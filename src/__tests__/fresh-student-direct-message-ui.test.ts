import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    join(process.cwd(), "supabase", "fresh-start", "011_student_message_recipients.sql"),
    "utf8",
);

const studentPage = readFileSync(
    join(process.cwd(), "src", "app", "dashboard", "learning", "dm", "page.tsx"),
    "utf8",
);

const studentBottomNav = readFileSync(
    join(
        process.cwd(),
        "src",
        "app",
        "dashboard",
        "learning",
        "components",
        "StudentBottomNav.tsx",
    ),
    "utf8",
);

describe("fresh student direct-message UI connection", () => {
    it("exposes only the signed-in student's approved recipients", () => {
        expect(migration).toContain(
            "create or replace function public.codingssok_student_message_recipients()",
        );
        expect(migration).toContain("s.auth_user_id = auth.uid()");
        expect(migration).toContain("signed_in.role = 'student'");
        expect(migration).toContain("signed_in.approval_status = 'approved'");
        expect(migration).toContain("assignment.student_id = student.id");
        expect(migration).toContain("assignment.status = 'active'");
        expect(migration).toContain("p.role = 'admin'");
        expect(migration).toContain("p.approval_status = 'approved'");
    });

    it("keeps recipient discovery authenticated and read-only", () => {
        expect(migration).toContain(
            "revoke all on function public.codingssok_student_message_recipients()",
        );
        expect(migration).toContain("from public, anon");
        expect(migration).toContain("to authenticated");
        expect(migration).not.toMatch(/insert\s+into/i);
        expect(migration).not.toMatch(/update\s+public\./i);
        expect(migration).not.toMatch(/delete\s+from/i);
        expect(migration.trimStart().toLowerCase()).toContain("begin;");
        expect(migration.trimEnd().toLowerCase().endsWith("commit;")).toBe(true);
    });

    it("loads the safe recipient RPC instead of every teacher profile", () => {
        expect(studentPage).toContain(
            '.rpc("codingssok_student_message_recipients")',
        );
        expect(studentPage).not.toContain('.from("profiles")');
        expect(studentPage).not.toContain('.eq("role", "teacher")');
        expect(studentPage).toContain("receiver_role");
    });

    it("sends only through the protected direct_messages table", () => {
        expect(studentPage).toContain('.from("direct_messages")');
        expect(studentPage).toContain("sender_id: user.id");
        expect(studentPage).toContain("receiver_id: activeRecipientId");
        expect(studentPage).toContain("sender_name: user.name || \"학생\"");
        expect(studentPage).toContain("content,");
        expect(studentPage).toContain("maxLength={2000}");
        expect(studentPage).toContain("전송하지 못했어요");
    });

    it("counts unread messages from the same protected table", () => {
        expect(studentBottomNav).toContain('.from("direct_messages")');
        expect(studentBottomNav).toContain('.eq("receiver_id", user!.id)');
        expect(studentBottomNav).toContain('.eq("is_read", false)');
        expect(studentBottomNav).toContain('table: "direct_messages"');
        expect(studentBottomNav).toContain('filter: `receiver_id=eq.${user.id}`');
    });
});
