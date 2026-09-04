import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "008_student_activity_log.sql",
    ),
    "utf8",
);

describe("fresh student activity log", () => {
    it("provides the fields used by the current learning and parent screens", () => {
        expect(sql).toContain("create table public.student_activity_log");
        expect(sql).toContain("user_id uuid not null references public.profiles(id)");
        expect(sql).toContain("student_name text not null");
        expect(sql).toContain("event_type text not null default 'page_view'");
        expect(sql).toContain("course_id text check");
        expect(sql).toContain("course_title text check");
        expect(sql).toContain("unit_id text check");
        expect(sql).toContain("unit_title text check");
        expect(sql).toContain("page_id text check");
        expect(sql).toContain("page_title text check");
        expect(sql).toContain("page_url text check");
        expect(sql).toContain("duration_seconds integer check");
    });

    it("replaces browser-supplied identity and timing with database values", () => {
        expect(sql).toContain("create or replace function private.prepare_student_activity_log()");
        expect(sql).toContain("new.student_name := v_student_name");
        expect(sql).toContain("new.started_at := now()");
        expect(sql).toContain("new.ended_at := null");
        expect(sql).toContain("new.duration_seconds := null");
        expect(sql).toContain("create trigger student_activity_log_prepare");
    });

    it("derives a bounded duration when a learning visit ends", () => {
        expect(sql).toContain("create or replace function private.finalize_student_activity_log()");
        expect(sql).toContain("v_finished_at := greatest(old.started_at, now())");
        expect(sql).toContain("floor(extract(epoch from (v_finished_at - old.started_at)))::integer");
        expect(sql).toContain("86400");
        expect(sql).toContain("create trigger student_activity_log_finalize");
    });

    it("allows active students to write only their own visits", () => {
        expect(sql).toContain("create policy student_activity_log_insert_self");
        expect(sql).toContain("create policy student_activity_log_update_self");
        expect(sql).toContain("public.codingssok_is_active_student_user(user_id)");
        expect(sql).toContain("grant update (\n    ended_at,\n    duration_seconds");
        expect(sql).toMatch(
            /grant insert \([\s\S]*?student_name,[\s\S]*?course_id,[\s\S]*?\) on public\.student_activity_log to authenticated/,
        );
        expect(sql).not.toMatch(
            /grant insert \([\s\S]*?event_type[\s\S]*?\) on public\.student_activity_log to authenticated/,
        );
        expect(sql).not.toMatch(/grant\s+delete[\s\S]*student_activity_log\s+to\s+authenticated/i);
    });

    it("limits reads to the student and linked parent, teacher, or admin", () => {
        expect(sql).toContain("alter table public.student_activity_log enable row level security");
        expect(sql).toContain("create policy student_activity_log_read_scoped");
        expect(sql).toContain("public.codingssok_can_read_student_user(user_id)");
        expect(sql).toContain("revoke all on public.student_activity_log from public, anon, authenticated");
        expect(sql).not.toMatch(/grant\s+select[\s\S]*student_activity_log\s+to\s+anon/i);
    });

    it("keeps service-only access and private trigger functions explicit", () => {
        expect(sql).toContain("grant all on public.student_activity_log to service_role");
        expect(sql).toContain("revoke all on function private.prepare_student_activity_log()");
        expect(sql).toContain("revoke all on function private.finalize_student_activity_log()");
    });

    it("contains no seed records or personal identifiers and is transactional", () => {
        expect(sql).not.toMatch(/insert\s+into\s+(auth\.users|public\.students)/i);
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
