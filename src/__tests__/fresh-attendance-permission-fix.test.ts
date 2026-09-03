import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "005_fix_attendance_returning_permissions.sql",
    ),
    "utf8",
);

describe("fresh attendance returning permission fix", () => {
    it("replaces the existing save function without changing 004", () => {
        expect(sql).toContain(
            "create or replace function public.growth_api_teacher_set_attendance",
        );
        expect(sql).toContain("p_actor_id uuid default null");
    });

    it("returns only granted parent-safe columns instead of every audit column", () => {
        expect(sql.toLowerCase()).not.toContain("returning *");
        expect(sql).toContain("v_saved_id");
        expect(sql).toContain("v_saved_student_id");
        expect(sql).toContain("v_saved_updated_at");

        const returningBlocks = sql.match(/returning[\s\S]*?into/g) ?? [];
        expect(returningBlocks).toHaveLength(2);
        for (const block of returningBlocks) {
            expect(block).not.toContain("created_by");
            expect(block).not.toContain("updated_by");
        }
    });

    it("preserves actor and student permission checks", () => {
        expect(sql).toContain("actor_id is required for server attendance writes");
        expect(sql).toContain("public.codingssok_can_manage_student(p_student_id)");
        expect(sql).toContain("p_actor_id <> v_actor_id");
        expect(sql).toContain("attendance write access denied");
    });

    it("keeps anonymous users blocked and authenticated roles explicit", () => {
        expect(sql).toContain("from public, anon");
        expect(sql).toContain("to authenticated, service_role");
    });

    it("contains no user data and is transaction wrapped", () => {
        expect(sql).not.toMatch(/insert\s+into\s+(auth\.users|public\.students)/i);
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
