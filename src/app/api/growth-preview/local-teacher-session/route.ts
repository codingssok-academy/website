import { NextRequest } from "next/server";
import {
  localJson,
  readLocalTeacherConfig,
  safeJson,
} from "../local-teacher-guard";

export async function POST(request: NextRequest) {
  const config = readLocalTeacherConfig(request);
  if (!config.ok) return config.error;

  const email = process.env.GROWTH_PREVIEW_TEACHER_EMAIL ?? "";
  const password = process.env.GROWTH_PREVIEW_TEACHER_PASSWORD ?? "";
  if (!email || !password) {
    return localJson(
      { code: "LOCAL_PREVIEW_NOT_READY", message: "로컬 선생님 체험이 아직 준비되지 않았습니다." },
      503,
    );
  }

  try {
    const response = await fetch(
      `${config.apiUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        cache: "no-store",
        headers: { apikey: config.anonKey, "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    );
    const body = await safeJson(response);
    const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
    const expiresIn = typeof body?.expires_in === "number" ? body.expires_in : 3600;

    if (!response.ok || !accessToken) {
      return localJson(
        { code: "LOCAL_TEACHER_LOGIN_FAILED", message: "테스트 선생님으로 들어가지 못했습니다." },
        401,
      );
    }

    return localJson({ accessToken, expiresIn });
  } catch {
    return localJson(
      { code: "LOCAL_BACKEND_UNAVAILABLE", message: "로컬 연습 DB에 연결할 수 없습니다." },
      503,
    );
  }
}
