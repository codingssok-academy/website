import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "007_learning_progress_xp.sql",
    ),
    "utf8",
);

describe("fresh learning progress and XP", () => {
    it("starts every student at XP zero and level one", () => {
        expect(sql).toContain("add column total_xp integer not null default 0");
        expect(sql).toContain("add column level integer not null default 1");
        expect(sql).toContain("xp integer not null default 0");
        expect(sql).toContain("level integer not null default 1");
        expect(sql).toContain("new.level := floor(sqrt(new.xp::numeric / 100))::integer + 1");
    });

    it("provides the progress fields used by the current learning screens", () => {
        expect(sql).toContain("create table public.user_progress");
        expect(sql).toContain("create table public.user_course_progress");
        expect(sql).toContain("completed_lessons jsonb not null default '[]'::jsonb");
        expect(sql).toContain("progress integer not null default 0");
        expect(sql).toContain("is_completed boolean not null default false");
        expect(sql).toContain("unique (user_id, course_id)");
    });

    it("keeps profile and dashboard level summaries in sync", () => {
        expect(sql).toContain("create trigger user_progress_mirror_profile");
        expect(sql).toContain("set total_xp = new.xp");
        expect(sql).toContain("level = new.level");
        expect(sql).toContain("create trigger profiles_ensure_student_user_progress");
    });

    it("awards fixed XP in one deduplicated database operation", () => {
        expect(sql).toContain("public.growth_api_award_xp");
        expect(sql).toContain("when 'lesson_view' then 10");
        expect(sql).toContain("when 'quiz_correct' then 20");
        expect(sql).toContain("when 'unit_complete' then 30");
        expect(sql).toContain("when 'code_run' then 5");
        expect(sql).toContain("when 'attendance' then 15");
        expect(sql).toContain("on conflict (user_id, action_type, item_id) do nothing");
        expect(sql).toContain("pg_catalog.pg_advisory_xact_lock");
    });

    it("caps repeated code-run rewards and rejects unknown actions", () => {
        expect(sql).toContain("if v_code_runs >= 20 then");
        expect(sql).toContain("'reason', 'daily_cap'");
        expect(sql).toContain("message = 'XP action type is invalid'");
        expect(sql).toContain("xp_amount integer not null check (xp_amount between 1 and 200)");
    });

    it("blocks direct XP writes while allowing active students to save course progress", () => {
        expect(sql).not.toContain("grant insert on public.xp_history to authenticated");
        expect(sql).not.toContain("grant update on public.user_progress to authenticated");
        expect(sql).toContain("create policy user_course_progress_insert_self");
        expect(sql).toContain("create policy user_course_progress_update_self");
        expect(sql).toContain("public.codingssok_is_active_student_user(user_id)");
    });

    it("allows only scoped students, parents, teachers, and admins to read", () => {
        expect(sql).toContain("public.codingssok_can_read_student_user(user_id)");
        expect(sql).toContain("create policy user_progress_read_scoped");
        expect(sql).toContain("create policy xp_history_read_scoped");
        expect(sql).toContain("create policy user_course_progress_read_scoped");
        expect(sql).toContain("from public, anon, authenticated");
    });

    it("contains no seed records or personal identifiers and is transactional", () => {
        expect(sql).not.toMatch(/insert\s+into\s+(auth\.users|public\.students)/i);
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
