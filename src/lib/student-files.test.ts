import { describe, expect, it } from "vitest";
import { getStudentFilePreviewKind } from "./student-files";

describe("학생 파일 안전 미리보기", () => {
  it("이미지와 PDF만 미리보기 대상으로 분류한다", () => {
    expect(getStudentFilePreviewKind("가짜작품.png", "image/png")).toBe("image");
    expect(getStudentFilePreviewKind("가짜보고서.pdf", "application/pdf")).toBe("pdf");
    expect(getStudentFilePreviewKind("가짜작품.ent", "application/octet-stream")).toBeNull();
  });

  it("확장자와 파일 형식이 서로 다르면 미리보기를 차단한다", () => {
    expect(getStudentFilePreviewKind("위장파일.html", "image/png")).toBeNull();
    expect(getStudentFilePreviewKind("위장파일.png", "text/html")).toBeNull();
    expect(getStudentFilePreviewKind("위장파일.txt", "application/pdf")).toBeNull();
  });
});
