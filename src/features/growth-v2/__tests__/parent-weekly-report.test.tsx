import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ParentWeeklyReport } from "@/features/growth-v2/components/ParentWeeklyReport";
import { MOCK_PARENT_WEEKLY_REPORT } from "@/features/growth-v2/data/parent-weekly-report.mock";
import { MOCK_STUDENT_DASHBOARD } from "@/features/growth-v2/data/student-dashboard.mock";

describe("Growth 2.0 parent weekly report preview", () => {
  it("shares the approved student concepts and project summary", () => {
    expect(MOCK_PARENT_WEEKLY_REPORT.studentName).toBe(
      MOCK_STUDENT_DASHBOARD.student.displayName,
    );
    expect(MOCK_PARENT_WEEKLY_REPORT.learnedConcepts.map((concept) => concept.name)).toEqual(
      MOCK_STUDENT_DASHBOARD.weeklyGrowth.learnedConcepts,
    );
    expect(MOCK_PARENT_WEEKLY_REPORT.project.name).toBe(
      MOCK_STUDENT_DASHBOARD.project.name,
    );
    expect(MOCK_PARENT_WEEKLY_REPORT.project.progress).toBe(
      MOCK_STUDENT_DASHBOARD.project.progress,
    );
  });

  it("shows the weekly summary and the mock-data notice", () => {
    render(<ParentWeeklyReport report={MOCK_PARENT_WEEKLY_REPORT} />);

    expect(
      screen.getByRole("heading", { name: "민준 학생의 이번 주 성장" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Growth 2.0 테스트 화면 · 실제 학생 정보가 아닙니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("2회 / 2회")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getAllByText("64%").length).toBeGreaterThanOrEqual(1);
  });

  it("explains all three concepts and the teacher evaluation", () => {
    render(<ParentWeeklyReport report={MOCK_PARENT_WEEKLY_REPORT} />);

    expect(screen.getByText("for 반복문")).toBeInTheDocument();
    expect(screen.getByText("조건 비교")).toBeInTheDocument();
    expect(screen.getByText("오류 찾기")).toBeInTheDocument();
    expect(screen.getByText("잘한 점")).toBeInTheDocument();
    expect(screen.getByText("보완할 점")).toBeInTheDocument();
    expect(screen.getByText("다음 수업 목표")).toBeInTheDocument();
  });

  it("shows activities, project details, conversation guidance, and navigation", () => {
    render(<ParentWeeklyReport report={MOCK_PARENT_WEEKLY_REPORT} />);

    const activityList = screen.getByRole("heading", { name: "이번 주 성장 기록" })
      .closest("section")
      ?.querySelector("ul");

    expect(activityList).not.toBeNull();
    expect(within(activityList as HTMLUListElement).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("프로젝트 진행 기록 작성 완료")).toBeInTheDocument();
    expect(screen.getByText("나만의 우주 탐험 게임")).toBeInTheDocument();
    expect(screen.getByText("이번 주에는 이렇게 물어보세요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "학생 화면 보기" })).toHaveAttribute(
      "href",
      "/growth-preview",
    );
  });
});
