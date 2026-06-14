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
    expect(page).toContain("const deleteCode");
    expect(page).toContain("const saveSiblingGroup");
    expect(page).toContain('href="/teacher/admin/students"');
    expect(page).toContain("cache: \"no-store\"");
  });

  it("keeps parent code API protected and connected to the live parent auth storage", () => {
    const route = read("src/app/api/teacher/parent-codes/route.ts");

    expect(route).toContain("async function requireTeacherContext");
    expect(route).toContain("관리자 로그인이 필요합니다");
    expect(route).toContain("관리자 권한이 필요합니다");
    expect(route).toContain("export async function GET");
    expect(route).toContain("export async function POST");
    expect(route).toContain("export async function PATCH");
    expect(route).toContain("export async function DELETE");
    expect(route).toContain("generateParentPin");
    expect(route).toContain("syncProgressPin");
    expect(route).toContain(".from('students')");
    expect(route).toContain(".from('study_progress')");
    expect(route).toContain("pin: null");
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

  it("keeps student signup accounts manageable without deleting parent codes", () => {
    const page = read("src/app/teacher/admin/students/page.tsx");
    const route = read("src/app/api/teacher/student-accounts/route.ts");

    expect(page).toContain('fetch("/api/teacher/student-accounts"');
    expect(page).toContain('method: "PATCH"');
    expect(page).toContain('method: "DELETE"');
    expect(page).toContain("deleteAccount");
    expect(route).toContain("export async function DELETE");
    expect(route).toContain("isProtectedProfile");
    expect(route).toContain("deleteUser");
    expect(route).toContain("auth_user_id: null");
    expect(route).toContain(".from(\"profiles\").delete()");
  });
});
