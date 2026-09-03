import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mergePersistenceStatuses, StudentSaveStatus } from "./StudentSaveStatus";

describe("StudentSaveStatus", () => {
    it("uses simple wording when the academy account save succeeds", () => {
        render(<StudentSaveStatus status="saved" />);

        expect(screen.getByRole("status")).toHaveTextContent("학원 계정에 안전하게 저장됐어요");
        expect(screen.queryByRole("button", { name: "다시 저장하기" })).not.toBeInTheDocument();
    });

    it.each([
        ["local", "이 기기에 임시 저장됐어요"],
        ["error", "아직 저장되지 않았어요"],
    ] as const)("offers a retry when the status is %s", (status, message) => {
        const onRetry = vi.fn();
        render(<StudentSaveStatus status={status} onRetry={onRetry} />);

        expect(screen.getByRole("status")).toHaveTextContent(message);
        fireEvent.click(screen.getByRole("button", { name: "다시 저장하기" }));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it("shows the most important state when more than one lesson save is active", () => {
        expect(mergePersistenceStatuses("saved", "saving")).toBe("saving");
        expect(mergePersistenceStatuses("saved", "local")).toBe("local");
        expect(mergePersistenceStatuses("local", "error")).toBe("error");
    });
});
