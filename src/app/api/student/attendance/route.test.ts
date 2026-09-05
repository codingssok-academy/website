import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
    usesHashedStudentAccessCodes: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/student-access-codes", () => ({
    usesHashedStudentAccessCodes: mocks.usesHashedStudentAccessCodes,
}));

import { GET } from "./route";

describe("student attendance API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.usesHashedStudentAccessCodes.mockReturnValue(false);
        mocks.createClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-student-1" } }, error: null }) },
        });
    });

    function freshSession(student: { id: string; status: string } | null = { id: "student-1", status: "active" }) {
        const builder = {
            select: vi.fn(), eq: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(),
        };
        builder.select.mockReturnValue(builder);
        builder.eq.mockReturnValue(builder);
        builder.limit.mockReturnValue(builder);
        builder.maybeSingle.mockResolvedValue({ data: student, error: null });
        const rpc = vi.fn().mockResolvedValue({
            data: { api_version: "1.0", data: { summary: {}, records: [] } }, error: null,
        });
        mocks.usesHashedStudentAccessCodes.mockReturnValue(true);
        mocks.createAdminClient.mockReturnValue(null);
        mocks.createClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-student-1" } }, error: null }) },
            from: vi.fn().mockReturnValue(builder),
            rpc,
        });
        return { builder, rpc };
    }

    it("uses the signed-in student session for fresh attendance without a server key", async () => {
        const { builder, rpc } = freshSession();
        const response = await GET(new NextRequest(
            "https://preview.invalid/api/student/attendance?month=2026-09&studentId=another-student",
        ));

        expect(response.status).toBe(200);
        expect(builder.eq).toHaveBeenCalledWith("auth_user_id", "auth-student-1");
        expect(rpc).toHaveBeenCalledWith("growth_api_monthly_attendance", {
            p_student_id: "student-1", p_month: "2026-09-01",
        });
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });

    it("rejects fresh sessions without a linked student", async () => {
        const { rpc } = freshSession(null);
        const response = await GET(new NextRequest("https://preview.invalid/api/student/attendance?month=2026-09"));
        expect(response.status).toBe(403);
        expect(rpc).not.toHaveBeenCalled();
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });

    it.each(["deactivated", "rejected"])("rejects a %s student", async (status) => {
        const { rpc } = freshSession({ id: "student-1", status });
        const response = await GET(new NextRequest("https://preview.invalid/api/student/attendance?month=2026-09"));
        expect(response.status).toBe(403);
        expect(rpc).not.toHaveBeenCalled();
    });

    it("returns a safe error when fresh attendance is denied without falling back to admin", async () => {
        const { rpc } = freshSession();
        rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "private database detail" } });
        const response = await GET(new NextRequest("https://preview.invalid/api/student/attendance?month=2026-09"));
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ success: false, error: "출석 정보를 불러오지 못했습니다." });
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });

    it("rejects invalid months before looking up any session", async () => {
        const response = await GET(new NextRequest("https://preview.invalid/api/student/attendance?month=2026-13"));
        expect(response.status).toBe(400);
        expect(mocks.createClient).not.toHaveBeenCalled();
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });

    it("loads attendance only for the student account linked to the session", async () => {
        const studentBuilder = {
            select: vi.fn(), eq: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(),
        };
        studentBuilder.select.mockReturnValue(studentBuilder);
        studentBuilder.eq.mockReturnValue(studentBuilder);
        studentBuilder.limit.mockReturnValue(studentBuilder);
        studentBuilder.maybeSingle.mockResolvedValue({
            data: { id: "student-1", status: "active" },
            error: null,
        });
        const rpc = vi.fn().mockResolvedValue({
            data: { api_version: "1.0", data: { summary: {}, records: [] } },
            error: null,
        });
        mocks.createAdminClient.mockReturnValue({
            from: vi.fn().mockReturnValue(studentBuilder),
            rpc,
        });

        const response = await GET(new NextRequest(
            "https://www.codingssok.com/api/student/attendance?month=2026-08",
        ));

        expect(response.status).toBe(200);
        expect(studentBuilder.eq).toHaveBeenCalledWith("auth_user_id", "auth-student-1");
        expect(rpc).toHaveBeenCalledWith("growth_api_monthly_attendance", {
            p_student_id: "student-1",
            p_month: "2026-08-01",
        });
    });

    it("rejects a request without a signed-in student", async () => {
        mocks.createClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        });

        const response = await GET(new NextRequest(
            "https://www.codingssok.com/api/student/attendance?month=2026-08",
        ));

        expect(response.status).toBe(401);
        expect(mocks.createAdminClient).not.toHaveBeenCalled();
    });
});
