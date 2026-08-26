import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeacher: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth-teacher", () => ({
  requireTeacher: mocks.requireTeacher,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { DELETE, GET, PATCH, POST } from "./route";

function request(method: string, body: unknown) {
  return new NextRequest("https://www.codingssok.com/api/teacher/announcements", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const fakeAnnouncement = {
  id: "message-1",
  title: "가짜 수업 안내",
  content: "가짜 데이터로 만든 전체 메시지입니다.",
  author_id: "admin-1",
  is_pinned: true,
  created_at: "2026-08-26T00:00:00.000Z",
};

describe("관리자 전체 메시지 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTeacher.mockResolvedValue({ ok: true, userId: "admin-1", role: "admin" });
  });

  it("일반 선생님은 전체 메시지를 관리할 수 없다", async () => {
    mocks.requireTeacher.mockResolvedValue({ ok: true, userId: "teacher-1", role: "teacher" });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("관리자만");
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("관리자가 전체 메시지를 안전하게 보낸다", async () => {
    const single = vi.fn().mockResolvedValue({ data: fakeAnnouncement, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));
    mocks.createAdminClient.mockReturnValue({ from });

    const response = await POST(request("POST", {
      title: " 가짜 수업 안내 ",
      content: " 가짜 데이터로 만든 전체 메시지입니다. ",
      isPinned: true,
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ success: true, announcement: fakeAnnouncement });
    expect(from).toHaveBeenCalledWith("announcements");
    expect(insert).toHaveBeenCalledWith({
      title: "가짜 수업 안내",
      content: "가짜 데이터로 만든 전체 메시지입니다.",
      author_id: "admin-1",
      is_pinned: true,
    });
  });

  it("관리자가 기존 전체 메시지를 수정한다", async () => {
    const updated = { ...fakeAnnouncement, title: "수정한 가짜 안내", is_pinned: false };
    const single = vi.fn().mockResolvedValue({ data: updated, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    mocks.createAdminClient.mockReturnValue({ from });

    const response = await PATCH(request("PATCH", {
      id: "message-1",
      title: "수정한 가짜 안내",
      content: fakeAnnouncement.content,
      isPinned: false,
    }));

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      title: "수정한 가짜 안내",
      content: fakeAnnouncement.content,
      is_pinned: false,
    });
    expect(eq).toHaveBeenCalledWith("id", "message-1");
  });

  it("관리자가 전체 메시지를 삭제한다", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ delete: remove }));
    mocks.createAdminClient.mockReturnValue({ from });

    const response = await DELETE(request("DELETE", { id: "message-1" }));

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(eq).toHaveBeenCalledWith("id", "message-1");
  });
});
