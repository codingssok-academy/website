import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminStudentFilesPage from "./page";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("관리자 학생 파일 공개 범위", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("학부모 공개와 선생님만 보기 중 하나를 선택해 저장한다", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        canManageVisibility: true,
        students: [{
          id: "student-1", name: "가짜학생", school: "가짜초등학교", grade: "3학년",
          className: "공통기초반", status: "active", linked: true,
        }],
        files: [{
          id: "file-1", studentId: "student-1", uploadedByRole: "student",
          originalName: "가짜작품.ent", mimeType: "application/octet-stream", sizeBytes: 2048,
          category: "entry", note: "가짜 작품", visibility: "student_parent",
          createdAt: "2026-09-04T00:00:00.000Z", student: null,
        }],
      }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        file: { id: "file-1", visibility: "staff_only" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminStudentFilesPage />);

    expect(await screen.findByText("가짜작품.ent")).toBeInTheDocument();
    const parentButton = screen.getByRole("button", { name: "가짜작품.ent을 학부모 공개로 변경" });
    const staffButton = screen.getByRole("button", { name: "가짜작품.ent을 선생님만 보기로 변경" });
    expect(parentButton).toHaveAttribute("aria-pressed", "true");
    expect(staffButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(staffButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/teacher/student-files", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ fileId: "file-1", visibility: "staff_only" }),
    }));
    expect(await screen.findByText("가짜작품.ent 파일을 선생님만 볼 수 있게 변경했습니다.")).toBeInTheDocument();
    expect(staffButton).toHaveAttribute("aria-pressed", "true");
  });
});
