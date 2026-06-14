import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("homepage parent portal navigation", () => {
  it("renders the parent portal link directly on the homepage navbar", () => {
    const navbar = read("src/components/layout/Navbar.tsx");

    expect(navbar).toContain('href="/parent/feedback"');
    expect(navbar).toContain('aria-label="학부모 포털"');
    expect(navbar).toContain("학부모 포털");
    expect(navbar).not.toContain("앱 설치");
    expect(navbar).not.toContain('href="/install"');
  });
});
