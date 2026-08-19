import { NextRequest } from "next/server";
import {
  localJson,
  readLocalTeacherConfig,
  readTeacherAuthorization,
  safeJson,
  safeProxyError,
} from "../local-teacher-guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const config = readLocalTeacherConfig(request);
  if (!config.ok) return config.error;
  const authorization = readTeacherAuthorization(request);
  if (!authorization) return localJson({ code: "TEACHER_TOKEN_REQUIRED" }, 401);

  const body = (await request.json().catch(() => null)) as
    | { studentId?: unknown; weekStart?: unknown }
    | null;
  if (
    !body ||
    typeof body.studentId !== "string" ||
    !UUID.test(body.studentId) ||
    typeof body.weekStart !== "string" ||
    !DATE.test(body.weekStart)
  ) {
    return localJson({ code: "INVALID_EVALUATION_REQUEST" }, 400);
  }

  try {
    const response = await fetch(
      `${config.apiUrl}/rest/v1/rpc/growth_api_teacher_weekly_evaluation`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          apikey: config.anonKey,
          authorization,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          p_student_id: body.studentId,
          p_week_start: body.weekStart,
        }),
      },
    );
    if (!response.ok) return safeProxyError(response.status);
    return localJson(await safeJson(response));
  } catch {
    return localJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
