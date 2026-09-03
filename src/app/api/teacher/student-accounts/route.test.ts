import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireTeacher: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/auth-teacher", () => ({ requireTeacher: mocks.requireTeacher }));

import { PATCH } from "./route";

function request(body: unknown) {
    return new NextRequest("https://www.codingssok.com/api/teacher/student-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("student password administration in fresh database mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        mocks.requireTeacher.mockResolvedValue({ ok: true, userId: "teacher-user-id", role: "admin" });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("updates Auth and the hash RPC without writing login_pin", async () => {
        const studentId = "11111111-1111-4111-8111-111111111111";
        const authUserId = "22222222-2222-4222-8222-222222222222";
        const student = {
            id: studentId,
            name: "테스트학생",
            school: null,
            grade: null,
            class: null,
            status: "active",
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
            auth_user_id: authUserId,
            profile_id: authUserId,
        };
        const maybeSingleStudent = vi.fn().mockResolvedValue({ data: student, error: null });
        const studentsOrder = vi.fn().mockResolvedValue({ data: [student], error: null });
        const studentUpdate = vi.fn();
        const studentSelect = vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: maybeSingleStudent })),
            order: studentsOrder,
        }));

        const profile = {
            id: authUserId,
            email: "student_test@codingssok.local",
            role: "student",
            name: "테스트학생",
            display_name: "테스트학생",
            approval_status: "approved",
        };
        const profileBuilder = {
            eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }) })),
            then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
                Promise.resolve({ data: [profile], error: null }).then(resolve, reject),
        };
        const rpc = vi.fn((name: string) => {
            if (name === "codingssok_list_student_access_code_status") {
                return Promise.resolve({
                    data: [{ student_id: studentId, student_login_issued: true, parent_access_issued: true }],
                    error: null,
                });
            }
            return Promise.resolve({ data: null, error: null });
        });
        const updateUserById = vi.fn().mockResolvedValue({ error: null });
        const admin = {
            rpc,
            from: vi.fn((table: string) => {
                if (table === "students") return { select: studentSelect, update: studentUpdate };
                if (table === "profiles") return { select: vi.fn(() => profileBuilder) };
                throw new Error(`unexpected table: ${table}`);
            }),
            auth: {
                admin: {
                    updateUserById,
                    listUsers: vi.fn().mockResolvedValue({
                        data: { users: [{ id: authUserId, email: profile.email }] },
                        error: null,
                    }),
                },
            },
        };
        mocks.createAdminClient.mockReturnValue(admin);

        const response = await PATCH(request({
            action: "studentLoginPin",
            studentId,
            loginPin: "2468",
        }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.students[0].loginPin).toBeNull();
        expect(body.students[0].loginPinIssued).toBe(true);
        expect(rpc).toHaveBeenCalledWith("codingssok_issue_student_access_code", {
            p_student_id: studentId,
            p_purpose: "student_login",
            p_code: "2468",
        });
        expect(updateUserById).toHaveBeenCalledWith(authUserId, expect.objectContaining({ password: expect.any(String) }));
        expect(studentUpdate).not.toHaveBeenCalled();
    });
});
