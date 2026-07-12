import { NextRequest, NextResponse } from "next/server";

const NO_STORE_HEADERS = { "cache-control": "no-store" };

function isLocalHostname(hostname: string) {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function isLocalHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && isLocalHostname(url.hostname);
  } catch {
    return false;
  }
}

export function parentLocalJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export function readLocalParentConfig(request: NextRequest) {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.GROWTH_PREVIEW_LOCAL_ONLY !== "1" ||
    !isLocalHostname(request.nextUrl.hostname)
  ) {
    return { ok: false, error: parentLocalJson({ code: "LOCAL_PREVIEW_DISABLED" }, 404) } as const;
  }

  const apiUrl = process.env.GROWTH_PREVIEW_SUPABASE_URL ?? "";
  const anonKey = process.env.GROWTH_PREVIEW_SUPABASE_ANON_KEY ?? "";
  if (!isLocalHttpUrl(apiUrl) || !anonKey) {
    return { ok: false, error: parentLocalJson({ code: "LOCAL_PREVIEW_NOT_READY" }, 503) } as const;
  }

  return { ok: true, apiUrl, anonKey } as const;
}

export function readParentAuthorization(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") && authorization.length > 20
    ? authorization
    : null;
}

export async function readSafeParentJson(response: Response) {
  return response.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

export function safeParentProxyError(status: number) {
  if (status === 401) return parentLocalJson({ code: "PARENT_SESSION_EXPIRED" }, 401);
  if (status === 403) return parentLocalJson({ code: "PARENT_ACCESS_DENIED" }, 403);
  if (status >= 500) return parentLocalJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  return parentLocalJson({ code: "LOCAL_PARENT_REQUEST_FAILED" }, 400);
}
