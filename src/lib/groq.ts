export const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MAX_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 4000;

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

type GroqChatBody = Record<string, unknown>;

type GroqFetchOptions = {
  maxRetries?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
    }
  }

  const backoff = 500 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(backoff + jitter, MAX_RETRY_DELAY_MS);
}

function shouldRetry(response: Response): boolean {
  return RETRYABLE_STATUSES.has(response.status);
}

export async function fetchGroqChatCompletion(
  apiKey: string,
  body: GroqChatBody,
  options: GroqFetchOptions = {},
): Promise<Response> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!shouldRetry(response) || attempt === maxRetries) return response;

    if (response.body) {
      await response.body.cancel().catch(() => undefined);
    }
    await sleep(retryDelayMs(response, attempt));
  }

  throw new Error("unreachable Groq retry loop state");
}
