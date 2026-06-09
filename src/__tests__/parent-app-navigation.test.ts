import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("parent app navigation", () => {
  it("keeps only feedback and settings in the bottom tabs", () => {
    const nav = read("src/app/parent/ParentBottomNav.tsx");
    const hrefs = Array.from(nav.matchAll(/href:\s*"([^"]+)"/g)).map((match) => match[1]);

    expect(hrefs).toEqual(["/parent/feedback", "/parent/settings"]);
    expect(nav).not.toContain('label: "홈"');
    expect(nav).not.toContain('label: "성장"');
  });

  it("redirects retired parent home and growth routes to feedback", () => {
    const home = read("src/app/parent/page.tsx");
    const growth = read("src/app/parent/growth/page.tsx");

    expect(home).toContain('redirect("/parent/feedback")');
    expect(growth).toContain('redirect("/parent/feedback")');
  });

  it("keeps linked student switching on the feedback screen", () => {
    const feedback = read("src/app/parent/feedback/page.tsx");

    expect(feedback).toContain("readAllowedStudentNames");
    expect(feedback).toContain("selectAllowedStudent");
    expect(feedback).toContain("allowedNames.map");
  });

  it("shows settings as a read-only parent account screen without reset or retired tab controls", () => {
    const settings = read("src/app/parent/settings/page.tsx");

    expect(settings).toContain("연결된 학생");
    expect(settings).toContain("코딩쏙 학부모 앱");
    expect(settings).not.toContain("인증 초기화");
    expect(settings).not.toContain("데이터 초기화");
    expect(settings).not.toContain("clearParentStudentAccess");
    expect(settings).not.toContain('method: "DELETE"');
    expect(settings).not.toContain("readAllowedStudentNames");
    expect(settings).not.toContain("allowedNames.map");
    expect(settings).not.toContain("visibleNames.map");
    expect(settings).not.toContain('href="/parent"');
    expect(settings).not.toContain('href="/parent/growth"');
  });
});
