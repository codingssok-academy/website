import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildLearningReviewRequest } from "@/lib/learning-review-request";
import LearningReviewMarker from "./LearningReviewMarker";

const rows = [{
    sender_id: "teacher-auth",
    content: buildLearningReviewRequest({
        courseId: "3",
        unitId: "unit-1",
        pageId: "page-2",
        courseTitle: "파이썬 코어",
        unitTitle: "반복문",
        pageTitle: "직접 해보기",
        note: "반복 횟수를 다시 확인해 보세요.",
    }),
    created_at: "2026-09-03T01:00:00.000Z",
}];

const limit = vi.fn(() => Promise.resolve({ data: rows }));
const messageQuery = {
    select: vi.fn(() => messageQuery),
    in: vi.fn(() => messageQuery),
    like: vi.fn(() => messageQuery),
    order: vi.fn(() => messageQuery),
    limit,
};
const teacherQuery = {
    select: vi.fn(() => teacherQuery),
    in: vi.fn((column: string) => column === "role"
        ? Promise.resolve({ data: [{ id: "teacher-auth" }] })
        : teacherQuery),
};

vi.mock("@/lib/supabase", () => ({
    createClient: () => ({
        from: vi.fn((table: string) => table === "profiles" ? teacherQuery : messageQuery),
    }),
}));

describe("LearningReviewMarker", () => {
    beforeEach(() => vi.clearAllMocks());

    it("appears only on the page selected by the teacher", async () => {
        const { rerender } = render(
            <LearningReviewMarker
                enabled
                authUserId="student-auth"
                courseId="3"
                unitId="unit-1"
                pageId="page-2"
            />,
        );

        expect(await screen.findByText("선생님 확인 필요")).toBeInTheDocument();
        expect(screen.getByText("반복 횟수를 다시 확인해 보세요.")).toBeInTheDocument();

        rerender(
            <LearningReviewMarker
                enabled
                authUserId="student-auth"
                courseId="3"
                unitId="unit-1"
                pageId="another-page"
            />,
        );
        expect(screen.queryByText("선생님 확인 필요")).not.toBeInTheDocument();
    });

    it("does not load or show student requests in teacher view", () => {
        render(
            <LearningReviewMarker
                enabled={false}
                authUserId="teacher-auth"
                courseId="3"
                unitId="unit-1"
                pageId="page-2"
            />,
        );
        expect(limit).not.toHaveBeenCalled();
        expect(screen.queryByText("선생님 확인 필요")).not.toBeInTheDocument();
    });
});
