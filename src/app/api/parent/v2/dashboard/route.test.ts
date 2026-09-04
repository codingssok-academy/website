import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  createServerClient: vi.fn(),
  verifyParentSessionToken: vi.fn(),
  canParentSessionReadStudent: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createServiceClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createServerClient,
}));

vi.mock("@/lib/parent-session", () => ({
  PARENT_SESSION_COOKIE: "test_parent_session",
  verifyParentSessionToken: mocks.verifyParentSessionToken,
}));

vi.mock("@/lib/parent-session-access", () => ({
  canParentSessionReadStudent: mocks.canParentSessionReadStudent,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
}));

type QueryResult = { data: unknown; error: null };

function makeBuilder(data: unknown) {
  const result: QueryResult = { data, error: null };
  const builder: Record<string, unknown> = {};
  const chain = vi.fn(() => builder);

  builder.select = chain;
  builder.eq = chain;
  builder.neq = chain;
  builder.gte = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.single = vi.fn(async () => result);
  builder.maybeSingle = vi.fn(async () => ({
    data: Array.isArray(data) ? data[0] ?? null : data,
    error: null,
  }));
  builder.then = (resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);

  return builder as {
    eq: ReturnType<typeof vi.fn>;
    [key: string]: unknown;
  };
}

describe("fresh parent dashboard growth connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fresh-test.invalid");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key-for-unit-test");
    vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
    mocks.verifyParentSessionToken.mockReturnValue({ studentId: "student-1", studentName: "가짜학생" });
    mocks.canParentSessionReadStudent.mockResolvedValue(true);
    mocks.rateLimit.mockResolvedValue({ success: true, remaining: 59 });
  });

  it("reads only published Growth 2.0 records from the fresh table", async () => {
    const currentGrowth = {
      id: "growth-current",
      class_snapshot: "가짜 공통기초반",
      learned_concepts: "가짜 반복문",
      strengths: "가짜 강점",
      next_goal: "가짜 다음 목표",
      lesson_summary: "가짜 수업 요약",
      parent_message: "가짜 학부모 메시지",
      status: "published",
      published_at: "2026-09-04T01:00:00.000Z",
      updated_at: "2026-09-04T01:00:00.000Z",
      created_at: "2026-09-04T00:00:00.000Z",
    };
    const oldGrowth = {
      ...currentGrowth,
      id: "growth-old",
      learned_concepts: "가짜 조건문",
      published_at: "2026-08-04T01:00:00.000Z",
    };
    const buildersByTable = new Map<string, ReturnType<typeof makeBuilder>[]>();
    let growthCall = 0;

    const from = vi.fn((table: string) => {
      let data: unknown = [];
      if (table === "profiles") {
        data = [{ id: "student-auth-1", display_name: "가짜학생", total_xp: 30, level: 1, role: "student", avatar_url: null }];
      } else if (table === "students") {
        data = [{ id: "student-1", name: "가짜학생", auth_user_id: "student-auth-1", school: "가짜초", grade: "1학년", class: "공통기초반", status: "active" }];
      } else if (table === "user_progress") {
        data = { xp: 30, level: 1, streak: 0, best_streak: 0, tier: "Iron", accuracy: 0, total_code_runs: 0, total_problems: 0, last_active_date: null, tier_points: 0 };
      } else if (table === "student_growth_records") {
        growthCall += 1;
        data = growthCall === 1 ? currentGrowth : [currentGrowth, oldGrowth];
      }

      const builder = makeBuilder(data);
      buildersByTable.set(table, [...(buildersByTable.get(table) || []), builder]);
      return builder;
    });

    mocks.createServiceClient.mockReturnValue({
      from,
      rpc: vi.fn(async () => ({ data: null, error: null })),
    });

    const { GET } = await import("./route");
    const request = new NextRequest("http://localhost:3011/api/parent/v2/dashboard?name=가짜학생", {
      headers: { cookie: "test_parent_session=signed-fake-session" },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("student_growth_records");
    expect(from).not.toHaveBeenCalledWith("student_growth_management");
    expect(from).not.toHaveBeenCalledWith("student_growth_entries");
    expect(buildersByTable.get("student_growth_records")).toHaveLength(2);
    for (const builder of buildersByTable.get("student_growth_records") || []) {
      expect(builder.eq).toHaveBeenCalledWith("status", "published");
    }
    expect(body.growth.current).toEqual({
      id: "growth-current",
      currentClass: "가짜 공통기초반",
      strengths: "가짜 강점",
      currentGoal: "가짜 다음 목표",
      classProgress: "가짜 반복문",
      parentFeedback: "가짜 학부모 메시지",
      recordedAt: "2026-09-04T01:00:00.000Z",
    });
    expect(body.growth.history).toEqual([
      expect.objectContaining({ id: "growth-old", classProgress: "가짜 조건문" }),
    ]);
  });
});
