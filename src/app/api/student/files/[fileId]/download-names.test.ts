// @vitest-environment node
import { createClient as createStorageClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createParentSessionToken, PARENT_SESSION_COOKIE } from "@/lib/parent-session";
import type { StudentFileRow } from "@/lib/student-files";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
    canParentSessionReadStudent: vi.fn(),
    requireTeacher: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/parent-session-access", () => ({ canParentSessionReadStudent: mocks.canParentSessionReadStudent }));
vi.mock("@/lib/auth-teacher", () => ({ requireTeacher: mocks.requireTeacher }));

import { GET } from "./route";

const studentId = "11111111-1111-4111-8111-111111111111";
const fileId = "22222222-2222-4222-8222-222222222222";
const storagePath = `students/${studentId}/admin/fake%20result.txt`;
const signedPath = `/object/sign/student-files/${storagePath}`;
const fakeToken = "fake-signed-token";
let file: StudentFileRow | null;
let studentStatus: string;
let getUser: ReturnType<typeof vi.fn>;
let rpc: ReturnType<typeof vi.fn>;
let signingFetch: ReturnType<typeof vi.fn<typeof fetch>>;

function parentCookie(childId = studentId) {
    return `${PARENT_SESSION_COOKIE}=${createParentSessionToken({ studentId: childId, studentNames: ["가짜파일학생"] })}`;
}
function request(cookie?: string, suffix = "") {
    return new NextRequest(`http://localhost/api/student/files/${fileId}${suffix}`, {
        headers: cookie ? { Cookie: cookie } : {},
    });
}
function download(cookie = parentCookie(), suffix = "") {
    return GET(request(cookie, suffix), { params: Promise.resolve({ fileId }) });
}

describe("file download names and parent-only authorization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        vi.stubEnv("PARENT_SESSION_SECRET", "fake-file-download-test-secret");
        file = {
            id: fileId, student_id: studentId, owner_auth_user_id: null,
            uploaded_by: "fake-admin", uploaded_by_role: "admin",
            original_name: "가짜연결작품.txt", storage_path: storagePath,
            mime_type: "text/plain", size_bytes: 78, category: "result", note: null,
            visibility: "student_parent", created_at: "2026-09-05T00:00:00Z",
        };
        studentStatus = "active";
        getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
        rpc = vi.fn();
        mocks.createClient.mockResolvedValue({ auth: { getUser }, rpc });
        mocks.canParentSessionReadStudent.mockResolvedValue(true);
        // Exercise the installed SDK, not a hand-written URL-signing approximation.
        signingFetch = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ signedURL: `${signedPath}?token=${fakeToken}` }), {
            status: 200, headers: { "Content-Type": "application/json" },
        }));
        const storageClient = createStorageClient("https://fake-storage.invalid", "fake-test-key", {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { fetch: signingFetch },
        });
        mocks.createAdminClient.mockReturnValue({
            storage: storageClient.storage,
            from: vi.fn((table: string) => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        maybeSingle: vi.fn(async () => ({
                            data: table === "student_files" ? file : { id: studentId, name: "가짜파일학생", status: studentStatus },
                            error: null,
                        })),
                    })),
                })),
            })),
        });
    });
    afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

    it.each(["가짜연결작품.txt", "report.txt", "my work.txt", "100%.txt", "한글 + 공백 # & = %.txt", "%EA%B0%80.txt"])(
        "keeps %s intact with no student or administrator session",
        async (name) => {
            file!.original_name = name;
            const response = await download();
            expect(response.status).toBe(307);
            const location = new URL(response.headers.get("location")!);
            expect(location.searchParams.get("download")).toBe(name);
            expect(location.searchParams.getAll("download")).toEqual([name]);
            expect(location.searchParams.get("token")).toBe(fakeToken);
            expect(location.pathname).toBe(new URL(`https://fake-storage.invalid/storage/v1${signedPath.replace("%20", "%2520")}`).pathname);
            expect(getUser).toHaveBeenCalledOnce();
            expect(rpc).not.toHaveBeenCalled();
            expect(mocks.requireTeacher).not.toHaveBeenCalled();
            expect(mocks.canParentSessionReadStudent).toHaveBeenCalledOnce();
            expect(signingFetch).toHaveBeenCalledOnce();
            const options = signingFetch.mock.calls[0]?.[1] as RequestInit | undefined;
            expect(JSON.parse(String(options?.body))).toEqual({ expiresIn: 60 });
        },
    );

    it.each(["anonymous", "tampered", "unlinked", "expired"])("rejects %s parent access before signing", async (kind) => {
        let cookie = kind === "anonymous" ? "" : kind === "tampered" ? `${PARENT_SESSION_COOKIE}=invalid` : parentCookie(kind === "unlinked" ? "other-fake-student" : studentId);
        if (kind === "expired") {
            cookie = parentCookie();
            vi.useFakeTimers();
            vi.setSystemTime(Date.now() + 13 * 60 * 60 * 1000);
        }
        expect((await download(cookie)).status).toBe(403);
        expect(signingFetch).not.toHaveBeenCalled();
    });

    it("blocks internal files even with a valid linked parent cookie", async () => {
        file!.visibility = "staff_only";
        expect((await download()).status).toBe(403);
        expect(signingFetch).not.toHaveBeenCalled();
    });
    it("blocks inactive students", async () => {
        studentStatus = "deactivated";
        expect((await download()).status).toBe(403);
        expect(signingFetch).not.toHaveBeenCalled();
    });
    it("blocks a parent session whose access is no longer valid", async () => {
        mocks.canParentSessionReadStudent.mockResolvedValue(false);
        expect((await download()).status).toBe(403);
        expect(signingFetch).not.toHaveBeenCalled();
    });
    it("keeps safe previews inline without a download parameter", async () => {
        file!.original_name = "가짜보고서.pdf";
        file!.mime_type = "application/pdf";
        const response = await download(parentCookie(), "?mode=preview");
        expect(response.status).toBe(307);
        expect(new URL(response.headers.get("location")!).searchParams.has("download")).toBe(false);
    });
    it("still blocks previews for unsupported file types", async () => {
        expect((await download(parentCookie(), "?mode=preview")).status).toBe(400);
        expect(signingFetch).not.toHaveBeenCalled();
    });
    it("does not sign a missing file", async () => {
        file = null;
        expect((await download()).status).toBe(404);
        expect(signingFetch).not.toHaveBeenCalled();
    });
    it("does not fall back to a parent cookie on an authenticated permission lookup error", async () => {
        getUser.mockResolvedValue({ data: { user: { id: "fake-student-auth" } } });
        rpc.mockResolvedValue({ data: null, error: { message: "fake unavailable permission service" } });
        expect((await download()).status).toBe(503);
        expect(signingFetch).not.toHaveBeenCalled();
    });
});
