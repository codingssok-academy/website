import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_007_learning_progress_xp.sql",
    ),
    "utf8",
);

describe("fresh learning progress and XP database verification", () => {
    it("runs fake checks inside a rolled-back transaction", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).toContain(
            "PASS: Learning progress and XP role checks passed and all fake data was rolled back.",
        );
    });

    it("checks XP zero, level one, automatic leveling, and profile mirroring", () => {
        expect(sql).toContain("student XP zero and level one initialization failed");
        expect(sql).toContain("XP level or profile mirror failed");
        expect(sql).toContain("v_xp <> 100 or v_level <> 2");
        expect(sql).toContain("v_profile_xp <> 100 or v_profile_level <> 2");
    });

    it("checks fixed awards, duplicate prevention, invalid actions, and the daily cap", () => {
        expect(sql).toContain("XP award deduplication failed");
        expect(sql).toContain("unknown XP action unexpectedly succeeded");
        expect(sql).toContain("for v_index in 1..21 loop");
        expect(sql).toContain("code-run daily cap failed");
        expect(sql).toContain("v_result ->> 'reason' <> 'daily_cap'");
    });

    it("checks course saving and blocks direct XP manipulation", () => {
        expect(sql).toContain("student course completion normalization failed");
        expect(sql).toContain("direct student XP update unexpectedly succeeded");
        expect(sql).toContain("direct student XP history insert unexpectedly succeeded");
        expect(sql).toContain("student write to another student unexpectedly succeeded");
    });

    it("checks every relevant role and anonymous access", () => {
        expect(sql).toContain("parent learning visibility failed");
        expect(sql).toContain("assigned teacher learning visibility failed");
        expect(sql).toContain("unassigned teacher learning read unexpectedly succeeded");
        expect(sql).toContain("pending account learning read unexpectedly succeeded");
        expect(sql).toContain("admin learning visibility failed");
        expect(sql).toContain("set local role service_role");
        expect(sql).toContain("anonymous progress read unexpectedly succeeded");
    });

    it("uses generated fake identifiers and no personal data", () => {
        expect(sql).toContain("extensions.gen_random_uuid()");
        expect(sql).toContain("@invalid.local");
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
    });
});
