import { describe, expect, it } from "vitest";
import { createLearningResume, findLatestLearningResume, type LearningActivityRow } from "./learning-resume";

const validRow: LearningActivityRow = {
    course_id: "11",
    course_title: "디지털 창작자",
    unit_id: "digital-creator-v2-u01",
    unit_title: "컴퓨터 탐험대 출발",
    page_id: "digital-creator-v2-004",
    page_title: "만들기 도전",
    started_at: "2026-08-28T10:00:00.000Z",
};

describe("learning resume", () => {
    it("builds an exact lesson link and remaining-step count from the activity log", () => {
        const resume = createLearningResume(validRow);

        expect(resume).not.toBeNull();
        expect(resume?.href).toBe(
            "/dashboard/learning/courses/11?unit=digital-creator-v2-u01&page=digital-creator-v2-004",
        );
        expect(resume?.currentStep).toBe(4);
        expect(resume?.totalSteps).toBe(10);
        expect(resume?.remainingSteps).toBe(6);
        expect(resume?.progressPercent).toBe(40);
    });

    it("skips obsolete records and uses the newest record that still matches the curriculum", () => {
        const obsolete = { ...validRow, page_id: "removed-page" };
        expect(findLatestLearningResume([obsolete, validRow])?.pageId).toBe(validRow.page_id);
    });

    it("does not create a misleading link when a record cannot be matched", () => {
        expect(createLearningResume({ ...validRow, course_id: "missing-course" })).toBeNull();
    });
});
