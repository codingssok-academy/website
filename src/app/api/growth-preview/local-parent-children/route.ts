import { NextRequest } from "next/server";
import {
  parentLocalJson,
  readLocalParentConfig,
  readParentAuthorization,
  readSafeParentJson,
  safeParentProxyError,
} from "../local-parent-guard";

export async function POST(request: NextRequest) {
  const config = readLocalParentConfig(request);
  if (!config.ok) return config.error;
  const authorization = readParentAuthorization(request);
  if (!authorization) return parentLocalJson({ code: "PARENT_TOKEN_REQUIRED" }, 401);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (Object.keys(body).length > 0) {
    return parentLocalJson({ code: "INVALID_CHILDREN_REQUEST" }, 400);
  }

  try {
    const response = await fetch(`${config.apiUrl}/rest/v1/rpc/growth_api_parent_children`, {
      method: "POST",
      cache: "no-store",
      headers: {
        apikey: config.anonKey,
        authorization,
        "content-type": "application/json",
      },
      body: "{}",
    });
    if (!response.ok) return safeParentProxyError(response.status);
    return parentLocalJson(await readSafeParentJson(response));
  } catch {
    return parentLocalJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
