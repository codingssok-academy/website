import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { GET } from "./route";

describe("student file list in fresh database mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("lists only the signed-in student's parent-safe files", async () => {
        const studentId = "11111111-1111-4111-8111-111111111111";
        const authUserId = "student-user";
        mocks.createClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { id: authUserId } },
                    error: null,
                }),
            },
        });

        const filesEq = vi.fn();
        const filesOrder = vi.fn().mockResolvedValue({ data: [], error: null });
        const filesQuery = { eq: filesEq, order: filesOrder };
        filesEq.mockReturnValue(filesQuery);
        const filesSelect = vi.fn(() => filesQuery);
        const studentMaybeSingle = vi.fn().mockResolvedValue({
            data: {
                id: studentId,
                name: "가짜학생",
                school: "테스트초등학교",
                grade: "3",
                class: "공통기초반",
                status: "active",
                auth_user_id: authUserId,
            },
            error: null,
        });
        const admin = {
            from: vi.fn((table: string) => {
                if (table === "students") {
                    return {
                        select: vi.fn(() => ({
                            eq: vi.fn(() => ({ maybeSingle: studentMaybeSingle })),
                        })),
                    };
                }
                if (table === "student_files") return { select: filesSelect };
                throw new Error(`unexpected table: ${table}`);
            }),
        };
        mocks.createAdminClient.mockReturnValue(admin);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(filesSelect).toHaveBeenCalledWith(expect.stringContaining("visibility"));
        expect(filesEq).toHaveBeenNthCalledWith(1, "student_id", studentId);
        expect(filesEq).toHaveBeenNthCalledWith(2, "visibility", "student_parent");
        expect(body).toMatchObject({ success: true, files: [] });
    });
});
