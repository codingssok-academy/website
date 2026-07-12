import {
  LocalStudentPreviewError,
  type LocalStudentCode,
  type LocalStudentHomeResponse,
  type LocalStudentSession,
} from "./types";

async function safeJson(response: Response) {
  return response.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

export async function createLocalStudentSession(
  studentCode: LocalStudentCode,
): Promise<LocalStudentSession> {
  let response: Response;
  try {
    response = await fetch("/api/growth-preview/local-student-session", {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentCode }),
    });
  } catch {
    throw new LocalStudentPreviewError(
      "BACKEND_UNAVAILABLE",
      "연습용 데이터베이스가 꺼져 있어요.",
    );
  }

  const body = await safeJson(response);
  if (!response.ok) {
    throw new LocalStudentPreviewError(
      response.status >= 500 ? "BACKEND_UNAVAILABLE" : "LOGIN_FAILED",
      response.status >= 500
        ? "연습용 데이터베이스가 꺼져 있어요."
        : "테스트 학생으로 들어가지 못했어요.",
    );
  }
  if (typeof body?.accessToken !== "string" || typeof body?.expiresIn !== "number") {
    throw new LocalStudentPreviewError("LOGIN_FAILED", "테스트 학생으로 들어가지 못했어요.");
  }
  return { accessToken: body.accessToken, expiresIn: body.expiresIn };
}

export async function fetchLocalStudentHome(
  session: LocalStudentSession,
): Promise<LocalStudentHomeResponse> {
  let response: Response;
  try {
    response = await fetch("/api/growth-preview/local-student-home", {
      method: "POST",
      cache: "no-store",
      headers: {
        authorization: `Bearer ${session.accessToken}`,
        "content-type": "application/json",
      },
      body: "{}",
    });
  } catch {
    throw new LocalStudentPreviewError(
      "BACKEND_UNAVAILABLE",
      "연습용 데이터베이스가 꺼져 있어요.",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new LocalStudentPreviewError(
      "SESSION_EXPIRED",
      "로그인 시간이 끝났어요. 다시 들어가 주세요.",
    );
  }
  if (!response.ok) {
    throw new LocalStudentPreviewError(
      response.status >= 500 ? "BACKEND_UNAVAILABLE" : "REQUEST_FAILED",
      response.status >= 500
        ? "연습용 데이터베이스가 꺼져 있어요."
        : "학생 정보를 불러오지 못했어요.",
    );
  }

  const result = (await response.json()) as LocalStudentHomeResponse;
  if (!result.data) {
    throw new LocalStudentPreviewError("STUDENT_NOT_FOUND", "학생 정보를 불러오지 못했어요.");
  }
  return result;
}
