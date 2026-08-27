import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PictureChoiceActivity } from "./PictureChoiceActivity";

const activity = {
    label: "그림 카드 고르기",
    prompt: "컴퓨터로 해 본 일을 하나 이상 골라보세요.",
    soloGuide: "혼자라면 소리 내어 말해 보세요.",
    groupGuide: "함께라면 친구나 선생님에게 이야기해 보세요.",
    options: [
        { id: "drawing", emoji: "🎨", label: "그림 그리기", description: "그림판이나 꾸미기" },
        { id: "game", emoji: "🎮", label: "게임하기", description: "규칙을 보고 플레이하기" },
    ],
};

describe("PictureChoiceActivity", () => {
    it("shows visual choices and guidance for both solo and group learning", () => {
        render(<PictureChoiceActivity activity={activity} value="" onChange={vi.fn()} saveStatus="idle" />);

        expect(screen.getByRole("button", { name: /그림 그리기/ })).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByRole("button", { name: /게임하기/ })).toBeInTheDocument();
        expect(screen.getByText("혼자 할 때")).toBeInTheDocument();
        expect(screen.getByText("함께 할 때")).toBeInTheDocument();
    });

    it("returns the selected card labels in a saveable answer", () => {
        const onChange = vi.fn();
        const view = render(<PictureChoiceActivity activity={activity} value="" onChange={onChange} saveStatus="idle" />);

        fireEvent.click(screen.getByRole("button", { name: /그림 그리기/ }));
        expect(onChange).toHaveBeenLastCalledWith("그림 그리기");

        view.rerender(<PictureChoiceActivity activity={activity} value="그림 그리기" onChange={onChange} saveStatus="saved" />);
        fireEvent.click(screen.getByRole("button", { name: /게임하기/ }));
        expect(onChange).toHaveBeenLastCalledWith("그림 그리기 · 게임하기");
        expect(screen.getByText("자동 저장됨")).toBeInTheDocument();
    });
});
