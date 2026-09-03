import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { POST } from "./route";

function request(body: unknown) {
    return new NextRequest("https://www.codingssok.com/api/teacher/parent-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("parent code administration in fresh database mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        mocks.createClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("returns a newly issued code once but stores no plaintext student column", async () => {
        const studentId = "11111111-1111-4111-8111-111111111111";
        const student = {
            id: studentId,
            name: "테스트학생",
            school: null,
            grade: null,
            class: null,
            auth_user_id: null,
            profile_id: null,
            status: "active",
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
        };
        const studentUpdate = vi.fn((payload: Record<string, unknown>) => ({
            eq: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: { ...student, ...payload }, error: null }),
                })),
            })),
        }));
        let selectCount = 0;
        const studentSelect = vi.fn(() => {
            selectCount += 1;
            if (selectCount === 1) return Promise.resolve({ data: [student], error: null });
            return { order: vi.fn().mockResolvedValue({ data: [student], error: null }) };
        });
        const rpc = vi.fn((name: string) => {
            if (name === "codingssok_list_student_access_code_status") {
                return Promise.resolve({
                    data: [{ student_id: studentId, student_login_issued: false, parent_access_issued: true }],
                    error: null,
                });
            }
            return Promise.resolve({ data: null, error: null });
        });
        const admin = {
            rpc,
            from: vi.fn((table: string) => {
                if (table !== "students") throw new Error(`unexpected table: ${table}`);
                return { select: studentSelect, update: studentUpdate };
            }),
        };
        mocks.createAdminClient.mockReturnValue(admin);

        const response = await POST(request({ name: "테스트학생", pin: "54321" }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
        expect(body.issuedCode).toBe("54321");
        expect(body.secureMode).toBe(true);
        expect(body.rows[0].code).toBe("");
        expect(body.rows[0].codeIssued).toBe(true);
        expect(studentUpdate).toHaveBeenCalled();
        expect(studentUpdate.mock.calls[0][0]).not.toHaveProperty("pin");
        expect(rpc).toHaveBeenCalledWith("codingssok_issue_student_access_code", {
            p_student_id: studentId,
            p_purpose: "parent_access",
            p_code: "54321",
        });
    });
});
