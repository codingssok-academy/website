import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_006_announcements.sql",
    ),
    "utf8",
);

describe("fresh announcement database verification", () => {
    it("runs fake checks inside a rolled-back transaction", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).toContain(
            "PASS: Announcement role checks passed and all fake data was rolled back.",
        );
    });

    it("checks student, parent, teacher, pending, admin, service, and anon roles", () => {
        expect(sql).toContain("student announcement visibility failed");
        expect(sql).toContain("parent announcement visibility failed");
        expect(sql).toContain("teacher announcement visibility failed");
        expect(sql).toContain("pending account announcement read unexpectedly succeeded");
        expect(sql).toContain("admin announcement visibility failed");
        expect(sql).toContain("set local role service_role");
        expect(sql).toContain("anonymous announcement read unexpectedly succeeded");
    });

    it("checks public, draft, and archived message visibility", () => {
        expect(sql).toContain("'published_message'");
        expect(sql).toContain("'draft_message'");
        expect(sql).toContain("'archived_message'");
        expect(sql).toContain("if v_visible <> 1");
        expect(sql).toContain("if v_visible <> 3");
    });

    it("checks admin-only writes and hidden author audit data", () => {
        expect(sql).toContain("student announcement insert unexpectedly succeeded");
        expect(sql).toContain("teacher announcement insert unexpectedly succeeded");
        expect(sql).toContain("admin announcement update failed");
        expect(sql).toContain(
            "admin mismatched announcement author unexpectedly succeeded",
        );
        expect(sql).toContain("announcement author id unexpectedly visible to student");
    });

    it("checks realtime setup without adding real data", () => {
        expect(sql).toContain("announcements realtime publication is missing");
        expect(sql).toContain("extensions.gen_random_uuid()");
        expect(sql).toContain("@invalid.local");
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
    });
});
