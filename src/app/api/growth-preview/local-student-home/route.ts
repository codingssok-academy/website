import { NextRequest } from "next/server";
import {
  containsForbiddenStudentField,
  readLocalStudentConfig,
  readSafeStudentJson,
  readStudentAuthorization,
  safeStudentProxyError,
  studentLocalJson,
} from "../local-student-guard";

export async function POST(request: NextRequest) {
  const config = readLocalStudentConfig(request);
  if (!config.ok) return config.error;
  const authorization = readStudentAuthorization(request);
  if (!authorization) return studentLocalJson({ code: "STUDENT_TOKEN_REQUIRED" }, 401);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body) || Object.keys(body).length !== 0) {
    return studentLocalJson({ code: "INVALID_STUDENT_HOME_REQUEST" }, 400);
  }

  try {
    const response = await fetch(`${config.apiUrl}/rest/v1/rpc/growth_api_student_home`, {
      method: "POST",
      cache: "no-store",
      headers: {
        apikey: config.anonKey,
        authorization,
        "content-type": "application/json",
      },
      body: "{}",
    });
    if (!response.ok) return safeStudentProxyError(response.status);
    const result = await readSafeStudentJson(response);
    if (!result || containsForbiddenStudentField(result)) {
      return studentLocalJson({ code: "UNSAFE_STUDENT_RESPONSE" }, 503);
    }
    return studentLocalJson(result);
  } catch {
    return studentLocalJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
