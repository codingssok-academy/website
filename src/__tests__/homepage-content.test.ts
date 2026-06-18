import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("homepage content", () => {
  it("uses the current homepage learning and curriculum sections", () => {
    const page = read("src/app/page.tsx");

    expect(page).toContain("PromoShowcase");
    expect(page).toContain("LiveStudySection");
    expect(page).toContain("Curriculum");
    expect(page).not.toContain("GrowthPlatformV2");
  });

  it("does not show the curriculum V2 heading copy", () => {
    const curriculum = read("src/components/sections/Curriculum.tsx");

    expect(curriculum).not.toContain("커리큘럼 V2");
    expect(curriculum).not.toContain("진도는 문법 목록이 아니라 사용 능력이다");
  });
});
