import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "./local-parent-session/route";
import { POST as children } from "./local-parent-children/route";
import { POST as report } from "./local-parent-weekly-report/route";

const TOKEN = "parent-access-token-long-enough";
const STUDENT_ID = "11111111-1111-4111-8111-111111111111";

function request(
  path: string,
  body?: Record<string, unknown>,
  token = TOKEN,
  host = "127.0.0.1:3016",
) {
  return new NextRequest(`http://${host}/api/growth-preview/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("local parent read-only API routes", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GROWTH_PREVIEW_LOCAL_ONLY", "1");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_ANON_KEY", "local-anon-key");
    vi.stubEnv("GROWTH_PREVIEW_PARENT_EMAIL", "parent-preview@example.test");
    vi.stubEnv("GROWTH_PREVIEW_PARENT_PASSWORD", "placeholder-only");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("blocks production, external hosts, external backends, and missing settings", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await login(request("local-parent-session"))).status).toBe(404);
    vi.stubEnv("NODE_ENV", "development");
    expect((await login(request("local-parent-session", undefined, TOKEN, "example.com"))).status).toBe(404);
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "https://example.invalid");
    expect((await login(request("local-parent-session"))).status).toBe(503);
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_ANON_KEY", "");
    expect((await login(request("local-parent-session"))).status).toBe(503);
  });

  it("returns only an access token and expiry without cookies", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      access_token: TOKEN,
      refresh_token: "must-stay-on-server",
      expires_in: 3600,
      user: { id: "hidden-parent-auth-id" },
    }), { status: 200 }));

    const response = await login(request("local-parent-session"));
    const body = await response.json();
    expect(body).toEqual({ accessToken: TOKEN, expiresIn: 3600 });
    expect(JSON.stringify(body)).not.toMatch(/refresh|password|hidden-parent/);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reads linked children with only the anon key and real parent token", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ api_version: "1.0", data: [] }), { status: 200 }),
    );
    const response = await children(request("local-parent-children", {}));
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:54321/rest/v1/rpc/growth_api_parent_children",
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: {
          apikey: "local-anon-key",
          authorization: `Bearer ${TOKEN}`,
          "content-type": "application/json",
        },
      }),
    );
    expect(JSON.stringify(fetchSpy.mock.calls)).not.toMatch(/service_role|parent_id|role/);
  });

  it("rejects identity fields and missing parent tokens for child reads", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await children(request("local-parent-children", { parent_id: "forbidden" }))).status).toBe(400);
    expect((await children(request("local-parent-children", { role: "parent" }))).status).toBe(400);
    expect((await children(request("local-parent-children", {}, ""))).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends only student id and week start to the verified report RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ api_version: "1.0", data: {} }), { status: 200 }),
    );
    const response = await report(request("local-parent-weekly-report", {
      studentId: STUDENT_ID,
      weekStart: "2026-07-06",
    }));
    const sent = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(response.status).toBe(200);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "http://127.0.0.1:54321/rest/v1/rpc/growth_api_parent_weekly_report",
    );
    expect(sent).toEqual({ p_student_id: STUDENT_ID, p_week_start: "2026-07-06" });
    expect(JSON.stringify(fetchSpy.mock.calls)).not.toMatch(
      /service_role|parent_id|teacher_id|published_version|evaluation_id/,
    );
  });

  it("rejects unsafe report fields, invalid values, and missing tokens", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const valid = { studentId: STUDENT_ID, weekStart: "2026-07-06" };
    expect((await report(request("local-parent-weekly-report", { ...valid, parent_id: "forbidden" }))).status).toBe(400);
    expect((await report(request("local-parent-weekly-report", { ...valid, role: "parent" }))).status).toBe(400);
    expect((await report(request("local-parent-weekly-report", { ...valid, publishedVersion: 9 }))).status).toBe(400);
    expect((await report(request("local-parent-weekly-report", { ...valid, studentId: "not-a-uuid" }))).status).toBe(400);
    expect((await report(request("local-parent-weekly-report", { ...valid, weekStart: "06-07-2026" }))).status).toBe(400);
    expect((await report(request("local-parent-weekly-report", valid, ""))).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns friendly status codes and hides backend details", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "private sql policy detail" }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "private stack" }), { status: 500 }));
    const denied = await report(request("local-parent-weekly-report", { studentId: STUDENT_ID, weekStart: "2026-07-06" }));
    expect(await denied.json()).toEqual({ code: "PARENT_ACCESS_DENIED" });
    const unavailable = await children(request("local-parent-children", {}));
    expect(await unavailable.json()).toEqual({ code: "LOCAL_BACKEND_UNAVAILABLE" });
  });
});
