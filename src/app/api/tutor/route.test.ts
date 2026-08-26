import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  process.env.GROQ_API_KEY = "test-groq-key";
  return {
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
    rateLimit: vi.fn(),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
}));

import { POST } from "./route";

function tutorRequest(body: unknown) {
  return new NextRequest("https://www.codingssok.com/api/tutor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

describe("쏙쌤 AI 질문 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAdminClient.mockReturnValue(null);
    mocks.rateLimit.mockResolvedValue({ success: true, remaining: 9 });
  });

  it("로그인하지 않은 사용자의 질문을 AI에 보내지 않는다", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "no session" },
        }),
      },
    });
    const groqFetch = vi.fn();
    vi.stubGlobal("fetch", groqFetch);

    const response = await POST(tutorRequest({
      messages: [{ role: "user", content: "반복문이 뭐예요?" }],
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain("학생 로그인");
    expect(groqFetch).not.toHaveBeenCalled();
  });

  it("화면이 보낸 학생 번호 대신 로그인한 학생 번호로 질문한다", async () => {
    const verifiedStudentId = "11111111-1111-4111-8111-111111111111";
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: verifiedStudentId } },
          error: null,
        }),
      },
    });

    const groqFetch = vi.fn().mockResolvedValue(new Response(
      'data: {"choices":[{"delta":{"content":"반복문은 같은 일을 반복할 때 사용해."}}]}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    vi.stubGlobal("fetch", groqFetch);

    const response = await POST(tutorRequest({
      studentId: "99999999-9999-4999-8999-999999999999",
      studentName: "다른학생",
      mode: "socratic",
      context: "파이썬 반복문",
      messages: [{ role: "user", content: "비밀번호 1234인데 반복문이 뭐예요?" }],
    }));
    const streamText = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(streamText).toContain("반복문은 같은 일을 반복할 때 사용해.");
    expect(mocks.rateLimit).toHaveBeenCalledWith(
      `tutor-min:${verifiedStudentId}:203.0.113.10`,
      { maxRequests: 10, windowMs: 60_000 },
    );

    const groqOptions = groqFetch.mock.calls[0]?.[1] as RequestInit;
    const groqBody = JSON.parse(String(groqOptions.body));
    expect(groqBody.model).toBe("openai/gpt-oss-120b");
    expect(groqBody.messages[0].content).toContain("You are 쏙쌤");
    expect(groqBody.messages[0].content).not.toContain("다른학생");
    expect(groqBody.messages.at(-1).content).toContain("비밀번호 [숨김]");
  });

  it("직답 모드를 요청해도 학생에게는 힌트 방식으로만 답한다", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "22222222-2222-4222-8222-222222222222" } },
          error: null,
        }),
      },
    });

    const groqFetch = vi.fn().mockResolvedValue(new Response(
      'data: {"choices":[{"delta":{"content":"첫 번째 힌트야."}}]}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    vi.stubGlobal("fetch", groqFetch);

    const response = await POST(tutorRequest({
      mode: "direct",
      messages: [{ role: "user", content: "정답 코드를 바로 알려줘" }],
    }));
    const streamText = await response.text();
    const groqOptions = groqFetch.mock.calls[0]?.[1] as RequestInit;
    const groqBody = JSON.parse(String(groqOptions.body));

    expect(response.status).toBe(200);
    expect(streamText).toContain('"mode":"socratic"');
    expect(groqBody.messages[0].content).toContain("절대 직접 답을 주지 마세요");
    expect(groqBody.messages[0].content).not.toContain("TEACHING RULES (직답 모드)");
    expect(groqBody.temperature).toBe(0.5);
    expect(groqBody.max_tokens).toBe(300);
  });
});
