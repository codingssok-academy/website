import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeProblemCard } from "./components";

const problem = {
    id: 3101,
    title: "첫 인사 프로그램 완성하기",
    difficulty: 1 as const,
    question: "인사 문장을 직접 작성해 실행해보세요.",
    answer: "print()를 사용합니다.",
    codeTemplate: 'print("안녕하세요!")',
};

function Harness({
    startBlank,
    executeCode = vi.fn(),
}: {
    startBlank?: boolean;
    executeCode?: (id: number, code: string) => void;
}) {
    const [editorCode, setEditorCode] = useState<Record<number, string>>({});
    const [showProblemAnswer, setShowProblemAnswer] = useState<Record<number, boolean>>({});

    return (
        <CodeProblemCard
            prob={problem}
            editorCode={editorCode}
            setEditorCode={setEditorCode}
            runResult={{}}
            runLoading={{}}
            executeCode={executeCode}
            showProblemAnswer={showProblemAnswer}
            setShowProblemAnswer={setShowProblemAnswer}
            startBlank={startBlank}
        />
    );
}

describe("CodeProblemCard", () => {
    it("starts Python Core with an empty editor and clears all typed code", () => {
        render(<Harness startBlank />);
        const editor = screen.getByRole("textbox");

        expect(editor).toHaveValue("");
        expect(editor).not.toHaveValue(problem.codeTemplate);

        fireEvent.change(editor, { target: { value: 'print("내가 직접 쓴 코드")' } });
        expect(editor).toHaveValue('print("내가 직접 쓴 코드")');

        fireEvent.click(screen.getByRole("button", { name: /전체 지우기/ }));
        expect(editor).toHaveValue("");
    });

    it("runs code typed from scratch even when it matches the lesson example", () => {
        const executeCode = vi.fn();
        render(<Harness startBlank executeCode={executeCode} />);

        fireEvent.change(screen.getByRole("textbox"), { target: { value: problem.codeTemplate } });
        fireEvent.click(screen.getByRole("button", { name: /실행하기/ }));

        expect(executeCode).toHaveBeenCalledWith(problem.id, problem.codeTemplate);
    });

    it("keeps starter code behavior for courses other than Python Core", () => {
        render(<Harness />);

        expect(screen.getByRole("textbox")).toHaveValue(problem.codeTemplate);
        expect(screen.getByRole("button", { name: /초기화/ })).toBeInTheDocument();
    });
});
