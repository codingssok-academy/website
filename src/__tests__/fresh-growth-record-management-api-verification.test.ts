import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(process.cwd(), "supabase", "fresh-start", "verify_012_growth_record_management_api.sql"),
    "utf8",
);

describe("fresh Growth 2.0 management API verification", () => {
    it("uses generated fake accounts and a fake student only", () => {
        expect(sql).toContain("'student_user'");
        expect(sql).toContain("'parent_user'");
        expect(sql).toContain("'teacher_user'");
        expect(sql).toContain("'other_teacher_user'");
        expect(sql).toContain("Fresh Growth API Fake Student");
        expect(sql).toContain("fresh-growth-api-verify-%s@invalid.local");
    });

    it("checks draft, private-note, publish, and archive behavior", () => {
        expect(sql).toContain("teacher draft/private-note check failed");
        expect(sql).toContain("parent saw draft or teacher-only API rows");
        expect(sql).toContain("parent did not see the published safe record");
        expect(sql).toContain("archived record remained in the teacher list");
    });

    it("checks parent and unassigned-teacher write/read blocking", () => {
        expect(sql).toContain("parent save unexpectedly succeeded");
        expect(sql).toContain("parent private-note read unexpectedly succeeded");
        expect(sql).toContain("unassigned teacher saw a managed record");
    });

    it("rolls back and checks that every fake record is gone", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).toContain("PASS: Growth record management API checks passed and all fake data was rolled back.");
        expect(sql.indexOf("rollback;")).toBeLessThan(sql.indexOf("select case"));
    });
});
