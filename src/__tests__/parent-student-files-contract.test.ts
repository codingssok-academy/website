import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("학부모 현황판 결과물 공개 계약", () => {
  it("시험 DB에서 학부모 공개 파일의 안전한 표시 정보만 조회한다", () => {
    const route = read("src/app/api/parent/v2/dashboard/route.ts");
    const fileQuery = route.match(/sb\.from\("student_files"\)([\s\S]*?)\.limit\(6\)/)?.[0] || "";

    expect(route).toContain("usesHashedStudentAccessCodes()");
    expect(fileQuery).toContain("id,original_name,mime_type,size_bytes,category,note,created_at");
    expect(fileQuery).toContain('.eq("visibility", "student_parent")');
    expect(fileQuery).not.toContain("storage_path");
    expect(fileQuery).not.toContain("uploaded_by");
  });

  it("결과물 다운로드와 미리보기는 기존의 권한 확인 API를 사용한다", () => {
    const page = read("src/app/parent/dashboard/page.tsx");

    expect(page).toContain('title="아이 결과물"');
    expect(page).toContain('href={`/api/student/files/${file.id}`}');
    expect(page).toContain('aria-label={`${file.name} 다운로드`}');
    expect(page).toContain('src={`/api/student/files/${previewFile.id}?mode=preview`}');
    expect(page).toContain('aria-modal="true"');
  });
});
