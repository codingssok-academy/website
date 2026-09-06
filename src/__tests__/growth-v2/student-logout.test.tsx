import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createBrowserClient } from "@supabase/ssr";
import { AuthApiError } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(), isSupabaseConfigured: vi.fn(), isLocalPreviewAuthEnabled: vi.fn(),
}));
vi.mock("@/lib/supabase", () => mocks);

import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Regression coverage for the 2026-09-06 diagnosis. The installed SDK runs with
// fake cookies and in-memory HTTP responses; no real database/key/network is used.
const COOKIE_NAME = "sb-fake-logout-regression-auth-token";
const START_URL = "http://localhost:3000/dashboard/learning";
const fakeUser = {
    id: "11111111-1111-4111-8111-111111111111",
    studentId: "22222222-2222-4222-8222-222222222222",
    name: "가짜로그아웃학생",
    email: "fake-student@example.test",
    role: "student" as const,
    level: 1, xp: 0, streak: 0, joinedAt: "2026-09-06T00:00:00.000Z",
};

function Probe() {
    const { user, loading, signOut } = useAuth();
    return <>
        <output>{loading ? "loading" : user ? "student-present" : "student-absent"}</output>
        <button onClick={signOut}>logout</button>
        <button onClick={() => { signOut(); signOut(); }}>double logout</button>
    </>;
}

function makeQuery(result: Promise<{ data: unknown; error: null }>) {
    return { select: () => ({ eq: () => ({ maybeSingle: () => result }) }) };
}

function httpResponse(status: number) {
    return status === 204 ? new Response(null, { status }) : new Response(
        JSON.stringify({ message: "Fake logout service failure" }),
        { status, headers: { "Content-Type": "application/json" } },
    );
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => { resolve = done; });
    return { promise, resolve };
}

describe("Growth 2.0 safe student logout", () => {
    let client: ReturnType<typeof createBrowserClient> | undefined;
    let location: { href: string };
    let unexpectedFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isSupabaseConfigured.mockReturnValue(true);
        mocks.isLocalPreviewAuthEnabled.mockReturnValue(false);
        localStorage.clear();
        document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
        const browserWindow = window;
        location = { href: START_URL };
        vi.stubGlobal("window", new Proxy(browserWindow, {
            get(target, property) {
                return property === "location" ? location : Reflect.get(target, property, target);
            },
        }));
        unexpectedFetch = vi.fn(() => { throw new Error("Live network is forbidden in this test"); });
        vi.stubGlobal("fetch", unexpectedFetch);
        localStorage.setItem("codingssok_user", JSON.stringify(fakeUser));
        localStorage.setItem("codingssok_role", "student");
        localStorage.setItem("sb-unrelated-project", "keep");
        localStorage.setItem("unrelated_supabase_preference", "keep");
        localStorage.setItem("learning-unsaved-draft", "keep");
        const session = {
            access_token: "fake-access-token-not-a-real-credential",
            refresh_token: "fake-refresh-token-not-a-real-credential",
            token_type: "bearer", expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: { id: fakeUser.id, email: fakeUser.email, aud: "authenticated" },
        };
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(session))}; Path=/`;
    });

    afterEach(async () => {
        cleanup();
        await client?.auth.dispose();
        client = undefined;
        document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
        localStorage.clear();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    async function setupClient(
        respond: () => Response | Promise<Response>,
        progress = Promise.resolve({ data: { xp: 0, level: 1, streak: 0 } as unknown, error: null }),
    ) {
        const authFetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = new URL(input instanceof Request ? input.url : String(input));
            expect(url.origin).toBe("https://fake-logout.example.test");
            expect(url.pathname).toBe("/auth/v1/logout");
            expect(url.searchParams.get("scope")).toBe("local");
            return respond();
        });
        client = createBrowserClient("https://fake-logout.example.test", "fake-publishable-key", {
            isSingleton: false, cookieEncoding: "raw", cookieOptions: { name: COOKIE_NAME },
            global: { fetch: authFetch },
        });
        expect((await client.auth.getSession()).data.session?.user.id).toBe(fakeUser.id);
        await client.auth.stopAutoRefresh();
        const signOut = vi.spyOn(client.auth, "signOut");
        const from = vi.fn((table: string) => {
            if (table === "students") return makeQuery(Promise.resolve({ data: { id: fakeUser.studentId, status: "active" }, error: null }));
            if (table === "user_progress") return makeQuery(progress);
            throw new Error(`Unexpected table: ${table}`);
        });
        const auth = client.auth;
        // Mock the application's verification call separately: the SDK's own
        // SIGNED_OUT listener also calls getSession for its realtime client.
        const getSession = vi.fn(() => auth.getSession());
        mocks.createClient.mockReturnValue({
            auth: { signOut: (options: { scope: "local" }) => auth.signOut(options), getSession }, from,
        });
        return { auth, signOut, getSession, from, authFetch };
    }

    async function mountReady() {
        render(<AuthProvider><Probe /></AuthProvider>);
        await screen.findByText("student-present");
    }

    async function clickLogout(name = "logout") {
        await act(async () => { fireEvent.click(screen.getByRole("button", { name })); });
    }

    function expectUnrelatedStoragePreserved() {
        expect(localStorage.getItem("sb-unrelated-project")).toBe("keep");
        expect(localStorage.getItem("unrelated_supabase_preference")).toBe("keep");
        expect(localStorage.getItem("learning-unsaved-draft")).toBe("keep");
        expect(unexpectedFetch).not.toHaveBeenCalled();
    }

    async function expectFailure() {
        expect(await screen.findByRole("alert")).toHaveTextContent("로그아웃을 완료하지 못했어요");
        expect(screen.getByRole("button", { name: "로그아웃 다시 시도" })).toBeEnabled();
        expect(screen.queryByText("student-present")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "logout" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
        expect(location.href).toBe(START_URL);
        expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 }));
        expectUnrelatedStoragePreserved();
    }

    async function expectSuccess() {
        await waitFor(() => expect(location.href).toBe("/login"));
        expect(localStorage.getItem("codingssok_user")).toBeNull();
        expect(localStorage.getItem("codingssok_role")).toBeNull();
        expect((await client!.auth.getSession()).data.session).toBeNull();
        expect(document.cookie).not.toContain(`${COOKIE_NAME}=`);
        expect(screen.queryByText("student-present")).not.toBeInTheDocument();
        expectUnrelatedStoragePreserved();
    }

    it.each([204, 401, 403, 404])("redirects only after the SDK removes the session (HTTP %i)", async (status) => {
        const { signOut, authFetch } = await setupClient(() => httpResponse(status));
        await mountReady();
        await clickLogout();
        await expectSuccess();
        expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
        expect(authFetch).toHaveBeenCalledTimes(1);
    });

    it.each([500, 503])("blocks false success on HTTP %i and lets the student retry", async (initialStatus) => {
        let status = initialStatus;
        const { auth, signOut } = await setupClient(() => httpResponse(status));
        await mountReady();
        await clickLogout();
        await expectFailure();
        expect((await auth.getSession()).data.session?.user.id).toBe(fakeUser.id);
        expect(document.cookie).toContain(`${COOKIE_NAME}=`);
        expect(localStorage.getItem("codingssok_user")).not.toBeNull();
        expect(signOut).toHaveBeenCalledTimes(1);
        status = 204;
        await clickLogout("로그아웃 다시 시도");
        await expectSuccess();
        expect(signOut).toHaveBeenCalledTimes(2);
    });

    it("hides learning and rejects duplicate clicks while a request is pending", async () => {
        const pending = deferred<Response>();
        const { signOut } = await setupClient(() => pending.promise);
        await mountReady();
        await clickLogout("double logout");
        expect(screen.getByRole("status")).toHaveTextContent("로그아웃을 확인하고 있어요");
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
        expect(screen.queryByText("student-present")).not.toBeInTheDocument();
        expect(signOut).toHaveBeenCalledTimes(1);
        expect(location.href).toBe(START_URL);
        expect(localStorage.getItem("codingssok_user")).not.toBeNull();
        await act(async () => { pending.resolve(httpResponse(204)); });
        await expectSuccess();
    });

    it("shows a safe retry message when signOut throws, without exposing error details", async () => {
        const { signOut } = await setupClient(() => httpResponse(204));
        await mountReady();
        signOut.mockRejectedValueOnce(new Error("fake-private-error-details"));
        await clickLogout();
        await expectFailure();
        expect(screen.queryByText(/fake-private-error-details/)).not.toBeInTheDocument();
        await clickLogout("로그아웃 다시 시도");
        await expectSuccess();
    });

    it.each(["remaining-session", "error", "exception"])("blocks navigation when post-logout verification reports %s", async (kind) => {
        const { auth, getSession } = await setupClient(() => httpResponse(204));
        await mountReady();
        const previous = await auth.getSession();
        if (kind === "remaining-session") getSession.mockResolvedValueOnce(previous);
        else if (kind === "error") getSession.mockResolvedValueOnce({
            data: { session: null }, error: new AuthApiError("fake verification failure", 503, "unexpected_failure"),
        });
        else getSession.mockRejectedValueOnce(new Error("fake verification exception"));
        await clickLogout();
        await expectFailure();
        await clickLogout("로그아웃 다시 시도");
        await expectSuccess();
    });

    it("does not restore stale profile data when initial XP loading finishes after logout", async () => {
        const progress = deferred<{ data: unknown; error: null }>();
        const { from } = await setupClient(() => httpResponse(204), progress.promise);
        render(<AuthProvider><Probe /></AuthProvider>);
        await waitFor(() => expect(from).toHaveBeenCalledWith("user_progress"));
        await clickLogout();
        await expectSuccess();
        await act(async () => { progress.resolve({ data: { xp: 99, level: 2, streak: 1 }, error: null }); });
        expect(localStorage.getItem("codingssok_user")).toBeNull();
        expect(screen.queryByText("student-present")).not.toBeInTheDocument();
    });

    it("does not report success if this browser refuses to clear the student UI cache", async () => {
        await setupClient(() => httpResponse(204));
        await mountReady();
        const removeItem = Storage.prototype.removeItem;
        const storageFailure = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key: string) {
            if (key === "codingssok_user") throw new Error("Fake storage failure");
            return removeItem.call(this, key);
        });
        await clickLogout();
        await expectFailure();
        storageFailure.mockRestore();
        await clickLogout("로그아웃 다시 시도");
        await expectSuccess();
    });

    it("fails closed if online authentication configuration becomes unavailable", async () => {
        const { signOut } = await setupClient(() => httpResponse(204));
        await mountReady();
        mocks.isSupabaseConfigured.mockReturnValue(false);
        await clickLogout();
        await expectFailure();
        expect(signOut).not.toHaveBeenCalled();
    });

    it("keeps no-DB local preview logout working without creating a client", async () => {
        document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
        mocks.isSupabaseConfigured.mockReturnValue(false);
        mocks.isLocalPreviewAuthEnabled.mockReturnValue(true);
        await mountReady();
        await clickLogout();
        await waitFor(() => expect(location.href).toBe("/login"));
        expect(localStorage.getItem("codingssok_user")).toBeNull();
        expect(localStorage.getItem("codingssok_role")).toBeNull();
        expect(mocks.createClient).not.toHaveBeenCalled();
        expectUnrelatedStoragePreserved();
    });
});
