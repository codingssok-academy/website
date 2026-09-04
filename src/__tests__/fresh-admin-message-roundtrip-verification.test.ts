import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_admin_message_roundtrip.sql",
    ),
    "utf8",
);

describe("fresh student-admin message round-trip verification", () => {
    it("uses only temporary fake student and admin identities", () => {
        expect(sql).toContain("fresh-admin-roundtrip-%s@invalid.local");
        expect(sql).toContain("Roundtrip Verify Student");
        expect(sql).toContain("Roundtrip Verify Admin");
        expect(sql).toContain("temporary-test-only");
    });

    it("checks the exact student question and admin reply path", () => {
        expect(sql).toContain("Fresh Admin Roundtrip Student Question");
        expect(sql).toContain("admin could not see the student question");
        expect(sql).toContain("Fresh Admin Roundtrip Admin Reply");
        expect(sql).toContain("student could not see the admin reply");
    });

    it("checks trusted identities and both read receipts", () => {
        expect(sql).toContain("student question identity normalization failed");
        expect(sql).toContain("admin reply identity normalization failed");
        expect(sql).toContain("admin read receipt was not stored");
        expect(sql).toContain("student read receipt for admin reply was not stored");
    });

    it("rolls back all fake accounts, students, and messages", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql.indexOf("rollback;")).toBeLessThan(sql.indexOf("select case"));
        expect(sql).toContain(
            "PASS: Student-admin message round trip passed and all fake data was rolled back.",
        );
    });
});
