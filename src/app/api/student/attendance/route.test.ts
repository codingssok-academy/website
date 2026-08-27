import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { GET } from "./route";

describe("student attendance API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-student-1" } }, error: null }) },
        });
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
