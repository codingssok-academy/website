import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { POST } from "./route";

function signupRequest(body: unknown) {
  return new NextRequest("https://www.codingssok.com/api/student/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("student signup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("가입 전 학생 ID에 발급된 학부모 인증번호로 회원가입한다", async () => {
    const studentId = "11111111-1111-4111-8111-111111111111";
    const authUserId = "22222222-2222-4222-8222-222222222222";
    const parentCode = "54321";
    const student = {
      id: studentId,
      name: "테스트학생",
      school: "테스트초",
      grade: "5학년",
      class: "프로젝트반",
      avatar: null,
      pin: null,
      auth_user_id: null,
      birthday: null,
      status: "approved",
    };
    const updatedStudent = {
      ...student,
      pin: parentCode,
      auth_user_id: authUserId,
    };

    const studentLimit = vi.fn().mockResolvedValue({ data: [student], error: null });
    const studentNameEq = vi.fn(() => ({ limit: studentLimit }));
    const studentSelect = vi.fn(() => ({ eq: studentNameEq }));

    const parentCodeMaybeSingle = vi.fn().mockResolvedValue({
      data: { completed_units: [parentCode] },
      error: null,
    });
    const parentCodeCourseEq = vi.fn(() => ({ maybeSingle: parentCodeMaybeSingle }));
    const parentCodeUserEq = vi.fn(() => ({ eq: parentCodeCourseEq }));
    const progressSelect = vi.fn(() => ({ eq: parentCodeUserEq }));
    const progressUpsert = vi.fn().mockResolvedValue({ error: null });

    const updatedSingle = vi.fn().mockResolvedValue({ data: updatedStudent, error: null });
    const updatedSelect = vi.fn(() => ({ single: updatedSingle }));
    const updatedIdEq = vi.fn(() => ({ select: updatedSelect }));
    const studentUpdate = vi.fn(() => ({ eq: updatedIdEq }));
    const profileUpsert = vi.fn().mockResolvedValue({ error: null });
    const profileMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const profileLimit = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileEmailEq = vi.fn(() => ({ limit: profileLimit }));
    const profileSelect = vi.fn(() => ({ eq: profileEmailEq }));
    const listUsers = vi.fn().mockResolvedValue({
      data: { users: [] },
      error: { message: "Database error finding users" },
    });

    const adminClient = {
      auth: {
        admin: {
          listUsers,
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: authUserId } }, error: null }),
          updateUserById: vi.fn(),
          deleteUser: vi.fn(),
        },
      },
      from: vi.fn((table: string) => {
        if (table === "students") {
          return { select: studentSelect, update: studentUpdate };
        }
        if (table === "study_progress") {
          return { select: progressSelect, upsert: progressUpsert };
        }
        if (table === "profiles") {
          return { select: profileSelect, upsert: profileUpsert };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    mocks.createAdminClient.mockReturnValue(adminClient);

    const response = await POST(signupRequest({
      name: "테스트학생",
      parentCode,
      pin: "2468",
      school: "테스트초",
      grade: "5학년",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.student.auth_user_id).toBe(authUserId);
    expect(listUsers).not.toHaveBeenCalled();
    expect(profileEmailEq).toHaveBeenCalledWith("email", `student_${studentId}@codingssok.local`);
    expect(parentCodeUserEq).toHaveBeenCalledWith("user_id", studentId);
    expect(adminClient.auth.admin.createUser).toHaveBeenCalledTimes(1);
    expect(progressUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: authUserId, completed_units: [parentCode] }),
      { onConflict: "user_id,course_id" },
    );
  });

  it("새 DB 모드에서는 인증번호를 공개 학생 표에 저장하지 않는다", async () => {
    vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
    const studentId = "11111111-1111-4111-8111-111111111111";
    const authUserId = "22222222-2222-4222-8222-222222222222";
    const student = {
      id: studentId,
      name: "테스트학생",
      school: "테스트초",
      grade: "3학년",
      class: "기초반",
      avatar: null,
      auth_user_id: null,
      birthday: null,
      status: "active",
    };
    const updatedStudent = { ...student, auth_user_id: authUserId };
    const studentMaybeSingle = vi.fn().mockResolvedValue({ data: student, error: null });
    const studentIdEq = vi.fn(() => ({ maybeSingle: studentMaybeSingle }));
    const updatedSingle = vi.fn().mockResolvedValue({ data: updatedStudent, error: null });
    const updatedSelect = vi.fn(() => ({ single: updatedSingle }));
    const updateIdEq = vi.fn(() => ({ select: updatedSelect }));
    const studentUpdate = vi.fn((payload: Record<string, unknown>) => {
      expect(payload).toBeDefined();
      return { eq: updateIdEq };
    });
    const profileMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const profileLimit = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
    const profileEmailEq = vi.fn(() => ({ limit: profileLimit }));
    const profileUpsert = vi.fn().mockResolvedValue({ error: null });
    const rpc = vi.fn()
      .mockResolvedValueOnce({
        data: [{ student_id: studentId, auth_user_id: null, student_status: "active" }],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });
    const adminClient = {
      rpc,
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: authUserId } }, error: null }),
          updateUserById: vi.fn(),
          deleteUser: vi.fn(),
        },
      },
      from: vi.fn((table: string) => {
        if (table === "students") {
          return {
            select: vi.fn(() => ({ eq: studentIdEq })),
            update: studentUpdate,
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({ eq: profileEmailEq })),
            upsert: profileUpsert,
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    mocks.createAdminClient.mockReturnValue(adminClient);

    const response = await POST(signupRequest({
      name: "테스트학생",
      parentCode: "54321",
      pin: "2468",
      school: "테스트초",
      grade: "3학년",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.accountRole).toBe("student");
    expect(rpc).toHaveBeenNthCalledWith(1, "codingssok_verify_student_access_code", {
      p_student_name: "테스트학생",
      p_purpose: "parent_access",
      p_code: "54321",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "codingssok_issue_student_access_code", {
      p_student_id: studentId,
      p_purpose: "student_login",
      p_code: "2468",
    });
    const updatePayload = studentUpdate.mock.calls[0][0];
    expect(updatePayload).not.toHaveProperty("pin");
    expect(updatePayload).not.toHaveProperty("login_pin");
    expect(adminClient.from).not.toHaveBeenCalledWith("study_progress");
  });
});
