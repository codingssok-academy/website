import { afterEach, describe, expect, it, vi } from "vitest";
import {
    getStudentAccessCodeMode,
    isValidStudentAccessCode,
    issueHashedStudentAccessCode,
    verifyHashedStudentAccessCode,
} from "@/lib/student-access-codes";

describe("student access codes", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("keeps the deployed legacy path unless hashed mode is explicitly enabled", () => {
        expect(getStudentAccessCodeMode()).toBe("legacy");

        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        expect(getStudentAccessCodeMode()).toBe("hashed");
    });

    it("uses separate student and parent code lengths", () => {
        expect(isValidStudentAccessCode("student_login", "2468")).toBe(true);
        expect(isValidStudentAccessCode("student_login", "24680")).toBe(false);
        expect(isValidStudentAccessCode("parent_access", "54321")).toBe(true);
        expect(isValidStudentAccessCode("parent_access", "5432")).toBe(false);
    });

    it("verifies a code only through the server RPC and returns no hash", async () => {
        const rpc = vi.fn().mockResolvedValue({
            data: [{
                student_id: "11111111-1111-4111-8111-111111111111",
                auth_user_id: "22222222-2222-4222-8222-222222222222",
                student_status: "active",
            }],
            error: null,
        });

        const result = await verifyHashedStudentAccessCode({ rpc } as never, {
            studentName: " 테스트 학생 ",
            purpose: "parent_access",
            code: "54321",
        });

        expect(rpc).toHaveBeenCalledWith("codingssok_verify_student_access_code", {
            p_student_name: "테스트학생",
            p_purpose: "parent_access",
            p_code: "54321",
        });
        expect(result).toEqual([{
            studentId: "11111111-1111-4111-8111-111111111111",
            authUserId: "22222222-2222-4222-8222-222222222222",
            status: "active",
        }]);
        expect(JSON.stringify(result)).not.toContain("hash");
    });

    it("issues a code through the hashing RPC instead of a public table update", async () => {
        const rpc = vi.fn().mockResolvedValue({ data: null, error: null });

        await issueHashedStudentAccessCode({ rpc } as never, {
            studentId: "11111111-1111-4111-8111-111111111111",
            purpose: "student_login",
            code: "2468",
        });

        expect(rpc).toHaveBeenCalledWith("codingssok_issue_student_access_code", {
            p_student_id: "11111111-1111-4111-8111-111111111111",
            p_purpose: "student_login",
            p_code: "2468",
        });
    });

    it("does not call the database for malformed codes", async () => {
        const rpc = vi.fn();

        const result = await verifyHashedStudentAccessCode({ rpc } as never, {
            studentName: "테스트학생",
            purpose: "parent_access",
            code: "12",
        });

        expect(result).toEqual([]);
        expect(rpc).not.toHaveBeenCalled();
    });
});
