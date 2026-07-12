import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalParentWeeklyReport } from "@/features/growth-v2/local-parent/LocalParentWeeklyReport";
import {
  createLocalParentSession,
  fetchLocalParentChildren,
  fetchLocalParentWeeklyReport,
} from "@/features/growth-v2/local-parent/local-parent-client";
import type { LocalParentWeeklyReportResponse } from "@/features/growth-v2/local-parent/types";
import { LocalParentPreviewError } from "@/features/growth-v2/local-parent/types";

vi.mock("@/features/growth-v2/local-parent/local-parent-client", () => ({
  createLocalParentSession: vi.fn(),
  fetchLocalParentChildren: vi.fn(),
  fetchLocalParentWeeklyReport: vi.fn(),
}));

const SESSION = { accessToken: "parent-jwt-in-test-memory", expiresIn: 3600 };
const STUDENT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STUDENT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CHILDREN = {
  api_version: "1.0",
  data: [
    { id: STUDENT_A, display_name: "테스트 학생 A" },
    { id: STUDENT_B, display_name: "테스트 학생 B" },
  ],
};

function report(
  studentId: string,
  studentName: string,
  version: number | null,
  customConcepts: string[] = [],
): LocalParentWeeklyReportResponse {
  return {
    api_version: "1.0",
    period: { week_start: "2026-07-06", week_end: "2026-07-12" },
    data: {
      student: { id: studentId, display_name: studentName },
      published_evaluation: version ? {
        evaluation_id: `published-${version}`,
        status: "published",
        version,
        strength: version === 1 ? "질문을 정리하며 문제를 해결하는 태도가 아주 좋았습니다." : "조건과 오류 찾기를 함께 사용해 풀이를 설명한 점이 아주 좋았습니다.",
        improvement: version === 1 ? "코드를 실행하기 전에 순서를 먼저 정리하는 연습이 필요합니다." : "실행 전에 입력값과 결과를 한 줄로 적는 연습을 조금 더 이어갑니다.",
        next_goal: version === 1 ? "조건문을 활용한 점수 계산 기능을 완성해 봅니다." : "다음 시간에는 함수와 입출력을 이용해 작은 기능을 완성합니다.",
        published_at: "2026-07-10T10:00:00Z",
        selected_concepts: version === 1
          ? [{ key: "for-loop", label: "for 반복문", description: "같은 일을 반복합니다." }, { key: "condition", label: "조건 비교" }]
          : [{ key: "condition", label: "조건 비교" }, { key: "debugging", label: "오류 찾기" }],
        custom_concepts: customConcepts.map((label, index) => ({ label, sort_order: index + 1 })),
      } : null,
      projects: studentId === STUDENT_A ? [{
        project_id: "project-a",
        name: "나만의 우주 탐험 게임",
        description: "반복과 조건을 이용한 게임입니다.",
        latest_update: {
          recent_work: "행성이 나타나는 순서를 반복문으로 정리했어요.",
          next_work: "조건문으로 점수를 계산하는 기능을 추가해요.",
          progress_pct: 64,
          occurred_at: "2026-07-08T10:00:00Z",
        },
      }] : [],
      growth_summary: [],
    },
    empty_state_reason: version ? {} : { published_evaluation: "아직 공개된 주간 평가가 없습니다." },
  };
}

const A_V1 = report(STUDENT_A, "테스트 학생 A", 1);
const A_V2 = report(STUDENT_A, "테스트 학생 A", 2, ["함수", "입출력"]);
const B_EMPTY = report(STUDENT_B, "테스트 학생 B", null);
const B_V1 = report(STUDENT_B, "테스트 학생 B", 1, ["변수", "입출력"]);
const mockedSession = vi.mocked(createLocalParentSession);
const mockedChildren = vi.mocked(fetchLocalParentChildren);
const mockedReport = vi.mocked(fetchLocalParentWeeklyReport);

async function login() {
  fireEvent.click(screen.getByRole("button", { name: "테스트 학부모로 들어가기" }));
  expect(await screen.findByRole("heading", { name: "테스트 학생 A의 이번 주 성장" })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole("button", { name: "최신 리포트 다시 불러오기" })).toBeEnabled());
}

describe("local parent weekly report", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_ENV", "local");
    vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV", "1");
    mockedSession.mockReset();
    mockedChildren.mockReset();
    mockedReport.mockReset();
    vi.setSystemTime(new Date("2026-07-12T10:00:00+09:00"));
    mockedSession.mockResolvedValue(SESSION);
    mockedChildren.mockResolvedValue(CHILDREN);
    mockedReport.mockResolvedValue(A_V1);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("starts signed out, prevents duplicate login, and stores no browser session", async () => {
    let release: ((value: typeof SESSION) => void) | undefined;
    mockedSession.mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    const view = render(<LocalParentWeeklyReport />);
    const button = screen.getByRole("button", { name: "테스트 학부모로 들어가기" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mockedSession).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "로그인 중" })).toBeDisabled();
    release?.(SESSION);
    expect(await screen.findByText("테스트 학생 A")).toBeInTheDocument();
    view.unmount();
    render(<LocalParentWeeklyReport />);
    expect(screen.getByRole("button", { name: "테스트 학부모로 들어가기" })).toBeInTheDocument();
  });

  it("shows only linked A and B and the published A version 1 report", async () => {
    render(<LocalParentWeeklyReport />);
    await login();
    expect(screen.getByRole("button", { name: /테스트 학생 A\s*현재 선택/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /테스트 학생 B\s*리포트 보기/ })).toBeInTheDocument();
    expect(screen.queryByText("테스트 학생 C")).not.toBeInTheDocument();
    expect(screen.queryByText(STUDENT_A)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "테스트 학생 A의 이번 주 성장" })).toBeInTheDocument();
    expect(screen.queryByText(/테스트 학생 A 학생의/)).not.toBeInTheDocument();
    expect(screen.getByText(/질문을 정리하며 문제를 해결/)).toBeInTheDocument();
    expect(screen.getByText(/코드를 실행하기 전에 순서를 먼저 정리/)).toBeInTheDocument();
    expect(screen.getByText(/조건문을 활용한 점수 계산/)).toBeInTheDocument();
    expect(screen.getByText("for 반복문")).toBeInTheDocument();
    expect(screen.getByText("조건 비교")).toBeInTheDocument();
    expect(screen.getByText("나만의 우주 탐험 게임")).toBeInTheDocument();
    expect(screen.queryByText(/draft|archived|published|version|테스트 버전|\bv\d+\b/i)).not.toBeInTheDocument();
  });

  it("shows student B without a published evaluation as a normal empty state", async () => {
    mockedReport.mockResolvedValueOnce(A_V1).mockResolvedValueOnce(B_EMPTY);
    render(<LocalParentWeeklyReport />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: /테스트 학생 B\s*리포트 보기/ }));
    expect(await screen.findByRole("heading", { name: "아직 공개된 주간 평가가 없습니다." })).toBeInTheDocument();
    expect(screen.getByText("선생님이 평가를 공개하면 이 화면에서 확인할 수 있어요.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/초안|draft|version 1 draft/i)).not.toBeInTheDocument();
  });

  it("refreshes with one read request and shows the real latest A version 2", async () => {
    let release: ((value: LocalParentWeeklyReportResponse) => void) | undefined;
    mockedReport
      .mockResolvedValueOnce(A_V1)
      .mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    render(<LocalParentWeeklyReport />);
    await login();
    const refresh = screen.getByRole("button", { name: "최신 리포트 다시 불러오기" });
    fireEvent.click(refresh);
    fireEvent.click(refresh);
    expect(mockedReport).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "불러오는 중" })).toBeDisabled();
    release?.(A_V2);
    expect(await screen.findByText("함수")).toBeInTheDocument();
    expect(screen.getByText("입출력")).toBeInTheDocument();
    expect(screen.queryByText(/version|테스트 버전|\bv\d+\b/i)).not.toBeInTheDocument();
    expect(screen.getByText("최신 공개 리포트를 다시 확인했습니다.")).toBeInTheDocument();
  });

  it("shows student B first published version after a read-only refresh", async () => {
    mockedReport
      .mockResolvedValueOnce(A_V1)
      .mockResolvedValueOnce(B_EMPTY)
      .mockResolvedValueOnce(B_V1);
    render(<LocalParentWeeklyReport />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: /테스트 학생 B\s*리포트 보기/ }));
    expect(await screen.findByRole("heading", { name: "아직 공개된 주간 평가가 없습니다." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "최신 리포트 다시 불러오기" }));
    expect(await screen.findByText("변수")).toBeInTheDocument();
    expect(screen.getByText("입출력")).toBeInTheDocument();
    expect(screen.getByText(/코드를 실행하기 전에 순서를 먼저 정리/)).toBeInTheDocument();
  });

  it("clears all in-memory data on logout and reads again after login", async () => {
    render(<LocalParentWeeklyReport />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: "체험 끝내기" }));
    expect(screen.getByRole("button", { name: "테스트 학부모로 들어가기" })).toBeInTheDocument();
    expect(screen.queryByText("테스트 학생 A")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "테스트 학부모로 들어가기" }));
    await waitFor(() => expect(mockedSession).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "테스트 학생 A의 이번 주 성장" })).toBeInTheDocument();
  });

  it("shows local guidance and hides the old demo link in staging mode", () => {
    const view = render(<LocalParentWeeklyReport />);
    expect(screen.getByText("Growth 2.0 로컬 연습 환경")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기존 데모 학부모 화면 보기" })).toBeInTheDocument();
    view.unmount();

    vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_ENV", "staging");
    vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV", "0");
    render(<LocalParentWeeklyReport />);
    expect(screen.getByText("Growth 2.0 시험 환경")).toBeInTheDocument();
    expect(screen.getByText(/운영 홈페이지와 분리/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /기존 데모 학부모 화면/ })).not.toBeInTheDocument();
  });

  it("distinguishes no children, database errors, access errors, and expired sessions", async () => {
    mockedChildren.mockResolvedValueOnce({ api_version: "1.0", data: [], empty_state_reason: "연결된 자녀가 없습니다." });
    const view = render(<LocalParentWeeklyReport />);
    fireEvent.click(screen.getByRole("button", { name: "테스트 학부모로 들어가기" }));
    expect(await screen.findByText("연결된 자녀가 없습니다.")).toBeInTheDocument();
    view.unmount();

    mockedChildren.mockRejectedValueOnce(new LocalParentPreviewError("BACKEND_UNAVAILABLE", "연습용 데이터베이스가 꺼져 있어요."));
    render(<LocalParentWeeklyReport />);
    fireEvent.click(screen.getByRole("button", { name: "테스트 학부모로 들어가기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("연습용 데이터베이스가 꺼져 있어요.");
  });
});
