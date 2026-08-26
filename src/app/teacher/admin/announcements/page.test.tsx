import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AnnouncementsPage from "./page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("관리자 전체 메시지 화면", () => {
  it("가짜 메시지를 전체 학생에게 보내고 목록을 새로 불러온다", async () => {
    let sent = false;
    const fakeAnnouncement = {
      id: "message-1",
      title: "가짜 수업 안내",
      content: "가짜 학생에게 보여줄 시험 메시지입니다.",
      author_id: "admin-1",
      is_pinned: false,
      created_at: "2026-08-26T00:00:00.000Z",
    };
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        sent = true;
        return new Response(JSON.stringify({ success: true, announcement: fakeAnnouncement }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        announcements: sent ? [fakeAnnouncement] : [],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AnnouncementsPage />);

    expect(await screen.findByRole("heading", { name: "전체 메시지" })).toBeInTheDocument();
    expect(await screen.findByText("아직 보낸 전체 메시지가 없습니다.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("전체 메시지 제목"), {
      target: { value: "가짜 수업 안내" },
    });
    fireEvent.change(screen.getByLabelText("전체 메시지 내용"), {
      target: { value: "가짜 학생에게 보여줄 시험 메시지입니다." },
    });
    fireEvent.click(screen.getByRole("button", { name: "전체 학생에게 보내기" }));

    expect(await screen.findByText("전체 학생에게 메시지를 보냈습니다.")).toBeInTheDocument();
    expect(await screen.findByText("가짜 수업 안내")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(postCall?.[0]).toBe("/api/teacher/announcements");
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
      title: "가짜 수업 안내",
      content: "가짜 학생에게 보여줄 시험 메시지입니다.",
      isPinned: false,
    });
  });
});
