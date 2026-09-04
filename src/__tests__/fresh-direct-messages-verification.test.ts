import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
    join(
        process.cwd(),
        "supabase",
        "fresh-start",
        "verify_010_direct_messages.sql",
    ),
    "utf8",
);

describe("fresh direct-message role verification", () => {
    it("uses fake student, parent, teacher, admin, and pending accounts", () => {
        expect(sql).toContain("'student_user_a'");
        expect(sql).toContain("'student_user_b'");
        expect(sql).toContain("'parent_user'");
        expect(sql).toContain("'teacher_user'");
        expect(sql).toContain("'other_teacher_user'");
        expect(sql).toContain("'admin_user'");
        expect(sql).toContain("'pending_user'");
        expect(sql).toContain("fresh-message-verify-%s@invalid.local");
    });

    it("checks valid student, assigned-teacher, and admin messages", () => {
        expect(sql).toContain("Fresh Message Verify Student To Teacher");
        expect(sql).toContain("Fresh Message Verify Teacher Reply");
        expect(sql).toContain("Fresh Message Verify Admin Reply");
        expect(sql).toContain("assigned teacher read receipt failed");
        expect(sql).toContain("student read receipt failed");
    });

    it("checks sender identity and name spoofing protection", () => {
        expect(sql).toContain("Forged Student Name");
        expect(sql).toContain("Forged Teacher Name");
        expect(sql).toContain("Forged Admin Name");
        expect(sql).toContain("student sender identity normalization failed");
        expect(sql).toContain("teacher sender identity normalization failed");
        expect(sql).toContain("admin sender identity normalization failed");
        expect(sql).toContain("where sender_name like 'Forged %'");
    });

    it("checks blocked recipients and unrelated roles", () => {
        expect(sql).toContain("student message to unassigned teacher unexpectedly succeeded");
        expect(sql).toContain("student-to-student direct message unexpectedly succeeded");
        expect(sql).toContain("teacher reply to unassigned student unexpectedly succeeded");
        expect(sql).toContain("unassigned teacher message read unexpectedly succeeded");
        expect(sql).toContain("parent direct message unexpectedly succeeded");
        expect(sql).toContain("pending account direct message unexpectedly succeeded");
        expect(sql).toContain("anonymous direct-message insert unexpectedly succeeded");
    });

    it("checks immutable messages and receiver-only read receipts", () => {
        expect(sql).toContain("message sender unexpectedly marked own message as read");
        expect(sql).toContain("student message content update unexpectedly succeeded");
        expect(sql).toContain("student message delete unexpectedly succeeded");
        expect(sql).toContain("admin sender unexpectedly marked own message as read");
    });

    it("rolls back every fake account, relationship, and message", () => {
        expect(sql.trimStart().toLowerCase()).toContain("begin;");
        expect(sql.toLowerCase()).toContain("rollback;");
        expect(sql).toContain("PASS: Direct-message role checks passed and all fake data was rolled back.");
        expect(sql.indexOf("rollback;")).toBeLessThan(sql.indexOf("select case"));
    });
});
