import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GrowthManagementPage from "./page";

vi.mock("@/features/growth-v2/attendance/MonthlyAttendancePanel", () => ({
  MonthlyAttendancePanel: ({ studentId }: { studentId: string }) => (
    <section aria-label="관리자 월별 출석">{studentId} 출석 입력 연결</section>
  ),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Growth 2.0 관리자 성장관리", () => {
  it("기존 운영 데이터를 새 성장 기록 흐름에 표시한다", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          success: true,
          migrationRequired: false,
          students: [
            {
              id: "student-1",
              name: "테스트학생",
              school: "테스트초",
              grade: "5학년",
              class: "프로젝트반",
              status: "approved",
            },
          ],
          records: [
            {
              id: "record-1",
              student_id: "student-1",
              student_name: "테스트학생",
              current_class: "프로젝트반",
              skill_level: null,
              strengths: "스스로 오류를 찾아 해결했습니다.",
              weaknesses: "풀이 순서를 먼저 정리해야 합니다.",
              current_goal: "조건문을 활용한 프로젝트 완성",
              next_class_potential: "이동 가능",
              class_progress: "for 반복문과 조건 비교",
              parent_feedback_draft: "이번 주에도 꾸준히 성장했습니다.",
              teacher_memo: "다음 시간 복습",
              status: "전달 준비",
              updated_at: "2026-08-19T00:00:00.000Z",
            },
          ],
          entries: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<GrowthManagementPage />);

    expect(
      await screen.findByRole("heading", { name: "Growth 2.0 성장관리" }),
    ).toBeInTheDocument();
    expect(screen.getByText("실제 DB 연동")).toBeInTheDocument();
    expect(screen.getByLabelText("배운 개념·수업 내용")).toHaveValue(
      "for 반복문과 조건 비교",
    );
    expect(screen.getByLabelText("다음 수업 목표")).toHaveValue(
      "조건문을 활용한 프로젝트 완성",
    );
    expect(screen.getByText("전달 준비·완료")).toBeInTheDocument();
    expect(screen.getByLabelText("관리자 월별 출석")).toHaveTextContent("student-1");
    expect(fetchMock).toHaveBeenCalledWith("/api/teacher/growth-management", {
      cache: "no-store",
    });
  });

  it("선택한 누적 성장 기록을 수정해 다시 표시한다", async () => {
    const entry = {
      id: "entry-1",
      student_id: "student-1",
      student_name: "테스트학생",
      current_class: "프로젝트반",
      skill_level: null,
      strengths: "끝까지 문제를 해결했습니다.",
      weaknesses: "풀이 순서를 정리해야 합니다.",
      current_goal: "조건문 프로젝트 완성",
      next_class_potential: "이동 가능",
      class_progress: "for 반복문",
      parent_feedback_draft: "꾸준히 성장하고 있습니다.",
      teacher_memo: "다음 시간 복습",
      entry_note: "기존 기록 메모",
      status: "전달 준비",
      updated_at: null,
      created_at: "2026-08-19T00:00:00.000Z",
    };
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        const body = JSON.parse(String(init.body));
        return new Response(
          JSON.stringify({
            success: true,
            entry: { ...entry, entry_note: body.entryNote },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          migrationRequired: false,
          students: [
            {
              id: "student-1",
              name: "테스트학생",
              school: "테스트초",
              grade: "5학년",
              class: "프로젝트반",
              status: "approved",
            },
          ],
          records: [],
          entries: [entry],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<GrowthManagementPage />);

    expect(await screen.findByText("기존 기록 메모")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "기록 수정" }));
    fireEvent.change(screen.getByLabelText("누적 기록 메모 수정"), {
      target: { value: "수정한 기록 메모" },
    });
    fireEvent.click(screen.getByRole("button", { name: "수정 내용 저장" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    const patchCall = fetchMock.mock.calls.find(([, options]) => options?.method === "PATCH");
    expect(patchCall).toBeDefined();
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({
      entryId: "entry-1",
      studentId: "student-1",
      entryNote: "수정한 기록 메모",
    });
    expect(await screen.findByText("선택한 누적 성장 기록을 수정했습니다.")).toBeInTheDocument();
    expect(screen.getByText("수정한 기록 메모")).toBeInTheDocument();
  });
});
