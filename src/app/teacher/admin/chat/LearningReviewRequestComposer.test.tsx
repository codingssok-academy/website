import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getCourseById } from "@/data/courses";
import { parseLearningReviewRequest } from "@/lib/learning-review-request";
import LearningReviewRequestComposer from "./LearningReviewRequestComposer";

describe("LearningReviewRequestComposer", () => {
    it("lets a teacher select an exact page and send a review marker", async () => {
        const course = getCourseById("3")!;
        const unit = course.chapters.flatMap(chapter => chapter.units).find(item => (item.pages?.length || 0) > 0)!;
        const page = unit.pages![0];
        const onSend = vi.fn().mockResolvedValue(true);

        render(
            <LearningReviewRequestComposer
                studentName="테스트학생"
                sending={false}
                onSend={onSend}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "선생님 확인 필요 표시" }));
        fireEvent.change(screen.getByLabelText("확인할 수업"), { target: { value: course.id } });
        fireEvent.change(screen.getByLabelText("확인할 단원"), { target: { value: unit.id } });
        fireEvent.change(screen.getByLabelText("확인할 학습 화면"), { target: { value: page.id } });
        fireEvent.change(screen.getByPlaceholderText("예: 반복문의 횟수를 다시 확인해 보세요."), {
            target: { value: "반복 횟수를 다시 확인해 보세요." },
        });
        fireEvent.click(screen.getByRole("button", { name: "학생 화면에 표시" }));

        await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
        const parsed = parseLearningReviewRequest(onSend.mock.calls[0][0]);
        expect(parsed).toMatchObject({
            courseId: course.id,
            unitId: unit.id,
            pageId: page.id,
            note: "반복 횟수를 다시 확인해 보세요.",
        });
        expect(await screen.findByRole("status")).toHaveTextContent("테스트학생 학생의 해당 학습 화면에 표시했습니다.");
    });

    it("does not enable sending until a page is selected", () => {
        render(
            <LearningReviewRequestComposer
                studentName="테스트학생"
                sending={false}
                onSend={vi.fn().mockResolvedValue(true)}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "선생님 확인 필요 표시" }));
        expect(screen.getByRole("button", { name: "학생 화면에 표시" })).toBeDisabled();
    });
});
