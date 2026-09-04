import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_009_student_files.sql",
    ),
    "utf8",
);

describe("fresh student files database verification", () => {
    it("runs fake checks inside a rolled-back transaction without uploading a file", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).not.toMatch(/insert\s+into\s+storage\.objects/i);
        expect(sql).toContain(
            "PASS: Student file role checks passed and all fake metadata was rolled back.",
        );
    });

    it("checks the private bucket and scoped storage policy", () => {
        expect(sql).toContain("where b.id = 'student-files'");
        expect(sql).toContain("v_file_size_limit <> 52428800");
        expect(sql).toContain("'application/octet-stream' = any(v_allowed_mime_types)");
        expect(sql).toContain("student_files_storage_read_scoped");
        expect(sql).toContain("private bucket settings failed");
    });

    it("checks canonical ownership and rejects invalid metadata", () => {
        expect(sql).toContain("student-file owner or uploader-role normalization failed");
        expect(sql).toContain("assigned teacher uploader-role normalization failed");
        expect(sql).toContain("unassigned teacher file insert unexpectedly succeeded");
        expect(sql).toContain("mismatched student storage path unexpectedly succeeded");
        expect(sql).toContain("oversized student file metadata unexpectedly succeeded");
        expect(sql).toContain("unsafe original filename unexpectedly succeeded");
    });

    it("checks that clients cannot see paths or directly change metadata", () => {
        expect(sql).toContain("student internal storage-path read unexpectedly succeeded");
        expect(sql).toContain("direct student file insert unexpectedly succeeded");
        expect(sql).toContain("direct student file update unexpectedly succeeded");
        expect(sql).toContain("direct student file delete unexpectedly succeeded");
    });

    it("checks parent-safe and staff-only visibility for every role", () => {
        expect(sql).toContain("student file visibility failed");
        expect(sql).toContain("other student file visibility failed");
        expect(sql).toContain("linked parent file visibility failed");
        expect(sql).toContain("assigned teacher file visibility failed");
        expect(sql).toContain("unassigned teacher file read unexpectedly succeeded");
        expect(sql).toContain("pending account file read unexpectedly succeeded");
        expect(sql).toContain("admin file visibility failed");
        expect(sql).toContain("anonymous file metadata read unexpectedly succeeded");
    });

    it("uses generated fake identifiers and no personal data", () => {
        expect(sql).toContain("extensions.gen_random_uuid()");
        expect(sql).toContain("@invalid.local");
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
    });
});
