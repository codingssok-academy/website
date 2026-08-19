import { NextRequest, NextResponse } from "next/server";
import { readGrowthPreviewProxyConfig } from "./preview-server-guard";

const NO_STORE_HEADERS = { "cache-control": "no-store" };
const FORBIDDEN_RESPONSE_KEYS = new Set([
  "improvement",
  "parent_conversation_prompt",
  "draft",
  "archived",
]);

export function studentLocalJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export function readLocalStudentConfig(request: NextRequest) {
  const result = readGrowthPreviewProxyConfig(request);
  if (!result.ok && result.reason === "disabled") {
    return { ok: false, error: studentLocalJson({ code: "LOCAL_PREVIEW_DISABLED" }, 404) } as const;
  }
  if (!result.ok) {
    return { ok: false, error: studentLocalJson({ code: "LOCAL_PREVIEW_NOT_READY" }, 503) } as const;
  }
  return { ok: true, apiUrl: result.config.apiUrl, anonKey: result.config.anonKey } as const;
}

export function readStudentAuthorization(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") && authorization.length > 20
    ? authorization
    : null;
}

export async function readSafeStudentJson(response: Response) {
  return response.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

export function containsForbiddenStudentField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenStudentField);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(
    ([key, child]) => FORBIDDEN_RESPONSE_KEYS.has(key) || containsForbiddenStudentField(child),
  );
}

export function safeStudentProxyError(status: number) {
  if (status === 401 || status === 403) {
    return studentLocalJson({ code: "STUDENT_SESSION_EXPIRED" }, 401);
  }
  if (status >= 500) return studentLocalJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  return studentLocalJson({ code: "LOCAL_STUDENT_REQUEST_FAILED" }, 400);
}
