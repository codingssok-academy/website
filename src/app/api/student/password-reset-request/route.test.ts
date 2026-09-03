import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { POST } from "./route";

function request(body: unknown) {
  return new NextRequest("https://www.codingssok.com/api/student/password-reset-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeAdmin(options?: { validCode?: boolean; recent?: boolean }) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const studentLimit = vi.fn().mockResolvedValue({
    data: [{
      id: "student-row-id",
      name: "테스트학생",
      pin: options?.validCode === false ? "99999" : "12345",
      auth_user_id: "student-auth-id",
      status: "approved",
    }],
    error: null,
  });
  const adminLimit = vi.fn().mockResolvedValue({
    data: [{ id: "admin-auth-id", name: "장민", display_name: "관리자" }],
    error: null,
  });
  const recentLimit = vi.fn().mockResolvedValue({
    data: options?.recent ? [{ id: "existing-message" }] : [],
    error: null,
  });

  const admin = {
    from: vi.fn((table: string) => {
      if (table === "students") {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ limit: studentLimit })) })) };
      }
      if (table === "profiles") {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ limit: adminLimit })) })) };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({ limit: recentLimit })),
              })),
            })),
          })),
        })),
        insert,
      };
    }),
  };

  return { admin, insert };
}

describe("student password reset request route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects incomplete identification before reading the database", async () => {
    const response = await POST(request({ name: "테스트학생", parentCode: "12" }));

    expect(response.status).toBe(400);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("does not reveal an account when the parent code is wrong", async () => {
    const { admin } = makeAdmin({ validCode: false });
    mocks.createAdminClient.mockReturnValue(admin);

    const response = await POST(request({ name: "테스트학생", parentCode: "12345" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("학생 이름과 학부모 인증번호를 확인해주세요.");
  });

  it("sends one fixed reset request to the admin without storing a password", async () => {
    const { admin, insert } = makeAdmin();
    mocks.createAdminClient.mockReturnValue(admin);

    const response = await POST(request({ name: "테스트학생", parentCode: "12345" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      sender_id: "student-auth-id",
      receiver_id: "admin-auth-id",
      sender_name: "테스트학생",
      is_read: false,
    }));
    expect(insert.mock.calls[0][0].content).toContain("비밀번호 변경 요청");
    expect(JSON.stringify(insert.mock.calls[0][0])).not.toContain("12345");
  });

  it("treats a recent identical request as success without sending it twice", async () => {
    const { admin, insert } = makeAdmin({ recent: true });
    mocks.createAdminClient.mockReturnValue(admin);

    const response = await POST(request({ name: "테스트학생", parentCode: "12345" }));

    expect(response.status).toBe(200);
    expect(insert).not.toHaveBeenCalled();
  });
});
