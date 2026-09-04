import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_011_student_message_recipients.sql",
    ),
    "utf8",
);

describe("fresh student message recipient verification", () => {
    it("uses generated fake accounts and rolls them all back", () => {
        expect(sql).toContain("extensions.gen_random_uuid()");
        expect(sql).toContain("fresh-recipient-verify-%s@invalid.local");
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).toContain(
            "PASS: Student message recipient checks passed and all fake data was rolled back.",
        );
    });

    it("allows only the assigned teacher and administrator", () => {
        expect(sql).toContain("v_visible <> 2");
        expect(sql).toContain("v_teacher <> 1");
        expect(sql).toContain("v_admin <> 1");
        expect(sql).toContain("v_other_teacher <> 0");
    });

    it("checks unrelated and unauthenticated roles", () => {
        expect(sql).toContain("parent unexpectedly received student message recipients");
        expect(sql).toContain("teacher unexpectedly received student message recipients");
        expect(sql).toContain("pending account unexpectedly received student message recipients");
        expect(sql).toContain("anonymous recipient discovery unexpectedly succeeded");
    });
});
