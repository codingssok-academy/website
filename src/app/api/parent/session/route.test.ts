import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createParentSessionToken: vi.fn(() => "signed-test-token"),
    setParentSessionCookie: vi.fn(),
    getNotionParentAccess: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/parent-session", async (importOriginal) => {
    const original = await importOriginal<typeof import("@/lib/parent-session")>();
    return {
        ...original,
        createParentSessionToken: mocks.createParentSessionToken,
        setParentSessionCookie: mocks.setParentSessionCookie,
    };
});

vi.mock("@/lib/notion-feedback", async (importOriginal) => {
    const original = await importOriginal<typeof import("@/lib/notion-feedback")>();
    return {
        ...original,
        getNotionParentAccess: mocks.getNotionParentAccess,
    };
});

import { POST } from "./route";

function request(body: unknown) {
    return new NextRequest("https://www.codingssok.com/api/parent/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("parent session route in fresh database mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("verifies the parent code on the server and omits it from the signed cookie payload", async () => {
        const studentId = "11111111-1111-4111-8111-111111111111";
        const rpc = vi.fn().mockResolvedValue({
            data: [{ student_id: studentId, auth_user_id: null, student_status: "active" }],
            error: null,
        });
        const maybeSingle = vi.fn().mockResolvedValue({
            data: { id: studentId, name: "테스트학생", status: "active" },
            error: null,
        });
        const admin = {
            rpc,
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({ maybeSingle })),
                })),
            })),
        };
        mocks.createAdminClient.mockReturnValue(admin);

        const response = await POST(request({ name: "테스트학생", pin: "54321" }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
            studentName: "테스트학생",
            allowedStudents: ["테스트학생"],
        });
        expect(rpc).toHaveBeenCalledWith("codingssok_verify_student_access_code", {
            p_student_name: "테스트학생",
            p_purpose: "parent_access",
            p_code: "54321",
        });
        expect(mocks.createParentSessionToken).toHaveBeenCalledWith({
            studentId,
            studentIds: [studentId],
            studentNames: ["테스트학생"],
            parentName: "테스트학생",
        });
        expect(mocks.getNotionParentAccess).not.toHaveBeenCalled();
        expect(mocks.setParentSessionCookie).toHaveBeenCalledWith(response, "signed-test-token");
    });
});
