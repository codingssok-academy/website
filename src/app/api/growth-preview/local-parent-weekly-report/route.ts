import { NextRequest } from "next/server";
import {
  parentLocalJson,
  readLocalParentConfig,
  readParentAuthorization,
  readSafeParentJson,
  safeParentProxyError,
} from "../local-parent-guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_KEYS = new Set(["studentId", "weekStart"]);

export async function POST(request: NextRequest) {
  const config = readLocalParentConfig(request);
  if (!config.ok) return config.error;
  const authorization = readParentAuthorization(request);
  if (!authorization) return parentLocalJson({ code: "PARENT_TOKEN_REQUIRED" }, 401);

  const body = (await request.json().catch(() => null)) as
    | { studentId?: unknown; weekStart?: unknown }
    | null;
  if (
    !body ||
    Object.keys(body).some((key) => !ALLOWED_KEYS.has(key)) ||
    typeof body.studentId !== "string" ||
    !UUID.test(body.studentId) ||
    typeof body.weekStart !== "string" ||
    !DATE.test(body.weekStart)
  ) {
    return parentLocalJson({ code: "INVALID_REPORT_REQUEST" }, 400);
  }

  try {
    const response = await fetch(`${config.apiUrl}/rest/v1/rpc/growth_api_parent_weekly_report`, {
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
    });
    if (!response.ok) return safeParentProxyError(response.status);
    return parentLocalJson(await readSafeParentJson(response));
  } catch {
    return parentLocalJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
