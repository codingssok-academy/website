import type {
  LocalDraftForm,
  LocalDraftSaveResult,
  LocalTeacherEvaluationResponse,
  LocalTeacherSession,
  LocalTeacherStudentsResponse,
} from "./types";
import { LocalTeacherPreviewError } from "./types";

async function postLocal<T>(
  path: string,
  token?: string,
  body?: Record<string, unknown>,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new LocalTeacherPreviewError(
      "BACKEND_UNAVAILABLE",
      "로컬 연습 DB에 연결할 수 없습니다. 시작 스크립트를 다시 확인해 주세요.",
    );
  }

  const result = (await response.json().catch(() => null)) as
    | (T & { code?: string; message?: string })
    | null;
  if (response.status === 401) {
    throw new LocalTeacherPreviewError(
      "SESSION_EXPIRED",
      "체험 시간이 끝났습니다. 테스트 선생님으로 다시 들어가 주세요.",
    );
  }
  if (response.status === 403) {
    throw new LocalTeacherPreviewError(
      "ACCESS_DENIED",
      "이 학생의 평가를 저장할 권한이 없습니다.",
    );
  }
  if (!response.ok || !result) {
    throw new LocalTeacherPreviewError(
      response.status >= 500 ? "BACKEND_UNAVAILABLE" : "SAVE_FAILED",
      result?.message ?? "로컬 평가 요청을 처리하지 못했습니다.",
    );
  }
  return result;
}

export function createLocalTeacherSession() {
  return postLocal<LocalTeacherSession>(
    "/api/growth-preview/local-teacher-session",
  );
}
export function fetchLocalTeacherStudents(session: LocalTeacherSession) {
  return postLocal<LocalTeacherStudentsResponse>(
    "/api/growth-preview/local-teacher-students",
    session.accessToken,
    {},
  );
}

export function fetchLocalTeacherEvaluation(
  session: LocalTeacherSession,
  studentId: string,
  weekStart: string,
) {
  return postLocal<LocalTeacherEvaluationResponse>(
    "/api/growth-preview/local-teacher-evaluation",
    session.accessToken,
    { studentId, weekStart },
  );
}

export function saveLocalTeacherDraft(
  session: LocalTeacherSession,
  studentId: string,
  weekStart: string,
  form: LocalDraftForm,
  expectedUpdatedAt: string | null,
) {
  return postLocal<LocalDraftSaveResult>(
    "/api/growth-preview/local-teacher-draft-save",
    session.accessToken,
    {
      studentId,
      weekStart,
      understanding: form.understanding,
      participation: form.participation,
      homeworkStatus: form.homeworkStatus,
      strength: form.strength,
      improvement: form.improvement,
      nextGoal: form.nextGoal,
      conceptKeys: form.conceptKeys,
      customConcepts: form.customConcepts,
      expectedUpdatedAt,
    },
  );
}
