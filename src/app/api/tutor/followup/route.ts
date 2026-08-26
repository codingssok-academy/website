/**
 * /api/tutor/followup
 *
 * 방금 받은 AI 답변을 기반으로 3개의 후속 질문 제안
 * 작은 모델(llama-3.1-8b-instant)로 빠르게 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { truncate } from "@/lib/text-utils";
import { fetchGroqChatCompletion } from "@/lib/groq";

const MODEL = "llama-3.1-8b-instant";

export async function POST(req: NextRequest) {
    const authClient = await createClient();
    const {
        data: { user },
        error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ suggestions: [] }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ suggestions: [] });
    }

    try {
        const body = await req.json();
        const {
            lastQuestion,
            lastAnswer,
            context,
        } = body as {
            lastQuestion?: string;
            lastAnswer?: string;
            context?: string;
        };

        if (!lastAnswer || typeof lastAnswer !== "string") {
            return NextResponse.json({ suggestions: [] });
        }

        // Rate Limit: IP당 분당 20회
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const { success } = await rateLimit(`followup:${user.id}:${ip}`, { maxRequests: 20, windowMs: 60_000 });
        if (!success) return NextResponse.json({ suggestions: [] });

        const systemPrompt = [
            "You generate follow-up coding questions for a Korean K-12 student.",
            "Use short, age-appropriate Korean that a K-12 student can understand.",
            context ? `Current lesson: ${context}.` : "",
            "",
            "Return EXACTLY a JSON array of 3 short Korean follow-up questions the student might ask next.",
            "Each question: 5-20 characters, natural spoken Korean, ends with ?",
            "Focus: deeper understanding, related concepts, hands-on practice.",
            "Example: [\"배열이랑 뭐가 달라?\", \"실제 예제가 더 있을까?\", \"에러 나면 어떻게 고쳐?\"]",
            "NO explanation, ONLY the JSON array.",
        ].filter(Boolean).join("\n");

        const userPrompt = `Question: ${truncate(lastQuestion || "", 300)}\nAnswer: ${truncate(lastAnswer, 800)}`;

        const res = await fetchGroqChatCompletion(apiKey, {
                model: MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.8,
                max_tokens: 200,
        });

        if (!res.ok) return NextResponse.json({ suggestions: [] });
        const data = await res.json();
        const text: string = data.choices?.[0]?.message?.content || "";

        // JSON 배열 추출
        const match = text.match(/\[[^\]]+\]/);
        if (!match) return NextResponse.json({ suggestions: [] });

        let suggestions: string[] = [];
        try {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed)) {
                suggestions = parsed
                    .filter((s: unknown): s is string => typeof s === "string")
                    .map((s) => s.trim())
                    .filter((s) => s.length >= 3 && s.length <= 60)
                    .slice(0, 3);
            }
        } catch { /* ignore */ }

        return NextResponse.json({ suggestions });
    } catch {
        return NextResponse.json({ suggestions: [] });
    }
}
