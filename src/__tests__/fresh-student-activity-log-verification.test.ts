import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_008_student_activity_log.sql",
    ),
    "utf8",
);

describe("fresh student activity database verification", () => {
    it("runs fake checks inside a rolled-back transaction", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).toContain(
            "PASS: Student activity role checks passed and all fake data was rolled back.",
        );
    });

    it("checks canonical identity, database time, and bounded duration", () => {
        expect(sql).toContain("canonical identity or start-time normalization failed");
        expect(sql).toContain("database-derived activity duration failed");
        expect(sql).toContain("'Forged Student Name'");
        expect(sql).toContain("duration_seconds = 999999");
        expect(sql).toContain("v_duration not between 0 and 86400");
    });

    it("checks own writes and blocks identity, event, content, and delete abuse", () => {
        expect(sql).toContain("student write to another student unexpectedly succeeded");
        expect(sql).toContain("student event-type override unexpectedly succeeded");
        expect(sql).toContain("student immutable activity update unexpectedly succeeded");
        expect(sql).toContain("student activity delete unexpectedly succeeded");
        expect(sql).toContain("student update to another student unexpectedly succeeded");
    });

    it("checks every relevant role and anonymous access", () => {
        expect(sql).toContain("linked parent activity visibility failed");
        expect(sql).toContain("assigned teacher activity visibility failed");
        expect(sql).toContain("unassigned teacher activity read unexpectedly succeeded");
        expect(sql).toContain("pending account activity read unexpectedly succeeded");
        expect(sql).toContain("admin activity visibility failed");
        expect(sql).toContain("set local role service_role");
        expect(sql).toContain("anonymous activity read unexpectedly succeeded");
    });

    it("uses generated fake identifiers and no personal data", () => {
        expect(sql).toContain("extensions.gen_random_uuid()");
        expect(sql).toContain("@invalid.local");
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
    });
});
