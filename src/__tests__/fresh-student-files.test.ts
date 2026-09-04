import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "009_student_files.sql",
    ),
    "utf8",
);

describe("fresh private student files", () => {
    it("provides metadata fields used by the current student and admin screens", () => {
        expect(sql).toContain("create table public.student_files");
        expect(sql).toContain("student_id uuid not null references public.students(id)");
        expect(sql).toContain("owner_auth_user_id uuid references auth.users(id)");
        expect(sql).toContain("uploaded_by uuid references auth.users(id)");
        expect(sql).toContain("original_name text not null");
        expect(sql).toContain("storage_path text not null unique");
        expect(sql).toContain("mime_type text check");
        expect(sql).toContain("size_bytes bigint not null");
        expect(sql).toContain("category text not null default 'result'");
        expect(sql).toContain("note text check");
    });

    it("creates a private bucket with a fifty-megabyte limit", () => {
        expect(sql).toContain("insert into storage.buckets");
        expect(sql).toContain("'student-files'");
        expect(sql).toContain("false,\n    52428800");
        expect(sql).toContain("allowed_mime_types");
        expect(sql).toContain("'application/octet-stream'");
        expect(sql).toContain("set public = false");
    });

    it("binds every path and uploader to an active academy student", () => {
        expect(sql).toContain("create or replace function private.prepare_student_file()");
        expect(sql).toContain("and s.status = 'active'");
        expect(sql).toContain("and p.approval_status = 'approved'");
        expect(sql).toContain("new.owner_auth_user_id := v_student_auth_user_id");
        expect(sql).toContain("new.uploaded_by_role := v_uploader_role");
        expect(sql).toContain("split_part(storage_path, '/', 2) = student_id::text");
        expect(sql).toContain("split_part(storage_path, '/', 3) = uploaded_by_role");
    });

    it("allows only the student, linked parent, assigned teacher, or admin to read", () => {
        expect(sql).toContain("public.codingssok_can_read_student_file(");
        expect(sql).toContain("public.codingssok_can_manage_student(f.student_id)");
        expect(sql).toContain("public.codingssok_can_read_student(f.student_id)");
        expect(sql).toContain("f.visibility = 'student_parent'");
        expect(sql).toContain("create policy student_files_read_scoped");
        expect(sql).toContain("create policy student_files_storage_read_scoped");
    });

    it("keeps internal paths and mutations behind the authenticated server", () => {
        const authenticatedGrant = sql.match(
            /grant select \(([\s\S]*?)\) on public\.student_files to authenticated/,
        )?.[1] ?? "";

        expect(authenticatedGrant).not.toContain("storage_path");
        expect(authenticatedGrant).not.toContain("uploaded_by,");
        expect(sql).not.toMatch(/grant\s+insert[\s\S]*public\.student_files\s+to\s+authenticated/i);
        expect(sql).not.toMatch(/grant\s+update[\s\S]*public\.student_files\s+to\s+authenticated/i);
        expect(sql).not.toMatch(/grant\s+delete[\s\S]*public\.student_files\s+to\s+authenticated/i);
        expect(sql).toContain("grant all on public.student_files to service_role");
    });

    it("blocks unsafe names, oversized files, and path traversal", () => {
        expect(sql).toContain("original_name !~ '[\\\\/]'");
        expect(sql).toContain("original_name !~ '[[:cntrl:]]'");
        expect(sql).toContain("size_bytes between 1 and 52428800");
        expect(sql).toContain("position('..' in storage_path) = 0");
        expect(sql).toContain("split_part(storage_path, '/', 5) = ''");
    });

    it("separates parent-safe files from staff-only files", () => {
        expect(sql).toContain("visibility text not null default 'student_parent'");
        expect(sql).toContain("visibility in ('student_parent', 'staff_only')");
        expect(sql).toContain("staff_only is limited to assigned teachers and admins");
    });

    it("contains no seed records or personal identifiers and is transactional", () => {
        expect(sql).not.toMatch(/insert\s+into\s+(auth\.users|public\.students|public\.student_files)/i);
        expect(sql).not.toMatch(
            /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
        );
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });
});
