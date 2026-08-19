import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as readMonth } from "./local-attendance-month/route";
import { POST as saveAttendance } from "./local-teacher-attendance-save/route";

const TOKEN = "attendance-access-token-long-enough";
const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const RECORD_ID = "22222222-2222-4222-8222-222222222222";

function request(path: string, body: Record<string, unknown>, token = TOKEN, host = "127.0.0.1:3018") {
  return new NextRequest(`http://${host}/api/growth-preview/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("monthly attendance API routes", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GROWTH_PREVIEW_LOCAL_ONLY", "1");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("GROWTH_PREVIEW_SUPABASE_ANON_KEY", "local-anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("reads one student's calendar month with only the user token", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ api_version: "1.0", data: { records: [] } }), { status: 200 }),
    );
    const response = await readMonth(request("local-attendance-month", {
      studentId: STUDENT_ID,
      month: "2026-08",
    }));

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:54321/rest/v1/rpc/growth_api_monthly_attendance",
      expect.objectContaining({
        body: JSON.stringify({ p_student_id: STUDENT_ID, p_month: "2026-08-01" }),
        headers: {
          apikey: "local-anon-key",
          authorization: `Bearer ${TOKEN}`,
          "content-type": "application/json",
        },
      }),
    );
    expect(JSON.stringify(fetchSpy.mock.calls)).not.toMatch(/service_role|parent_id|teacher_id/);
  });

  it("saves only approved attendance fields through the teacher RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ saved: true, record: { id: RECORD_ID } }), { status: 200 }),
    );
    const response = await saveAttendance(request("local-teacher-attendance-save", {
      studentId: STUDENT_ID,
      recordId: RECORD_ID,
      classDate: "2026-08-06",
      status: "present",
      lessonTitle: "  프로젝트반 정규 수업  ",
      note: "  정상 출석  ",
    }));
    const sent = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));

    expect(response.status).toBe(200);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      "http://127.0.0.1:54321/rest/v1/rpc/growth_api_teacher_set_attendance",
    );
    expect(sent).toEqual({
      p_student_id: STUDENT_ID,
      p_record_id: RECORD_ID,
      p_class_date: "2026-08-06",
      p_status: "present",
      p_lesson_title: "프로젝트반 정규 수업",
      p_note: "정상 출석",
    });
    expect(JSON.stringify(sent)).not.toMatch(/teacher_id|role|created_by|updated_by/);
  });

  it("rejects hidden identity fields, invalid months, dates, status, text, and missing tokens", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const month = { studentId: STUDENT_ID, month: "2026-08" };
    const save = {
      studentId: STUDENT_ID,
      recordId: null,
      classDate: "2026-08-06",
      status: "present",
      lessonTitle: "정규 수업",
      note: "",
    };

    expect((await readMonth(request("local-attendance-month", { ...month, parent_id: "hidden" }))).status).toBe(400);
    expect((await readMonth(request("local-attendance-month", { ...month, month: "2026-13" }))).status).toBe(400);
    expect((await readMonth(request("local-attendance-month", month, ""))).status).toBe(401);
    expect((await saveAttendance(request("local-teacher-attendance-save", { ...save, teacher_id: "hidden" }))).status).toBe(400);
    expect((await saveAttendance(request("local-teacher-attendance-save", { ...save, classDate: "06-08-2026" }))).status).toBe(400);
    expect((await saveAttendance(request("local-teacher-attendance-save", { ...save, status: "late" }))).status).toBe(400);
    expect((await saveAttendance(request("local-teacher-attendance-save", { ...save, lessonTitle: "" }))).status).toBe(400);
    expect((await saveAttendance(request("local-teacher-attendance-save", save, ""))).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("hides backend details and keeps the preview routes outside production", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "private SQL policy detail" }), { status: 403 }),
    );
    const denied = await saveAttendance(request("local-teacher-attendance-save", {
      studentId: STUDENT_ID,
      recordId: null,
      classDate: "2026-08-06",
      status: "present",
      lessonTitle: "정규 수업",
      note: "",
    }));
    expect(await denied.json()).toEqual({ code: "TEACHER_ACCESS_DENIED" });

    vi.stubEnv("NODE_ENV", "production");
    expect((await readMonth(request("local-attendance-month", {
      studentId: STUDENT_ID,
      month: "2026-08",
    }))).status).toBe(404);
  });
});
