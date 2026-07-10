import { render, screen } from "@testing-library/react";
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
    expect(screen.getByLabelText("30 경험치 획득 완료")).toBeInTheDocument();
    expect(screen.getByLabelText("완료하면 25 경험치")).toBeInTheDocument();
  });
});
