import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const coursePage = readFileSync(
    join(process.cwd(), "src/app/dashboard/learning/courses/[courseId]/page.tsx"),
    "utf8",
);
const pageDetail = readFileSync(
    join(process.cwd(), "src/app/dashboard/learning/courses/[courseId]/units/[unitId]/pages/[pageId]/page.tsx"),
    "utf8",
);
const learningPage = readFileSync(
    join(process.cwd(), "src/app/dashboard/learning/page.tsx"),
    "utf8",
);
const coursesData = readFileSync(
    join(process.cwd(), "src/data/courses/index.ts"),
    "utf8",
);

describe("Digital Creator learning UI", () => {
    it("saves activity answers and requires the packaged lesson flow before completion", () => {
        expect(coursePage).toContain("isDigitalCreatorPage");
        expect(coursePage).toContain("activePage?.id.startsWith('digital-creator-v2-')");
        expect(coursePage).toContain('selectedUnit?.id.startsWith("digital-creator-v2-")');
        expect(coursePage).toContain("kids-activity-panel");
        expect(coursePage).toContain("updateProjectActivityAnswer");
        expect(coursePage).toContain("setActivityCompleted");
        expect(coursePage).toContain("lessonCompletion.activities.completed");
        expect(coursePage).toContain("10개 학습 화면과 네 번의 활동 기록");
        expect(coursePage).toContain("PictureChoiceActivity");
        expect(coursePage).toContain("pictureChoiceSaveStatus");
        expect(coursePage).toContain("DigitalCreatorActionWriting");
        expect(coursePage).toContain("projectActionAnswers");
        expect(coursePage).toContain("make: projectActionAnswers.make");
        expect(coursePage).toContain("challenge: projectActionAnswers.challenge");
        expect(pageDetail).toContain("DigitalCreatorActionWriting");
        expect(pageDetail).toContain("actionWritingSaveStatus");
        expect(coursePage).toContain("DigitalCreatorLessonProgress");
        expect(coursePage).toContain("screens={lessonCompletion.pages}");
        expect(coursePage).toContain("records={lessonCompletion.activities}");
    });

    it("shows instructor guidance only in teacher view", () => {
        expect(coursePage).toContain("isTeacherView && activePage.teacherGuide");
        expect(coursePage).toContain("강사용 지도안 열기");
        expect(coursePage).toContain("아이에게 이렇게 설명하세요");
    });

    it("uses a child-friendly textbook layout in both lesson routes", () => {
        expect(coursePage).toContain("디지털 창작자 · 초등 교과서형");
        expect(coursePage).toContain(".course-content-pad .kids-it-think-box");
        expect(coursePage).toContain(".course-content-pad .kids-it-illustration-frame");
        expect(coursePage).toContain("img:not(.kids-it-illustration)");
        expect(pageDetail).toContain(".kids-it-content .kids-it-textbook");
        expect(pageDetail).toContain(".kids-it-content .kids-it-record-box");
    });

    it("does not mistake a textbook illustration for an iframe and keeps the reader inside one page", () => {
        expect(coursePage).toContain('activePage.content.match(/<iframe\\b');
        expect(coursePage).not.toContain('const iframeSrcMatch = activePage.content.match(/src=');
        expect(coursePage).toContain("digital-creator-reader");
        expect(coursePage).toContain("digital-creator-material");
        expect(coursePage).toContain("kids-page-nav");
        expect(coursePage).toContain("const pageIdxInUnit = pages.findIndex");
        expect(coursePage).toContain('content:\'교사용 지도서\'');
    });

    it("uses cover images with the final course titles printed into the artwork", () => {
        expect(learningPage).not.toContain("bk-cover-renamed-title");
        expect(coursesData).toContain("/images/courses/kids-it-v2.png");
        expect(coursesData).toContain("/images/courses/ai-class-v2.png");
        expect(coursesData).toContain("/images/courses/cpp-v2.png");
    });
});
