import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IntegratedGrowthPrototype } from "@/features/growth-v2/integrated/IntegratedGrowthPrototype";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Growth 2.0 홈페이지 통합형 UI/UX 시안", () => {
  it("shows the teacher workflow first and provides all three role previews", () => {
    render(<IntegratedGrowthPrototype />);

    expect(screen.getByText("홈페이지 통합형 UI/UX 시안")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /선생님/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { name: "주간 성장 평가" })).toBeInTheDocument();
    expect(screen.getByText("1. 학생 선택")).toBeInTheDocument();
    expect(screen.getByText("2. 평가 작성")).toBeInTheDocument();
    expect(screen.getByText("3. 확인 후 공개")).toBeInTheDocument();
    expect(screen.getByLabelText("학부모 공개 화면 미리보기")).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /학생/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /학부모/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /선생님 시험 DB 연결 화면 열기/ }),
    ).toHaveAttribute("href", "/growth-preview/teacher-local");
  });

  it("opens the matching persisted-data screen for each role", () => {
    render(<IntegratedGrowthPrototype />);

    fireEvent.click(screen.getByRole("tab", { name: /학생/ }));
    expect(
      screen.getByRole("link", { name: /학생 시험 DB 연결 화면 열기/ }),
    ).toHaveAttribute("href", "/growth-preview/student-local");

    fireEvent.click(screen.getByRole("tab", { name: /학부모/ }));
    expect(
      screen.getByRole("link", { name: /학부모 시험 DB 연결 화면 열기/ }),
    ).toHaveAttribute("href", "/growth-preview/parent-local");
  });

  it("uses the existing secure portals on the public homepage route", () => {
    render(<IntegratedGrowthPrototype mode="homepage" />);

    expect(screen.getByText("코딩쏙 성장관리 기능 미리보기")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /선생님 포털 열기/ }),
    ).toHaveAttribute("href", "/teacher/login");

    fireEvent.click(screen.getByRole("tab", { name: /학생/ }));
    expect(
      screen.getByRole("link", { name: /학생 포털 열기/ }),
    ).toHaveAttribute("href", "/login");

    fireEvent.click(screen.getByRole("tab", { name: /학부모/ }));
    expect(
      screen.getByRole("link", { name: /학부모 포털 열기/ }),
    ).toHaveAttribute("href", "/parent/feedback");
    expect(screen.queryByText(/시험 DB 연결 화면 열기/)).not.toBeInTheDocument();
  });

  it("keeps learning weekly while attendance switches by calendar month", () => {
    render(<IntegratedGrowthPrototype />);

    expect(
      screen.getByRole("heading", { name: "주간 성장 평가" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "2026년 8월 출석 현황" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("정규 출석 7회와 보강 1회로 총 8회를 이수했어요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "9월 출석 보기" }));

    expect(
      screen.getByRole("heading", { name: "2026년 9월 출석 현황" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("정규 수업 8회가 예정되어 있어요."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /학생/ }));
    expect(
      screen.getByRole("heading", { name: "2026년 9월 출석 현황" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "이번 주에도 한 단계 성장했어요" }),
    ).toBeInTheDocument();
  });

  it("lets the teacher directly add and remove a learned concept", () => {
    render(<IntegratedGrowthPrototype />);
    const preview = screen.getByLabelText("학부모 공개 화면 미리보기");
    const input = screen.getByLabelText("선생님 직접 입력");

    fireEvent.change(input, { target: { value: "  리스트 활용  " } });
    fireEvent.click(screen.getByRole("button", { name: "개념 추가" }));

    expect(input).toHaveValue("");
    expect(within(preview).getByText("리스트 활용")).toBeInTheDocument();
    expect(screen.getByText("2~40자 · 직접 입력 1/5개")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "리스트 활용 개념 삭제" }));
    expect(within(preview).queryByText("리스트 활용")).not.toBeInTheDocument();
  });

  it("keeps draft changes private until the teacher publishes them", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<IntegratedGrowthPrototype />);
    const updatedStrength = "반복문을 활용해 움직임을 스스로 완성했습니다.";

    fireEvent.change(screen.getByLabelText("잘한 점"), {
      target: { value: updatedStrength },
    });
    fireEvent.change(screen.getByLabelText("선생님 직접 입력"), {
      target: { value: "리스트 활용" },
    });
    fireEvent.click(screen.getByRole("button", { name: "개념 추가" }));

    fireEvent.click(screen.getByRole("tab", { name: /학생/ }));
    expect(screen.queryByText(updatedStrength)).not.toBeInTheDocument();
    expect(screen.queryByText("리스트 활용")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /선생님/ }));
    fireEvent.click(screen.getByRole("button", { name: "학생·학부모에게 공개" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "공개된 화면에 최신 평가가 반영된 시안입니다.",
    );

    fireEvent.click(screen.getByRole("tab", { name: /학생/ }));
    expect(screen.getByText(updatedStrength)).toBeInTheDocument();
    expect(screen.getByText("리스트 활용")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /학부모/ }));
    expect(screen.getByText(updatedStrength)).toBeInTheDocument();
    expect(screen.getByText("리스트 활용")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
