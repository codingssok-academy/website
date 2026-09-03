import { afterEach, describe, expect, it, vi } from "vitest";
import { canParentSessionReadStudent } from "@/lib/parent-session-access";

describe("parent session access in fresh database mode", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("revalidates a signed student scope without storing the parent code in the session", async () => {
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        const studentId = "11111111-1111-4111-8111-111111111111";
        const inQuery = vi.fn().mockResolvedValue({
            data: [{ id: studentId, name: "테스트학생", status: "active" }],
            error: null,
        });
        const supabase = {
            from: vi.fn(() => ({
                select: vi.fn(() => ({ in: inQuery })),
            })),
        };

        const allowed = await canParentSessionReadStudent(supabase as never, {
            studentId,
            studentIds: [studentId],
            studentNames: ["테스트학생"],
            parentName: "테스트학생",
            issuedAt: Date.now(),
            expiresAt: Date.now() + 60_000,
        }, "테스트학생");

        expect(allowed).toBe(true);
        expect(inQuery).toHaveBeenCalledWith("id", [studentId]);
    });

    it("rejects a student outside the signed session scope before querying the database", async () => {
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        const from = vi.fn();

        const allowed = await canParentSessionReadStudent({ from } as never, {
            studentId: "11111111-1111-4111-8111-111111111111",
            studentIds: ["11111111-1111-4111-8111-111111111111"],
            studentNames: ["테스트학생"],
            parentName: "테스트학생",
            issuedAt: Date.now(),
            expiresAt: Date.now() + 60_000,
        }, "다른학생");

        expect(allowed).toBe(false);
        expect(from).not.toHaveBeenCalled();
    });
});
