import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { POST } from "./route";

describe("쏙쌤 후속 질문 API", () => {
  it("로그인하지 않은 사용자는 AI 후속 질문을 만들 수 없다", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "no session" },
        }),
      },
    });

    const response = await POST(new NextRequest("https://www.codingssok.com/api/tutor/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastQuestion: "반복문?", lastAnswer: "반복하는 문법이야." }),
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ suggestions: [] });
  });
});
