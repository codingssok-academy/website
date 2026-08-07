import {
  AttendanceRequestError,
  type MonthlyAttendanceResponse,
  type SaveAttendanceInput,
  type SaveAttendanceResponse,
} from "./types";

async function postAttendance<T>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      cache: "no-store",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AttendanceRequestError("REQUEST_FAILED", "출석 정보를 불러오지 못했어요.");
  }

  const result = (await response.json().catch(() => null)) as T | null;
  if (response.status === 401) {
    throw new AttendanceRequestError("SESSION_EXPIRED", "로그인 시간이 끝났어요. 다시 들어가 주세요.");
  }
  if (response.status === 403) {
    throw new AttendanceRequestError("ACCESS_DENIED", "이 학생의 출석 정보를 확인할 권한이 없어요.");
  }
  if (!response.ok || !result) {
    throw new AttendanceRequestError(
      "REQUEST_FAILED",
      path.includes("save") ? "출석 기록을 저장하지 못했어요." : "출석 정보를 불러오지 못했어요.",
    );
  }
  return result;
}

export function fetchMonthlyAttendance(
  accessToken: string,
  studentId: string,
  month: string,
) {
  return postAttendance<MonthlyAttendanceResponse>(
    "/api/growth-preview/local-attendance-month",
    accessToken,
    { studentId, month },
  );
}

export function saveTeacherAttendance(accessToken: string, input: SaveAttendanceInput) {
  return postAttendance<SaveAttendanceResponse>(
    "/api/growth-preview/local-teacher-attendance-save",
    accessToken,
    { ...input },
  );
}
