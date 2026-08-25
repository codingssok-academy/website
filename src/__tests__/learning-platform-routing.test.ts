import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("learning platform routing", () => {
  it("keeps the learning platform entry on the 3D book dashboard", () => {
    const learningPage = read("src/app/dashboard/learning/page.tsx");
    const studentHome = read("src/app/dashboard/learning/components/StudentHomeScreen.tsx");
    const coursesPage = read("src/app/dashboard/learning/courses/page.tsx");
    const layout = read("src/app/dashboard/learning/layout.tsx");

    expect(learningPage).toContain("function BookCard");
    expect(learningPage).toContain("STUDENT_SHELF_COURSES.map");
    expect(learningPage).not.toContain("COURSES.slice(0,5).map");
    expect(learningPage).not.toContain("COURSES.slice(5,10).map");
    expect(studentHome).toContain("const visibleCourses = STUDENT_SHELF_COURSES");
    expect(learningPage).toContain("router.push(`/dashboard/learning/courses/${id}`)");
    expect(learningPage).toContain('"11": "디지털 창작자"');
    expect(learningPage).toContain('"10": "AI 프로젝트 랩"');
    expect(learningPage).toContain('"4": "알고리즘·대회"');
    expect(coursesPage).toContain('export { default } from "../page"');
    expect(coursesPage).not.toContain("배정센터");
    expect(layout).toContain('const isCourseList = pathname === "/dashboard/learning/courses"');
    expect(layout).toContain("isMainDashboard || isCourseList || isCourseDetail || isLivePage");
    expect(coursesPage).not.toContain('router.replace("/dashboard/learning")');
  });

  it("does not force admin or teacher accounts into the track assignment center", () => {
    const layout = read("src/app/dashboard/learning/layout.tsx");

    expect(layout).not.toContain('window.location.replace("/dashboard/learning/admin")');
    expect(layout).not.toContain('href="/dashboard/learning/admin"');
    expect(layout).not.toContain('href: "/dashboard/learning/admin"');
    expect(layout).not.toContain('"/dashboard/learning/admin" : "/"');
  });
});
