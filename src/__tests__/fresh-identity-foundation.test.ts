import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
    process.cwd(),
    "supabase",
    "fresh-start",
    "001_identity_access.sql",
);
const sql = readFileSync(migrationPath, "utf8");

describe("fresh identity and access foundation", () => {
    it("creates only the first-step identity relationship tables", () => {
        expect(sql).toContain("create table public.profiles");
        expect(sql).toContain("create table public.students");
        expect(sql).toContain("create table public.parent_student_links");
        expect(sql).toContain("create table public.teacher_student_assignments");
        expect(sql).toContain("create table private.student_access_credentials");
    });

    it("keeps access codes out of public student columns and hashes them", () => {
        const studentsDefinition = sql.match(
            /create table public\.students \(([\s\S]*?)\n\);/,
        )?.[1] ?? "";

        expect(studentsDefinition).not.toMatch(/\bpin\b/i);
        expect(studentsDefinition).not.toMatch(/login_pin/i);
        expect(sql).toContain("extensions.crypt(p_code, extensions.gen_salt('bf', 10))");
        expect(sql).toContain("c.secret_hash = extensions.crypt(p_code, c.secret_hash)");
    });

    it("allows only the server service role to issue or verify codes", () => {
        expect(sql).toContain("if auth.role() <> 'service_role' then");
        expect(sql).toContain(
            "revoke all on function public.codingssok_issue_student_access_code(uuid, text, text)",
        );
        expect(sql).toContain(
            "revoke all on function public.codingssok_verify_student_access_code(text, text, text)",
        );
        expect(sql).toContain(
            "grant execute on function public.codingssok_verify_student_access_code(text, text, text)\n    to service_role",
        );
    });

    it("uses explicit relationship scopes for students, parents, teachers, and admins", () => {
        expect(sql).toContain("s.auth_user_id = auth.uid()");
        expect(sql).toContain("l.parent_user_id = auth.uid()");
        expect(sql).toContain("a.teacher_id = auth.uid()");
        expect(sql).toContain("public.codingssok_is_admin()");
        expect(sql).toContain("using (public.codingssok_can_read_student(id))");
    });

    it("enables RLS and gives anonymous users no identity-table access", () => {
        for (const table of [
            "profiles",
            "students",
            "parent_student_links",
            "teacher_student_assignments",
        ]) {
            expect(sql).toContain(`alter table public.${table} enable row level security`);
            expect(sql).toContain(`revoke all on public.${table} from public, anon, authenticated`);
        }
        expect(sql).not.toMatch(/to\s+anon\s+using\s*\(true\)/i);
        expect(sql).not.toMatch(/to\s+anon\s+with check\s*\(true\)/i);
    });

    it("does not trust a signup user's editable metadata for account roles", () => {
        expect(sql).toContain("new.raw_app_meta_data->>'role'");
        expect(sql).not.toContain("new.raw_user_meta_data->>'role'");
    });

    it("contains no fixed personal account data or seed records", () => {
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql).not.toMatch(/insert\s+into\s+auth\.users/i);
        expect(sql).not.toMatch(/@codingssok\.local/i);
    });

    it("is transaction-wrapped so a failed setup does not leave a half-built schema", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
