import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("learning platform routing", () => {
  it("opens the course and book list from the learning platform entry", () => {
    const learningPage = read("src/app/dashboard/learning/page.tsx");
    const coursesPage = read("src/app/dashboard/learning/courses/page.tsx");
    const layout = read("src/app/dashboard/learning/layout.tsx");

    expect(learningPage).toContain('redirect("/dashboard/learning/courses")');
    expect(coursesPage).toContain("bookshelfCourses");
    expect(coursesPage).toContain("/images/courses/kids-it.png");
    expect(coursesPage).toContain("/images/courses/programming-contest.png");
    expect(coursesPage).toContain("/dashboard/learning/courses/");
    expect(coursesPage).not.toContain("COURSES.map");
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
