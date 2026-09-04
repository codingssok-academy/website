import { describe, expect, it } from "vitest";
import { toParentAttendance, toParentGrowthRecord, toParentStudentFile } from "./parent-dashboard";

describe("학부모 통합 현황 공개 데이터", () => {
  it("완료된 성장 기록에서 학부모 공개 항목만 고른다", () => {
    const result = toParentGrowthRecord({
      id: "growth-1",
      status: "완료",
      current_class: "가짜 프로젝트반",
      strengths: "가짜 강점",
      weaknesses: "학부모에게 직접 노출하지 않을 내부 보완점",
      current_goal: "가짜 다음 목표",
      class_progress: "가짜 반복문 수업",
      parent_feedback_draft: "가짜 학부모 안내",
      teacher_memo: "선생님 전용 메모",
      temperament: "선생님 전용 관찰",
      updated_at: "2026-08-26T00:00:00.000Z",
    });

    expect(result).toEqual({
      id: "growth-1",
      currentClass: "가짜 프로젝트반",
      strengths: "가짜 강점",
      currentGoal: "가짜 다음 목표",
      classProgress: "가짜 반복문 수업",
      parentFeedback: "가짜 학부모 안내",
      recordedAt: "2026-08-26T00:00:00.000Z",
    });
    expect(JSON.stringify(result)).not.toMatch(/teacher_memo|선생님 전용|weaknesses|내부 보완점|temperament/);
  });

  it("초안과 전달 준비 기록은 학부모에게 공개하지 않는다", () => {
    expect(toParentGrowthRecord({ id: "draft-1", status: "초안" })).toBeNull();
    expect(toParentGrowthRecord({ id: "ready-1", status: "전달 준비" })).toBeNull();
  });

  it("새 시험 DB의 공개 완료 성장 기록을 학부모 표시 형식으로 바꾼다", () => {
    const result = toParentGrowthRecord({
      id: "fresh-growth-1",
      status: "published",
      class_snapshot: "가짜 공통기초반",
      learned_concepts: "가짜 반복문과 조건문",
      lesson_summary: "가짜 수업 요약",
      strengths: "가짜 문제 해결 과정이 좋았습니다.",
      improvements: "학부모 화면에 직접 전달하지 않을 보완점",
      next_goal: "가짜 블록코딩 작품 완성",
      parent_message: "가짜 수업 안내입니다.",
      published_at: "2026-09-04T01:00:00.000Z",
      created_by: "teacher-private-id",
      updated_by: "teacher-private-id",
    });

    expect(result).toEqual({
      id: "fresh-growth-1",
      currentClass: "가짜 공통기초반",
      strengths: "가짜 문제 해결 과정이 좋았습니다.",
      currentGoal: "가짜 블록코딩 작품 완성",
      classProgress: "가짜 반복문과 조건문",
      parentFeedback: "가짜 수업 안내입니다.",
      recordedAt: "2026-09-04T01:00:00.000Z",
    });
    expect(JSON.stringify(result)).not.toMatch(/improvements|보완점|created_by|updated_by|teacher-private-id/);
  });

  it("새 시험 DB의 초안과 보관 기록을 학부모에게 공개하지 않는다", () => {
    expect(toParentGrowthRecord({ id: "fresh-draft", status: "draft" })).toBeNull();
    expect(toParentGrowthRecord({ id: "fresh-archived", status: "archived" })).toBeNull();
  });

  it("출석 기록에서 내부 메모를 제외한다", () => {
    const result = toParentAttendance({
      period: { month: "2026-08" },
      data: {
        summary: { scheduled: 4, present: 3, absent: 1, makeup: 0, upcoming: 0, completed: 3 },
        records: [{
          id: "attendance-1",
          class_date: "2026-08-20",
          lesson_title: "가짜 정규 수업",
          status: "present",
          note: "선생님만 보는 출석 메모",
        }],
      },
    });

    expect(result?.records[0]).toEqual({
      id: "attendance-1",
      classDate: "2026-08-20",
      lessonTitle: "가짜 정규 수업",
      status: "present",
    });
    expect(JSON.stringify(result)).not.toContain("선생님만 보는 출석 메모");
  });

  it("결과물에서 학부모 화면에 필요한 안전한 항목만 고른다", () => {
    const result = toParentStudentFile({
      id: "file-1",
      original_name: "가짜 프로젝트.ent",
      mime_type: "application/octet-stream",
      size_bytes: 2048,
      category: "result",
      note: "가짜 엔트리 작품",
      created_at: "2026-08-25T00:00:00.000Z",
      storage_path: "students/private/internal.ent",
      uploaded_by: "teacher-secret-id",
    });

    expect(result).toEqual({
      id: "file-1",
      name: "가짜 프로젝트.ent",
      mimeType: "application/octet-stream",
      sizeBytes: 2048,
      category: "result",
      note: "가짜 엔트리 작품",
      createdAt: "2026-08-25T00:00:00.000Z",
    });
    expect(JSON.stringify(result)).not.toMatch(/storage_path|internal\.ent|uploaded_by|teacher-secret-id/);
  });
});
