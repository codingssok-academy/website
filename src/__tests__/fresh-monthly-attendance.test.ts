import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(process.cwd(), "supabase", "fresh-start", "004_monthly_attendance.sql"),
    "utf8",
);

describe("fresh monthly attendance", () => {
    it("stores calendar dates and the four existing Growth 2.0 statuses", () => {
        expect(sql).toContain("create table public.student_attendance_records");
        expect(sql).toContain("class_date date not null");
        expect(sql).toContain(
            "status in ('scheduled', 'present', 'absent', 'makeup')",
        );
        expect(sql).toContain("student_attendance_records_session_unique_idx");
    });

    it("lets only scoped students, parents, teachers, and admins read records", () => {
        expect(sql).toContain("create policy student_attendance_records_read_scoped");
        expect(sql).toContain("public.codingssok_can_read_student(student_id)");
        expect(sql).toContain("from public, anon, authenticated");
    });

    it("allows only a managing teacher or admin to write with an audited actor", () => {
        expect(sql).toContain("create policy student_attendance_records_insert_managed");
        expect(sql).toContain("create policy student_attendance_records_update_managed");
        expect(sql).toContain("public.codingssok_can_manage_student(student_id)");
        expect(sql).toContain("created_by = auth.uid()");
        expect(sql).toContain("updated_by = auth.uid()");
        expect(sql).toContain("actor_id is required for server attendance writes");
        expect(sql).toContain("p_actor_id uuid default null");
    });

    it("matches the existing monthly dashboard and teacher save APIs", () => {
        expect(sql).toContain("public.growth_api_monthly_attendance");
        expect(sql).toContain("public.growth_api_teacher_set_attendance");
        expect(sql).toContain("'api_version', '1.0'");
        expect(sql).toContain("'month_start', p_month");
        expect(sql).toContain("'scheduled', count(*) filter");
        expect(sql).toContain("'records', (");
        expect(sql).toContain("'saved', true");
    });

    it("keeps the visible note short and explicitly parent-safe", () => {
        expect(sql).toContain("char_length(note) <= 300");
        expect(sql).toContain("Short parent-safe attendance note");
        expect(sql).toContain("Never store private teacher observations here");
    });

    it("does not grant delete access or expose audit user ids", () => {
        const selectGrant = sql.match(
            /grant select \(([\s\S]*?)\) on public\.student_attendance_records to authenticated;/,
        )?.[1] ?? "";

        expect(selectGrant).not.toContain("created_by");
        expect(selectGrant).not.toContain("updated_by");
        expect(sql).not.toContain(
            "grant delete on public.student_attendance_records to authenticated",
        );
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
