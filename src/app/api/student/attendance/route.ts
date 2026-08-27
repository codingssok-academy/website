import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: NextRequest) {
    const month = request.nextUrl.searchParams.get("month") || "";
    if (!MONTH.test(month)) return json({ success: false, error: "출석 확인 월이 올바르지 않습니다." }, 400);

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ success: false, error: "로그인이 필요합니다." }, 401);

    const admin = createAdminClient();
    if (!admin) return json({ success: false, error: "서버 연결 설정이 필요합니다." }, 503);

    const { data: student, error: studentError } = await admin
        .from("students")
        .select("id,status")
        .eq("auth_user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (studentError) return json({ success: false, error: "학생 계정 연결을 확인하지 못했습니다." }, 500);
    if (!student || student.status === "deactivated" || student.status === "rejected") {
        return json({ success: false, error: "관리자 학생 명단과 연결된 계정이 아닙니다." }, 403);
    }

    const { data, error } = await admin.rpc("growth_api_monthly_attendance", {
        p_student_id: student.id,
        p_month: `${month}-01`,
    });
    if (error) return json({ success: false, error: "출석 정보를 불러오지 못했습니다." }, 500);
    return json(data);
}
