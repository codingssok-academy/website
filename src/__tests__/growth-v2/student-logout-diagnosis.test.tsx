import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createBrowserClient } from "@supabase/ssr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
    createClient: mocks.createClient,
    isSupabaseConfigured: () => true,
    isLocalPreviewAuthEnabled: () => false,
}));

import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Diagnostic characterization, NOT a security acceptance test. The failure cases
// deliberately reproduce the current defect; invert them when logout is fixed.
// The installed SDK runs locally with an in-memory HTTP substitute. No DB, real
// credentials, browser profile, or live Supabase endpoint is used.
const COOKIE_NAME = "sb-fake-logout-diagnosis-auth-token";
const fakeUser = {
    id: "11111111-1111-4111-8111-111111111111",
    studentId: "22222222-2222-4222-8222-222222222222",
    name: "가짜로그아웃학생",
    email: "fake-student@example.test",
    role: "student" as const,
    level: 1,
    xp: 0,
    streak: 0,
    joinedAt: "2026-09-06T00:00:00.000Z",
};

function Probe() {
    const { user, loading, signOut } = useAuth();
    return <>
        <output>{loading ? "loading" : user ? "student-present" : "student-absent"}</output>
        <button onClick={signOut}>diagnostic logout</button>
    </>;
}

function makeQuery(data: unknown) {
    return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data, error: null }) }) }) };
}

describe("Growth 2.0 student logout diagnosis (existing failure behavior)", () => {
    let client: ReturnType<typeof createBrowserClient> | undefined;
    let location: { href: string };
    let unexpectedFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
        const browserWindow = window;
        location = { href: "http://localhost:3000/dashboard/learning" };
        vi.stubGlobal("window", new Proxy(browserWindow, {
            get(target, property) {
                return property === "location" ? location : Reflect.get(target, property, target);
            },
        }));
        unexpectedFetch = vi.fn(() => { throw new Error("Live network is forbidden in this diagnosis"); });
        vi.stubGlobal("fetch", unexpectedFetch);
        localStorage.setItem("codingssok_user", JSON.stringify(fakeUser));
        localStorage.setItem("codingssok_role", "student");
        const session = {
            access_token: "fake-access-token-not-a-real-credential",
            refresh_token: "fake-refresh-token-not-a-real-credential",
            token_type: "bearer",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: { id: fakeUser.id, email: fakeUser.email, aud: "authenticated" },
        };
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(session))}; Path=/`;
    });

    afterEach(async () => {
        cleanup();
        await client?.auth.stopAutoRefresh();
        client = undefined;
        document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
        localStorage.clear();
        vi.unstubAllGlobals();
    });

    it.each([204, 500, 503])("records cookie/session behavior when logout returns HTTP %i", async (status) => {
        const authFetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = new URL(input instanceof Request ? input.url : String(input));
            expect(url.origin).toBe("https://fake-logout.example.test");
            expect(url.pathname).toBe("/auth/v1/logout");
            expect(url.searchParams.get("scope")).toBe("local");
            return status === 204
                ? new Response(null, { status })
                : new Response(JSON.stringify({ message: "Fake logout service failure" }), {
                    status, headers: { "Content-Type": "application/json" },
                });
        });
        client = createBrowserClient("https://fake-logout.example.test", "fake-publishable-key", {
            isSingleton: false,
            cookieEncoding: "raw",
            cookieOptions: { name: COOKIE_NAME },
            global: { fetch: authFetch },
        });
        expect((await client.auth.getSession()).data.session?.user.id).toBe(fakeUser.id);
        await client.auth.stopAutoRefresh();
        const sdkSignOut = vi.spyOn(client.auth, "signOut");
        mocks.createClient.mockReturnValue({
            auth: client.auth,
            from: (table: string) => {
                if (table === "students") return makeQuery({ id: fakeUser.studentId, status: "active" });
                if (table === "user_progress") return makeQuery({ xp: 0, level: 1, streak: 0 });
                throw new Error(`Unexpected table: ${table}`);
            },
        });

        render(<AuthProvider><Probe /></AuthProvider>);
        await screen.findByText("student-present");
        await act(async () => { fireEvent.click(screen.getByRole("button", { name: "diagnostic logout" })); });
        await waitFor(() => expect(location.href).toBe("/login"));

        expect(sdkSignOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
        expect(authFetch).toHaveBeenCalledTimes(1);
        expect(unexpectedFetch).not.toHaveBeenCalled();
        expect(screen.getByText("student-absent")).toBeInTheDocument();
        expect(localStorage.getItem("codingssok_user")).toBeNull();
        expect(localStorage.getItem("codingssok_role")).toBeNull();
        const result = await sdkSignOut.mock.results[0].value;
        const remaining = (await client.auth.getSession()).data.session;
        if (status === 204) {
            expect(result.error).toBeNull();
            expect(remaining).toBeNull();
            expect(document.cookie).not.toContain(`${COOKIE_NAME}=`);
        } else {
            // Confirmed defect: the UI navigates exactly as on success even
            // though the SDK reports failure and keeps the cookie/session.
            expect(result.error).not.toBeNull();
            expect(remaining?.user.id).toBe(fakeUser.id);
            expect(document.cookie).toContain(`${COOKIE_NAME}=`);
        }
    });
});
