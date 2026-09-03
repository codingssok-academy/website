import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_004_monthly_attendance.sql",
    ),
    "utf8",
);

describe("fresh monthly attendance database verification", () => {
    it("runs fake role checks inside a rolled-back transaction", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).toContain(
            "PASS: Monthly attendance role checks passed and all fake data was rolled back.",
        );
    });

    it("checks student, parent, assigned teacher, other teacher, admin, service, and anon", () => {
        expect(sql).toContain("student attendance visibility failed");
        expect(sql).toContain("parent attendance visibility failed");
        expect(sql).toContain("teacher attendance scope failed");
        expect(sql).toContain("unassigned teacher attendance read failed");
        expect(sql).toContain("admin attendance visibility failed");
        expect(sql).toContain("set local role service_role");
        expect(sql).toContain("anonymous attendance read unexpectedly succeeded");
    });

    it("checks the monthly totals and the existing read and save APIs", () => {
        expect(sql).toContain("public.growth_api_monthly_attendance");
        expect(sql).toContain("public.growth_api_teacher_set_attendance");
        expect(sql).toContain("'{data,summary,scheduled}'");
        expect(sql).toContain("'{data,summary,completed}'");
        expect(sql).toContain("jsonb_array_length");
    });

    it("checks blocked writes, hidden audit columns, and server actor validation", () => {
        expect(sql).toContain("student attendance update unexpectedly succeeded");
        expect(sql).toContain("parent attendance insert unexpectedly succeeded");
        expect(sql).toContain(
            "unassigned teacher attendance write unexpectedly succeeded",
        );
        expect(sql).toContain("attendance audit-column read unexpectedly succeeded");
        expect(sql).toContain(
            "server attendance write without actor unexpectedly succeeded",
        );
    });

    it("uses generated fake identifiers and no personal data", () => {
        expect(sql).toContain("extensions.gen_random_uuid()");
        expect(sql).toContain("@invalid.local");
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
    });
});
