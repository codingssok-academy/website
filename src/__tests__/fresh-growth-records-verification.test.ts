import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_003_growth_records.sql",
    ),
    "utf8",
);

describe("fresh Growth 2.0 database verification", () => {
    it("runs every fake record check inside a rolled-back transaction", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).toContain(
            "PASS: Growth 2.0 role checks passed and all fake data was rolled back.",
        );
    });

    it("checks student, parent, assigned teacher, other teacher, admin, and anon", () => {
        expect(sql).toContain("student visibility failed");
        expect(sql).toContain("parent visibility failed");
        expect(sql).toContain("teacher scope failed");
        expect(sql).toContain("unassigned teacher read failed");
        expect(sql).toContain("admin visibility failed");
        expect(sql).toContain("anonymous read unexpectedly succeeded");
    });

    it("checks blocked writes, hidden audit identities, and private notes", () => {
        expect(sql).toContain("student update unexpectedly succeeded");
        expect(sql).toContain("parent insert unexpectedly succeeded");
        expect(sql).toContain("unassigned teacher insert unexpectedly succeeded");
        expect(sql).toContain(
            "authenticated audit-column read unexpectedly succeeded",
        );
        expect(sql).toContain("private note read unexpectedly succeeded");
    });

    it("uses generated fake identifiers and no personal data", () => {
        expect(sql).toContain("extensions.gen_random_uuid()");
        expect(sql).toContain("@invalid.local");
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
    });
});
