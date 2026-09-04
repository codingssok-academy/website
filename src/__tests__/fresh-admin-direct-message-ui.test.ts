import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
    join(process.cwd(), "src", "app", "teacher", "admin", "chat", "page.tsx"),
    "utf8",
);
const sidebar = readFileSync(
    join(process.cwd(), "src", "app", "teacher", "admin", "components", "AdminSidebar.tsx"),
    "utf8",
);

describe("fresh admin direct-message UI", () => {
    it("shows the chat screen in the permanent admin menu", () => {
        expect(sidebar).toContain('href: "/teacher/admin/chat"');
        expect(sidebar).toContain('label: "1:1 학생 질문"');
        expect(page).toContain('id="admin-chat-title"');
    });

    it("lists only conversations involving the signed-in administrator", () => {
        expect(page).toContain('.from("direct_messages")');
        expect(page).toContain('.or(`sender_id.eq.${staffId},receiver_id.eq.${staffId}`)');
        expect(page).not.toContain('.select("*")');
    });

    it("uses account IDs instead of display names to identify administrator replies", () => {
        expect(page).toContain("const isMine = message.sender_id === viewerId");
        expect(page).not.toContain('m.sender_name === "선생님"');
    });

    it("starts new chats only with active linked students", () => {
        expect(page).toContain("!student.auth_user_id");
        expect(page).toContain('status !== "active"');
        expect(page).toContain("로그인 연결이 완료된 학생");
    });

    it("checks database errors and preserves a failed reply", () => {
        expect(page).toContain("if (error) throw error");
        expect(page).toContain("setInput(pendingContent)");
        expect(page).toContain("내용을 그대로 보관했으니 다시 눌러주세요.");
        expect(page).toContain("maxLength={2000}");
    });

    it("subscribes only to messages sent or received by the signed-in administrator", () => {
        expect(page).toContain("filter: `sender_id=eq.${viewerId}`");
        expect(page).toContain("filter: `receiver_id=eq.${viewerId}`");
    });
});
