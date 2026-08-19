import type {
  LocalParentChildrenResponse,
  LocalParentSession,
  LocalParentWeeklyReportResponse,
} from "./types";
import { LocalParentPreviewError } from "./types";

async function postLocalParent<T>(
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
    throw new LocalParentPreviewError("BACKEND_UNAVAILABLE", "연습용 데이터베이스가 꺼져 있어요.");
  }

  const result = (await response.json().catch(() => null)) as
    | (T & { code?: string })
    | null;
  if (response.status === 401) {
    throw new LocalParentPreviewError("SESSION_EXPIRED", "로그인 시간이 끝났어요. 다시 들어가 주세요.");
  }
  if (response.status === 403) {
    throw new LocalParentPreviewError("ACCESS_DENIED", "이 학생의 리포트를 볼 권한이 없어요.");
  }
  if (response.status === 503) {
    throw new LocalParentPreviewError("BACKEND_UNAVAILABLE", "연습용 데이터베이스가 꺼져 있어요.");
  }
  if (!response.ok || !result) {
    throw new LocalParentPreviewError(
      path.includes("session") ? "LOGIN_FAILED" : "REQUEST_FAILED",
      path.includes("session")
        ? "테스트 학부모로 들어가지 못했어요."
        : "최신 리포트를 불러오지 못했어요.",
    );
  }
  return result;
}

export function createLocalParentSession() {
  return postLocalParent<LocalParentSession>(
    process.env.NEXT_PUBLIC_GROWTH_PREVIEW_ENV === "staging"
      ? "/api/growth-preview/staging-session"
      : "/api/growth-preview/local-parent-session",
    undefined,
    process.env.NEXT_PUBLIC_GROWTH_PREVIEW_ENV === "staging"
      ? { roleCode: "parent" }
      : undefined,
  );
}

export function fetchLocalParentChildren(session: LocalParentSession) {
  return postLocalParent<LocalParentChildrenResponse>(
    "/api/growth-preview/local-parent-children",
    session.accessToken,
    {},
  );
}

export function fetchLocalParentWeeklyReport(
  session: LocalParentSession,
  studentId: string,
  weekStart: string,
) {
  return postLocalParent<LocalParentWeeklyReportResponse>(
    "/api/growth-preview/local-parent-weekly-report",
    session.accessToken,
    { studentId, weekStart },
  );
}
