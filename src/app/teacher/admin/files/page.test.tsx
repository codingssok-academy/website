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

  it("선택한 학생에게 공개 범위와 설명을 포함한 파일을 올린다", async () => {
    const uploadedFile = {
      id: "uploaded-file", studentId: "student-1", uploadedByRole: "admin",
      originalName: "관리자작품.ent", mimeType: "application/octet-stream", sizeBytes: 12,
      category: "entry", note: "9월 엔트리 작품", visibility: "staff_only",
      createdAt: "2026-09-04T00:00:00.000Z", student: null,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        canManageVisibility: true,
        students: [{
          id: "student-1", name: "가짜학생", school: "가짜초등학교", grade: "3학년",
          className: "공통기초반", status: "active", linked: true,
        }],
        files: [],
      }))
      .mockResolvedValueOnce(jsonResponse({ success: true, file: uploadedFile }, 201));
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminStudentFilesPage />);

    const fileInput = await screen.findByLabelText("파일 선택");
    const file = new File(["fake content"], "관리자작품.ent", { type: "application/octet-stream" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText("분류"), { target: { value: "entry" } });
    fireEvent.change(screen.getByLabelText("공개 범위"), { target: { value: "staff_only" } });
    fireEvent.change(screen.getByLabelText(/파일 설명/), { target: { value: "9월 엔트리 작품" } });
    fireEvent.click(screen.getByRole("button", { name: "선택 학생에게 올리기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, uploadOptions] = fetchMock.mock.calls[1];
    expect(uploadOptions.method).toBe("POST");
    expect(uploadOptions.body).toBeInstanceOf(FormData);
    expect(uploadOptions.body.get("studentId")).toBe("student-1");
    expect(uploadOptions.body.get("category")).toBe("entry");
    expect(uploadOptions.body.get("visibility")).toBe("staff_only");
    expect(uploadOptions.body.get("note")).toBe("9월 엔트리 작품");
    expect(await screen.findByText("관리자작품.ent 파일을 선생님 전용으로 올렸습니다.")).toBeInTheDocument();
    expect(screen.getByText("관리자작품.ent")).toBeInTheDocument();
  });
});
