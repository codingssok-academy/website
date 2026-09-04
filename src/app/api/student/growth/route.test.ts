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
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "legacy");
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

    it("reads only the signed-in student's published records from the fresh Growth 2.0 table", async () => {
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");

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

        const currentBuilder = {
            select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(),
        };
        currentBuilder.select.mockReturnValue(currentBuilder);
        currentBuilder.eq.mockReturnValue(currentBuilder);
        currentBuilder.order.mockReturnValue(currentBuilder);
        currentBuilder.limit.mockReturnValue(currentBuilder);
        currentBuilder.maybeSingle.mockResolvedValue({
            data: {
                id: "fresh-current",
                class_snapshot: "가짜 프로젝트반",
                learned_concepts: "가짜 반복문과 조건문",
                strengths: "가짜 문제 해결력이 좋아졌어요.",
                next_goal: "가짜 작품 완성",
                lesson_summary: "가짜 수업 요약",
                parent_message: "가짜 선생님 이야기",
                status: "published",
                published_at: "2026-09-04T00:00:00.000Z",
                updated_at: "2026-09-04T00:00:00.000Z",
                created_at: "2026-09-03T00:00:00.000Z",
            },
            error: null,
        });

        const historyBuilder = {
            select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(),
        };
        historyBuilder.select.mockReturnValue(historyBuilder);
        historyBuilder.eq.mockReturnValue(historyBuilder);
        historyBuilder.order.mockReturnValue(historyBuilder);
        historyBuilder.limit.mockResolvedValue({ data: [], error: null });

        let growthCall = 0;
        const userFrom = vi.fn((table: string) => {
            if (table !== "student_growth_records") throw new Error(`unexpected user table: ${table}`);
            growthCall += 1;
            return growthCall === 1 ? currentBuilder : historyBuilder;
        });
        mocks.createClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-student-1" } }, error: null }) },
            from: userFrom,
        });

        const adminFrom = vi.fn((table: string) => {
            if (table === "students") return studentBuilder;
            throw new Error(`unexpected admin table: ${table}`);
        });
        mocks.createAdminClient.mockReturnValue({ from: adminFrom });

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(userFrom).toHaveBeenCalledTimes(2);
        expect(userFrom).toHaveBeenCalledWith("student_growth_records");
        expect(adminFrom).toHaveBeenCalledTimes(1);
        expect(currentBuilder.eq).toHaveBeenCalledWith("student_id", "student-1");
        expect(currentBuilder.eq).toHaveBeenCalledWith("status", "published");
        expect(historyBuilder.eq).toHaveBeenCalledWith("status", "published");
        expect(currentBuilder.select).toHaveBeenCalledWith(expect.not.stringMatching(/improvements|created_by|updated_by/));
        expect(body.growth.current).toEqual({
            id: "fresh-current",
            currentClass: "가짜 프로젝트반",
            strengths: "가짜 문제 해결력이 좋아졌어요.",
            currentGoal: "가짜 작품 완성",
            classProgress: "가짜 반복문과 조건문",
            parentFeedback: "가짜 선생님 이야기",
            recordedAt: "2026-09-04T00:00:00.000Z",
        });
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
