import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DigitalCreatorActionWriting } from "./DigitalCreatorActionWriting";

const activity = {
    label: "만들기·도전 기록",
    help: "한 단어나 짧은 문장으로 적어도 좋아요. 적은 내용은 자동 저장됩니다.",
    make: {
        prompt: "그림판에서 동그라미를 그려 보세요.",
        placeholder: "무엇을 해 보았는지 적어 보세요.",
    },
    challenge: {
        prompt: "색을 바꾸어 다시 만들어 보세요.",
        placeholder: "어떻게 바꾸었는지 적어 보세요.",
    },
};

describe("DigitalCreatorActionWriting", () => {
    it("shows two clearly labelled writing fields with simple guidance", () => {
        render(
            <DigitalCreatorActionWriting
                activity={activity}
                value={{ make: "", challenge: "" }}
                onChange={vi.fn()}
                saveStatus="idle"
            />,
        );

        expect(screen.getByRole("textbox", { name: /만들기:/ })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: /도전하기:/ })).toBeInTheDocument();
        expect(screen.getByText("적으면 자동 저장")).toBeInTheDocument();
        expect(screen.getByText(/한 단어나 짧은 문장/)).toBeInTheDocument();
    });

    it("returns each answer without removing the other answer", () => {
        const onChange = vi.fn();
        const view = render(
            <DigitalCreatorActionWriting
                activity={activity}
                value={{ make: "", challenge: "먼저 쓴 도전" }}
                onChange={onChange}
                saveStatus="saving"
            />,
        );

        fireEvent.change(screen.getByRole("textbox", { name: /만들기:/ }), { target: { value: "원을 그렸어요" } });
        expect(onChange).toHaveBeenLastCalledWith({ make: "원을 그렸어요", challenge: "먼저 쓴 도전" });

        view.rerender(
            <DigitalCreatorActionWriting
                activity={activity}
                value={{ make: "원을 그렸어요", challenge: "먼저 쓴 도전" }}
                onChange={onChange}
                saveStatus="saved"
            />,
        );
        fireEvent.change(screen.getByRole("textbox", { name: /도전하기:/ }), { target: { value: "파란색으로 바꿨어요" } });
        expect(onChange).toHaveBeenLastCalledWith({ make: "원을 그렸어요", challenge: "파란색으로 바꿨어요" });
        expect(screen.getByText("자동 저장됨")).toBeInTheDocument();
    });
});
