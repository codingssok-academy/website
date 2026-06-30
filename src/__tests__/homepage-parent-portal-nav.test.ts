import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("homepage parent portal navigation", () => {
  it("renders the parent portal link directly on desktop and mobile homepage navigation", () => {
    const navbar = read("src/components/layout/Navbar.tsx");

    expect(navbar).toContain('const PARENT_PORTAL_HREF = "/parent/feedback"');
    expect(navbar).toContain('aria-label="학부모 포털"');
    expect(navbar).toContain("학부모 포털");
    expect(navbar).toContain("mobile-parent-portal-link");
    expect(navbar).toContain("학생 이름과 인증번호로 수업 피드백을 바로 확인합니다.");
    expect(navbar).not.toContain("앱 설치");
    expect(navbar).not.toContain('href="/install"');
  });
});
