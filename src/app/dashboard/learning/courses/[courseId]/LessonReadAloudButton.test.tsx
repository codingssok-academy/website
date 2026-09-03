import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LessonReadAloudButton, {
    extractReadableLessonText,
    splitLessonSpeech,
} from "./LessonReadAloudButton";

class MockSpeechSynthesisUtterance {
    text: string;
    lang = "";
    rate = 1;
    pitch = 1;
    onend: (() => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;

    constructor(text: string) {
        this.text = text;
    }
}

describe("LessonReadAloudButton", () => {
    const speak = vi.fn();
    const cancel = vi.fn();

    beforeEach(() => {
        speak.mockReset();
        cancel.mockReset();
        vi.stubGlobal("SpeechSynthesisUtterance", MockSpeechSynthesisUtterance);
        vi.stubGlobal("speechSynthesis", { speak, cancel });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("keeps lesson explanations but removes code and icon names", () => {
        const text = extractReadableLessonText(`
            <h2>첫 인사 프로그램</h2>
            <span class="material-symbols-outlined">record_voice_over</span>
            <p>화면에 인사말을 보여 줍니다.</p>
            <pre><code>print(&quot;안녕하세요&quot;)</code></pre>
        `);

        expect(text).toContain("첫 인사 프로그램");
        expect(text).toContain("화면에 인사말을 보여 줍니다");
        expect(text).not.toContain("print");
        expect(text).not.toContain("record_voice_over");
    });

    it("splits long explanations into short speech chunks", () => {
        const chunks = splitLessonSpeech(
            "첫 번째 설명입니다. 두 번째 설명은 조금 더 길게 이어집니다. 세 번째 설명입니다.",
            28,
        );

        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.every((chunk) => chunk.length <= 28)).toBe(true);
    });

    it("starts Korean speech, excludes code, and lets the student stop it", async () => {
        render(
            <LessonReadAloudButton
                title="첫 인사"
                html={'<p>인사말을 직접 만들어 보세요.</p><code>print("안녕")</code>'}
            />,
        );

        const playButton = screen.getByRole("button", { name: "설명 듣기" });
        await waitFor(() => expect(playButton).toBeEnabled());
        fireEvent.click(playButton);

        expect(speak).toHaveBeenCalledTimes(1);
        const utterance = speak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
        expect(utterance.text).toContain("인사말을 직접 만들어 보세요");
        expect(utterance.text).not.toContain("print");
        expect(utterance.lang).toBe("ko-KR");
        expect(utterance.rate).toBe(0.9);
        expect(screen.getByRole("button", { name: "듣기 중지" })).toHaveAttribute("aria-pressed", "true");

        fireEvent.click(screen.getByRole("button", { name: "듣기 중지" }));
        expect(cancel).toHaveBeenCalled();
        expect(screen.getByText("설명 듣기를 멈췄어요.")).toBeInTheDocument();
    });
});
