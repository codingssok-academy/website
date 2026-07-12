import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "./local-teacher-session/route";
import { POST as students } from "./local-teacher-students/route";
import { POST as evaluation } from "./local-teacher-evaluation/route";
import { POST as saveDraft } from "./local-teacher-draft-save/route";

const TOKEN = "teacher-access-token-long-enough";

function request(path: string, body?: Record<string, unknown>, token = TOKEN, host = "127.0.0.1:3013") {
  return new NextRequest(`http://${host}/api/growth-preview/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const VALID_DRAFT = {
  studentId: "11111111-1111-4111-8111-111111111111",
  weekStart: "2026-07-06",
  understanding: "understands_basics",
  participation: "asked_questions",
  homeworkStatus: "complete",
  strength: "질문을 정리하며 문제를 해결한 점이 좋았습니다.",
  improvement: "실행 전에 예상 결과를 적는 연습이 필요합니다.",
  nextGoal: "다음 시간에는 조건문 문제를 완성해 봅니다.",
  conceptKeys: ["condition", "debugging"],
  customConcepts: [],
  expectedUpdatedAt: null,
};

describe("local teacher API routes", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GROWTH_PREVIEW_LOCAL_ONLY", "1");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_ANON_KEY", "local-anon-key");
    vi.stubEnv("GROWTH_PREVIEW_TEACHER_EMAIL", "teacher-preview@example.test");
    vi.stubEnv("GROWTH_PREVIEW_TEACHER_PASSWORD", "placeholder-only");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("blocks production, external hosts, external backends, and missing local settings", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await login(request("local-teacher-session"))).status).toBe(404);
    vi.stubEnv("NODE_ENV", "development");
    expect((await login(request("local-teacher-session", undefined, TOKEN, "example.com"))).status).toBe(404);
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "https://example.invalid");
    expect((await login(request("local-teacher-session"))).status).toBe(503);
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_ANON_KEY", "");
    expect((await login(request("local-teacher-session"))).status).toBe(503);
  });

  it("returns only an access token and expiry from local teacher login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      access_token: TOKEN,
      refresh_token: "must-stay-on-server",
      expires_in: 3600,
      user: { id: "hidden-user-id" },
    }), { status: 200 }));

    const response = await login(request("local-teacher-session"));
    const body = await response.json();

    expect(body).toEqual({ accessToken: TOKEN, expiresIn: 3600 });
    expect(JSON.stringify(body)).not.toContain("refresh");
    expect(JSON.stringify(body)).not.toContain("password");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reads assigned students and evaluation with the anon key and teacher token only", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ api_version: "1.0", data: [] }), { status: 200 }),
    );
    await students(request("local-teacher-students", {}));
    await evaluation(request("local-teacher-evaluation", {
      studentId: VALID_DRAFT.studentId,
      weekStart: VALID_DRAFT.weekStart,
    }));

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "http://127.0.0.1:54321/rest/v1/rpc/growth_api_teacher_students",
      expect.objectContaining({
        headers: {
          apikey: "local-anon-key",
          authorization: `Bearer ${TOKEN}`,
          "content-type": "application/json",
        },
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "http://127.0.0.1:54321/rest/v1/rpc/growth_api_teacher_weekly_evaluation",
      expect.objectContaining({
        body: JSON.stringify({
          p_student_id: VALID_DRAFT.studentId,
          p_week_start: VALID_DRAFT.weekStart,
        }),
      }),
    );
    expect(JSON.stringify(fetchSpy.mock.calls)).not.toContain("service_role");
  });

  it("sends only approved draft fields to the verified save RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ saved: true, created: true, conflict: false }), { status: 200 }),
    );
    const response = await saveDraft(request("local-teacher-draft-save", VALID_DRAFT));
    const sent = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));

    expect(response.status).toBe(200);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "http://127.0.0.1:54321/rest/v1/rpc/growth_api_save_teacher_evaluation_draft",
    );
    expect(sent).toEqual({
      p_student_id: VALID_DRAFT.studentId,
      p_week_start: VALID_DRAFT.weekStart,
      p_understanding: VALID_DRAFT.understanding,
      p_participation: VALID_DRAFT.participation,
      p_homework_status: VALID_DRAFT.homeworkStatus,
      p_strength: VALID_DRAFT.strength,
      p_improvement: VALID_DRAFT.improvement,
      p_next_goal: VALID_DRAFT.nextGoal,
      p_concept_keys: VALID_DRAFT.conceptKeys,
      p_expected_updated_at: null,
    });
    expect(Object.keys(sent)).not.toEqual(expect.arrayContaining([
      "teacher_id", "role", "status", "version", "published_at", "project", "xp", "mission",
    ]));
  });

  it("validates and forwards custom concepts without identity fields", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ saved: true, created: true, conflict: false }), { status: 200 }),
    );
    const customOnly = {
      ...VALID_DRAFT,
      conceptKeys: [],
      customConcepts: ["  변수  ", "입출력"],
    };
    expect((await saveDraft(request("local-teacher-draft-save", customOnly))).status).toBe(200);
    const sent = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(sent.p_concept_keys).toEqual(["custom:변수", "custom:입출력"]);
    expect(Object.keys(sent)).not.toEqual(expect.arrayContaining([
      "teacher_id", "role", "status", "published_at", "project",
    ]));
  });

  it("rejects hidden fields, invalid text, missing concepts, and missing tokens", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await saveDraft(request("local-teacher-draft-save", { ...VALID_DRAFT, teacher_id: "forbidden" }))).status).toBe(400);
    expect((await saveDraft(request("local-teacher-draft-save", { ...VALID_DRAFT, strength: "짧음" }))).status).toBe(400);
    expect((await saveDraft(request("local-teacher-draft-save", { ...VALID_DRAFT, conceptKeys: [] }))).status).toBe(400);
    expect((await saveDraft(request("local-teacher-draft-save", { ...VALID_DRAFT, customConcepts: ["A"] }))).status).toBe(400);
    expect((await saveDraft(request("local-teacher-draft-save", { ...VALID_DRAFT, customConcepts: ["함수", " 함수 "] }))).status).toBe(400);
    expect((await saveDraft(request("local-teacher-draft-save", { ...VALID_DRAFT, customConcepts: ["조건 비교"] }))).status).toBe(400);
    expect((await saveDraft(request("local-teacher-draft-save", { ...VALID_DRAFT, customConcepts: ["01개념", "02개념", "03개념", "04개념", "05개념", "06개념"] }))).status).toBe(400);
    expect((await saveDraft(request("local-teacher-draft-save", VALID_DRAFT, ""))).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes through conflict JSON but hides backend error details", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ saved: false, conflict: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "internal sql detail" }), { status: 403 }));
    const conflict = await saveDraft(request("local-teacher-draft-save", VALID_DRAFT));
    expect(await conflict.json()).toEqual({ saved: false, conflict: true });
    const denied = await saveDraft(request("local-teacher-draft-save", VALID_DRAFT));
    expect(await denied.json()).toEqual({ code: "TEACHER_ACCESS_DENIED" });
  });
});
