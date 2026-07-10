import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StudentDashboard } from "@/features/growth-v2/components/StudentDashboard";
import { MOCK_STUDENT_DASHBOARD } from "@/features/growth-v2/data/student-dashboard.mock";
import { studentDashboardRepository } from "@/features/growth-v2/services/student-dashboard-repository";

describe("Growth 2.0 student dashboard preview", () => {
  it("uses only the isolated mock repository", async () => {
    const dashboard = await studentDashboardRepository.getStudentDashboard();

    expect(dashboard.dataKind).toBe("mock");
    expect(dashboard.student.displayName).toBe("민준");
    expect(dashboard.missions).toHaveLength(3);
    expect(dashboard.recentBadges).toHaveLength(3);
  });

  it("shows the approved student home information", () => {
    render(<StudentDashboard dashboard={MOCK_STUDENT_DASHBOARD} />);

    expect(
      screen.getByRole("heading", { name: "안녕하세요, 민준 학생" }),
    ).toBeInTheDocument();
    expect(screen.getByText("오늘의 미션")).toBeInTheDocument();
    expect(screen.getByText("이번 주 성장")).toBeInTheDocument();
    expect(screen.getByText("선생님 피드백")).toBeInTheDocument();
    expect(screen.getByText("나만의 우주 탐험 게임")).toBeInTheDocument();
    expect(screen.getByText("최근 획득 배지")).toBeInTheDocument();
    expect(screen.getByText("가상 학생 미리보기")).toBeInTheDocument();
  });

  it("shows completed and remaining missions clearly", () => {
    render(<StudentDashboard dashboard={MOCK_STUDENT_DASHBOARD} />);

    expect(screen.getByText("2/3 완료")).toBeInTheDocument();
    expect(screen.getByText("2,480 XP")).toBeInTheDocument();
    expect(screen.getByText("다음 레벨까지 240 XP")).toBeInTheDocument();
    expect(screen.getByLabelText("30 경험치 획득 완료")).toBeInTheDocument();
    expect(screen.getByLabelText("완료하면 25 경험치")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "프로젝트 진행 기록 작성하기 완료하기",
      }),
    ).toBeEnabled();
  });

  it("completes the preview mission only once and resets the experience", () => {
    render(<StudentDashboard dashboard={MOCK_STUDENT_DASHBOARD} />);

    const completeButton = screen.getByRole("button", {
      name: "프로젝트 진행 기록 작성하기 완료하기",
    });
    const levelProgress = screen.getByRole("progressbar", {
      name: "레벨 8 진행도",
    });

    expect(levelProgress).toHaveAttribute("aria-valuenow", "91");

    fireEvent.click(completeButton);
    fireEvent.click(completeButton);

    expect(screen.getByText("3/3 완료")).toBeInTheDocument();
    expect(screen.getByText("2,505 XP")).toBeInTheDocument();
    expect(screen.getByText("다음 레벨까지 215 XP")).toBeInTheDocument();
    expect(levelProgress).toHaveAttribute("aria-valuenow", "92");
    expect(
      screen.getByText("미션 완료! +25 XP를 획득했어요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(
      screen.getByRole("button", {
        name: "프로젝트 진행 기록 작성하기 완료됨",
      }),
    ).toBeDisabled();
    expect(screen.queryByText("2,530 XP")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "체험 초기화" }));

    expect(screen.getByText("2/3 완료")).toBeInTheDocument();
    expect(screen.getByText("2,480 XP")).toBeInTheDocument();
    expect(screen.getByText("다음 레벨까지 240 XP")).toBeInTheDocument();
    expect(levelProgress).toHaveAttribute("aria-valuenow", "91");
    expect(
      screen.getByRole("button", {
        name: "프로젝트 진행 기록 작성하기 완료하기",
      }),
    ).toBeEnabled();
    expect(
      screen.queryByText("미션 완료! +25 XP를 획득했어요."),
    ).not.toBeInTheDocument();
  });
});
