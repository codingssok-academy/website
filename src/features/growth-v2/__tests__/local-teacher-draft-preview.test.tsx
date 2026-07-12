import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalTeacherDraftPreview } from "@/features/growth-v2/local-teacher/LocalTeacherDraftPreview";
import {
  createLocalTeacherSession,
  fetchLocalTeacherEvaluation,
  fetchLocalTeacherStudents,
  publishLocalTeacherEvaluation,
  saveLocalTeacherDraft,
} from "@/features/growth-v2/local-teacher/local-teacher-client";
import type { LocalTeacherEvaluationResponse } from "@/features/growth-v2/local-teacher/types";

vi.mock("@/features/growth-v2/local-teacher/local-teacher-client", () => ({
  createLocalTeacherSession: vi.fn(),
  fetchLocalTeacherStudents: vi.fn(),
  fetchLocalTeacherEvaluation: vi.fn(),
  saveLocalTeacherDraft: vi.fn(),
  publishLocalTeacherEvaluation: vi.fn(),
}));

const SESSION = { accessToken: "teacher-jwt-in-test-memory", expiresIn: 3600 };
const STUDENTS = {
  api_version: "1.0",
  period: { week_start: "2026-07-06", week_end: "2026-07-12" },
  data: [
    { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", display_name: "테스트 학생 A", week_start: "2026-07-06", has_draft: false, has_published: true, evaluation_status: "published" as const },
    { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", display_name: "테스트 학생 B", week_start: "2026-07-06", has_draft: false, has_published: false, evaluation_status: "not_started" as const },
  ],
};

function evaluationResponse(
  studentName: string,
  draftVersion: number | null,
  publishedVersion: number | null,
  customLabels: string[] = [],
): LocalTeacherEvaluationResponse {
  const record = (status: "draft" | "published", version: number) => ({
    evaluation_id: `${status}-${version}`,
    status,
    version,
    ...(status === "draft" ? { updated_at: "2026-07-12T10:00:00Z" } : { published_at: "2026-07-10T10:00:00Z" }),
    understanding: "solves_independently",
    participation: "asked_questions",
    homework_status: "complete",
    strength: "질문을 정리하며 문제를 해결한 점이 좋았습니다.",
    improvement: "실행 전에 예상 결과를 적는 연습이 필요합니다.",
    next_goal: "다음 시간에는 조건문 문제를 완성해 봅니다.",
    concepts: [{ key: "condition" as const, label: "조건 비교" }],
    selected_concepts: [{ key: "condition" as const, label: "조건 비교" }],
    custom_concepts: customLabels.map((label, index) => ({
      id: `custom-${index}`,
      label,
      sort_order: index + 1,
    })),
  });
  return {
    api_version: "1.0",
    period: { week_start: "2026-07-06", week_end: "2026-07-12" },
    data: {
      student: { id: studentName.endsWith("A") ? STUDENTS.data[0].id : STUDENTS.data[1].id, display_name: studentName },
      draft: draftVersion ? record("draft", draftVersion) : null,
      published: publishedVersion ? record("published", publishedVersion) : null,
      project: null,
    },
  };
}

const A_PUBLISHED = evaluationResponse("테스트 학생 A", null, 1);
const A_DRAFT = evaluationResponse("테스트 학생 A", 2, 1);
const B_EMPTY = evaluationResponse("테스트 학생 B", null, null);
const A_CUSTOM_DRAFT = evaluationResponse("테스트 학생 A", 2, 1, ["함수", "입출력"]);
const A_PUBLISHED_V2 = evaluationResponse("테스트 학생 A", null, 2, ["함수", "입출력"]);
const B_CUSTOM_DRAFT = evaluationResponse("테스트 학생 B", 1, null, ["변수", "입출력"]);
const mockedSession = vi.mocked(createLocalTeacherSession);
const mockedStudents = vi.mocked(fetchLocalTeacherStudents);
const mockedEvaluation = vi.mocked(fetchLocalTeacherEvaluation);
const mockedSave = vi.mocked(saveLocalTeacherDraft);
const mockedPublish = vi.mocked(publishLocalTeacherEvaluation);

async function login() {
  fireEvent.click(screen.getByRole("button", { name: "테스트 선생님으로 들어가기" }));
  expect(await screen.findByRole("heading", { name: "테스트 학생 A 평가 초안" })).toBeInTheDocument();
}

describe("local teacher draft preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSession.mockResolvedValue(SESSION);
    mockedStudents.mockResolvedValue(STUDENTS);
    mockedEvaluation.mockResolvedValue(A_PUBLISHED);
    mockedSave.mockResolvedValue({
      saved: true, created: true, conflict: false, evaluation_id: "draft-2",
      version: 2, status: "draft", updated_at: "2026-07-12T10:00:00Z",
      selected_concepts: [{ key: "condition", label: "조건 비교" }],
    });
    mockedPublish.mockResolvedValue({
      published: true, already_published: false, conflict: false,
      evaluation_id: "draft-2", version: 2, status: "published",
      published_at: "2026-07-12T11:00:00Z", archived_previous_version: 1,
    });
  });

  it("starts signed out, prevents duplicate login, and stores no browser session", async () => {
    let release: ((value: typeof SESSION) => void) | undefined;
    mockedSession.mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    const view = render(<LocalTeacherDraftPreview />);
    const button = screen.getByRole("button", { name: "테스트 선생님으로 들어가기" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mockedSession).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "로그인 중" })).toBeDisabled();
    release?.(SESSION);
    expect(await screen.findByRole("heading", { name: "테스트 학생 A 평가 초안" })).toBeInTheDocument();
    view.unmount();
    render(<LocalTeacherDraftPreview />);
    expect(screen.getByRole("button", { name: "테스트 선생님으로 들어가기" })).toBeInTheDocument();
  });

  it("shows assigned A and B, published v1, and read-only project fields", async () => {
    render(<LocalTeacherDraftPreview />);
    await login();
    expect(screen.getByRole("button", { name: /테스트 학생 A/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /테스트 학생 B/ })).toBeInTheDocument();
    expect(screen.queryByText("테스트 학생 C")).not.toBeInTheDocument();
    expect(screen.getByText("기존 공개본 v1")).toBeInTheDocument();
    expect(screen.getByText("저장된 초안 없음")).toBeInTheDocument();
    expect(screen.getByLabelText("프로젝트 최근 작업")).toBeDisabled();
    expect(screen.getByRole("button", { name: "평가 공개하기" })).toBeDisabled();
    expect(screen.getByText("현재 공개할 평가 초안이 없습니다.")).toBeInTheDocument();
  });

  it("validates input, saves A, and shows only the re-read draft version 2", async () => {
    mockedEvaluation.mockResolvedValueOnce(A_PUBLISHED).mockResolvedValueOnce(A_DRAFT);
    render(<LocalTeacherDraftPreview />);
    await login();
    fireEvent.click(screen.getByRole("checkbox", { name: "조건 비교" }));
    fireEvent.click(screen.getByRole("button", { name: "평가 초안 저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("개념을 하나 이상");
    fireEvent.click(screen.getByRole("checkbox", { name: "조건 비교" }));
    fireEvent.click(screen.getByRole("button", { name: "평가 초안 저장" }));

    await waitFor(() => expect(mockedSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockedEvaluation).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/평가 초안 version 2이 실제 로컬 DB에 저장/)).toBeInTheDocument();
    expect(screen.getAllByText("학생·학부모 미공개").length).toBeGreaterThan(0);
    const sentForm = mockedSave.mock.calls[0][3];
    expect(sentForm).not.toHaveProperty("project");
    expect(JSON.stringify(sentForm)).not.toMatch(/teacher_id|role|published_at/);
  });

  it("adds custom concepts by button and Enter, removes a tag, and re-reads DB values", async () => {
    mockedEvaluation.mockResolvedValueOnce(A_PUBLISHED).mockResolvedValueOnce(A_CUSTOM_DRAFT);
    render(<LocalTeacherDraftPreview />);
    await login();

    const input = screen.getByLabelText("직접 입력할 개념");
    fireEvent.change(input, { target: { value: "  리스트  " } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    fireEvent.change(input, { target: { value: "함수" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("2/5")).toBeInTheDocument();
    expect(input).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "리스트 개념 제거" }));
    fireEvent.change(input, { target: { value: "입출력" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    fireEvent.click(screen.getByRole("button", { name: "평가 초안 저장" }));

    await waitFor(() => expect(mockedSave).toHaveBeenCalledTimes(1));
    expect(mockedSave.mock.calls[0][3].customConcepts).toEqual(["함수", "입출력"]);
    expect(await screen.findByText(/평가 초안 version 2이 실제 로컬 DB에 저장/)).toBeInTheDocument();
    expect(screen.getAllByText("함수").length).toBeGreaterThan(0);
    expect(screen.getAllByText("입출력").length).toBeGreaterThan(0);
    expect(screen.queryByText("리스트")).not.toBeInTheDocument();
  });

  it("shows friendly custom concept limits and duplicate messages", async () => {
    render(<LocalTeacherDraftPreview />);
    await login();
    const input = screen.getByLabelText("직접 입력할 개념");
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByRole("alert")).toHaveTextContent("입력해 주세요");
    fireEvent.change(input, { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByRole("alert")).toHaveTextContent("2자 이상");

    fireEvent.change(input, { target: { value: "조건 비교" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByRole("alert")).toHaveTextContent("준비된 개념에서 이미 선택");

    fireEvent.click(screen.getByRole("checkbox", { name: "조건 비교" }));
    fireEvent.change(input, { target: { value: "함수" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    fireEvent.change(input, { target: { value: " 함수 " } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByRole("alert")).toHaveTextContent("이미 직접 추가");

    fireEvent.change(input, { target: { value: "가".repeat(41) } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByRole("alert")).toHaveTextContent("40자 이하");

    for (const concept of ["리스트", "입출력", "변수", "터틀 그래픽"]) {
      fireEvent.change(input, { target: { value: concept } });
      fireEvent.click(screen.getByRole("button", { name: "추가" }));
    }
    expect(screen.getByText("5/5")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "HTML/CSS" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByRole("alert")).toHaveTextContent("최대 5개");
  });

  it("handles student B empty state and keeps draft version 1 after saving", async () => {
    mockedEvaluation
      .mockResolvedValueOnce(A_PUBLISHED)
      .mockResolvedValueOnce(B_EMPTY)
      .mockResolvedValueOnce(B_CUSTOM_DRAFT);
    mockedSave.mockResolvedValue({
      saved: true, created: true, conflict: false, evaluation_id: "draft-1",
      version: 1, status: "draft", updated_at: "2026-07-12T10:00:00Z",
      selected_concepts: [{ key: "condition", label: "조건 비교" }],
    });
    render(<LocalTeacherDraftPreview />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: /테스트 학생 B/ }));
    expect(await screen.findByRole("heading", { name: "테스트 학생 B 평가 초안" })).toBeInTheDocument();
    expect(screen.getByText("아직 공개된 평가 없음")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("잘한 점"), { target: { value: "순서에 맞춰 문제를 해결한 점이 아주 좋았습니다." } });
    fireEvent.change(screen.getByLabelText("보완할 점"), { target: { value: "실행 전에 예상 결과를 적는 연습을 이어갑니다." } });
    fireEvent.change(screen.getByLabelText("다음 수업 목표"), { target: { value: "다음 시간에는 조건문 문제를 스스로 완성합니다." } });
    const customInput = screen.getByLabelText("직접 입력할 개념");
    fireEvent.change(customInput, { target: { value: "변수" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    fireEvent.change(customInput, { target: { value: "입출력" } });
    fireEvent.keyDown(customInput, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "평가 초안 저장" }));
    expect(await screen.findByText(/평가 초안 version 1이 실제 로컬 DB에 저장/)).toBeInTheDocument();
    expect(screen.getByText("공개본", { selector: "dt" }).nextSibling).toHaveTextContent("없음");
    expect(mockedSave.mock.calls.at(-1)?.[3].conceptKeys).toEqual([]);
    expect(mockedSave.mock.calls.at(-1)?.[3].customConcepts).toEqual(["변수", "입출력"]);
  });

  it("keeps typed text on conflict and offers an explicit reload", async () => {
    mockedSave.mockResolvedValue({
      saved: false, created: false, conflict: true, evaluation_id: "draft-2",
      version: 2, status: "draft", updated_at: "2026-07-12T10:01:00Z", selected_concepts: [],
    });
    render(<LocalTeacherDraftPreview />);
    await login();
    const changed = "다른 화면과 충돌해도 지금 작성한 문장은 그대로 유지되어야 합니다.";
    fireEvent.change(screen.getByLabelText("잘한 점"), { target: { value: changed } });
    fireEvent.click(screen.getByRole("button", { name: "평가 초안 저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("다른 곳에서 평가가 변경");
    expect(screen.getByLabelText("잘한 점")).toHaveValue(changed);
    expect(screen.getByRole("button", { name: "최신 내용 다시 불러오기" })).toBeInTheDocument();
  });

  it("blocks publishing unsaved changes and enables it again after draft save", async () => {
    mockedEvaluation.mockResolvedValueOnce(A_CUSTOM_DRAFT).mockResolvedValueOnce(A_CUSTOM_DRAFT);
    render(<LocalTeacherDraftPreview />);
    await login();
    const publishButton = screen.getByRole("button", { name: "평가 공개하기" });
    expect(publishButton).toBeEnabled();

    fireEvent.change(screen.getByLabelText("잘한 점"), {
      target: { value: "변경한 평가 문장은 먼저 초안으로 안전하게 저장해야 합니다." },
    });
    expect(publishButton).toBeDisabled();
    expect(screen.getByText("공개하기 전에 변경한 내용을 초안으로 저장해 주세요.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "평가 초안 저장" }));
    await waitFor(() => expect(mockedSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(publishButton).toBeEnabled());
  });

  it("shows publishing scope, cancels without an API call, and returns focus", async () => {
    mockedEvaluation.mockResolvedValue(A_CUSTOM_DRAFT);
    render(<LocalTeacherDraftPreview />);
    await login();
    const publishButton = screen.getByRole("button", { name: "평가 공개하기" });
    fireEvent.click(publishButton);

    expect(screen.getByRole("dialog", { name: "평가를 공개할까요?" })).toBeInTheDocument();
    expect(screen.getByText("학생에게 공개")).toBeInTheDocument();
    expect(screen.getByText("학부모에게 공개")).toBeInTheDocument();
    expect(screen.getAllByText(/보완할 점/).length).toBeGreaterThan(0);
    expect(screen.getByText(/기존 공개본 version 1은 삭제하지 않고/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(mockedPublish).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(publishButton).toHaveFocus();
  });

  it("publishes once, re-reads the DB, and shows version 2 with no draft", async () => {
    mockedEvaluation.mockResolvedValueOnce(A_CUSTOM_DRAFT).mockResolvedValueOnce(A_PUBLISHED_V2);
    mockedStudents.mockResolvedValue({
      ...STUDENTS,
      data: [{ ...STUDENTS.data[0], has_draft: false, has_published: true, evaluation_status: "published" }, STUDENTS.data[1]],
    });
    render(<LocalTeacherDraftPreview />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: "평가 공개하기" }));
    const confirm = screen.getByRole("button", { name: "정말 공개하기" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(mockedPublish).toHaveBeenCalledTimes(1));
    expect(mockedPublish).toHaveBeenCalledWith(SESSION, "draft-2", "2026-07-12T10:00:00Z");
    await waitFor(() => expect(mockedEvaluation).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "평가 공개 완료" })).toBeInTheDocument();
    expect(screen.getByText("version 2", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("없음", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText(/이전 공개본 version 1은 이전 기록으로 보관/)).toBeInTheDocument();
    expect(screen.getByText("학생·학부모 공개", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getAllByText("함수").length).toBeGreaterThan(0);
    expect(screen.getAllByText("입출력").length).toBeGreaterThan(0);
  });

  it("treats already-published as safe and shows conflicts without success", async () => {
    mockedEvaluation.mockResolvedValue(A_CUSTOM_DRAFT);
    mockedPublish.mockResolvedValueOnce({
      published: false, already_published: false, conflict: true,
      evaluation_id: "draft-2", version: 2, status: "published",
      published_at: "", archived_previous_version: null,
    });
    render(<LocalTeacherDraftPreview />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: "평가 공개하기" }));
    fireEvent.click(screen.getByRole("button", { name: "정말 공개하기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("다른 곳에서 초안이 변경됐어요");
    expect(screen.queryByRole("heading", { name: "평가 공개 완료" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "최신 내용 다시 불러오기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "평가 공개하기" })).toBeDisabled();
  });

  it("clears the in-memory teacher session without deleting the DB draft", async () => {
    render(<LocalTeacherDraftPreview />);
    await login();
    fireEvent.click(screen.getByRole("button", { name: "체험 끝내기" }));
    expect(screen.getByRole("button", { name: "테스트 선생님으로 들어가기" })).toBeInTheDocument();
    expect(mockedSave).not.toHaveBeenCalled();
  });
});
