import { NextRequest, NextResponse } from "next/server";
import { readGrowthPreviewProxyConfig } from "./preview-server-guard";

export const NO_STORE_HEADERS = { "cache-control": "no-store" };

export function localJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export function readLocalTeacherConfig(request: NextRequest) {
  const result = readGrowthPreviewProxyConfig(request);
  if (!result.ok && result.reason === "disabled") {
    return { ok: false, error: localJson({ code: "LOCAL_PREVIEW_DISABLED" }, 404) } as const;
  }
  if (!result.ok) {
    return { ok: false, error: localJson({ code: "LOCAL_PREVIEW_NOT_READY" }, 503) } as const;
  }
  return { ok: true, apiUrl: result.config.apiUrl, anonKey: result.config.anonKey } as const;
}

export function readTeacherAuthorization(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") && authorization.length > 20
    ? authorization
    : null;
}

export async function safeJson(response: Response) {
  return response.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

export function safeProxyError(status: number) {
  if (status === 401) return localJson({ code: "TEACHER_SESSION_EXPIRED" }, 401);
  if (status === 403) return localJson({ code: "TEACHER_ACCESS_DENIED" }, 403);
  if (status >= 500) return localJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  return localJson({ code: "LOCAL_TEACHER_REQUEST_FAILED" }, 400);
}
