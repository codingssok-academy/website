import { NextRequest, NextResponse } from "next/server";
import { readGrowthPreviewProxyConfig } from "../preview-server-guard";

const NO_STORE_HEADERS = { "cache-control": "no-store" };
const ACCOUNTS = {
  "student-a": {
    emailEnv: "GROWTH_PREVIEW_STUDENT_A_EMAIL",
    passwordEnv: "GROWTH_PREVIEW_STUDENT_A_PASSWORD",
    expectedEmail: "student-a-staging@example.test",
  },
  "student-b": {
    emailEnv: "GROWTH_PREVIEW_STUDENT_B_EMAIL",
    passwordEnv: "GROWTH_PREVIEW_STUDENT_B_PASSWORD",
    expectedEmail: "student-b-staging@example.test",
  },
  parent: {
    emailEnv: "GROWTH_PREVIEW_PARENT_EMAIL",
    passwordEnv: "GROWTH_PREVIEW_PARENT_PASSWORD",
    expectedEmail: "parent-staging@example.test",
  },
  teacher: {
    emailEnv: "GROWTH_PREVIEW_TEACHER_EMAIL",
    passwordEnv: "GROWTH_PREVIEW_TEACHER_PASSWORD",
    expectedEmail: "teacher-staging@example.test",
  },
} as const;

type RoleCode = keyof typeof ACCOUNTS;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
  const configResult = readGrowthPreviewProxyConfig(request);
  if (!configResult.ok) {
    return json(
      { code: configResult.reason === "not_ready" ? "STAGING_PREVIEW_NOT_READY" : "STAGING_PREVIEW_DISABLED" },
      configResult.reason === "not_ready" ? 503 : 404,
    );
  }
  if (configResult.config.mode !== "staging") {
    return json({ code: "STAGING_PREVIEW_DISABLED" }, 404);
  }

  const body = (await request.json().catch(() => null)) as { roleCode?: unknown } | null;
  if (
    !body ||
    Object.keys(body).length !== 1 ||
    typeof body.roleCode !== "string" ||
    !(body.roleCode in ACCOUNTS)
  ) {
    return json({ code: "INVALID_ROLE_CODE" }, 400);
  }

  const account = ACCOUNTS[body.roleCode as RoleCode];
  const email = process.env[account.emailEnv] ?? "";
  const password = process.env[account.passwordEnv] ?? "";
  if (email !== account.expectedEmail || !password) {
    return json({ code: "STAGING_PREVIEW_NOT_READY" }, 503);
  }

  try {
    const response = await fetch(
      `${configResult.config.apiUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          apikey: configResult.config.anonKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      },
    );
    const result = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const accessToken = typeof result?.access_token === "string" ? result.access_token : "";
    const expiresIn = typeof result?.expires_in === "number" ? result.expires_in : 3600;
    if (!response.ok || !accessToken) return json({ code: "STAGING_LOGIN_FAILED" }, 401);
    return json({ accessToken, expiresIn });
  } catch {
    return json({ code: "STAGING_BACKEND_UNAVAILABLE" }, 503);
  }
}
