import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_MESSAGE = [
  "[비밀번호 변경 요청]",
  "로그인 비밀번호를 잊어버렸습니다. 학생 계정 관리에서 새 숫자 4자리 비밀번호를 설정해주세요.",
].join("\n");

type StudentRow = {
  id: string;
  name: string;
  pin: string | null;
  auth_user_id: string | null;
  status: string | null;
};

type AdminProfile = {
  id: string;
  name: string | null;
  display_name: string | null;
};

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "").slice(0, 20) : "";
}

function normalizeParentCode(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, 5) : "";
}

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = normalizeName(body?.name);
    const parentCode = normalizeParentCode(body?.parentCode);

    if (name.length < 2 || !/^\d{5}$/.test(parentCode)) {
      return response(
        { success: false, error: "학생 이름과 학부모 인증번호 5자리를 입력해주세요." },
        400,
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return response({ success: false, error: "요청 기능을 잠시 사용할 수 없습니다. 학원에 알려주세요." }, 503);
    }

    const { data: studentRows, error: studentError } = await admin
      .from("students")
      .select("id,name,pin,auth_user_id,status")
      .eq("name", name)
      .limit(10);

    if (studentError) throw new Error(studentError.message);

    const matches = ((studentRows || []) as StudentRow[]).filter(
      student => normalizeParentCode(student.pin) === parentCode,
    );

    if (matches.length !== 1) {
      return response(
        { success: false, error: "학생 이름과 학부모 인증번호를 확인해주세요." },
        401,
      );
    }

    const student = matches[0];
    if (student.status === "deactivated" || student.status === "rejected") {
      return response({ success: false, error: "현재 사용할 수 없는 계정입니다. 학원에 알려주세요." }, 403);
    }
    if (!student.auth_user_id) {
      return response(
        { success: false, error: "아직 회원가입이 되지 않은 학생입니다. 먼저 회원가입을 해주세요." },
        409,
      );
    }

    const { data: adminProfiles, error: adminError } = await admin
      .from("profiles")
      .select("id,name,display_name")
      .eq("role", "admin")
      .limit(10);

    if (adminError) throw new Error(adminError.message);

    const recipients = (adminProfiles || []) as AdminProfile[];
    const recipient = recipients.find(profile =>
      [profile.name, profile.display_name].some(value => normalizeName(value) === "장민"),
    ) || recipients[0];

    if (!recipient) {
      return response({ success: false, error: "요청을 받을 관리자를 찾지 못했습니다. 학원에 알려주세요." }, 503);
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentMessages, error: recentError } = await admin
      .from("direct_messages")
      .select("id")
      .eq("sender_id", student.auth_user_id)
      .eq("receiver_id", recipient.id)
      .eq("content", REQUEST_MESSAGE)
      .gte("created_at", tenMinutesAgo)
      .limit(1);

    if (recentError) throw new Error(recentError.message);

    if (!recentMessages?.length) {
      const { error: insertError } = await admin.from("direct_messages").insert({
        sender_id: student.auth_user_id,
        receiver_id: recipient.id,
        sender_name: student.name,
        content: REQUEST_MESSAGE,
        is_read: false,
      });
      if (insertError) throw new Error(insertError.message);
    }

    return response({
      success: true,
      message: "선생님께 요청을 보냈어요. 새 비밀번호를 받을 때까지 기다려주세요.",
    });
  } catch {
    return response({ success: false, error: "요청을 보내지 못했습니다. 잠시 후 다시 시도해주세요." }, 500);
  }
}
