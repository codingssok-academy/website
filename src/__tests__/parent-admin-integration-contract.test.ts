import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("parent portal admin integration contract", () => {
  it("keeps parent code admin wired to issue, reissue, edit, delete, sibling grouping and student accounts", () => {
    const page = read("src/app/teacher/admin/page.tsx");

    expect(page).toContain('fetch("/api/teacher/parent-codes"');
    expect(page).toContain('method: "POST" | "PATCH" | "DELETE"');
    expect(page).toContain("const issueCode");
    expect(page).toContain("const reissueCode");
    expect(page).toContain("const saveEdit");
    expect(page).toContain("const deleteStudent");
    expect(page).toContain("const saveSiblingGroup");
    expect(page).toContain('href="/teacher/admin/students"');
    expect(page).toContain('cache: "no-store"');
    expect(page).toContain("school: row.school");
    expect(page).toContain("grade: row.grade");
    expect(page).toContain("form.school");
    expect(page).toContain("editForm.school");
  });

  it("keeps teacher growth management available from the admin shell", () => {
    const sidebar = read("src/app/teacher/admin/components/AdminSidebar.tsx");
    const page = read("src/app/teacher/admin/growth/page.tsx");
    const route = read("src/app/api/teacher/growth-management/route.ts");
    const migration = read("supabase/migrations/20260616_student_growth_management.sql");

    expect(sidebar).toContain("/teacher/admin/growth");
    expect(sidebar).toContain("Growth 2.0 성장관리");
    expect(page).toContain("Growth 2.0 성장관리");
    expect(page).toContain("배운 개념·수업 내용");
    expect(page).toContain("학부모 전달 문구");
    expect(page).toContain('updateForm("classProgress"');
    expect(page).toContain("/api/teacher/growth-management");
    expect(route).toContain("export async function GET");
    expect(route).toContain("export async function POST");
    expect(route).toContain("export async function DELETE");
    expect(route).toContain("student_growth_management");
    expect(migration).toContain("create table if not exists public.student_growth_management");
    expect(migration).toContain("unique (student_id)");
    expect(migration).toContain("student_growth_management_teacher_write");
  });

  it("keeps parent code API protected and connected to the live parent auth storage", () => {
    const route = read("src/app/api/teacher/parent-codes/route.ts");

    expect(route).toContain("async function requireTeacherContext");
    expect(route).toContain("export async function GET");
    expect(route).toContain("export async function POST");
    expect(route).toContain("export async function PATCH");
    expect(route).toContain("export async function DELETE");
    expect(route).toContain("generateParentPin");
    expect(route).toContain("syncProgressPin");
    expect(route).toContain("school, grade");
    expect(route).toContain("input.school !== undefined");
    expect(route).toContain("const school = typeof body?.school");
    expect(route).toContain("school,");
    expect(route).toContain(".from('students')");
    expect(route).toContain(".from('study_progress')");
    expect(route).toContain("pin: null");
    expect(route).toContain("status: 'deactivated'");
    expect(route).toContain("set pin = null");
    expect(route).toContain("insert into public.students");
    expect(route).toContain("'deactivated'");
  });

  it("keeps the parent portal edge fallback using the same roster deletion semantics", () => {
    const edge = read("supabase/functions/parent-portal/index.ts");

    expect(edge).toContain('action === "delete"');
    expect(edge).toContain("syncProgressPin");
    expect(edge).toContain('status: "deactivated"');
    expect(edge).toContain("pin: null");
    expect(edge).toContain("birthday, school, grade");
    expect(edge).toContain("school: typeof body.school");
    expect(edge).toContain('(student) => student.class !== "admin"');
    expect(edge).not.toContain('student.status !== "deactivated" && student.class !== "admin"');
  });

  it("keeps parent sessions revalidated against the live current code", () => {
    const route = read("src/app/api/parent/session/route.ts");
    const shell = read("src/app/parent/ParentShell.tsx");

    expect(route).toContain("export async function GET");
    expect(route).toContain("canParentSessionReadStudent");
    expect(route).toContain("canParentSessionReadStudentFromDatabase");
    expect(route).toContain("clearParentSessionCookie");
    expect(route).toContain("Cache-Control");
    expect(shell).toContain("validateSession");
    expect(shell).toContain("/api/parent/session");
    expect(shell).toContain("setInterval");
    expect(shell).toContain("visibilitychange");
    expect(shell).toContain("focus");
  });

  it("keeps student signup accounts manageable without deleting parent codes or auth users", () => {
    const page = read("src/app/teacher/admin/students/page.tsx");
    const route = read("src/app/api/teacher/student-accounts/route.ts");

    expect(page).toContain('fetch("/api/teacher/student-accounts"');
    expect(page).toContain('method: "PATCH"');
    expect(page).toContain('method: "DELETE"');
    expect(page).toContain("deleteAccount");
    expect(page).toContain("saveStudentInfo");
    expect(page).toContain("studentInfo");
    expect(page).toContain("student.school");
    expect(page).toContain("inline-field");
    expect(route).toContain("export async function DELETE");
    expect(route).toContain("updateStudentInfoWithAdmin");
    expect(route).toContain("studentAccountInfo");
    expect(route).toContain("id,name,school,grade,class");
    expect(route).toContain("proxyStudentAccountsToRpc");
    expect(route).toContain("studentAccountDelete");
    expect(route).not.toContain("deleteUser");
    expect(route).not.toContain(".from(\"profiles\").delete()");
  });

  it("keeps student account management available through the safe admin RPC fallback", () => {
    const route = read("src/app/api/teacher/student-accounts/route.ts");
    const migration = read("supabase/migrations/20260615_admin_student_accounts_rpc.sql");

    expect(route).toContain("proxyStudentAccountsToRpc");
    expect(route).toContain('supabase.rpc("codingssok_admin_student_accounts"');
    expect(route).toContain("studentAccountsList");
    expect(route).toContain("studentAccountInfo");
    expect(route).toContain("studentAccountStatus");
    expect(route).toContain("studentAccountDelete");
    expect(migration).toContain("create or replace function private.codingssok_admin_student_accounts_impl");
    expect(migration).toContain("create or replace function public.codingssok_admin_student_accounts");
    expect(migration).toContain("security definer");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("This admin account is not allowlisted.");
    expect(migration).toContain("profiles_approval_status_check");
    expect(migration).toContain("approval_status = 'deactivated'");
    expect(migration).toContain("status = 'deactivated'");
    expect(migration).toContain("'school', s.school");
    expect(migration).toContain("_action = 'studentAccountInfo'");
    expect(migration).toContain("set school = nullif");
    expect(migration).not.toContain("delete from auth.users");
    expect(migration).not.toContain("deleteUser");
    expect(migration).toContain("grant execute on function public.codingssok_admin_student_accounts");
  });

  it("keeps deleted or deactivated student auth sessions blocked on dashboard load", () => {
    const auth = read("src/contexts/AuthContext.tsx");
    const parentCodes = read("src/app/api/teacher/parent-codes/route.ts");
    const postgresAdmin = read("src/lib/postgres-admin.ts");

    expect(auth).toContain('.eq("auth_user_id", session.user.id)');
    expect(auth).toContain('linkedStudent.status === "deactivated"');
    expect(auth).toContain('linkedStudent.status === "rejected"');
    expect(parentCodes).toContain("status: 'approved'");
    expect(postgresAdmin).toContain("status = 'approved'");
  });
});
