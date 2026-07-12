import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as home } from "./local-student-home/route";
import { POST as login } from "./local-student-session/route";

const TOKEN = "student-access-token-long-enough";

function request(
  path: string,
  body: Record<string, unknown>,
  token = "",
  host = "127.0.0.1:3017",
) {
  return new NextRequest(`http://${host}/api/growth-preview/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("local student read-only API routes", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GROWTH_PREVIEW_LOCAL_ONLY", "1");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_ANON_KEY", "local-anon-key");
    vi.stubEnv("GROWTH_PREVIEW_STUDENT_A_EMAIL", "student-a-preview@example.test");
    vi.stubEnv("GROWTH_PREVIEW_STUDENT_A_PASSWORD", "memory-only-a");
    vi.stubEnv("GROWTH_PREVIEW_STUDENT_B_EMAIL", "student-b-preview@example.test");
    vi.stubEnv("GROWTH_PREVIEW_STUDENT_B_PASSWORD", "memory-only-b");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("blocks production, external hosts, external backends, and missing settings", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await login(request("local-student-session", { studentCode: "student-a" }))).status).toBe(404);
    vi.stubEnv("NODE_ENV", "development");
    expect((await login(request("local-student-session", { studentCode: "student-a" }, "", "example.com"))).status).toBe(404);
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "https://example.invalid");
    expect((await login(request("local-student-session", { studentCode: "student-a" }))).status).toBe(503);
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_ANON_KEY", "");
    expect((await home(request("local-student-home", {}, TOKEN))).status).toBe(503);
  });

  it("accepts only student A or B codes and keeps account details on the server", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({
        access_token: TOKEN,
        refresh_token: "must-stay-on-server",
        expires_in: 3600,
        user: { id: "hidden-auth-id" },
      }), { status: 200 }),
    );

    const responseA = await login(request("local-student-session", { studentCode: "student-a" }));
    const responseB = await login(request("local-student-session", { studentCode: "student-b" }));
    expect(await responseA.json()).toEqual({ accessToken: TOKEN, expiresIn: 3600 });
    expect(await responseB.json()).toEqual({ accessToken: TOKEN, expiresIn: 3600 });
    expect(responseA.headers.get("set-cookie")).toBeNull();
    expect(responseA.headers.get("cache-control")).toBe("no-store");
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      email: "student-a-preview@example.test",
      password: "memory-only-a",
    });
    expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body))).toEqual({
      email: "student-b-preview@example.test",
      password: "memory-only-b",
    });
  });

  it("rejects unknown codes, extra identity fields, and freely supplied account data", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await login(request("local-student-session", { studentCode: "student-c" }))).status).toBe(400);
    expect((await login(request("local-student-session", { studentCode: "student-a", email: "other@example.test" }))).status).toBe(400);
    expect((await login(request("local-student-session", { studentCode: "student-a", userId: "hidden" }))).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls only the verified student home RPC with the real student token", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ api_version: "1.0", data: { published_feedback: null } }), { status: 200 }),
    );
    const response = await home(request("local-student-home", {}, TOKEN));
    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:54321/rest/v1/rpc/growth_api_student_home",
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
    expect(JSON.stringify(fetchSpy.mock.calls)).not.toMatch(/service_role|student_id|parent_id|teacher_id|role/);
  });

  it("rejects student identity fields and missing tokens before calling the backend", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await home(request("local-student-home", { student_id: "forbidden" }, TOKEN))).status).toBe(400);
    expect((await home(request("local-student-home", { role: "student" }, TOKEN))).status).toBe(400);
    expect((await home(request("local-student-home", {}, ""))).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses a backend response containing student-hidden evaluation fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        data: { published_feedback: { strength: "좋아요", improvement: "숨김 정보" } },
      }), { status: 200 }),
    );
    const response = await home(request("local-student-home", {}, TOKEN));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "UNSAFE_STUDENT_RESPONSE" });
  });

  it("returns friendly status codes without exposing backend errors", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "private jwt detail" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "private sql stack" }), { status: 500 }));
    const expired = await home(request("local-student-home", {}, TOKEN));
    expect(await expired.json()).toEqual({ code: "STUDENT_SESSION_EXPIRED" });
    const unavailable = await home(request("local-student-home", {}, TOKEN));
    expect(await unavailable.json()).toEqual({ code: "LOCAL_BACKEND_UNAVAILABLE" });
  });
});
