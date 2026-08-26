import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rateLimit: vi.fn(),
  fetchGroqChatCompletion: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
}));

vi.mock("@/lib/groq", () => ({
  fetchGroqChatCompletion: mocks.fetchGroqChatCompletion,
}));

import { POST } from "./route";

describe("쏙쌤 후속 질문 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GROQ_API_KEY", "test-groq-key");
    mocks.rateLimit.mockResolvedValue({ success: true, remaining: 19 });
  });

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

  it("공식 경량 모델로 후속 질문을 만든다", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
          error: null,
        }),
      },
    });
    mocks.fetchGroqChatCompletion.mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: '["반복 횟수는 어떻게 정해?","while문과 뭐가 달라?","직접 연습해 볼까?"]' } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    const response = await POST(new NextRequest("https://www.codingssok.com/api/tutor/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.10" },
      body: JSON.stringify({ lastQuestion: "반복문?", lastAnswer: "반복하는 문법이야." }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.suggestions).toHaveLength(3);
    expect(mocks.fetchGroqChatCompletion).toHaveBeenCalledWith(
      "test-groq-key",
      expect.objectContaining({ model: "openai/gpt-oss-20b" }),
    );
  });
});
