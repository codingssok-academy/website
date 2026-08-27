import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useParentDashboard: vi.fn(),
}));

vi.mock("@/app/parent/hooks/useParentDashboard", () => ({
  useParentDashboard: mocks.useParentDashboard,
}));

import ParentDashboardPage from "./page";

describe("학부모 통합 현황판", () => {
  it("가짜 자녀의 공개된 성장·출석·메시지를 모바일 현황에 표시한다", () => {
    mocks.useParentDashboard.mockReturnValue({
      loading: false,
      name: "가짜학생",
      refresh: vi.fn(),
      data: {
        found: true,
        student: {
          id: "student-1", name: "가짜학생", school: "가짜초등학교", grade: "5학년",
          currentClass: "가짜 프로젝트반", totalXp: 100, level: 3, tier: "Iron", streak: 2,
          bestStreak: 3, accuracy: 80, totalCodeRuns: 10, totalProblems: 7, lastActive: "2026-08-25",
        },
        xp: { total: 100, today: 10, weekly: [], history: [] },
        activity: {
          todayMinutes: 25,
          totalMinutes: 80,
          recent: [
            { page_title: "가짜 반복문 학습", created_at: "2026-08-25" },
            { page_title: "login", created_at: "2026-08-24" },
          ],
        },
        feedbacks: [],
        codeHistory: [],
        announcements: [{ id: "message-1", title: "가짜 수업 안내", content: "가짜 안내 내용", isPinned: true, createdAt: "2026-08-26" }],
        growth: {
          current: {
            id: "growth-1", currentClass: "가짜 프로젝트반", strengths: "끝까지 해결했습니다.",
            currentGoal: "반복문 프로젝트 완성", classProgress: "for 반복문", parentFeedback: "꾸준히 성장하고 있습니다.",
            recordedAt: "2026-08-25",
          },
          history: [],
        },
        attendance: {
          month: "2026-08",
          summary: { scheduled: 4, present: 3, absent: 1, makeup: 0, upcoming: 0, completed: 3 },
          records: [{ id: "attendance-1", classDate: "2026-08-20", lessonTitle: "가짜 정규 수업", status: "present" }],
        },
        studyNotes: { count30d: 0, latestAt: null },
      },
    });

    render(<ParentDashboardPage />);

    expect(screen.getByRole("heading", { name: "가짜학생 학생의 성장 현황" })).toBeInTheDocument();
    expect(screen.getByLabelText("학부모 통합 현황판")).toHaveClass("max-w-[1440px]");
    expect(screen.getByLabelText("학습 요약")).toHaveClass("grid-cols-3");
    expect(screen.getByLabelText("학습 요약")).toHaveClass("lg:grid-cols-[minmax(260px,1.35fr)_repeat(3,minmax(140px,0.65fr))]");
    expect(screen.getByLabelText("학습 세부 현황")).toHaveClass("lg:grid-cols-2");
    expect(screen.getAllByText("가짜 프로젝트반").length).toBeGreaterThan(0);
    expect(screen.getByText("for 반복문")).toBeInTheDocument();
    expect(screen.getByText("끝까지 해결했습니다.")).toBeInTheDocument();
    expect(screen.getByText("3회")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2026년 8월 출석" })).toBeInTheDocument();
    expect(screen.getByText("가짜 수업 안내")).toBeInTheDocument();
    expect(screen.getByLabelText("선생님 메시지 목록")).not.toHaveClass("sm:grid-cols-2");
    expect(screen.getByText("가짜 반복문 학습")).toBeInTheDocument();
    expect(screen.getByText("홈페이지 로그인")).toBeInTheDocument();
    expect(screen.getByText(/내부 메모는 표시되지 않습니다/)).toBeInTheDocument();
  });
});
