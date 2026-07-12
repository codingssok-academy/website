import { describe, expect, it } from "vitest";
import {
  formatStudentDisplayName,
  formatStudentPossessive,
  formatStudentWithHonorific,
  getGrowthPreviewEnvironment,
  getGrowthPreviewEnvironmentCopy,
  shouldShowGrowthPreviewDemoNavigation,
} from "@/features/growth-v2/preview-presentation";

describe("growth preview presentation", () => {
  it("uses safe local guidance by default and for unknown values", () => {
    expect(getGrowthPreviewEnvironment()).toBe("local");
    expect(getGrowthPreviewEnvironment("unexpected")).toBe("local");
    expect(getGrowthPreviewEnvironmentCopy("unexpected")).toMatchObject({
      label: "Growth 2.0 로컬 연습 환경",
      badge: "로컬 데모",
    });
  });

  it("uses separate staging guidance only for the explicit staging value", () => {
    expect(getGrowthPreviewEnvironment("staging")).toBe("staging");
    expect(getGrowthPreviewEnvironmentCopy("staging")).toMatchObject({
      label: "Growth 2.0 시험 환경",
      badge: "시험 환경",
    });
  });

  it("shows demo navigation only for the explicit value 1", () => {
    expect(shouldShowGrowthPreviewDemoNavigation("1")).toBe(true);
    expect(shouldShowGrowthPreviewDemoNavigation("0")).toBe(false);
    expect(shouldShowGrowthPreviewDemoNavigation("true")).toBe(false);
    expect(shouldShowGrowthPreviewDemoNavigation()).toBe(false);
  });

  it("normalizes student names without adding a second honorific", () => {
    expect(formatStudentDisplayName("  테스트  학생 A  ")).toBe("테스트 학생 A");
    expect(formatStudentPossessive("  테스트 학생 A  ")).toBe("테스트 학생 A의");
    expect(formatStudentPossessive("민준 학생")).toBe("민준 학생의");
    expect(formatStudentPossessive("민준")).toBe("민준 학생의");
    expect(formatStudentWithHonorific("테스트 학생 민준")).toBe("테스트 학생 민준");
    expect(formatStudentWithHonorific("민준")).toBe("민준 학생");
    expect(formatStudentPossessive("민준 학생")).not.toContain("학생 학생");
  });
});
