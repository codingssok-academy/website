import { describe, expect, it } from "vitest";
import {
    buildLearningReviewRequest,
    isLearningReviewRequestForPage,
    parseLearningReviewRequest,
} from "./learning-review-request";

const requestInput = {
    courseId: "3",
    unitId: "py-core-01",
    pageId: "py-core-01-04",
    courseTitle: "파이썬 코어",
    unitTitle: "첫 인사 프로그램",
    pageTitle: "직접 코드 작성하기",
    note: "print 문장을 한 번 더 작성해 보세요.",
};

describe("learning review request", () => {
    it("builds and parses a safe link to an exact learning page", () => {
        const message = buildLearningReviewRequest(requestInput);
        const parsed = parseLearningReviewRequest(message);

        expect(message).toContain("[선생님 확인 필요]");
        expect(parsed).toMatchObject(requestInput);
        expect(parsed?.href).toBe("/dashboard/learning/courses/3?unit=py-core-01&page=py-core-01-04");
    });

    it("removes line breaks from teacher notes", () => {
        const message = buildLearningReviewRequest({ ...requestInput, note: "첫 줄\n둘째 줄" });
        expect(message).toContain("선생님 말씀: 첫 줄 둘째 줄");
    });

    it("rejects ordinary or external messages", () => {
        expect(parseLearningReviewRequest("안녕하세요")).toBeNull();
        expect(parseLearningReviewRequest(
            "[선생님 확인 필요]\n학습 위치: A > B > C\n다시 볼 주소: https://example.com/dashboard/learning/courses/3?unit=u&page=p",
        )).toBeNull();
    });

    it("matches only the requested page", () => {
        const parsed = parseLearningReviewRequest(buildLearningReviewRequest(requestInput));
        expect(parsed && isLearningReviewRequestForPage(parsed, requestInput)).toBe(true);
        expect(parsed && isLearningReviewRequestForPage(parsed, { ...requestInput, pageId: "another" })).toBe(false);
    });
});
