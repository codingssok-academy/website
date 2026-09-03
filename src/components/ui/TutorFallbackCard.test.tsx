import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readTeacherQuestionDraft } from "@/lib/tutor-fallback";
import TutorFallbackCard from "./TutorFallbackCard";

describe("TutorFallbackCard", () => {
    beforeEach(() => sessionStorage.clear());

    it("shows a basic hint and prepares the question for the teacher message screen", () => {
        const onRetry = vi.fn();
        render(
            <TutorFallbackCard
                hint="오류가 난 줄의 괄호를 확인해 보세요."
                question="왜 실행이 안 돼요?"
                context="파이썬 코어 > 첫 수업"
                onRetry={onRetry}
            />,
        );

        expect(screen.getByRole("heading", { name: "기본 힌트" })).toBeInTheDocument();
        expect(screen.getByText(/오류가 난 줄/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "쏙쌤 다시 불러보기" }));
        expect(onRetry).toHaveBeenCalledOnce();

        const teacherLink = screen.getByRole("link", { name: "선생님께 질문 남기기" });
        expect(teacherLink).toHaveAttribute("href", "/dashboard/learning/dm");
        teacherLink.addEventListener("click", event => event.preventDefault());
        fireEvent.click(teacherLink);
        expect(readTeacherQuestionDraft()).toContain("궁금한 점: 왜 실행이 안 돼요?");
    });
});
