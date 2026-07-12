import { NextRequest } from "next/server";
import {
  localJson,
  readLocalTeacherConfig,
  readTeacherAuthorization,
  safeJson,
  safeProxyError,
} from "../local-teacher-guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_KEYS = new Set(["evaluationId", "expectedUpdatedAt"]);

type PublishBody = {
  evaluationId?: unknown;
  expectedUpdatedAt?: unknown;
};

export async function POST(request: NextRequest) {
  const config = readLocalTeacherConfig(request);
  if (!config.ok) return config.error;
  const authorization = readTeacherAuthorization(request);
  if (!authorization) return localJson({ code: "TEACHER_TOKEN_REQUIRED" }, 401);

  const body = (await request.json().catch(() => null)) as PublishBody | null;
  if (
    !body ||
    Object.keys(body).some((key) => !ALLOWED_KEYS.has(key)) ||
    typeof body.evaluationId !== "string" ||
    !UUID.test(body.evaluationId) ||
    typeof body.expectedUpdatedAt !== "string" ||
    Number.isNaN(Date.parse(body.expectedUpdatedAt))
  ) {
    return localJson(
      { code: "INVALID_PUBLISH_INPUT", message: "공개할 평가 초안을 다시 확인해 주세요." },
      400,
    );
  }

  try {
    const response = await fetch(
      `${config.apiUrl}/rest/v1/rpc/growth_api_publish_teacher_evaluation`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          apikey: config.anonKey,
          authorization,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          p_evaluation_id: body.evaluationId,
          p_expected_updated_at: body.expectedUpdatedAt,
        }),
      },
    );
    if (!response.ok) return safeProxyError(response.status);
    return localJson(await safeJson(response));
  } catch {
    return localJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
