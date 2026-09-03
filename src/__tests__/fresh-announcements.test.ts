import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(process.cwd(), "supabase", "fresh-start", "006_announcements.sql"),
    "utf8",
);

describe("fresh academy announcements", () => {
    it("matches the fields and limits used by the existing message screen", () => {
        expect(sql).toContain("create table public.announcements");
        expect(sql).toContain("char_length(btrim(title)) between 1 and 80");
        expect(sql).toContain("char_length(btrim(content)) between 1 and 2000");
        expect(sql).toContain("is_pinned boolean not null default false");
        expect(sql).toContain("author_id uuid not null references auth.users(id)");
    });

    it("keeps the current admin send action immediately published", () => {
        expect(sql).toContain("status text not null default 'published'");
        expect(sql).toContain("status in ('draft', 'published', 'archived')");
        expect(sql).toContain("announcements_set_status_timestamps");
        expect(sql).toContain("new.published_at = now()");
    });

    it("shows published messages only to approved academy accounts", () => {
        expect(sql).toContain("create policy announcements_read_published_or_admin");
        expect(sql).toContain("status = 'published'");
        expect(sql).toContain(
            "public.codingssok_current_role() in ('student', 'parent', 'teacher')",
        );
        expect(sql).toContain("public.codingssok_is_admin()");
        expect(sql).toContain("from public, anon, authenticated");
    });

    it("allows only an approved admin to create or change messages", () => {
        expect(sql).toContain("create policy announcements_insert_admin");
        expect(sql).toContain("create policy announcements_update_admin");
        expect(sql).toContain("author_id = auth.uid()");
        expect(sql).not.toContain(
            "grant delete on public.announcements to authenticated",
        );
    });

    it("does not expose the admin account id to ordinary clients", () => {
        const selectGrant = sql.match(
            /grant select \(([\s\S]*?)\) on public\.announcements to authenticated;/,
        )?.[1] ?? "";

        expect(selectGrant).not.toContain("author_id");
        expect(sql).toContain("grant all on public.announcements to service_role");
    });

    it("enables realtime delivery for newly published messages", () => {
        expect(sql).toContain("supabase_realtime");
        expect(sql).toContain(
            "alter publication supabase_realtime add table public.announcements",
        );

        const publicationColumns = sql.match(
            /alter publication supabase_realtime add table public\.announcements \(([\s\S]*?)\);/,
        )?.[1] ?? "";

        expect(publicationColumns).not.toContain("author_id");
    });

    it("contains no seed records or personal identifiers and is transactional", () => {
        expect(sql).not.toMatch(/insert\s+into\s+(auth\.users|public\.announcements)/i);
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
