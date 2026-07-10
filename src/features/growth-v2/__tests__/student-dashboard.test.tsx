import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(dashboard.growthTimeline).toHaveLength(5);
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
    expect(screen.getByText("최근 성장 기록")).toBeInTheDocument();
    expect(screen.getByText("가상 학생 미리보기")).toBeInTheDocument();
  });

  it("shows five fixed growth records with the newest activity first", () => {
    render(<StudentDashboard dashboard={MOCK_STUDENT_DASHBOARD} />);

    const timeline = screen.getByRole("list", { name: "최근 성장 기록 목록" });
    const timelineItems = within(timeline).getAllByRole("listitem");
    const feedbackItem = within(timeline)
      .getByText("선생님 피드백을 받았어요")
      .closest("li");

    expect(timelineItems).toHaveLength(5);
    expect(within(timelineItems[0]).getByText("반복문 문제 3개 완료")).toBeInTheDocument();
    expect(within(timelineItems[0]).getByText("+30 XP")).toBeInTheDocument();
    expect(feedbackItem).not.toBeNull();
    expect(within(feedbackItem as HTMLLIElement).queryByText(/XP/)).not.toBeInTheDocument();
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
    expect(
      screen.getByText("미션 완료! +25 XP를 획득했어요."),
    ).toHaveAttribute("aria-live", "polite");
    const completedTimeline = screen.getByRole("list", {
      name: "최근 성장 기록 목록",
    });
    const completedTimelineItems = within(completedTimeline).getAllByRole("listitem");
    expect(completedTimelineItems).toHaveLength(6);
    expect(
      within(completedTimelineItems[0]).getByText("프로젝트 진행 기록 작성 완료"),
    ).toBeInTheDocument();
    expect(within(completedTimelineItems[0]).getByText("방금")).toBeInTheDocument();
    expect(within(completedTimelineItems[0]).getByText("+25 XP")).toBeInTheDocument();
    expect(
      within(completedTimeline).getAllByText("프로젝트 진행 기록 작성 완료"),
    ).toHaveLength(1);
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
    const resetTimeline = screen.getByRole("list", {
      name: "최근 성장 기록 목록",
    });
    expect(within(resetTimeline).getAllByRole("listitem")).toHaveLength(5);
    expect(
      within(resetTimeline).queryByText("프로젝트 진행 기록 작성 완료"),
    ).not.toBeInTheDocument();
  });
});
