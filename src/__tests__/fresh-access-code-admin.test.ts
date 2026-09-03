import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
    return readFileSync(join(process.cwd(), path), "utf8");
}

describe("fresh DB access-code administration", () => {
    it("keeps status and revoke helpers restricted to the service role", () => {
        const sql = read("supabase/fresh-start/002_access_code_admin.sql");
        const statusFunction = sql.split("create or replace function public.codingssok_revoke_student_access_code")[0];

        expect(sql).toContain("security definer");
        expect(sql).toContain("set search_path = ''");
        expect(sql).toContain("auth.role() <> 'service_role'");
        expect(sql).toContain("from public, anon, authenticated");
        expect(sql).toContain("to service_role");
        expect(statusFunction).not.toContain("secret_hash");
    });

    it("stores parent and student codes through the hashing RPC in secure mode", () => {
        const parentRoute = read("src/app/api/teacher/parent-codes/route.ts");
        const studentRoute = read("src/app/api/teacher/student-accounts/route.ts");

        expect(parentRoute).toContain("upsertHashedParentCode");
        expect(parentRoute).toContain("purpose: 'parent_access'");
        expect(parentRoute).toContain("issuedCode: pin");
        expect(parentRoute).toContain("'Cache-Control': 'no-store'");
        expect(studentRoute).toContain("purpose: \"student_login\"");
        expect(studentRoute).toContain("if (!hashedMode)");
        expect(studentRoute).toContain("loginPinIssued");
    });

    it("shows existing secrets only as issued status in secure admin screens", () => {
        const parentPage = read("src/app/teacher/admin/page.tsx");
        const studentPage = read("src/app/teacher/admin/students/page.tsx");

        expect(parentPage).toContain("안전하게 발급됨");
        expect(parentPage).toContain("화면을 벗어나면 다시 볼 수 없습니다.");
        expect(studentPage).toContain("비밀번호 설정됨");
    });
});
