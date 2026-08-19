import { NextRequest } from "next/server";
import type { GrowthAttendanceStatus } from "@/features/growth-v2/attendance/types";
import {
  localJson,
  readLocalTeacherConfig,
  readTeacherAuthorization,
  safeJson,
  safeProxyError,
} from "../local-teacher-guard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = new Set<GrowthAttendanceStatus>(["scheduled", "present", "absent", "makeup"]);
const ALLOWED_KEYS = new Set([
  "studentId",
  "recordId",
  "classDate",
  "status",
  "lessonTitle",
  "note",
]);

export async function POST(request: NextRequest) {
  const config = readLocalTeacherConfig(request);
  if (!config.ok) return config.error;
  const authorization = readTeacherAuthorization(request);
  if (!authorization) return localJson({ code: "TEACHER_TOKEN_REQUIRED" }, 401);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.lessonTitle === "string" ? body.lessonTitle.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (
    !body ||
    Object.keys(body).some((key) => !ALLOWED_KEYS.has(key)) ||
    typeof body.studentId !== "string" ||
    !UUID.test(body.studentId) ||
    !(body.recordId === null || (typeof body.recordId === "string" && UUID.test(body.recordId))) ||
    typeof body.classDate !== "string" ||
    !DATE.test(body.classDate) ||
    typeof body.status !== "string" ||
    !STATUSES.has(body.status as GrowthAttendanceStatus) ||
    title.length < 1 ||
    title.length > 120 ||
    note.length > 300
  ) {
    return localJson({ code: "INVALID_ATTENDANCE_SAVE" }, 400);
  }

  try {
    const response = await fetch(
      `${config.apiUrl}/rest/v1/rpc/growth_api_teacher_set_attendance`,
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
          p_record_id: body.recordId,
          p_class_date: body.classDate,
          p_status: body.status,
          p_lesson_title: title,
          p_note: note || null,
        }),
      },
    );
    if (!response.ok) return safeProxyError(response.status);
    return localJson(await safeJson(response));
  } catch {
    return localJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
