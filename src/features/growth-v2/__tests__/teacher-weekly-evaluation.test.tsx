import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeacherWeeklyEvaluation } from "@/features/growth-v2/components/TeacherWeeklyEvaluation";
import { GrowthPreviewStateProvider } from "@/features/growth-v2/components/GrowthPreviewStateProvider";
import { MOCK_PARENT_WEEKLY_REPORT } from "@/features/growth-v2/data/parent-weekly-report.mock";
import { MOCK_TEACHER_WEEKLY_EVALUATION } from "@/features/growth-v2/data/teacher-weekly-evaluation.mock";

afterEach(() => {
  vi.restoreAllMocks();
});

function renderTeacherEvaluation() {
  return render(
    <GrowthPreviewStateProvider>
      <TeacherWeeklyEvaluation data={MOCK_TEACHER_WEEKLY_EVALUATION} />
    </GrowthPreviewStateProvider>,
  );
}

describe("Growth 2.0 teacher weekly evaluation preview", () => {
  it("shows the approved mock student, period, summary, and defaults", () => {
    renderTeacherEvaluation();

    expect(screen.getByRole("heading", { name: "주간 평가 작성" })).toBeInTheDocument();
    expect(screen.getByText("민준 학생")).toBeInTheDocument();
    expect(screen.getByText("7월 6일 ~ 7월 12일")).toBeInTheDocument();
    expect(
      screen.getByText("Growth 2.0 테스트 화면 · 입력 내용은 실제로 저장되지 않습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("2회 / 2회")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByText("64%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "스스로 문제를 풀 수 있어요" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "질문하며 참여했어요" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "완료" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    MOCK_TEACHER_WEEKLY_EVALUATION.learnedConcepts.forEach((concept) => {
      expect(screen.getByRole("checkbox", { name: concept })).toBeChecked();
    });
    expect(screen.getByLabelText("잘한 점")).toHaveValue(
      MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.strength,
    );
    expect(screen.getByLabelText("보완할 점")).toHaveValue(
      MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.improvement,
    );
    expect(screen.getByLabelText("다음 수업 목표")).toHaveValue(
      MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.nextLessonGoal,
    );
    expect(screen.getByLabelText("학부모 표시 미리보기")).toBeInTheDocument();
  });

  it("reflects text and concept changes in the parent preview", () => {
    renderTeacherEvaluation();
    const preview = screen.getByLabelText("학부모 표시 미리보기");

    fireEvent.change(screen.getByLabelText("잘한 점"), {
      target: { value: "질문을 정리해서 스스로 해결하는 모습이 좋아졌습니다." },
    });
    fireEvent.change(screen.getByLabelText("보완할 점"), {
      target: { value: "코드를 실행하기 전에 순서를 먼저 확인하는 연습이 필요합니다." },
    });
    fireEvent.change(screen.getByLabelText("다음 수업 목표"), {
      target: { value: "조건문을 사용한 점수 계산 기능을 완성합니다." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "오류 찾기" }));

    expect(
      within(preview).getByText("질문을 정리해서 스스로 해결하는 모습이 좋아졌습니다."),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText("코드를 실행하기 전에 순서를 먼저 확인하는 연습이 필요합니다."),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText("조건문을 사용한 점수 계산 기능을 완성합니다."),
    ).toBeInTheDocument();
    expect(within(preview).queryByText("오류 찾기")).not.toBeInTheDocument();
  });

  it("applies a recommendation phrase as a clear replacement", () => {
    renderTeacherEvaluation();

    fireEvent.click(screen.getByRole("button", { name: "오류를 스스로 찾았어요" }));

    expect(screen.getByLabelText("잘한 점")).toHaveValue(
      "코드의 오류를 스스로 찾고 고치는 힘이 자랐습니다.",
    );
    expect(
      within(screen.getByLabelText("학부모 표시 미리보기")).getByText(
        "코드의 오류를 스스로 찾고 고치는 힘이 자랐습니다.",
      ),
    ).toBeInTheDocument();
  });

  it("validates every required evaluation field and focuses the first error", () => {
    renderTeacherEvaluation();
    const saveButton = screen.getByRole("button", { name: "평가 미리보기 저장" });
    const strength = screen.getByLabelText("잘한 점");
    const improvement = screen.getByLabelText("보완할 점");
    const nextGoal = screen.getByLabelText("다음 수업 목표");

    fireEvent.change(strength, { target: { value: "" } });
    fireEvent.click(saveButton);
    expect(screen.getByText("잘한 점을 10자 이상 적어주세요.")).toBeInTheDocument();
    expect(strength).toHaveFocus();

    fireEvent.change(strength, { target: { value: "질문하며 해결하는 모습이 좋아졌습니다." } });
    fireEvent.change(improvement, { target: { value: "짧음" } });
    fireEvent.click(saveButton);
    expect(screen.getByText("보완할 점을 10자 이상 적어주세요.")).toBeInTheDocument();
    expect(improvement).toHaveFocus();

    fireEvent.change(improvement, { target: { value: "실행 순서를 정리하는 연습이 필요합니다." } });
    fireEvent.change(nextGoal, { target: { value: "" } });
    fireEvent.click(saveButton);
    expect(screen.getByText("다음 수업 목표를 10자 이상 적어주세요.")).toBeInTheDocument();
    expect(nextGoal).toHaveFocus();
  });

  it("shows one local-only save notice even after repeated clicks", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderTeacherEvaluation();
    const saveButton = screen.getByRole("button", { name: "평가 미리보기 저장" });

    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(
      screen.getAllByText(
        "주간 평가 미리보기가 준비됐어요. 실제 데이터에는 저장되지 않았습니다.",
      ),
    ).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("resets edited fields, choices, concepts, notices, and errors", () => {
    renderTeacherEvaluation();
    const strength = screen.getByLabelText("잘한 점");

    fireEvent.change(strength, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "다른 문제에도 활용할 수 있어요" }));
    fireEvent.click(screen.getByRole("button", { name: "스스로 해결을 시도했어요" }));
    fireEvent.click(screen.getByRole("button", { name: "추가 도전까지 완료" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "조건 비교" }));
    fireEvent.click(screen.getByRole("button", { name: "평가 미리보기 저장" }));
    fireEvent.click(screen.getByRole("button", { name: "입력 초기화" }));

    expect(strength).toHaveValue(MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.strength);
    expect(screen.getByRole("button", { name: "스스로 문제를 풀 수 있어요" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "질문하며 참여했어요" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "완료" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "조건 비교" })).toBeChecked();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("links to the student and parent preview screens", () => {
    renderTeacherEvaluation();

    expect(screen.getByRole("link", { name: "학생 화면" })).toHaveAttribute(
      "href",
      "/growth-preview",
    );
    expect(screen.getByRole("link", { name: "학부모 화면" })).toHaveAttribute(
      "href",
      "/growth-preview/parent",
    );
  });
});
