import { describe, expect, it } from "vitest";
import {
  normalizeGrowthArtifactTitle,
  normalizeGrowthArtifactUrl,
  safeGrowthArtifactUrl,
} from "./growth-artifacts";

describe("성장 기록 결과물 입력", () => {
  it("결과물 제목의 불필요한 공백을 정리한다", () => {
    expect(normalizeGrowthArtifactTitle("  가짜   우주 게임  ")).toBe("가짜 우주 게임");
  });

  it("http와 https 공유 주소만 허용한다", () => {
    expect(normalizeGrowthArtifactUrl("https://playentry.org/project/fake")).toBe(
      "https://playentry.org/project/fake",
    );
    expect(() => normalizeGrowthArtifactUrl("javascript:alert(1)")).toThrow(
      "http 또는 https",
    );
    expect(safeGrowthArtifactUrl("javascript:alert(1)")).toBeNull();
  });
});
