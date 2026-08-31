import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const components = readFileSync(
    join(process.cwd(), "src/app/dashboard/learning/courses/[courseId]/components.tsx"),
    "utf8",
);
const coursePage = readFileSync(
    join(process.cwd(), "src/app/dashboard/learning/courses/[courseId]/page.tsx"),
    "utf8",
);
const pageDetail = readFileSync(
    join(process.cwd(), "src/app/dashboard/learning/courses/[courseId]/units/[unitId]/pages/[pageId]/page.tsx"),
    "utf8",
);

describe("Python Core learning UI", () => {
    it("starts only Python Core code problems blank while preserving other courses", () => {
        expect(components).toContain("startBlank = false");
        expect(components).toContain('const initialCode = startBlank ? ""');
        expect(components).toContain('startBlank ? "전체 지우기" : "초기화"');
        expect(coursePage).toContain("startBlank={isPythonCorePage}");
        expect(pageDetail).toContain('startBlank={courseId === "3"');
    });

    it("accepts a non-empty successful program even when the student typed the lesson example exactly", () => {
        expect(coursePage).toContain("if (code.trim().length > 0)");
        expect(coursePage).toContain("코드를 직접 작성한 뒤 실행하면 코딩 활동이 인정됩니다.");
        expect(coursePage).not.toContain("예제 코드를 한 곳 이상 직접 바꾼 뒤");
    });
});
