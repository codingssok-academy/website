import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { readGrowthPreviewProxyConfig } = vi.hoisted(() => ({
  readGrowthPreviewProxyConfig: vi.fn(),
}));
vi.mock("../preview-server-guard", () => ({ readGrowthPreviewProxyConfig }));

import { POST } from "./route";

function request(body: Record<string, unknown>) {
  return new NextRequest("https://growth-preview-test.vercel.app/api/growth-preview/staging-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("staging preview session route", () => {
  beforeEach(() => {
    readGrowthPreviewProxyConfig.mockReturnValue({
      ok: true,
      config: {
        mode: "staging",
        apiUrl: "https://growth-preview-test.supabase.co",
        anonKey: "sb_publishable_test-only-value",
      },
    });
    vi.stubEnv("GROWTH_PREVIEW_STUDENT_A_EMAIL", "student-a-staging@example.test");
    vi.stubEnv("GROWTH_PREVIEW_STUDENT_A_PASSWORD", "student-a-test-password");
    vi.stubEnv("GROWTH_PREVIEW_STUDENT_B_EMAIL", "student-b-staging@example.test");
    vi.stubEnv("GROWTH_PREVIEW_STUDENT_B_PASSWORD", "student-b-test-password");
    vi.stubEnv("GROWTH_PREVIEW_PARENT_EMAIL", "parent-staging@example.test");
    vi.stubEnv("GROWTH_PREVIEW_PARENT_PASSWORD", "parent-test-password");
    vi.stubEnv("GROWTH_PREVIEW_TEACHER_EMAIL", "teacher-staging@example.test");
    vi.stubEnv("GROWTH_PREVIEW_TEACHER_PASSWORD", "teacher-test-password");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    readGrowthPreviewProxyConfig.mockReset();
  });

  it.each(["student-a", "student-b", "parent", "teacher"])(
    "accepts only the fixed %s role code and returns no refresh token or cookie",
    async (roleCode) => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({
          access_token: "access-token-kept-in-react-memory",
          refresh_token: "must-not-reach-browser",
          expires_in: 3600,
        }), { status: 200 }),
      );
      const response = await POST(request({ roleCode }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        accessToken: "access-token-kept-in-react-memory",
        expiresIn: 3600,
      });
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(JSON.stringify(fetchSpy.mock.calls)).not.toContain("refresh_token");
    },
  );

  it("rejects free-form identity input before contacting Supabase", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (const body of [
      { roleCode: "admin" },
      { roleCode: "student-c" },
      { roleCode: "student-a", email: "other@example.test" },
      { email: "student-a-staging@example.test" },
      {},
    ]) {
      expect((await POST(request(body))).status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails closed outside the exact staging Preview guard", async () => {
    readGrowthPreviewProxyConfig.mockReturnValue({ ok: false, reason: "disabled" });
    expect((await POST(request({ roleCode: "student-a" }))).status).toBe(404);
    readGrowthPreviewProxyConfig.mockReturnValue({ ok: false, reason: "not_ready" });
    expect((await POST(request({ roleCode: "student-a" }))).status).toBe(503);
  });
});
