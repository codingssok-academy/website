import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const prepare = readFileSync(
    join(process.cwd(), "supabase", "fresh-start", "prepare_admin_message_ui_check.sql"),
    "utf8",
);
const cleanup = readFileSync(
    join(process.cwd(), "supabase", "fresh-start", "cleanup_admin_message_ui_check.sql"),
    "utf8",
);
const uiCheck = readFileSync(
    join(process.cwd(), "scripts", "fresh-admin-message-ui-check.mjs"),
    "utf8",
);

describe("fresh admin message UI-check account lifecycle", () => {
    it("marks the scripts for the exact fresh-test project only", () => {
        expect(prepare).toContain("opcdcuedhwyuyhzaubpu");
        expect(cleanup).toContain("opcdcuedhwyuyhzaubpu");
        expect(prepare).toContain("codingssok-growth-v2-fresh-test");
        expect(cleanup).toContain("codingssok-growth-v2-fresh-test");
    });

    it("uses fixed fake identities and test-only credentials", () => {
        expect(prepare).toContain("가짜화면학생");
        expect(prepare).toContain("가짜화면관리자");
        expect(prepare).toContain("@invalid.local");
        expect(prepare).toContain("@codingssok.local");
        expect(prepare).toContain("student_a0000000-0000-4000-8000-000000000001@codingssok.local");
        expect(prepare).toContain("cs_student_a0000000000040008000000000000001_2468");
        expect(prepare).toContain("student_login");
        expect(prepare).toContain("'2468'");
    });

    it("refuses to overwrite an unfinished prior UI check", () => {
        expect(prepare).toContain("previous fake UI-check records exist; run cleanup first");
        expect(prepare).not.toMatch(/delete\s+from/i);
    });

    it("limits cleanup to the exact fake student and account IDs", () => {
        expect(cleanup).toContain("delete from public.direct_messages");
        expect(cleanup).toContain("delete from private.student_access_credentials");
        expect(cleanup).toContain("delete from public.students");
        expect(cleanup).toContain("delete from auth.identities");
        expect(cleanup).toContain("delete from auth.users");
        expect(cleanup).toContain("CLEAN: Fake student, admin, and message UI-check records are zero.");
    });

    it("checks the fake student-to-admin message flow through Google Chrome", () => {
        expect(uiCheck).toContain("Google\\\\Chrome\\\\Application\\\\chrome.exe");
        expect(uiCheck).toContain("가짜 화면 왕복 질문입니다.");
        expect(uiCheck).toContain("가짜 화면 왕복 답장입니다.");
        expect(uiCheck).toContain("/dashboard/learning/dm");
        expect(uiCheck).toContain("/teacher/admin/chat");
    });
});
