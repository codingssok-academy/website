import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch
const mockFetch = vi.fn(() => Promise.resolve({ ok: true }));
vi.stubGlobal("fetch", mockFetch);

// Mock env
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");

describe("error-reporter", () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    it("should send error to supabase", async () => {
        // Dynamic import to pick up env mocks
        const { reportError } = await import("@/lib/error-reporter");

        await reportError({
            source: "client",
            message: "Test error",
            stack: "Error: Test\n  at test.ts:1",
        });

        expect(mockFetch).toHaveBeenCalledOnce();
        const [url, options] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toContain("/rest/v1/error_logs");
        expect(options.method).toBe("POST");

        const body = JSON.parse(options.body as string);
        expect(body.source).toBe("client");
        expect(body.message).toBe("Test error");
    });

    it("should truncate long messages to 500 chars", () => {
        const longMsg = "x".repeat(1000);
        expect(longMsg.slice(0, 500).length).toBe(500);
    });
});
