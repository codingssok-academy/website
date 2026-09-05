import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    canParentSessionReadStudent: vi.fn(),
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
    requireTeacher: vi.fn(),
    verifyParentSessionToken: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/auth-teacher", () => ({ requireTeacher: mocks.requireTeacher }));
vi.mock("@/lib/parent-session-access", () => ({
    canParentSessionReadStudent: mocks.canParentSessionReadStudent,
}));
vi.mock("@/lib/parent-session", () => ({
    PARENT_SESSION_COOKIE: "codingssok_parent_session",
    verifyParentSessionToken: mocks.verifyParentSessionToken,
}));

import { DELETE, GET } from "./route";

const file = {
    id: "11111111-1111-4111-8111-111111111111",
    student_id: "22222222-2222-4222-8222-222222222222",
    owner_auth_user_id: "student-user",
    uploaded_by: "teacher-user",
    uploaded_by_role: "teacher",
    original_name: "fake-project.ent",
    storage_path: "students/22222222-2222-4222-8222-222222222222/teacher/fake-project.ent",
    mime_type: "application/octet-stream",
    size_bytes: 100,
    category: "result",
    note: "가짜 테스트 파일",
    visibility: "student_parent",
    created_at: "2026-09-04T00:00:00.000Z",
};

function makeRequest(method = "GET", withParentCookie = false, mode?: "preview" | "download") {
    const query = mode ? `?mode=${mode}` : "";
    return new NextRequest(`https://www.codingssok.com/api/student/files/${file.id}${query}`, {
        method,
        headers: withParentCookie
            ? { cookie: "codingssok_parent_session=test-token" }
            : undefined,
    });
}

function makeServerClient(input?: {
    userId?: string | null;
    allowed?: boolean;
    role?: string;
    approvalStatus?: string;
}) {
    const profileResult = {
        data: input?.role ? {
            role: input.role,
            approval_status: input.approvalStatus ?? "approved",
        } : null,
        error: null,
    };
    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: input?.userId ? { id: input.userId } : null },
                error: null,
            }),
        },
        rpc: vi.fn().mockResolvedValue({ data: input?.allowed ?? false, error: null }),
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue(profileResult) })),
            })),
        })),
    };
}

function makeAdmin(fileOverrides: Partial<typeof file> = {}) {
    const currentFile = { ...file, ...fileOverrides };
    const createSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: "https://files.example.test/temporary-download" },
        error: null,
    });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const studentMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: currentFile.student_id, name: "가짜학생", status: "active" },
        error: null,
    });

    const admin = {
        from: vi.fn((table: string) => {
            if (table === "student_files") {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn().mockResolvedValue({ data: currentFile, error: null }),
                        })),
                    })),
                    delete: vi.fn(() => ({ eq: deleteEq })),
                };
            }
            if (table === "students") {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({ maybeSingle: studentMaybeSingle })),
                    })),
                };
            }
            throw new Error(`unexpected table: ${table}`);
        }),
        storage: {
            from: vi.fn(() => ({ createSignedUrl, remove })),
        },
    };

    return { admin, createSignedUrl, remove, deleteEq };
}

const routeContext = { params: Promise.resolve({ fileId: file.id }) };

describe("student file route in fresh database mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        mocks.requireTeacher.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) });
        mocks.verifyParentSessionToken.mockReturnValue(null);
        mocks.canParentSessionReadStudent.mockResolvedValue(false);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("blocks an unassigned teacher before creating a download URL", async () => {
        const { admin, createSignedUrl } = makeAdmin();
        mocks.createAdminClient.mockReturnValue(admin);
        mocks.createClient.mockResolvedValue(makeServerClient({
            userId: "unassigned-teacher",
            allowed: false,
            role: "teacher",
        }));

        const response = await GET(makeRequest(), routeContext);

        expect(response.status).toBe(403);
        expect(createSignedUrl).not.toHaveBeenCalled();
    });

    it("creates a short download URL for an assigned approved teacher", async () => {
        const { admin, createSignedUrl } = makeAdmin();
        mocks.createAdminClient.mockReturnValue(admin);
        mocks.createClient.mockResolvedValue(makeServerClient({
            userId: "assigned-teacher",
            allowed: true,
            role: "teacher",
        }));

        const response = await GET(makeRequest(), routeContext);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe("https://files.example.test/temporary-download?download=fake-project.ent");
        expect(createSignedUrl).toHaveBeenCalledWith(file.storage_path, 60);
    });

    it("creates an inline short URL for a safe image preview", async () => {
        const previewFile = {
            original_name: "fake-preview.png",
            mime_type: "image/png",
            storage_path: "students/22222222-2222-4222-8222-222222222222/teacher/fake-preview.png",
        };
        const { admin, createSignedUrl } = makeAdmin(previewFile);
        mocks.createAdminClient.mockReturnValue(admin);
        mocks.createClient.mockResolvedValue(makeServerClient({
            userId: "assigned-teacher",
            allowed: true,
            role: "teacher",
        }));

        const response = await GET(makeRequest("GET", false, "preview"), routeContext);

        expect(response.status).toBe(307);
        expect(createSignedUrl).toHaveBeenCalledWith(previewFile.storage_path, 60);
        expect(createSignedUrl).not.toHaveBeenCalledWith(previewFile.storage_path, 60, expect.anything());
    });

    it("does not preview executable or project files inline", async () => {
        const { admin, createSignedUrl } = makeAdmin();
        mocks.createAdminClient.mockReturnValue(admin);
        mocks.createClient.mockResolvedValue(makeServerClient({
            userId: "assigned-teacher",
            allowed: true,
            role: "teacher",
        }));

        const response = await GET(makeRequest("GET", false, "preview"), routeContext);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toContain("안전한 미리보기");
        expect(createSignedUrl).not.toHaveBeenCalled();
    });

    it("allows a valid parent session to download a parent-safe child file", async () => {
        const { admin } = makeAdmin();
        mocks.createAdminClient.mockReturnValue(admin);
        mocks.createClient.mockResolvedValue(makeServerClient());
        const parentSession = {
            studentId: file.student_id,
            studentIds: [file.student_id],
            studentNames: ["가짜학생"],
            parentName: "가짜학부모",
            issuedAt: Date.now(),
            expiresAt: Date.now() + 60_000,
        };
        mocks.verifyParentSessionToken.mockReturnValue(parentSession);
        mocks.canParentSessionReadStudent.mockResolvedValue(true);

        const response = await GET(makeRequest("GET", true), routeContext);

        expect(response.status).toBe(307);
        expect(mocks.canParentSessionReadStudent).toHaveBeenCalledWith(admin, parentSession, "가짜학생");
    });

    it("blocks a same-name parent session when the student ID does not match", async () => {
        const { admin, createSignedUrl } = makeAdmin();
        mocks.createAdminClient.mockReturnValue(admin);
        mocks.createClient.mockResolvedValue(makeServerClient());
        mocks.verifyParentSessionToken.mockReturnValue({
            studentId: "different-student-id",
            studentIds: ["different-student-id"],
            studentNames: ["가짜학생"],
            parentName: "가짜학부모",
            issuedAt: Date.now(),
            expiresAt: Date.now() + 60_000,
        });
        mocks.canParentSessionReadStudent.mockResolvedValue(true);

        const response = await GET(makeRequest("GET", true), routeContext);

        expect(response.status).toBe(403);
        expect(mocks.canParentSessionReadStudent).not.toHaveBeenCalled();
        expect(createSignedUrl).not.toHaveBeenCalled();
    });

    it("does not expose staff-only files to a parent session", async () => {
        const { admin, createSignedUrl } = makeAdmin({ visibility: "staff_only" });
        mocks.createAdminClient.mockReturnValue(admin);
        mocks.createClient.mockResolvedValue(makeServerClient());
        mocks.verifyParentSessionToken.mockReturnValue({
            studentId: file.student_id,
            studentIds: [file.student_id],
            studentNames: ["가짜학생"],
            parentName: "가짜학부모",
            issuedAt: Date.now(),
            expiresAt: Date.now() + 60_000,
        });

        const response = await GET(makeRequest("GET", true), routeContext);

        expect(response.status).toBe(403);
        expect(createSignedUrl).not.toHaveBeenCalled();
    });

    it("does not let a parent session delete a file", async () => {
        const { admin, remove, deleteEq } = makeAdmin();
        mocks.createAdminClient.mockReturnValue(admin);
        mocks.createClient.mockResolvedValue(makeServerClient());
        mocks.verifyParentSessionToken.mockReturnValue({
            studentId: file.student_id,
            studentIds: [file.student_id],
            studentNames: ["가짜학생"],
            parentName: "가짜학부모",
            issuedAt: Date.now(),
            expiresAt: Date.now() + 60_000,
        });
        mocks.canParentSessionReadStudent.mockResolvedValue(true);

        const response = await DELETE(makeRequest("DELETE", true), routeContext);

        expect(response.status).toBe(403);
        expect(remove).not.toHaveBeenCalled();
        expect(deleteEq).not.toHaveBeenCalled();
    });
});
