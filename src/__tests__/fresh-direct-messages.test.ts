import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "010_direct_messages.sql",
    ),
    "utf8",
);

describe("fresh private direct messages", () => {
    it("keeps the fields required by the current student and admin chat screens", () => {
        expect(sql).toContain("create table public.direct_messages");
        expect(sql).toContain("student_id uuid not null references public.students(id)");
        expect(sql).toContain("sender_id uuid not null references auth.users(id)");
        expect(sql).toContain("receiver_id uuid not null references auth.users(id)");
        expect(sql).toContain("sender_name text not null");
        expect(sql).toContain("content text not null");
        expect(sql).toContain("is_read boolean not null default false");
        expect(sql).toContain("created_at timestamptz not null default now()");
    });

    it("derives the sender and student identity instead of trusting the browser", () => {
        expect(sql).toContain("create or replace function private.prepare_direct_message()");
        expect(sql).toContain("v_actor_id uuid := auth.uid()");
        expect(sql).toContain("new.student_id := v_student_id");
        expect(sql).toContain("new.sender_id := v_actor_id");
        expect(sql).toContain("new.sender_name := coalesce(v_actor_name");
        expect(sql).toContain("new.sender_role := v_actor_role");
        expect(sql).toContain("new.created_at := now()");
    });

    it("allows messages only between an active student and approved assigned staff", () => {
        expect(sql).toContain("and s.status = 'active'");
        expect(sql).toContain("and p.approval_status = 'approved'");
        expect(sql).toContain("and p.role in ('teacher', 'admin')");
        expect(sql).toContain("from public.teacher_student_assignments a");
        expect(sql).toContain("and a.status = 'active'");
        expect(sql).toContain("the teacher is not assigned to this student");
    });

    it("prevents anonymous, parent, unassigned, and unrelated-account access", () => {
        expect(sql).toContain("revoke all on public.direct_messages from public, anon, authenticated");
        expect(sql).toContain("create policy direct_messages_read_scoped");
        expect(sql).toContain("(sender_id = auth.uid() or receiver_id = auth.uid())");
        expect(sql).toContain("public.codingssok_current_role() = 'teacher'");
        expect(sql).toContain("public.codingssok_can_manage_student(direct_messages.student_id)");
        expect(sql).toContain("public.codingssok_is_admin()");
        expect(sql).not.toMatch(/to\s+anon/i);
    });

    it("lets only the receiver mark an unread message as read", () => {
        expect(sql).toContain("grant update (is_read) on public.direct_messages to authenticated");
        expect(sql).toContain("create policy direct_messages_mark_received_read");
        expect(sql).toContain("receiver_id = auth.uid()");
        expect(sql).toContain("only an unread message can be marked as read");
        expect(sql).toContain("new.read_at := now()");
        expect(sql).not.toMatch(/grant\s+delete[\s\S]*public\.direct_messages\s+to\s+authenticated/i);
    });

    it("limits content size and enables realtime without adding sample messages", () => {
        expect(sql).toContain("char_length(btrim(content)) between 1 and 2000");
        expect(sql).toContain("alter publication supabase_realtime add table public.direct_messages");
        expect(sql).not.toMatch(/insert\s+into\s+public\.direct_messages/i);
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
