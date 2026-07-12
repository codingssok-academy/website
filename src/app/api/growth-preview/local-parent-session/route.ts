import { NextRequest } from "next/server";
import {
  parentLocalJson,
  readLocalParentConfig,
  readSafeParentJson,
} from "../local-parent-guard";

export async function POST(request: NextRequest) {
  const config = readLocalParentConfig(request);
  if (!config.ok) return config.error;

  const email = process.env.GROWTH_PREVIEW_PARENT_EMAIL ?? "";
  const password = process.env.GROWTH_PREVIEW_PARENT_PASSWORD ?? "";
  if (!email || !password) {
    return parentLocalJson({ code: "LOCAL_PREVIEW_NOT_READY" }, 503);
  }

  try {
    const response = await fetch(`${config.apiUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      cache: "no-store",
      headers: { apikey: config.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await readSafeParentJson(response);
    const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
    const expiresIn = typeof body?.expires_in === "number" ? body.expires_in : 3600;
    if (!response.ok || !accessToken) {
      return parentLocalJson({ code: "LOCAL_PARENT_LOGIN_FAILED" }, 401);
    }
    return parentLocalJson({ accessToken, expiresIn });
  } catch {
    return parentLocalJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
