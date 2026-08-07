export type GrowthAttendanceStatus = "scheduled" | "present" | "absent" | "makeup";

export interface GrowthAttendanceRecord {
  id: string;
  class_date: string;
  lesson_title: string;
  status: GrowthAttendanceStatus;
  note: string | null;
  updated_at: string;
}

export interface MonthlyAttendanceResponse {
  api_version: string;
  period: {
    month: string;
    month_start: string;
    month_end: string;
  };
  data: {
    student: { id: string; display_name: string };
    summary: {
      scheduled: number;
      present: number;
      absent: number;
      makeup: number;
      upcoming: number;
      completed: number;
    };
    records: GrowthAttendanceRecord[];
  };
}

export interface SaveAttendanceInput {
  studentId: string;
  recordId: string | null;
  classDate: string;
  status: GrowthAttendanceStatus;
  lessonTitle: string;
  note: string;
}

export interface SaveAttendanceResponse {
  saved: true;
  record: GrowthAttendanceRecord & { student_id: string };
}

export const ATTENDANCE_STATUS_LABEL: Record<GrowthAttendanceStatus, string> = {
  scheduled: "예정",
  present: "출석",
  absent: "결석",
  makeup: "보강 완료",
};

export class AttendanceRequestError extends Error {
  constructor(
    public code: "SESSION_EXPIRED" | "ACCESS_DENIED" | "REQUEST_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "AttendanceRequestError";
  }
}
