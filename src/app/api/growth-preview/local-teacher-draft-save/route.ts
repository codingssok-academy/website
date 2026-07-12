import { NextRequest } from "next/server";
import {
  localJson,
  readLocalTeacherConfig,
  readTeacherAuthorization,
  safeJson,
  safeProxyError,
} from "../local-teacher-guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UNDERSTANDING = new Set(["needs_help", "understands_basics", "solves_independently", "applies_elsewhere"]);
const PARTICIPATION = new Set(["listened", "asked_questions", "tried_independently", "explained_to_friend"]);
const HOMEWORK = new Set(["not_submitted", "partly_complete", "complete", "extra_challenge"]);
const CONCEPTS = new Set(["for-loop", "condition", "debugging"]);
const ALLOWED_KEYS = new Set([
  "studentId", "weekStart", "understanding", "participation", "homeworkStatus",
  "strength", "improvement", "nextGoal", "conceptKeys", "expectedUpdatedAt",
]);

type DraftBody = {
  studentId?: unknown;
  weekStart?: unknown;
  understanding?: unknown;
  participation?: unknown;
  homeworkStatus?: unknown;
  strength?: unknown;
  improvement?: unknown;
  nextGoal?: unknown;
  conceptKeys?: unknown;
  expectedUpdatedAt?: unknown;
};

function validText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 10 && value.trim().length <= 200;
}

function validMonday(value: string) {
  if (!DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.getUTCDay() === 1;
}

export async function POST(request: NextRequest) {
  const config = readLocalTeacherConfig(request);
  if (!config.ok) return config.error;
  const authorization = readTeacherAuthorization(request);
  if (!authorization) return localJson({ code: "TEACHER_TOKEN_REQUIRED" }, 401);

  const body = (await request.json().catch(() => null)) as DraftBody | null;
  const hasUnknownKey = body
    ? Object.keys(body).some((key) => !ALLOWED_KEYS.has(key))
    : true;
  const concepts = Array.isArray(body?.conceptKeys)
    ? [...new Set(body.conceptKeys.filter((value): value is string => typeof value === "string"))]
    : [];
  const expectedUpdatedAt = body?.expectedUpdatedAt;

  if (
    !body || hasUnknownKey || typeof body.studentId !== "string" || !UUID.test(body.studentId) ||
    typeof body.weekStart !== "string" || !validMonday(body.weekStart) ||
    typeof body.understanding !== "string" || !UNDERSTANDING.has(body.understanding) ||
    typeof body.participation !== "string" || !PARTICIPATION.has(body.participation) ||
    typeof body.homeworkStatus !== "string" || !HOMEWORK.has(body.homeworkStatus) ||
    !validText(body.strength) || !validText(body.improvement) || !validText(body.nextGoal) ||
    concepts.length === 0 || concepts.some((concept) => !CONCEPTS.has(concept)) ||
    !(expectedUpdatedAt === null || (typeof expectedUpdatedAt === "string" && !Number.isNaN(Date.parse(expectedUpdatedAt))))
  ) {
    return localJson(
      { code: "INVALID_DRAFT_INPUT", message: "평가 입력 내용을 다시 확인해 주세요." },
      400,
    );
  }

  try {
    const response = await fetch(
      `${config.apiUrl}/rest/v1/rpc/growth_api_save_teacher_evaluation_draft`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          apikey: config.anonKey,
          authorization,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          p_student_id: body.studentId,
          p_week_start: body.weekStart,
          p_understanding: body.understanding,
          p_participation: body.participation,
          p_homework_status: body.homeworkStatus,
          p_strength: body.strength.trim(),
          p_improvement: body.improvement.trim(),
          p_next_goal: body.nextGoal.trim(),
          p_concept_keys: concepts,
          p_expected_updated_at: expectedUpdatedAt,
        }),
      },
    );
    if (!response.ok) return safeProxyError(response.status);
    return localJson(await safeJson(response));
  } catch {
    return localJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
