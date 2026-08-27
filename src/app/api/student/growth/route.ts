import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toParentGrowthRecord } from "@/lib/parent-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json(
            { success: false, error: "로그인이 필요합니다." },
            { status: 401, headers: NO_STORE_HEADERS },
        );
    }

    const admin = createAdminClient();
    if (!admin) {
        return NextResponse.json(
            { success: false, error: "서버 연결 설정이 필요합니다." },
            { status: 503, headers: NO_STORE_HEADERS },
        );
    }

    const { data: student, error: studentError } = await admin
        .from("students")
        .select("id,name,school,grade,class,status,auth_user_id")
        .eq("auth_user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (studentError) {
        return NextResponse.json(
            { success: false, error: "학생 계정 연결을 확인하지 못했습니다." },
            { status: 500, headers: NO_STORE_HEADERS },
        );
    }

    if (!student || student.status === "deactivated" || student.status === "rejected") {
        return NextResponse.json(
            { success: false, error: "관리자 학생 명단과 연결된 계정이 아닙니다." },
            { status: 403, headers: NO_STORE_HEADERS },
        );
    }

    const [currentResult, entriesResult] = await Promise.all([
        admin
            .from("student_growth_management")
            .select("id,current_class,strengths,current_goal,class_progress,parent_feedback_draft,status,updated_at")
            .eq("student_id", student.id)
            .maybeSingle(),
        admin
            .from("student_growth_entries")
            .select("id,current_class,strengths,current_goal,class_progress,parent_feedback_draft,status,created_at")
            .eq("student_id", student.id)
            .eq("status", "완료")
            .order("created_at", { ascending: false })
            .limit(6),
    ]);

    if (currentResult.error || entriesResult.error) {
        return NextResponse.json(
            { success: false, error: "성장 기록을 불러오지 못했습니다." },
            { status: 500, headers: NO_STORE_HEADERS },
        );
    }

    const history = (entriesResult.data || [])
        .map(row => toParentGrowthRecord(row))
        .filter(record => record !== null);
    const current = toParentGrowthRecord(currentResult.data) || history[0] || null;

    return NextResponse.json({
        success: true,
        student: {
            id: student.id,
            name: student.name,
            school: student.school,
            grade: student.grade,
            className: current?.currentClass || student.class || null,
        },
        growth: {
            current,
            history: history.filter(record => record.id !== current?.id).slice(0, 5),
        },
    }, { headers: NO_STORE_HEADERS });
}
