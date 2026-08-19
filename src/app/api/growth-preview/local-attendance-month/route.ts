import { NextRequest } from "next/server";
import {
  localJson,
  readLocalTeacherConfig,
  readTeacherAuthorization,
  safeJson,
  safeProxyError,
} from "../local-teacher-guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const ALLOWED_KEYS = new Set(["studentId", "month"]);

export async function POST(request: NextRequest) {
  const config = readLocalTeacherConfig(request);
  if (!config.ok) return config.error;
  const authorization = readTeacherAuthorization(request);
  if (!authorization) return localJson({ code: "ATTENDANCE_TOKEN_REQUIRED" }, 401);

  const body = (await request.json().catch(() => null)) as
    | { studentId?: unknown; month?: unknown }
    | null;
  if (
    !body ||
    Object.keys(body).some((key) => !ALLOWED_KEYS.has(key)) ||
    typeof body.studentId !== "string" ||
    !UUID.test(body.studentId) ||
    typeof body.month !== "string" ||
    !MONTH.test(body.month)
  ) {
    return localJson({ code: "INVALID_ATTENDANCE_REQUEST" }, 400);
  }

  try {
    const response = await fetch(
      `${config.apiUrl}/rest/v1/rpc/growth_api_monthly_attendance`,
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
          p_month: `${body.month}-01`,
        }),
      },
    );
    if (!response.ok) return safeProxyError(response.status);
    return localJson(await safeJson(response));
  } catch {
    return localJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
