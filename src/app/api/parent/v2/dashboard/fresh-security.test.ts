import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createServiceClient: vi.fn(), createServerClient: vi.fn(),
    verifyParentSessionToken: vi.fn(), rateLimit: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createServiceClient }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createServerClient }));
vi.mock("@/lib/parent-session", () => ({
    PARENT_SESSION_COOKIE: "test_parent_session", verifyParentSessionToken: mocks.verifyParentSessionToken,
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/parent-session-access", () => ({ canParentSessionReadStudent: vi.fn(async () => true) }));

type Result = { data: unknown; error: unknown };
function makeBuilder(data: unknown, error: unknown = null) {
    const result: Result = { data, error };
    const builder = {
        select: vi.fn(), eq: vi.fn(), neq: vi.fn(), in: vi.fn(), gte: vi.fn(), lte: vi.fn(),
        order: vi.fn(), limit: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(),
        then: (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject),
    };
    for (const method of [builder.select, builder.eq, builder.neq, builder.in, builder.gte,
        builder.lte, builder.order, builder.limit]) method.mockReturnValue(builder);
    builder.single.mockResolvedValue(result);
    builder.maybeSingle.mockResolvedValue({ data: Array.isArray(data) ? data[0] ?? null : data, error });
    return builder;
}

const student = { id: "student-1", name: "가짜학생", auth_user_id: "auth-1", school: "가짜초", grade: "1학년", class: "공통기초반", status: "active" };
const growth = {
    id: "growth-current", class_snapshot: "가짜 공통기초반", learned_concepts: "가짜 반복문",
    strengths: "가짜 강점", next_goal: "가짜 다음 목표", lesson_summary: "가짜 수업 요약",
    parent_message: "가짜 학부모 메시지", status: "published", published_at: "2026-09-04T01:00:00.000Z",
};

function fixture(overrides: Record<string, unknown> = {}, errors: Record<string, unknown> = {}) {
    const rows: Record<string, unknown> = {
        students: [student],
        profiles: [{ id: "auth-1", display_name: "가짜학생", total_xp: 430, level: 3, role: "student" }],
        user_progress: { xp: 430, level: 3 },
        xp_history: [{ xp_amount: 30, action_type: "lesson_view", created_at: "2026-09-04T00:00:00Z" }],
        student_growth_records: [growth, { ...growth, id: "growth-old", learned_concepts: "가짜 조건문" }],
        student_attendance_records: [{ id: "attendance-1", class_date: "2026-09-05", lesson_title: "가짜 보강", status: "makeup" }],
        ...overrides,
    };
    const queries = new Map<string, ReturnType<typeof makeBuilder>[]>();
    const from = vi.fn((table: string) => {
        const builder = makeBuilder(rows[table] ?? [], errors[table] ?? null);
        queries.set(table, [...(queries.get(table) || []), builder]);
        return builder;
    });
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    mocks.createServiceClient.mockReturnValue({ from, rpc });
    return { from, rpc, queries };
}

async function request(name = "가짜학생") {
    const { GET } = await import("./route");
    return GET(new NextRequest(`https://preview.invalid/api/parent/v2/dashboard?name=${encodeURIComponent(name)}`, {
        headers: { cookie: "test_parent_session=signed-fake-session" },
    }));
}

describe("fresh parent dashboard safety", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fresh-test.invalid");
        vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-unit-test-key");
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "hashed");
        mocks.verifyParentSessionToken.mockReturnValue({ studentId: "student-1", studentNames: ["가짜학생"], parentName: "가짜학생" });
        mocks.rateLimit.mockResolvedValue({ success: true });
        mocks.createServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } });
    });
    afterEach(() => vi.unstubAllEnvs());

    it("loads the signed child's published growth, monthly attendance and lifetime XP", async () => {
        const { queries, from, rpc } = fixture();
        const response = await request();
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
        expect(body.growth.current.classProgress).toBe("가짜 반복문");
        expect(body.growth.history).toEqual([expect.objectContaining({ id: "growth-old" })]);
        expect(body.attendance.summary).toEqual({ scheduled: 0, present: 0, absent: 0, makeup: 1, upcoming: 0, completed: 1 });
        expect(body.student.totalXp).toBe(430);
        expect(body.xp.total).toBe(430);
        expect(body.student.level).toBe(3);
        expect(queries.get("students")?.[0].in).toHaveBeenCalledWith("id", ["student-1"]);
        expect(queries.get("profiles")?.[0].eq).toHaveBeenCalledWith("id", "auth-1");
        expect(queries.get("profiles")?.[0].select).not.toHaveBeenCalledWith(expect.stringContaining("avatar_url"));
        expect(queries.get("student_activity_log")?.[0].eq).toHaveBeenCalledWith("user_id", "auth-1");
        expect(queries.get("announcements")?.[0].eq).toHaveBeenCalledWith("status", "published");
        for (const table of ["student_growth_records", "student_files", "student_attendance_records"]) {
            for (const builder of queries.get(table) || []) expect(builder.eq).toHaveBeenCalledWith("student_id", "student-1");
        }
        for (const builder of queries.get("student_growth_records") || []) {
            expect(builder.eq).toHaveBeenCalledWith("status", "published");
            expect(builder.select).not.toHaveBeenCalledWith(expect.stringContaining("internal"));
        }
        expect(queries.get("student_files")?.[0].eq).toHaveBeenCalledWith("visibility", "student_parent");
        expect(queries.get("student_attendance_records")?.[0].select).toHaveBeenCalledWith("id,class_date,lesson_title,status");
        for (const table of ["student_growth_management", "student_growth_entries", "code_submissions", "study_notes"]) expect(from).not.toHaveBeenCalledWith(table);
        expect(rpc).not.toHaveBeenCalled();
    });

    it("does not mix records of another student with the same name", async () => {
        const { queries } = fixture({ students: [{ ...student, id: "namesake", auth_user_id: "other-auth" }, student] });
        expect((await request()).status).toBe(200);
        expect(queries.get("profiles")?.[0].eq).toHaveBeenCalledWith("id", "auth-1");
        expect(queries.get("profiles")?.[0].eq).not.toHaveBeenCalledWith("id", "other-auth");
    });

    it("rejects another child's requested name before reading their data", async () => {
        const { from } = fixture();
        expect((await request("다른학생")).status).toBe(403);
        expect(from).not.toHaveBeenCalled();
        expect(mocks.createServerClient).not.toHaveBeenCalled();
    });

    it.each(["pending", "deactivated"])("rejects a %s child", async (status) => {
        const { from } = fixture({ students: [{ ...student, status }] });
        expect((await request()).status).toBe(403);
        expect(from).not.toHaveBeenCalledWith("student_growth_records");
    });

    it("denies ambiguous signed namesakes rather than picking the first", async () => {
        mocks.verifyParentSessionToken.mockReturnValue({ studentId: "student-1", studentIds: ["student-2"], studentNames: ["가짜학생"] });
        fixture({ students: [student, { ...student, id: "student-2" }] });
        expect((await request()).status).toBe(403);
    });

    it("denies invalid or expired sessions without a staff login", async () => {
        mocks.verifyParentSessionToken.mockReturnValue(null);
        const { from } = fixture();
        expect((await request()).status).toBe(403);
        expect(from).not.toHaveBeenCalled();
    });

    it("does not cache an authorized response after the child is deactivated", async () => {
        fixture();
        expect((await request()).status).toBe(200);
        fixture({ students: [{ ...student, status: "deactivated" }] });
        expect((await request()).status).toBe(403);
    });

    it("supports a child without a login account without name-based activity lookup", async () => {
        const { from } = fixture({ students: [{ ...student, auth_user_id: null }], student_growth_records: [] });
        const response = await request();
        const body = await response.json();
        expect(response.status).toBe(200);
        expect(body.student.level).toBe(1);
        expect(body.student.totalXp).toBe(0);
        expect(from).not.toHaveBeenCalledWith("profiles");
        expect(from).not.toHaveBeenCalledWith("student_activity_log");
    });

    it("treats missing initial progress as zero rather than a query failure", async () => {
        fixture({ user_progress: [], profiles: [{ id: "auth-1", display_name: "가짜학생", total_xp: 0, level: 1 }] });
        const response = await request();
        expect(response.status).toBe(200);
        expect((await response.json()).student.totalXp).toBe(0);
    });

    it.each(["students", "profiles", "student_attendance_records", "student_growth_records", "announcements"])("fails safely for %s errors, not an empty success", async (table) => {
        fixture({}, { [table]: { message: "private database detail", code: "42501" } });
        const response = await request();
        expect(response.status).toBe(503);
        expect(JSON.stringify(await response.json())).not.toMatch(/private database detail|stack|serviceKey/);
    });

    it.each(["pending", "deactivated"])("denies %s staff preview", async (approval_status) => {
        mocks.verifyParentSessionToken.mockReturnValue(null);
        const { from } = fixture();
        mocks.createServerClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "teacher-1" } }, error: null }) },
            from: vi.fn(() => makeBuilder({ role: "teacher", approval_status })),
        });
        expect((await request()).status).toBe(403);
        expect(from).not.toHaveBeenCalled();
    });

    it("uses staff RLS, denying an unassigned teacher", async () => {
        mocks.verifyParentSessionToken.mockReturnValue(null);
        const { from } = fixture();
        const staffFrom = vi.fn((table: string) => makeBuilder(table === "profiles" ? { role: "teacher", approval_status: "approved" } : []));
        mocks.createServerClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "teacher-1" } }, error: null }) }, from: staffFrom });
        expect((await request()).status).toBe(403);
        expect(staffFrom).toHaveBeenCalledWith("students");
        expect(from).not.toHaveBeenCalled();
    });

    it.each(["teacher", "admin"])("allows an approved %s only after their scoped student lookup", async (role) => {
        mocks.verifyParentSessionToken.mockReturnValue(null);
        const { queries } = fixture();
        const staffStudent = makeBuilder([student]);
        mocks.createServerClient.mockResolvedValue({
            auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "staff-1" } }, error: null }) },
            from: vi.fn((table: string) => table === "profiles" ? makeBuilder({ role, approval_status: "approved" }) : staffStudent),
        });
        expect((await request()).status).toBe(200);
        expect(staffStudent.eq).toHaveBeenCalledWith("name", "가짜학생");
        expect(queries.get("student_growth_records")?.[0].eq).toHaveBeenCalledWith("student_id", "student-1");
    });

    it("preserves the legacy RPC and tables when fresh mode is disabled", async () => {
        vi.stubEnv("SUPABASE_ACCESS_CODE_MODE", "legacy");
        const { from, rpc } = fixture();
        expect((await request()).status).toBe(200);
        expect(rpc).toHaveBeenCalledWith("growth_api_monthly_attendance", expect.objectContaining({ p_student_id: "student-1" }));
        expect(from).toHaveBeenCalledWith("student_growth_management");
        expect(from).not.toHaveBeenCalledWith("student_attendance_records");
    });

    it("matches monthly DB totals including leap-year boundaries", async () => {
        const { queries } = fixture({ student_attendance_records: ["scheduled", "present", "absent", "makeup"].map((status, index) => ({ id: `fake-${index}`, status, class_date: "2028-02-29", lesson_title: "가짜 수업" })) });
        const { readFreshParentAttendance } = await import("@/features/growth-v2/parent/fresh-dashboard");
        const result = await readFreshParentAttendance(mocks.createServiceClient(), student, "2028-02");
        expect(result.data?.data.summary).toEqual({ scheduled: 3, present: 1, absent: 1, upcoming: 1, makeup: 1, completed: 2 });
        expect(queries.get("student_attendance_records")?.[0].gte).toHaveBeenCalledWith("class_date", "2028-02-01");
        expect(queries.get("student_attendance_records")?.[0].lte).toHaveBeenCalledWith("class_date", "2028-02-29");
    });
});
