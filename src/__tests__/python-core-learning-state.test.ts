import { describe, expect, it } from "vitest";

import {
    emptyLessonProgress,
    evaluateLessonCompletion,
    normalizeLessonAnswer,
    normalizeLessonProgress,
} from "@/lib/python-core-learning";

describe("Python Core learning state", () => {
    it("requires every page, quiz and coding task before lesson completion", () => {
        const summary = evaluateLessonCompletion({
            ...emptyLessonProgress(),
            visitedPageIds: ["p1", "p2", "p3"],
            correctQuizPageIds: ["p2"],
            successfulProblemIds: [101, 102],
        }, ["p1", "p2", "p3"], ["p2"], [101, 102]);

        expect(summary.ready).toBe(true);
        expect(summary.pages).toEqual({ completed: 3, total: 3 });
        expect(summary.quizzes).toEqual({ completed: 1, total: 1 });
        expect(summary.problems).toEqual({ completed: 2, total: 2 });
        expect(summary.activities).toEqual({ completed: 0, total: 0 });
    });

    it("tracks short project records when a lesson requires them", () => {
        const summary = evaluateLessonCompletion({
            ...emptyLessonProgress(),
            visitedPageIds: ["p1", "p2"],
            completedActivityPageIds: ["p2"],
        }, ["p1", "p2"], [], [], ["p2"]);

        expect(summary.ready).toBe(true);
        expect(summary.activities).toEqual({ completed: 1, total: 1 });
    });

    it("does not complete a lesson after only one correct quiz", () => {
        const summary = evaluateLessonCompletion({
            ...emptyLessonProgress(),
            visitedPageIds: ["p1", "p2"],
            correctQuizPageIds: ["p2"],
        }, ["p1", "p2", "p3"], ["p2", "p3"], [101]);

        expect(summary.ready).toBe(false);
        expect(summary.pages.completed).toBe(2);
        expect(summary.quizzes.completed).toBe(1);
        expect(summary.problems.completed).toBe(0);
    });

    it("normalizes saved answers and removes invalid progress values", () => {
        expect(normalizeLessonAnswer({
            quizAnswer: 2,
            quizResult: "correct",
            codeAnswers: { 101: "print('ok')", bad: 3 },
            updatedAt: "2026-08-25T00:00:00.000Z",
        })).toMatchObject({ quizAnswer: 2, quizResult: "correct", codeAnswers: { 101: "print('ok')" } });

        expect(normalizeLessonProgress({
            visitedPageIds: ["p1", "p1", 3],
            correctQuizPageIds: ["p2"],
            successfulProblemIds: [101, 101, -1, "102"],
        })).toMatchObject({ visitedPageIds: ["p1"], correctQuizPageIds: ["p2"], successfulProblemIds: [101] });
    });
});
