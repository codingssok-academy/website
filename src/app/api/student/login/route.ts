import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { buildStudentAuthEmail, buildStudentAuthPassword } from "@/lib/auth-bridge";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  usesHashedStudentAccessCodes,
  verifyHashedStudentAccessCode,
} from "@/lib/student-access-codes";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StudentRow = {
  id: string;
  name: string;
  school: string | null;
  grade: string | null;
  class: string | null;
  avatar: string | null;
  auth_user_id: string | null;
  status: string | null;
};

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "") : "";
}

function normalizePin(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, 4) : "";
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = normalizeName(body?.name);
    const pin = normalizePin(body?.pin);

    if (!name || !/^\d{4}$/.test(pin)) {
      return errorResponse("이름과 숫자 4자리 비밀번호를 확인해주세요.", 400);
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await rateLimit(`student-login:${ip}`, { maxRequests: 12, windowMs: 60_000 });
    if (!limit.success) {
      return errorResponse("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
    }

    const admin = createAdminClient();
    if (!admin || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return errorResponse("로그인 서버 설정을 확인해주세요.", 503);
    }

    let student: StudentRow | null = null;
    if (usesHashedStudentAccessCodes()) {
      const verified = await verifyHashedStudentAccessCode(admin, {
        studentName: name,
        purpose: "student_login",
        code: pin,
      });
      if (verified.length !== 1) {
        return errorResponse("이름 또는 비밀번호가 올바르지 않습니다.", 401);
      }

      const { data, error } = await admin
        .from("students")
        .select("id,name,school,grade,class,avatar,auth_user_id,status")
        .eq("id", verified[0].studentId)
        .maybeSingle();
      if (error) return errorResponse("로그인 정보를 확인하지 못했습니다.", 500);
      student = data as StudentRow | null;
    } else {
      const { data: rows, error: studentError } = await admin
        .from("students")
        .select("id,name,school,grade,class,avatar,auth_user_id,status")
        .eq("name", name)
        .limit(2);

      if (studentError) {
        return errorResponse("로그인 정보를 확인하지 못했습니다.", 500);
      }
      if (rows?.length === 1) student = rows[0] as StudentRow;
    }

    if (!student) {
      return errorResponse("이름 또는 비밀번호가 올바르지 않습니다.", 401);
    }
    if (student.status === "deactivated" || student.status === "rejected") {
      return errorResponse("비활성화된 계정입니다. 학원에 문의해주세요.", 403);
    }

    const authClient = createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const email = buildStudentAuthEmail(student.id);
    const password = buildStudentAuthPassword(student.id, pin);
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      return errorResponse("이름 또는 비밀번호가 올바르지 않습니다.", 401);
    }

    if (student.auth_user_id !== authData.user.id) {
      const { error: linkError } = await admin
        .from("students")
        .update(usesHashedStudentAccessCodes()
          ? { auth_user_id: authData.user.id, profile_id: authData.user.id }
          : { auth_user_id: authData.user.id })
        .eq("id", student.id);
      if (linkError) return errorResponse("계정 연결 정보를 저장하지 못했습니다.", 500);
    }

    await admin
      .from("profiles")
      .update({ name: student.name, display_name: student.name })
      .eq("id", authData.user.id);

    return NextResponse.json(
      {
        success: true,
        student: { ...student, auth_user_id: authData.user.id },
        accountRole: usesHashedStudentAccessCodes()
          ? "student"
          : (student.class?.replace(/\s+/g, "").toLowerCase() === "admin"
            || student.name.replace(/\s+/g, "") === "장민")
            ? "admin"
            : "student",
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return errorResponse("로그인 중 오류가 발생했습니다. 다시 시도해주세요.", 500);
  }
}
