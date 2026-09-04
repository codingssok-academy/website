import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeacher: vi.fn(),
  createClient: vi.fn(),
  usesHashedStudentAccessCodes: vi.fn(),
}));

vi.mock("@/lib/auth-teacher", () => ({
  requireTeacher: mocks.requireTeacher,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/student-access-codes", () => ({
  usesHashedStudentAccessCodes: mocks.usesHashedStudentAccessCodes,
}));

import { DELETE, GET, PATCH, POST } from "./route";

function patchRequest(body: unknown) {
  return new NextRequest("https://www.codingssok.com/api/teacher/growth-management", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function request(method: "POST" | "DELETE", body: unknown) {
  return new NextRequest("https://www.codingssok.com/api/teacher/growth-management", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const freshRow = {
  id: "record-1",
  student_id: "student-1",
  period_month: "2026-09-01",
  class_snapshot: "공통기초반",
  learned_concepts: "반복문",
  strengths: "스스로 오류를 찾았습니다.",
  improvements: "풀이 순서를 정리해야 합니다.",
  next_goal: "조건문 프로젝트 완성",
  lesson_summary: "반복문",
  parent_message: "꾸준히 성장하고 있습니다.",
  status: "draft",
  published_at: null,
  archived_at: null,
  created_at: "2026-09-04T01:00:00.000Z",
  updated_at: "2026-09-04T02:00:00.000Z",
  teacher_memo: "다음 시간 복습",
  entry_note: "이번 달 메모",
  next_class_potential: "이동 가능",
};

describe("teacher growth-management PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTeacher.mockResolvedValue({ ok: true, userId: "teacher-1" });
    mocks.usesHashedStudentAccessCodes.mockReturnValue(false);
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

describe("teacher growth-management fresh mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTeacher.mockResolvedValue({ ok: true, userId: "teacher-1", role: "teacher" });
    mocks.usesHashedStudentAccessCodes.mockReturnValue(true);
  });

  it("관리 가능한 학생의 새 월별 기록과 비공개 메모를 화면 형식으로 읽는다", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "student-1", name: "가짜학생", school: "테스트초", grade: "3", class: "공통기초반", status: "active" }],
      error: null,
    });
    const neq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ neq }));
    const from = vi.fn(() => ({ select }));
    const rpc = vi.fn().mockResolvedValue({ data: [freshRow], error: null });
    mocks.createClient.mockResolvedValue({ from, rpc });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.freshMode).toBe(true);
    expect(body.migrationRequired).toBe(false);
    expect(body.records[0]).toEqual(expect.objectContaining({
      id: "record-1",
      student_name: "가짜학생",
      class_progress: "반복문",
      weaknesses: "풀이 순서를 정리해야 합니다.",
      teacher_memo: "다음 시간 복습",
      status: "초안",
    }));
    expect(rpc).toHaveBeenCalledWith("growth_api_teacher_list_records");
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("자동 저장은 공개 상태를 선택했어도 새 DB에 비공개 초안으로 저장한다", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "growth_api_teacher_save_record") return { data: "record-1", error: null };
      if (name === "growth_api_teacher_list_records") return { data: [freshRow], error: null };
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { name: "가짜학생" }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    mocks.createClient.mockResolvedValue({ from, rpc });

    const response = await POST(request("POST", {
      recordId: "published-record-1",
      studentId: "student-1",
      currentClass: "공통기초반",
      classProgress: "반복문",
      recordStatus: "완료",
      autoSave: true,
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.entry).toBeNull();
    expect(body.record.status).toBe("초안");
    expect(rpc).toHaveBeenCalledWith("growth_api_teacher_save_record", expect.objectContaining({
      p_record_id: "published-record-1",
      p_student_id: "student-1",
      p_status: "draft",
      p_learned_concepts: "반복문",
    }));
  });

  it("완료 버튼 저장은 월별 기록을 공개 상태로 전환한다", async () => {
    const published = { ...freshRow, status: "published", published_at: "2026-09-04T03:00:00.000Z" };
    const rpc = vi.fn(async (name: string) => name === "growth_api_teacher_save_record"
      ? { data: "record-1", error: null }
      : { data: [published], error: null });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { name: "가짜학생" }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq })) }));
    mocks.createClient.mockResolvedValue({ from, rpc });

    const response = await POST(request("POST", {
      recordId: "record-1",
      studentId: "student-1",
      recordStatus: "완료",
      createEntry: true,
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.record.status).toBe("완료");
    expect(body.entry.id).toBe("record-1");
    expect(rpc).toHaveBeenCalledWith("growth_api_teacher_save_record", expect.objectContaining({ p_status: "published" }));
  });

  it("선택한 새 월별 기록만 수정한다", async () => {
    const updated = { ...freshRow, strengths: "수정한 장점" };
    const rpc = vi.fn(async (name: string) => name === "growth_api_teacher_update_record"
      ? { data: "record-1", error: null }
      : { data: [updated], error: null });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { name: "가짜학생" }, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const from = vi.fn(() => ({ select: vi.fn(() => ({ eq })) }));
    mocks.createClient.mockResolvedValue({ from, rpc });

    const response = await PATCH(patchRequest({
      entryId: "record-1",
      studentId: "student-1",
      strengths: "수정한 장점",
      recordStatus: "초안",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.entry.strengths).toBe("수정한 장점");
    expect(rpc).toHaveBeenCalledWith("growth_api_teacher_update_record", expect.objectContaining({
      p_record_id: "record-1",
      p_student_id: "student-1",
      p_status: "draft",
    }));
  });

  it("초기화 요청은 삭제 대신 보관 함수를 호출한다", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 2, error: null });
    mocks.createClient.mockResolvedValue({ rpc });

    const response = await DELETE(request("DELETE", { studentId: "student-1" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, freshMode: true });
    expect(rpc).toHaveBeenCalledWith("growth_api_teacher_archive_records", { p_student_id: "student-1" });
  });
});
