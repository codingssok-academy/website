import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(process.cwd(), "supabase", "fresh-start", "012_growth_record_management_api.sql"),
    "utf8",
);

describe("fresh Growth 2.0 teacher management API", () => {
    it("keeps internal fields in the private note table", () => {
        expect(sql).toContain("alter table private.student_growth_internal_notes");
        expect(sql).toContain("add column teacher_memo text not null default ''");
        expect(sql).toContain("add column entry_note text not null default ''");
        expect(sql).toContain("add column next_class_potential text not null default ''");
        expect(sql).not.toMatch(/alter\s+table\s+public\.student_growth_records[\s\S]*teacher_memo/i);
    });

    it("limits every management function to an approved assigned teacher or admin", () => {
        expect(sql).toContain("public.codingssok_is_teacher_or_admin()");
        expect(sql).toContain("public.codingssok_can_manage_student(p_student_id)");
        expect(sql).toContain("public.codingssok_can_manage_student(record.student_id)");
        expect(sql).toContain("security definer");
        expect(sql).toContain("set search_path = ''");
        expect(sql).toMatch(/revoke all on function public\.growth_api_teacher_list_records\(\)[\s\S]*from public, anon;/i);
    });

    it("saves the public record and private note atomically", () => {
        expect(sql).toContain("create or replace function public.growth_api_teacher_save_record");
        expect(sql).toContain("insert into public.student_growth_records");
        expect(sql).toContain("insert into private.student_growth_internal_notes");
        expect(sql).toContain("on conflict (record_id) do update");
        expect(sql).toContain("return v_record_id");
    });

    it("never changes a published record back into an automatic draft", () => {
        expect(sql).toContain("v_record_status <> 'draft' and p_status = 'draft'");
        expect(sql).toContain("record.status = 'draft'");
        expect(sql).toContain("record.period_month = p_period_month");
        expect(sql).toContain("a draft already exists for this month");
    });

    it("archives instead of permanently deleting records", () => {
        expect(sql).toContain("create or replace function public.growth_api_teacher_archive_records");
        expect(sql).toContain("set status = 'archived'");
        expect(sql).not.toMatch(/delete\s+from\s+public\.student_growth_records/i);
    });

    it("contains no student seed data and is transaction wrapped", () => {
        expect(sql).not.toMatch(/insert\s+into\s+(auth\.users|public\.students)/i);
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
