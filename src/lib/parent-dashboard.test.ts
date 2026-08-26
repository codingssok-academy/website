import { describe, expect, it } from "vitest";
import { toParentAttendance, toParentGrowthRecord } from "./parent-dashboard";

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
});
