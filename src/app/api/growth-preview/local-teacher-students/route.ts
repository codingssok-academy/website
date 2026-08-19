import { NextRequest } from "next/server";
import {
  localJson,
  readLocalTeacherConfig,
  readTeacherAuthorization,
  safeJson,
  safeProxyError,
} from "../local-teacher-guard";

export async function POST(request: NextRequest) {
  const config = readLocalTeacherConfig(request);
  if (!config.ok) return config.error;
  const authorization = readTeacherAuthorization(request);
  if (!authorization) return localJson({ code: "TEACHER_TOKEN_REQUIRED" }, 401);

  try {
    const response = await fetch(
      `${config.apiUrl}/rest/v1/rpc/growth_api_teacher_students`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          apikey: config.anonKey,
          authorization,
          "content-type": "application/json",
        },
        body: "{}",
      },
    );
    if (!response.ok) return safeProxyError(response.status);
    return localJson(await safeJson(response));
  } catch {
    return localJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
