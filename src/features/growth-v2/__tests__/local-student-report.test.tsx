import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStudentReport } from "@/features/growth-v2/local-student/LocalStudentReport";
import {
  createLocalStudentSession,
  fetchLocalStudentHome,
} from "@/features/growth-v2/local-student/local-student-client";
import type { LocalStudentHomeResponse } from "@/features/growth-v2/local-student/types";

vi.mock("@/features/growth-v2/local-student/local-student-client", () => ({
  createLocalStudentSession: vi.fn(),
  fetchLocalStudentHome: vi.fn(),
}));

const SESSION = { accessToken: "student-jwt-in-test-memory", expiresIn: 3600 };

function studentHome(
  name: string,
  version: number | null,
  customConcepts: string[] = [],
): LocalStudentHomeResponse {
  return {
    api_version: "1.0",
    period: { week_start: "2026-07-06", week_end: "2026-07-12" },
    data: {
      student: { id: name.endsWith("A") ? "student-a-hidden-id" : "student-b-hidden-id", display_name: name },
      total_xp: name.endsWith("A") ? 2480 : 0,
      missions: [{
        student_mission_id: `${name}-mission`,
        code: "write-project-progress",
        title: "프로젝트 진행 기록 작성하기",
        detail: "오늘 만든 내용을 정리합니다.",
        xp_reward: 40,
        status: "assigned",
        assigned_at: "2026-07-06T00:00:00Z",
        completed_at: null,
      }],
      recent_growth: name.endsWith("A") ? [{
        type: "feedback",
        title: "선생님 피드백을 받았어요",
        detail: "질문하는 습관이 좋아졌어요.",
        occurred_at: "2026-07-08T10:00:00Z",
      }] : [],
      published_feedback: version === null ? null : {
        evaluation_id: `published-${version}`,
        status: "published",
        version,
        strength: version === 1
          ? "질문을 정리하며 문제를 해결하는 태도가 아주 좋았습니다."
          : "조건과 오류 찾기를 함께 사용해 풀이를 설명한 점이 아주 좋았습니다.",
        next_goal: version === 1
          ? "조건문을 활용한 점수 계산 기능을 완성해 봅니다."
          : "다음 시간에는 함수와 입출력을 이용해 작은 기능을 완성합니다.",
        published_at: "2026-07-10T10:00:00Z",
        selected_concepts: version === 1
          ? [{ key: "for-loop", label: "for 반복문" }, { key: "condition", label: "조건 비교" }]
          : [{ key: "condition", label: "조건 비교" }, { key: "debugging", label: "오류 찾기" }],
        custom_concepts: customConcepts.map((label, index) => ({ label, sort_order: index + 1 })),
      },
      projects: name.endsWith("A") ? [{
        project_id: "project-a",
        name: "나만의 우주 탐험 게임",
        description: "반복문과 조건문으로 만드는 가상 프로젝트",
        latest_update: {
          recent_work: "행성이 나타나는 순서를 반복문으로 정리했어요.",
          next_work: "조건문으로 점수를 계산하는 기능을 추가해요.",
          progress_pct: 64,
          occurred_at: "2026-07-08T10:00:00Z",
        },
      }] : [],
      badges: name.endsWith("A") ? [{
        code: "steady-explorer",
        name: "꾸준한 탐험가",
        description: "꾸준히 학습했어요.",
        icon_key: "calendar",
        awarded_at: "2026-07-08T10:00:00Z",
      }] : [],
    },
    empty_state_reason: version === null
      ? { published_feedback: "아직 공개된 주간 평가가 없습니다." }
      : {},
  };
}

const A_V1 = studentHome("테스트 학생 A", 1);
const A_V2 = studentHome("테스트 학생 A", 2, ["함수", "입출력"]);
const B_EMPTY = studentHome("테스트 학생 B", null);
const B_V1 = studentHome("테스트 학생 B", 1, ["변수", "입출력"]);
const mockedSession = vi.mocked(createLocalStudentSession);
const mockedHome = vi.mocked(fetchLocalStudentHome);

describe("local student report", () => {
  beforeEach(() => {
    mockedSession.mockReset();
    mockedHome.mockReset();
    mockedSession.mockResolvedValue(SESSION);
    mockedHome.mockResolvedValue(A_V1);
  });

  it("starts signed out with two keyboard buttons and the required safety guidance", () => {
    render(<LocalStudentReport />);
    expect(screen.getByRole("button", { name: "테스트 학생 A로 들어가기" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "테스트 학생 B로 들어가기" })).toBeEnabled();
    expect(screen.getByText(/공개된 최신 평가만/)).toBeInTheDocument();
    expect(screen.getByText(/보완할 점은 학생 화면에 표시되지/)).toBeInTheDocument();
    expect(screen.getByText(/새로고침하면 가상 로그인이 해제/)).toBeInTheDocument();
  });

  it("blocks duplicate login and does not use browser storage", async () => {
    let release: ((value: typeof SESSION) => void) | undefined;
    mockedSession.mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    render(<LocalStudentReport />);
    const button = screen.getByRole("button", { name: "테스트 학생 A로 들어가기" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mockedSession).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "로그인 중" })).toBeDisabled();
    release?.(SESSION);
    expect(await screen.findByRole("heading", { name: "테스트 학생 A 학생의 성장 리포트" })).toBeInTheDocument();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it("shows only student A published version 1 and real student home data", async () => {
    render(<LocalStudentReport />);
    fireEvent.click(screen.getByRole("button", { name: "테스트 학생 A로 들어가기" }));
    expect(await screen.findByText("테스트 버전: 1")).toBeInTheDocument();
    expect(screen.getByText("2,480 XP")).toBeInTheDocument();
    expect(screen.getByText(/질문을 정리하며 문제를 해결/)).toBeInTheDocument();
    expect(screen.getByText(/조건문을 활용한 점수 계산/)).toBeInTheDocument();
    expect(screen.getByText("for 반복문")).toBeInTheDocument();
    expect(screen.getByText("나만의 우주 탐험 게임")).toBeInTheDocument();
    expect(screen.getByText("꾸준한 탐험가")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "프로젝트 진행 기록 작성하기 읽기 전용" })).toBeDisabled();
    expect(screen.queryByText(/코드를 실행하기 전에 순서를 먼저 정리/)).not.toBeInTheDocument();
    expect(screen.queryByText(/draft|archived|version 2/i)).not.toBeInTheDocument();
  });

  it("shows student B with no published evaluation as a normal empty state", async () => {
    mockedHome.mockResolvedValue(B_EMPTY);
    render(<LocalStudentReport />);
    fireEvent.click(screen.getByRole("button", { name: "테스트 학생 B로 들어가기" }));
    expect(await screen.findByRole("heading", { name: "아직 공개된 주간 평가가 없습니다." })).toBeInTheDocument();
    expect(screen.getByText("선생님이 평가를 공개하면 이 화면에서 확인할 수 있어요.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/초안이 있습니다|선생님이 작성 중입니다|draft version|공개 대기 중/)).not.toBeInTheDocument();
  });

  it("reloads only through the student home reader and shows A version 2 custom concepts", async () => {
    let release: ((value: LocalStudentHomeResponse) => void) | undefined;
    mockedHome
      .mockResolvedValueOnce(A_V1)
      .mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    render(<LocalStudentReport />);
    fireEvent.click(screen.getByRole("button", { name: "테스트 학생 A로 들어가기" }));
    await screen.findByText("테스트 버전: 1");
    const refresh = screen.getByRole("button", { name: "최신 내용 다시 불러오기" });
    fireEvent.click(refresh);
    fireEvent.click(refresh);
    expect(mockedHome).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "불러오는 중" })).toBeDisabled();
    release?.(A_V2);
    expect(await screen.findByText("테스트 버전: 2")).toBeInTheDocument();
    expect(screen.getByText("오류 찾기")).toBeInTheDocument();
    expect(screen.getByText("함수")).toBeInTheDocument();
    expect(screen.getByText("입출력")).toBeInTheDocument();
    expect(screen.queryByText("테스트 버전: 1")).not.toBeInTheDocument();
  });

  it("shows student B first published version after a read-only reload", async () => {
    mockedHome.mockResolvedValueOnce(B_EMPTY).mockResolvedValueOnce(B_V1);
    render(<LocalStudentReport />);
    fireEvent.click(screen.getByRole("button", { name: "테스트 학생 B로 들어가기" }));
    await screen.findByRole("heading", { name: "아직 공개된 주간 평가가 없습니다." });
    fireEvent.click(screen.getByRole("button", { name: "최신 내용 다시 불러오기" }));
    expect(await screen.findByText("테스트 버전: 1")).toBeInTheDocument();
    expect(screen.getByText("변수")).toBeInTheDocument();
    expect(screen.getByText("입출력")).toBeInTheDocument();
  });

  it("clears all in-memory student data on exit and reads again after login", async () => {
    render(<LocalStudentReport />);
    fireEvent.click(screen.getByRole("button", { name: "테스트 학생 A로 들어가기" }));
    await screen.findByText("테스트 버전: 1");
    fireEvent.click(screen.getByRole("button", { name: "체험 끝내기" }));
    expect(screen.getByRole("button", { name: "테스트 학생 A로 들어가기" })).toBeInTheDocument();
    expect(screen.queryByText("2,480 XP")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "테스트 학생 A로 들어가기" }));
    await waitFor(() => expect(mockedSession).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("테스트 버전: 1")).toBeInTheDocument();
  });
});
