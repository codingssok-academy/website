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

describe("lesson read-aloud learning UI", () => {
    it("shows the read-aloud control on both student lesson routes while excluding media-only pages", () => {
        expect(coursePage).toContain("<LessonReadAloudButton");
        expect(coursePage).toContain('courseId !== "4" && !isIframePage');
        expect(pageDetail).toContain("<LessonReadAloudButton");
        expect(pageDetail).toContain("!currentPage.content.includes('<iframe')");
        expect(pageDetail).toContain("!currentPage.content.includes('cs-slide-wrap')");
    });
});
