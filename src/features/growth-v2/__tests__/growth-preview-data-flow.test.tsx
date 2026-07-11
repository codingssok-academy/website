import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { GrowthPreviewStateProvider } from "@/features/growth-v2/components/GrowthPreviewStateProvider";
import { ParentWeeklyReport } from "@/features/growth-v2/components/ParentWeeklyReport";
import { StudentDashboard } from "@/features/growth-v2/components/StudentDashboard";
import { TeacherWeeklyEvaluation } from "@/features/growth-v2/components/TeacherWeeklyEvaluation";
import { MOCK_PARENT_WEEKLY_REPORT } from "@/features/growth-v2/data/parent-weekly-report.mock";
import { MOCK_STUDENT_DASHBOARD } from "@/features/growth-v2/data/student-dashboard.mock";
import { MOCK_TEACHER_WEEKLY_EVALUATION } from "@/features/growth-v2/data/teacher-weekly-evaluation.mock";

type PreviewScreen = "student" | "parent" | "teacher";

function DataFlowHarness() {
  const [activeScreen, setActiveScreen] = useState<PreviewScreen>("teacher");

  return (
    <>
      <div aria-label="테스트 화면 전환">
        <button type="button" onClick={() => setActiveScreen("student")}>학생 확인</button>
        <button type="button" onClick={() => setActiveScreen("parent")}>학부모 확인</button>
        <button type="button" onClick={() => setActiveScreen("teacher")}>선생님 확인</button>
      </div>
      {activeScreen === "student" ? (
        <StudentDashboard dashboard={MOCK_STUDENT_DASHBOARD} />
      ) : null}
      {activeScreen === "parent" ? (
        <ParentWeeklyReport report={MOCK_PARENT_WEEKLY_REPORT} />
      ) : null}
      {activeScreen === "teacher" ? (
        <TeacherWeeklyEvaluation data={MOCK_TEACHER_WEEKLY_EVALUATION} />
      ) : null}
    </>
  );
}

function renderDataFlow() {
  return render(
    <GrowthPreviewStateProvider>
      <DataFlowHarness />
    </GrowthPreviewStateProvider>,
  );
}

const UPDATED_STRENGTH = "질문을 차근차근 정리해 스스로 해결하는 힘이 좋아졌습니다.";
const UPDATED_IMPROVEMENT = "코딩 전에 실행 순서를 글로 적는 연습을 더 해보면 좋겠습니다.";
const UPDATED_GOAL = "조건문을 사용해 우주 게임의 점수 기능을 완성합니다.";
const UPDATED_RECENT_WORK = "반복문으로 행성이 차례대로 움직이게 만들었습니다.";
const UPDATED_NEXT_WORK = "조건문으로 점수를 계산하는 기능을 추가합니다.";

function editTeacherDraft() {
  fireEvent.change(screen.getByLabelText("잘한 점"), {
    target: { value: UPDATED_STRENGTH },
  });
  fireEvent.change(screen.getByLabelText("보완할 점"), {
    target: { value: UPDATED_IMPROVEMENT },
  });
  fireEvent.change(screen.getByLabelText("다음 수업 목표"), {
    target: { value: UPDATED_GOAL },
  });
  fireEvent.change(screen.getByLabelText("프로젝트 최근 작업"), {
    target: { value: UPDATED_RECENT_WORK },
  });
  fireEvent.change(screen.getByLabelText("프로젝트 다음 작업"), {
    target: { value: UPDATED_NEXT_WORK },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: "오류 찾기" }));
}

describe("Growth 2.0 preview data flow", () => {
  it("keeps the draft private until save and publishes it to student and parent screens", () => {
    renderDataFlow();
    editTeacherDraft();

    fireEvent.click(screen.getByRole("button", { name: "학생 확인" }));
    expect(
      screen.getByText(MOCK_STUDENT_DASHBOARD.teacherFeedback.comment, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText(UPDATED_STRENGTH, { exact: false })).not.toBeInTheDocument();
    expect(screen.getByText(MOCK_STUDENT_DASHBOARD.project.recentWork)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "학부모 확인" }));
    expect(
      screen.getByText(MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.strength),
    ).toBeInTheDocument();
    expect(screen.queryByText(UPDATED_STRENGTH, { exact: false })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "선생님 확인" }));
    expect(screen.getByLabelText("잘한 점")).toHaveValue(UPDATED_STRENGTH);
    fireEvent.click(screen.getByRole("button", { name: "평가 미리보기 저장" }));

    fireEvent.click(screen.getByRole("button", { name: "학생 확인" }));
    expect(screen.getByText(UPDATED_STRENGTH, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(UPDATED_GOAL)).toBeInTheDocument();
    expect(screen.getByText(UPDATED_RECENT_WORK)).toBeInTheDocument();
    expect(screen.queryByText("오류 찾기")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "학부모 확인" }));
    expect(screen.getByText(UPDATED_STRENGTH)).toBeInTheDocument();
    expect(screen.getByText(UPDATED_IMPROVEMENT)).toBeInTheDocument();
    expect(screen.getByText(UPDATED_GOAL)).toBeInTheDocument();
    expect(screen.getByText(UPDATED_RECENT_WORK)).toBeInTheDocument();
    expect(screen.getByText(UPDATED_NEXT_WORK)).toBeInTheDocument();
    expect(screen.queryByText("오류 찾기")).not.toBeInTheDocument();
  });

  it("resets draft and published screens to the original mock data", () => {
    renderDataFlow();
    editTeacherDraft();
    fireEvent.click(screen.getByRole("button", { name: "평가 미리보기 저장" }));
    fireEvent.click(screen.getByRole("button", { name: "입력 초기화" }));

    fireEvent.click(screen.getByRole("button", { name: "학생 확인" }));
    expect(
      screen.getByText(MOCK_STUDENT_DASHBOARD.teacherFeedback.comment, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText(UPDATED_STRENGTH, { exact: false })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "학부모 확인" }));
    expect(
      screen.getByText(MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.strength),
    ).toBeInTheDocument();
    expect(screen.getByText("오류 찾기")).toBeInTheDocument();
    expect(screen.queryByText(UPDATED_RECENT_WORK)).not.toBeInTheDocument();
  });

  it("returns to defaults when the preview provider is recreated like a refresh", () => {
    const firstRender = renderDataFlow();
    editTeacherDraft();
    fireEvent.click(screen.getByRole("button", { name: "평가 미리보기 저장" }));
    fireEvent.click(screen.getByRole("button", { name: "학부모 확인" }));
    expect(screen.getByText(UPDATED_STRENGTH)).toBeInTheDocument();

    firstRender.unmount();
    renderDataFlow();
    fireEvent.click(screen.getByRole("button", { name: "학부모 확인" }));

    expect(
      screen.getByText(MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.strength),
    ).toBeInTheDocument();
    expect(screen.queryByText(UPDATED_STRENGTH, { exact: false })).not.toBeInTheDocument();
  });
});
