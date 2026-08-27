import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GrowthAttendanceStatus } from "@/features/growth-v2/attendance/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;
const STATUSES = new Set<GrowthAttendanceStatus>(["scheduled", "present", "absent", "makeup"]);
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200) {
    return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: NextRequest) {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const studentId = request.nextUrl.searchParams.get("studentId") || "";
    const month = request.nextUrl.searchParams.get("month") || "";
    if (!UUID.test(studentId) || !MONTH.test(month)) {
        return json({ success: false, error: "학생과 출석 확인 월을 다시 선택해주세요." }, 400);
    }

    const admin = createAdminClient();
    if (!admin) return json({ success: false, error: "서버 연결 설정이 필요합니다." }, 503);

    const { data, error } = await admin.rpc("growth_api_monthly_attendance", {
        p_student_id: studentId,
        p_month: `${month}-01`,
    });
    if (error) return json({ success: false, error: "출석 정보를 불러오지 못했습니다." }, 500);
    return json(data);
}

export async function POST(request: NextRequest) {
    const auth = await requireTeacher();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const studentId = typeof body?.studentId === "string" ? body.studentId : "";
    const recordId = body?.recordId === null ? null : typeof body?.recordId === "string" ? body.recordId : "";
    const classDate = typeof body?.classDate === "string" ? body.classDate : "";
    const status = typeof body?.status === "string" ? body.status : "";
    const lessonTitle = typeof body?.lessonTitle === "string" ? body.lessonTitle.trim() : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    if (
        !body
        || !UUID.test(studentId)
        || !(recordId === null || UUID.test(recordId))
        || !DATE.test(classDate)
        || !STATUSES.has(status as GrowthAttendanceStatus)
        || lessonTitle.length < 1
        || lessonTitle.length > 120
        || note.length > 300
    ) {
        return json({ success: false, error: "출석 입력 내용을 다시 확인해주세요." }, 400);
    }

    const admin = createAdminClient();
    if (!admin) return json({ success: false, error: "서버 연결 설정이 필요합니다." }, 503);

    const { data, error } = await admin.rpc("growth_api_teacher_set_attendance", {
        p_student_id: studentId,
        p_record_id: recordId,
        p_class_date: classDate,
        p_status: status,
        p_lesson_title: lessonTitle,
        p_note: note || null,
    });
    if (error) return json({ success: false, error: "출석 기록을 저장하지 못했습니다." }, 500);
    return json(data);
}
