import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AITutor from "./AITutor";

describe("AITutor fallback", () => {
    beforeEach(() => {
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("keeps learning moving with a basic hint when the AI is unavailable", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
            JSON.stringify({ error: "쏙쌤이 잠시 쉬고 있어요." }),
            { status: 503, headers: { "Content-Type": "application/json" } },
        )));

        render(<AITutor context="파이썬 코어 > 반복문" currentLanguage="Python" />);
        fireEvent.click(screen.getByRole("button", { name: "쏙쌤 AI 질문 도우미" }));

        const input = screen.getByPlaceholderText("코딩 질문을 입력하세요...");
        fireEvent.change(input, { target: { value: "for 반복문이 어려워요" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(await screen.findByRole("heading", { name: "기본 힌트" })).toBeInTheDocument();
        expect(screen.getByText(/반복할 일을 한 줄로 정리/)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "선생님께 질문 남기기" })).toBeInTheDocument();
    });
});
