import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createSupabaseClient,
}));

import { POST } from "./route";

function request(body: unknown) {
  return new NextRequest("https://www.codingssok.com/api/student/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("student login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects an invalid name or PIN before reading the database", async () => {
    const response = await POST(request({ name: "장민", pin: "00" }));

    expect(response.status).toBe(400);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("returns a generic error when the account cannot be authenticated", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: "cd9271ed-65b3-40ad-8f22-65eb0899fc61",
          name: "장민",
          school: null,
          grade: null,
          class: "admin",
          avatar: null,
          auth_user_id: "15b6cdb8-ab2f-43e9-a10f-f441ffb24b81",
          status: "approved",
        },
      ],
      error: null,
    });
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: vi.fn(() => ({ limit })) })),
      })),
    });
    mocks.createSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "invalid credentials" },
        }),
      },
    });

    const response = await POST(request({ name: "장민", pin: "9999" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("이름 또는 비밀번호가 올바르지 않습니다.");
  });

  it("creates the browser session through the protected server lookup", async () => {
    const userId = "15b6cdb8-ab2f-43e9-a10f-f441ffb24b81";
    const student = {
      id: "cd9271ed-65b3-40ad-8f22-65eb0899fc61",
      name: "장민",
      school: null,
      grade: null,
      class: "admin",
      avatar: null,
      auth_user_id: userId,
      status: "approved",
    };
    const profileEq = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "students") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({ data: [student], error: null }),
              })),
            })),
          };
        }
        return { update: vi.fn(() => ({ eq: profileEq })) };
      }),
    };
    mocks.createAdminClient.mockReturnValue(admin);
    mocks.createSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: { id: userId },
            session: { access_token: "access-token", refresh_token: "refresh-token" },
          },
          error: null,
        }),
      },
    });

    const response = await POST(request({ name: "장민", pin: "0000" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.student.name).toBe("장민");
    expect(body.session).toEqual({ access_token: "access-token", refresh_token: "refresh-token" });
    expect(profileEq).toHaveBeenCalledWith("id", userId);
  });

  it("uses the server-only hashed lookup when the fresh database mode is enabled", async () => {
    vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
    const studentId = "11111111-1111-4111-8111-111111111111";
    const userId = "22222222-2222-4222-8222-222222222222";
    const student = {
      id: studentId,
      name: "테스트학생",
      school: "테스트초",
      grade: "3학년",
      class: "기초반",
      avatar: null,
      auth_user_id: userId,
      status: "active",
    };
    const maybeSingle = vi.fn().mockResolvedValue({ data: student, error: null });
    const idEq = vi.fn(() => ({ maybeSingle }));
    const profileEq = vi.fn().mockResolvedValue({ error: null });
    const rpc = vi.fn().mockResolvedValue({
      data: [{ student_id: studentId, auth_user_id: userId, student_status: "active" }],
      error: null,
    });
    const admin = {
      rpc,
      from: vi.fn((table: string) => {
        if (table === "students") {
          return { select: vi.fn(() => ({ eq: idEq })) };
        }
        return { update: vi.fn(() => ({ eq: profileEq })) };
      }),
    };
    mocks.createAdminClient.mockReturnValue(admin);
    mocks.createSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: { id: userId },
            session: { access_token: "access-token", refresh_token: "refresh-token" },
          },
          error: null,
        }),
      },
    });

    const response = await POST(request({ name: "테스트학생", pin: "2468" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.accountRole).toBe("student");
    expect(rpc).toHaveBeenCalledWith("codingssok_verify_student_access_code", {
      p_student_name: "테스트학생",
      p_purpose: "student_login",
      p_code: "2468",
    });
    expect(idEq).toHaveBeenCalledWith("id", studentId);
  });
});
