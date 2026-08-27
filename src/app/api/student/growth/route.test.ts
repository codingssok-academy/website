import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { GET } from "./route";

describe("student growth API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-student-1" } }, error: null }) },
        });
    });

    it("returns only the linked student's completed public growth fields", async () => {
        const studentBuilder = {
            select: vi.fn(), eq: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(),
        };
        studentBuilder.select.mockReturnValue(studentBuilder);
        studentBuilder.eq.mockReturnValue(studentBuilder);
        studentBuilder.limit.mockReturnValue(studentBuilder);
        studentBuilder.maybeSingle.mockResolvedValue({
            data: { id: "student-1", name: "가짜학생", school: "가짜초등학교", grade: "5학년", class: "가짜반", status: "active", auth_user_id: "auth-student-1" },
            error: null,
        });

        const currentBuilder = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
        currentBuilder.select.mockReturnValue(currentBuilder);
        currentBuilder.eq.mockReturnValue(currentBuilder);
        currentBuilder.maybeSingle.mockResolvedValue({
            data: {
                id: "growth-current", current_class: "가짜반", strengths: "끝까지 해결했어요.", current_goal: "반복문 완성",
                class_progress: "for 반복문", parent_feedback_draft: "꾸준히 성장 중이에요.", teacher_memo: "학생에게 숨김",
                status: "완료", updated_at: "2026-08-27T00:00:00.000Z",
            },
            error: null,
        });

        const entriesBuilder = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn() };
        entriesBuilder.select.mockReturnValue(entriesBuilder);
        entriesBuilder.eq.mockReturnValue(entriesBuilder);
        entriesBuilder.order.mockReturnValue(entriesBuilder);
        entriesBuilder.limit.mockResolvedValue({ data: [], error: null });

        const from = vi.fn((table: string) => {
            if (table === "students") return studentBuilder;
            if (table === "student_growth_management") return currentBuilder;
            if (table === "student_growth_entries") return entriesBuilder;
            throw new Error(`unexpected table: ${table}`);
        });
        mocks.createAdminClient.mockReturnValue({ from });

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.student.name).toBe("가짜학생");
        expect(body.growth.current.classProgress).toBe("for 반복문");
        expect(body.growth.current).not.toHaveProperty("teacherMemo");
        expect(studentBuilder.eq).toHaveBeenCalledWith("auth_user_id", "auth-student-1");
        expect(currentBuilder.eq).toHaveBeenCalledWith("student_id", "student-1");
        expect(entriesBuilder.eq).toHaveBeenCalledWith("status", "완료");
    });

    it("rejects a request without a signed-in student", async () => {
        mocks.createClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        });

        const response = await GET();
        expect(response.status).toBe(401);
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });
});
