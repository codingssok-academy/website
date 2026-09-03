import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminSidebar from "./AdminSidebar";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
    usePathname: () => "/teacher/admin/chat",
    useRouter: () => ({ push }),
}));

vi.mock("next/image", () => ({
    default: ({ alt }: { alt: string }) => <span aria-label={alt} />,
}));

vi.mock("../context", () => ({
    useAdmin: () => ({ currentTeacher: { display_name: "관리자" } }),
}));

describe("AdminSidebar", () => {
    it("always shows a direct student chat menu", () => {
        render(<AdminSidebar />);

        const chatMenu = screen.getByRole("button", { name: "학생 1:1 채팅" });
        expect(chatMenu).toBeInTheDocument();
        fireEvent.click(chatMenu);
        expect(push).toHaveBeenCalledWith("/teacher/admin/chat");
    });

    it("keeps the group announcement menu separate", () => {
        render(<AdminSidebar />);
        expect(screen.getByRole("button", { name: "학생 1:1 채팅" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "전체 메시지" })).toBeInTheDocument();
    });
});
