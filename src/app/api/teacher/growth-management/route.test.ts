import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeacher: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth-teacher", () => ({
  requireTeacher: mocks.requireTeacher,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { PATCH } from "./route";

function patchRequest(body: unknown) {
  return new NextRequest("https://www.codingssok.com/api/teacher/growth-management", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("teacher growth-management PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTeacher.mockResolvedValue({ ok: true, userId: "teacher-1" });
  });

  it("수정할 누적 기록 ID가 없으면 DB를 호출하지 않는다", async () => {
    const response = await PATCH(patchRequest({ studentId: "student-1" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("수정할 성장 기록을 찾지 못했습니다.");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("선택한 학생의 누적 기록 한 건만 수정한다", async () => {
    const updatedEntry = {
      id: "entry-1",
      student_id: "student-1",
      entry_note: "수정한 수업 기록",
      class_progress: "반복문과 조건문",
      status: "전달 준비",
    };
    const single = vi.fn().mockResolvedValue({ data: updatedEntry, error: null });
    const select = vi.fn(() => ({ single }));
    const studentEq = vi.fn(() => ({ select }));
    const entryEq = vi.fn(() => ({ eq: studentEq }));
    const update = vi.fn(() => ({ eq: entryEq }));
    const from = vi.fn(() => ({ update }));
    mocks.createClient.mockResolvedValue({ from });

    const response = await PATCH(patchRequest({
      entryId: "entry-1",
      studentId: "student-1",
      currentClass: "프로젝트반",
      strengths: "스스로 오류를 찾았습니다.",
      weaknesses: "풀이 순서를 정리해야 합니다.",
      currentGoal: "조건문 프로젝트 완성",
      nextClassPotential: "이동 가능",
      classProgress: "반복문과 조건문",
      parentFeedbackDraft: "꾸준히 성장하고 있습니다.",
      teacherMemo: "다음 시간 복습",
      entryNote: "수정한 수업 기록",
      recordStatus: "전달 준비",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, entry: updatedEntry });
    expect(from).toHaveBeenCalledWith("student_growth_entries");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      entry_note: "수정한 수업 기록",
      class_progress: "반복문과 조건문",
      status: "전달 준비",
    }));
    expect(entryEq).toHaveBeenCalledWith("id", "entry-1");
    expect(studentEq).toHaveBeenCalledWith("student_id", "student-1");
  });
});
