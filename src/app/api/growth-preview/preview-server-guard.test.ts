import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hashGrowthPreviewHostname,
  readGrowthPreviewProxyConfig,
} from "./preview-server-guard";

const PREVIEW_HOST = "growth-preview-test.vercel.app";
const STAGING_SUPABASE_HOST = "growth-preview-test.supabase.co";

function request(host = PREVIEW_HOST) {
  return new NextRequest(`https://${host}/api/growth-preview/test`, {
    method: "POST",
    headers: { host, "x-forwarded-host": host },
  });
}

function enableStaging() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("VERCEL_URL", PREVIEW_HOST);
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "growth-production.vercel.app");
  vi.stubEnv("GROWTH_PREVIEW_STAGING_ONLY", "1");
  vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_ENV", "staging");
  vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV", "0");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `https://${STAGING_SUPABASE_HOST}`);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test-only-value");
}

describe("Growth Preview server guard", () => {
  beforeEach(() => {
    for (const name of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SECRET_KEY",
      "GROWTH_PREVIEW_SUPABASE_SECRET_KEY",
      "GROWTH_PREVIEW_SUPABASE_SERVICE_ROLE_KEY",
      "DATABASE_URL",
      "POSTGRES_URL",
    ]) {
      vi.stubEnv(name, "");
    }
  });

  afterEach(() => vi.unstubAllEnvs());

  it("allows only the exact Vercel Preview host and approved staging Supabase host", () => {
    enableStaging();
    const result = readGrowthPreviewProxyConfig(
      request(),
      hashGrowthPreviewHostname(STAGING_SUPABASE_HOST),
    );
    expect(result).toEqual({
      ok: true,
      config: {
        mode: "staging",
        apiUrl: `https://${STAGING_SUPABASE_HOST}`,
        anonKey: "sb_publishable_test-only-value",
      },
    });
  });

  it("blocks production, aliases, arbitrary Supabase projects, demo navigation, and secret keys", () => {
    enableStaging();
    const approvedHash = hashGrowthPreviewHostname(STAGING_SUPABASE_HOST);

    vi.stubEnv("VERCEL_ENV", "production");
    expect(readGrowthPreviewProxyConfig(request(), approvedHash)).toMatchObject({ ok: false });
    vi.stubEnv("VERCEL_ENV", "preview");

    expect(readGrowthPreviewProxyConfig(request("other-preview.vercel.app"), approvedHash)).toMatchObject({
      ok: false,
      reason: "disabled",
    });

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://different-project.supabase.co");
    expect(readGrowthPreviewProxyConfig(request(), approvedHash)).toMatchObject({
      ok: false,
      reason: "not_ready",
    });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `https://${STAGING_SUPABASE_HOST}`);

    vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV", "1");
    expect(readGrowthPreviewProxyConfig(request(), approvedHash)).toMatchObject({ ok: false });
    vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV", "0");

    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "forbidden-test-placeholder");
    expect(readGrowthPreviewProxyConfig(request(), approvedHash)).toMatchObject({
      ok: false,
      reason: "disabled",
    });
  });

  it("keeps the existing local-only development path", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GROWTH_PREVIEW_LOCAL_ONLY", "1");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_ANON_KEY", "local-test-key");
    const localRequest = new NextRequest("http://127.0.0.1:3010/api/growth-preview/test");
    expect(readGrowthPreviewProxyConfig(localRequest)).toEqual({
      ok: true,
      config: {
        mode: "local",
        apiUrl: "http://127.0.0.1:54321",
        anonKey: "local-test-key",
      },
    });
  });
});
