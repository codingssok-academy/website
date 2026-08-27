import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    requireTeacher: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth-teacher", () => ({ requireTeacher: mocks.requireTeacher }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { GET, POST } from "./route";

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";

describe("teacher growth attendance API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireTeacher.mockResolvedValue({ ok: true, userId: "teacher-1" });
    });

    it("loads one student's selected attendance month", async () => {
        const rpc = vi.fn().mockResolvedValue({
            data: { api_version: "1.0", data: { summary: {}, records: [] } },
            error: null,
        });
        mocks.createAdminClient.mockReturnValue({ rpc });

        const request = new NextRequest(
            `https://www.codingssok.com/api/teacher/growth-attendance?studentId=${STUDENT_ID}&month=2026-08`,
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(rpc).toHaveBeenCalledWith("growth_api_monthly_attendance", {
            p_student_id: STUDENT_ID,
            p_month: "2026-08-01",
        });
    });

    it("saves a validated attendance record for the selected student", async () => {
        const rpc = vi.fn().mockResolvedValue({ data: { saved: true }, error: null });
        mocks.createAdminClient.mockReturnValue({ rpc });
        const request = new NextRequest("https://www.codingssok.com/api/teacher/growth-attendance", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                studentId: STUDENT_ID,
                recordId: null,
                classDate: "2026-08-27",
                status: "present",
                lessonTitle: "가짜 정규 수업",
                note: "가짜 테스트 메모",
            }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(rpc).toHaveBeenCalledWith("growth_api_teacher_set_attendance", {
            p_student_id: STUDENT_ID,
            p_record_id: null,
            p_class_date: "2026-08-27",
            p_status: "present",
            p_lesson_title: "가짜 정규 수업",
            p_note: "가짜 테스트 메모",
        });
    });

    it("stops before the database when the teacher is not signed in", async () => {
        mocks.requireTeacher.mockResolvedValue({
            ok: false,
            response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
        });

        const response = await GET(new NextRequest(
            `https://www.codingssok.com/api/teacher/growth-attendance?studentId=${STUDENT_ID}&month=2026-08`,
        ));

        expect(response.status).toBe(401);
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });
});
