import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export type GrowthPreviewProxyConfig = {
  mode: "local" | "staging";
  apiUrl: string;
  anonKey: string;
};

export type GrowthPreviewProxyConfigResult =
  | { ok: true; config: GrowthPreviewProxyConfig }
  | { ok: false; reason: "disabled" | "not_ready" };

const APPROVED_STAGING_HOST_SHA256 =
  "d714b0a11220a6d0bea75febc75cbd418e3621d7db64f3ceea44d62e3e01ec27";

const FORBIDDEN_SERVER_SECRETS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "GROWTH_PREVIEW_SUPABASE_SECRET_KEY",
  "GROWTH_PREVIEW_SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "POSTGRES_URL",
] as const;

function normalizeHost(value: string | null | undefined) {
  const first = (value ?? "").split(",", 1)[0].trim().toLowerCase();
  if (!first) return "";
  try {
    return new URL(`https://${first}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}
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

export function hashGrowthPreviewHostname(hostname: string) {
  return createHash("sha256").update(hostname.toLowerCase()).digest("hex");
}

function hashesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actualBuffer.length === expectedBuffer.length &&
    actualBuffer.length > 0 &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function isApprovedStagingSupabaseUrl(value: string, approvedHostHash: string) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      (url.pathname !== "" && url.pathname !== "/") ||
      url.search ||
      url.hash ||
      !url.hostname.endsWith(".supabase.co")
    ) {
      return false;
    }
    return hashesMatch(hashGrowthPreviewHostname(url.hostname), approvedHostHash);
  } catch {
    return false;
  }
}

function hasForbiddenServerSecret() {
  return FORBIDDEN_SERVER_SECRETS.some((name) => Boolean(process.env[name]?.trim()));
}

function isExactVercelPreviewRequest(request: NextRequest) {
  const vercelHost = normalizeHost(process.env.VERCEL_URL);
  const requestHost = normalizeHost(request.headers.get("host"));
  const forwardedHost = normalizeHost(request.headers.get("x-forwarded-host") ?? requestHost);
  const nextHost = normalizeHost(request.nextUrl.hostname);
  const productionHost = normalizeHost(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  return (
    process.env.VERCEL === "1" &&
    process.env.VERCEL_ENV === "preview" &&
    process.env.GROWTH_PREVIEW_STAGING_ONLY === "1" &&
    process.env.NEXT_PUBLIC_GROWTH_PREVIEW_ENV === "staging" &&
    process.env.NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV === "0" &&
    vercelHost.endsWith(".vercel.app") &&
    requestHost === vercelHost &&
    forwardedHost === vercelHost &&
    nextHost === vercelHost &&
    (!productionHost || vercelHost !== productionHost)
  );
}

export function readGrowthPreviewProxyConfig(
  request: NextRequest,
  approvedHostHash = APPROVED_STAGING_HOST_SHA256,
): GrowthPreviewProxyConfigResult {
  const localUrl = process.env.GROWTH_PREVIEW_SUPABASE_URL ?? "";
  const localKey = process.env.GROWTH_PREVIEW_SUPABASE_ANON_KEY ?? "";
  if (
    process.env.NODE_ENV === "development" &&
    process.env.GROWTH_PREVIEW_LOCAL_ONLY === "1" &&
    isLocalHostname(request.nextUrl.hostname)
  ) {
    if (!isLocalHttpUrl(localUrl) || !localKey) return { ok: false, reason: "not_ready" };
    return { ok: true, config: { mode: "local", apiUrl: localUrl, anonKey: localKey } };
  }

  if (!isExactVercelPreviewRequest(request) || hasForbiddenServerSecret()) {
    return { ok: false, reason: "disabled" };
  }

  const stagingUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const stagingKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (
    !isApprovedStagingSupabaseUrl(stagingUrl, approvedHostHash) ||
    !stagingKey.startsWith("sb_publishable_")
  ) {
    return { ok: false, reason: "not_ready" };
  }

  return {
    ok: true,
    config: { mode: "staging", apiUrl: stagingUrl.replace(/\/$/, ""), anonKey: stagingKey },
  };
}
