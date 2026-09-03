import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(process.cwd(), "supabase", "fresh-start", "003_growth_records.sql"),
    "utf8",
);

describe("fresh Growth 2.0 records", () => {
    it("creates a monthly public record and a separate private teacher note", () => {
        expect(sql).toContain("create table public.student_growth_records");
        expect(sql).toContain("create table private.student_growth_internal_notes");
        expect(sql).toContain("extract(day from period_month) = 1");
        expect(sql).toContain("student_growth_records_one_draft_per_month_idx");

        const publicRecord = sql.match(
            /create table public\.student_growth_records \(([\s\S]*?)\n\);/,
        )?.[1] ?? "";

        expect(publicRecord).toContain("learned_concepts text");
        expect(publicRecord).toContain("parent_message text");
        expect(publicRecord).not.toContain("teacher_note");
    });

    it("shows students and linked parents only published parent-safe records", () => {
        expect(sql).toContain("create policy student_growth_records_read_scoped");
        expect(sql).toContain("public.codingssok_can_manage_student(student_id)");
        expect(sql).toContain("status = 'published'");
        expect(sql).toContain("public.codingssok_can_read_student(student_id)");
    });

    it("allows assigned teachers and admins to create and update managed records", () => {
        expect(sql).toContain("create policy student_growth_records_insert_managed");
        expect(sql).toContain("create policy student_growth_records_update_managed");
        expect(sql).toContain("created_by = auth.uid()");
        expect(sql).toContain("updated_by = auth.uid()");
        expect(sql).toContain("grant insert (");
        expect(sql).toContain("grant update (");
    });

    it("keeps audit identities and internal notes away from ordinary clients", () => {
        const authenticatedSelectGrant = sql.match(
            /grant select \(([\s\S]*?)\) on public\.student_growth_records to authenticated;/,
        )?.[1] ?? "";

        expect(authenticatedSelectGrant).not.toContain("created_by");
        expect(authenticatedSelectGrant).not.toContain("updated_by");
        expect(sql).toContain(
            "revoke all on private.student_growth_internal_notes from public, anon, authenticated",
        );
        expect(sql).toContain(
            "grant all on private.student_growth_internal_notes to service_role",
        );
        expect(sql).not.toContain(
            "grant select on private.student_growth_internal_notes to authenticated",
        );
    });

    it("publishes and archives records with database-managed timestamps", () => {
        expect(sql).toContain("private.set_growth_record_status_timestamps");
        expect(sql).toContain("new.published_at = now()");
        expect(sql).toContain("new.archived_at = now()");
        expect(sql).toContain("status in ('draft', 'published', 'archived')");
    });

    it("contains no seed users or personal records and is transaction wrapped", () => {
        expect(sql).not.toMatch(/insert\s+into\s+(auth\.users|public\.students)/i);
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
