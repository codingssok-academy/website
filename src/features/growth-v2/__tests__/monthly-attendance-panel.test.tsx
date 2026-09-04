import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonthlyAttendancePanel } from "@/features/growth-v2/attendance/MonthlyAttendancePanel";
import {
  fetchMonthlyAttendance,
  fetchStudentMonthlyAttendance,
  fetchTeacherMonthlyAttendance,
  saveProductionTeacherAttendance,
  saveTeacherAttendance,
} from "@/features/growth-v2/attendance/attendance-client";
import type { MonthlyAttendanceResponse } from "@/features/growth-v2/attendance/types";

vi.mock("@/features/growth-v2/attendance/attendance-client", () => ({
  fetchMonthlyAttendance: vi.fn(),
  fetchStudentMonthlyAttendance: vi.fn(),
  fetchTeacherMonthlyAttendance: vi.fn(),
  saveProductionTeacherAttendance: vi.fn(),
  saveTeacherAttendance: vi.fn(),
}));

const TOKEN = "teacher-token";
const STUDENT_ID = "11111111-1111-4111-8111-111111111111";

function monthData(month: string): MonthlyAttendanceResponse {
  const august = month === "2026-08";
  return {
    api_version: "1.0",
    period: {
      month,
      month_start: `${month}-01`,
      month_end: august ? "2026-08-31" : "2026-09-30",
    },
    data: {
      student: { id: STUDENT_ID, display_name: "테스트 학생 A" },
      summary: august
        ? { scheduled: 4, present: 2, absent: 1, makeup: 1, upcoming: 0, completed: 3 }
        : { scheduled: 0, present: 0, absent: 0, makeup: 0, upcoming: 0, completed: 0 },
      records: august ? [{
        id: "22222222-2222-4222-8222-222222222222",
        class_date: "2026-08-04",
        lesson_title: "프로젝트반 정규 수업",
        status: "present",
        note: null,
        updated_at: "2026-08-04T10:00:00Z",
      }] : [],
    },
  };
}

describe("monthly attendance panel", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-08-06T10:00:00+09:00"));
    vi.mocked(fetchMonthlyAttendance).mockImplementation(async (_token, _studentId, month) => monthData(month));
    vi.mocked(fetchStudentMonthlyAttendance).mockImplementation(async (month) => monthData(month));
    vi.mocked(fetchTeacherMonthlyAttendance).mockImplementation(async (_studentId, month) => monthData(month));
    vi.mocked(saveProductionTeacherAttendance).mockResolvedValue({
      saved: true,
      record: {
        ...monthData("2026-08").data.records[0],
        student_id: STUDENT_ID,
      },
    });
    vi.mocked(saveTeacherAttendance).mockResolvedValue({
      saved: true,
      record: {
        ...monthData("2026-08").data.records[0],
        student_id: STUDENT_ID,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("shows monthly totals and changes calendar months without changing weekly learning", async () => {
    render(<MonthlyAttendancePanel accessToken={TOKEN} studentId={STUDENT_ID} />);
    expect(await screen.findByRole("heading", { name: "2026년 8월 출석 현황" })).toBeInTheDocument();
    expect(screen.getByText("3/4")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("프로젝트반 정규 수업", { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다음 달 출석 보기" }));
    expect(await screen.findByRole("heading", { name: "2026년 9월 출석 현황" })).toBeInTheDocument();
    expect(fetchMonthlyAttendance).toHaveBeenLastCalledWith(TOKEN, STUDENT_ID, "2026-09");
    expect(screen.getByText("이 달에 등록된 출석 기록이 아직 없습니다.")).toBeInTheDocument();
  });

  it("shows a makeup-only month as completed without an impossible zero target", async () => {
    const makeupOnly = monthData("2026-08");
    makeupOnly.data.summary = {
      scheduled: 0,
      present: 0,
      absent: 0,
      makeup: 1,
      upcoming: 0,
      completed: 1,
    };
    makeupOnly.data.records = [{
      id: "33333333-3333-4333-8333-333333333333",
      class_date: "2026-08-06",
      lesson_title: "보강 수업",
      status: "makeup",
      note: null,
      updated_at: "2026-08-06T10:00:00Z",
    }];
    vi.mocked(fetchMonthlyAttendance).mockResolvedValue(makeupOnly);

    render(<MonthlyAttendancePanel accessToken={TOKEN} studentId={STUDENT_ID} />);

    expect(await screen.findByText("1/1")).toBeInTheDocument();
    expect(screen.queryByText("1/0")).not.toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "2026년 8월 수업 이수율" }))
      .toHaveAttribute("aria-valuenow", "100");
  });

  it("lets a teacher add and edit attendance but keeps viewer mode read-only", async () => {
    const view = render(<MonthlyAttendancePanel accessToken={TOKEN} studentId={STUDENT_ID} editable />);
    await screen.findByRole("heading", { name: "2026년 8월 출석 현황" });
    fireEvent.change(screen.getByLabelText("수업 날짜"), { target: { value: "2026-08-06" } });
    fireEvent.change(screen.getByLabelText("출석 상태"), { target: { value: "absent" } });
    fireEvent.change(screen.getByLabelText("수업 이름"), { target: { value: "알고리즘 정규 수업" } });
    fireEvent.change(screen.getByLabelText("메모(선택)"), { target: { value: "감기 결석" } });
    fireEvent.click(screen.getByRole("button", { name: "출석 기록 저장" }));

    await waitFor(() => expect(saveTeacherAttendance).toHaveBeenCalledWith(TOKEN, {
      studentId: STUDENT_ID,
      recordId: null,
      classDate: "2026-08-06",
      status: "absent",
      lessonTitle: "알고리즘 정규 수업",
      note: "감기 결석",
    }));
    expect(await screen.findByText("출석 기록을 저장했습니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "8월 4일 프로젝트반 정규 수업 수정" }));
    expect(screen.getByRole("button", { name: "수정 내용 저장" })).toBeInTheDocument();
    view.unmount();

    render(<MonthlyAttendancePanel accessToken={TOKEN} studentId={STUDENT_ID} />);
    await screen.findByRole("heading", { name: "2026년 8월 출석 현황" });
    expect(screen.queryByRole("button", { name: /출석 기록 저장|수정 내용 저장/ })).not.toBeInTheDocument();
  });

  it("connects the production teacher editor to the teacher attendance API", async () => {
    render(<MonthlyAttendancePanel source="teacher" studentId={STUDENT_ID} editable />);

    await screen.findByRole("heading", { name: "2026년 8월 출석 현황" });
    expect(fetchTeacherMonthlyAttendance).toHaveBeenCalledWith(STUDENT_ID, "2026-08");

    fireEvent.change(screen.getByLabelText("수업 날짜"), { target: { value: "2026-08-06" } });
    fireEvent.change(screen.getByLabelText("출석 상태"), { target: { value: "makeup" } });
    fireEvent.change(screen.getByLabelText("수업 이름"), { target: { value: "보강 수업" } });
    fireEvent.click(screen.getByRole("button", { name: "출석 기록 저장" }));

    await waitFor(() => expect(saveProductionTeacherAttendance).toHaveBeenCalledWith({
      studentId: STUDENT_ID,
      recordId: null,
      classDate: "2026-08-06",
      status: "makeup",
      lessonTitle: "보강 수업",
      note: "",
    }));
    expect(fetchTeacherMonthlyAttendance).toHaveBeenCalledTimes(2);
  });

  it("shows the signed-in student their own attendance without edit controls", async () => {
    render(<MonthlyAttendancePanel source="student" />);

    expect(await screen.findByRole("heading", { name: "2026년 8월 출석 현황" })).toBeInTheDocument();
    expect(fetchStudentMonthlyAttendance).toHaveBeenCalledWith("2026-08");
    expect(screen.queryByRole("button", { name: /출석 기록 저장|수정 내용 저장/ })).not.toBeInTheDocument();
  });
});
