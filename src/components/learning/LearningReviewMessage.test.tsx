import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildLearningReviewRequest } from "@/lib/learning-review-request";
import LearningReviewMessage from "./LearningReviewMessage";

describe("LearningReviewMessage", () => {
    it("shows a direct link for a structured teacher request", () => {
        render(<LearningReviewMessage content={buildLearningReviewRequest({
            courseId: "3",
            unitId: "unit-1",
            pageId: "page-2",
            courseTitle: "파이썬 코어",
            unitTitle: "반복문",
            pageTitle: "직접 해보기",
            note: "반복 횟수를 확인해 보세요.",
        })} />);

        expect(screen.getByText("선생님 확인 필요")).toBeInTheDocument();
        expect(screen.getByText("반복 횟수를 확인해 보세요.")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "해당 학습 화면 열기" })).toHaveAttribute(
            "href",
            "/dashboard/learning/courses/3?unit=unit-1&page=page-2",
        );
    });

    it("keeps an ordinary message unchanged", () => {
        render(<LearningReviewMessage content="수업 준비물을 챙겨 오세요." />);
        expect(screen.getByText("수업 준비물을 챙겨 오세요.")).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
});
