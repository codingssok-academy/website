import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const coursePage = readFileSync(
    join(process.cwd(), "src/app/dashboard/learning/courses/[courseId]/page.tsx"),
    "utf8",
);

describe("Digital Creator learning UI", () => {
    it("saves activity answers and requires the packaged lesson flow before completion", () => {
        expect(coursePage).toContain("isDigitalCreatorPage");
        expect(coursePage).toContain("kids-activity-panel");
        expect(coursePage).toContain("updateDigitalCreatorAnswer");
        expect(coursePage).toContain("setActivityCompleted");
        expect(coursePage).toContain("lessonCompletion.activities.completed");
        expect(coursePage).toContain("10개 학습 화면과 네 번의 탐험 기록");
    });

    it("shows instructor guidance only in teacher view", () => {
        expect(coursePage).toContain("isTeacherView && activePage.teacherGuide");
        expect(coursePage).toContain("강사용 지도안 열기");
        expect(coursePage).toContain("아이에게 이렇게 설명하세요");
    });
});
