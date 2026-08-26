/**
 * /api/tutor
 *
 * 쏙쌤 AI 튜터 — Memory + Concept Tracking + Socratic Mode
 *
 * Phase 2 추가 기능:
 * - 최근 대화 5건을 시스템 프롬프트에 주입 (메모리 증강)
 * - 자주 물어본 개념 TOP 5 주입 (약점 인식)
 * - Socratic vs Direct 모드 토글
 * - 응답 후 개념 자동 추출 & 태깅 (비동기)
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { truncate } from "@/lib/text-utils";

const GROQ_KEY = process.env.GROQ_API_KEY || "";
const MODEL = "llama-3.3-70b-versatile";
const CONCEPT_MODEL = "llama-3.1-8b-instant"; // 태깅은 빠르고 저렴한 모델
const MAX_CODE_CHARS = 3000;
const MAX_ERROR_CHARS = 500;
const MAX_CONTENT_CHARS = 2000;
const MEMORY_MESSAGES = 10; // 최근 5쌍(user+assistant)
const MAX_WEAK_CONCEPTS = 5;

type TutorMode = "direct" | "socratic";

function redactPrivateCodes(input: string) {
    return truncate(input, MAX_CONTENT_CHARS).replace(
        /((?:비밀번호|인증번호|password|passcode|pin)\s*[:=]?\s*)\d{4,}/gi,
        "$1[숨김]",
    );
}

function buildSystemPrompt(opts: {
    mode: TutorMode;
    context?: string;
    currentCode?: string;
    currentLanguage?: string;
    currentError?: string;
    weakConcepts?: { concept: string; ask_count: number }[];
    pastExchanges?: { role: string; content: string; created_at: string }[];
}): string {
    const lines: string[] = [
        "You are 쏙쌤, a friendly AI coding tutor at 코딩쏙 academy in Daejeon, Korea.",
        "You teach ALL programming languages, algorithms, data structures, and CS theory.",
        "Never ask for or repeat passwords, parent access codes, phone numbers, or other personal information.",
    ];

    // 모드별 교수 방식
    if (opts.mode === "socratic") {
        lines.push(
            "",
            "★★★ 소크라틱 모드 (반드시 준수) ★★★",
            "- 절대 직접 답을 주지 마세요. 답은 학생이 스스로 발견해야 합니다.",
            "- 대신 한 번에 1개의 작은 질문으로 학생을 유도하세요.",
            "- 학생의 답이 틀리면 '왜 그렇게 생각해?'처럼 생각을 물어보세요.",
            "- 학생이 맞는 방향으로 가면 '좋아! 그럼 다음은?' 격려하세요.",
            "- 힌트는 주되, 완성 코드는 절대 X.",
            "- 답변 길이: 3~5줄로 짧게.",
            "- 예: '일단 이 코드에서 p가 뭘 가리키고 있을까?' 같은 질문형."
        );
    } else {
        lines.push(
            "",
            "TEACHING RULES (직답 모드):",
            "1. Answer fully and helpfully. Never refuse coding questions.",
            "2. Include working code examples with Korean comments.",
            "3. Explain WHY the code works (step by step).",
            "4. Suggest a practice exercise at the end.",
            "5. Respond in Korean casual tone (반말 OK, 따뜻하게).",
            "6. Max 3 paragraphs + code.",
            "7. Use markdown ```code``` blocks.",
            "8. 학생이 좌절하면 격려."
        );
    }

    // 약점 개념 주입
    if (opts.weakConcepts && opts.weakConcepts.length > 0) {
        const top = opts.weakConcepts
            .slice(0, MAX_WEAK_CONCEPTS)
            .map(c => `${c.concept}(${c.ask_count}회)`)
            .join(", ");
        lines.push(
            "",
            `STUDENT WEAK POINTS: ${top}`,
            "→ 이 개념들은 학생이 자주 헷갈려 함. 관련 질문이면 기본부터 다시 점검."
        );
    }

    // 최근 대화 요약 주입 (메모리)
    if (opts.pastExchanges && opts.pastExchanges.length > 0) {
        lines.push("", "RECENT CONVERSATION WITH THIS STUDENT:");
        for (const ex of opts.pastExchanges.slice(-6)) {
            const prefix = ex.role === "user" ? "학생" : "나";
            lines.push(`- [${ex.created_at.slice(5, 10)}] ${prefix}: ${truncate(ex.content, 150)}`);
        }
        lines.push("→ 이전에 무엇을 물었는지 참고해서 중복 설명 피하기. 연속성 유지.");
    }

    if (opts.context) {
        lines.push("", `LESSON CONTEXT: "${opts.context}" 단원 학습 중.`);
    }

    if (opts.currentCode) {
        const lang = opts.currentLanguage || "code";
        lines.push(
            "",
            "STUDENT'S CURRENT CODE:",
            "```" + lang,
            truncate(opts.currentCode, MAX_CODE_CHARS),
            "```",
            "이 코드를 기반으로 답변. 버그/개선점 구체적으로 지적."
        );
    }

    if (opts.currentError) {
        lines.push(
            "",
            "RECENT ERROR/OUTPUT:",
            truncate(opts.currentError, MAX_ERROR_CHARS)
        );
    }

    return lines.join("\n");
}

async function saveConversation(
    userId: string | null,
    sessionId: string,
    contextKey: string | null,
    role: "user" | "assistant",
    content: string
): Promise<void> {
    try {
        const supabase = createAdminClient();
        if (!supabase) return;
        await supabase.from("tutor_conversations").insert({
            user_id: userId,
            session_id: sessionId,
            context_key: contextKey,
            role,
            content: truncate(content, MAX_CONTENT_CHARS),
        });
    } catch { /* 저장 실패는 응답에 영향 X */ }
}

async function fetchRecentExchanges(
    userId: string | null,
    sessionId: string
): Promise<{ role: string; content: string; created_at: string }[]> {
    if (!userId) return [];
    try {
        const supabase = createAdminClient();
        if (!supabase) return [];
        // 같은 세션의 최근 + 다른 세션의 최근
        const { data } = await supabase
            .from("tutor_conversations")
            .select("role, content, created_at")
            .eq("user_id", userId)
            .neq("session_id", sessionId) // 현재 세션 제외 (중복 방지)
            .order("created_at", { ascending: false })
            .limit(MEMORY_MESSAGES);
        return (data || []).reverse();
    } catch { return []; }
}

async function fetchWeakConcepts(
    userId: string | null
): Promise<{ concept: string; ask_count: number }[]> {
    if (!userId) return [];
    try {
        const supabase = createAdminClient();
        if (!supabase) return [];
        const { data } = await supabase
            .from("student_concepts")
            .select("concept, ask_count")
            .eq("user_id", userId)
            .order("ask_count", { ascending: false })
            .limit(MAX_WEAK_CONCEPTS);
        return data || [];
    } catch { return []; }
}

/** 비동기 개념 추출 — 응답 후 백그라운드 실행 */
async function extractAndSaveConcepts(
    userId: string | null,
    userQuestion: string,
    aiAnswer: string
): Promise<void> {
    if (!userId || !GROQ_KEY) return;
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_KEY}`,
            },
            body: JSON.stringify({
                model: CONCEPT_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "Extract 1-3 coding concepts from the Q&A. Return ONLY a JSON array of short Korean concept names. Example: [\"포인터\",\"NULL 역참조\"]. No explanation.",
                    },
                    {
                        role: "user",
                        content: `Q: ${truncate(userQuestion, 500)}\nA: ${truncate(aiAnswer, 500)}`,
                    },
                ],
                temperature: 0.2,
                max_tokens: 100,
            }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const text: string = data.choices?.[0]?.message?.content || "";
        const match = text.match(/\[[^\]]+\]/);
        if (!match) return;
        let concepts: string[] = [];
        try {
            concepts = JSON.parse(match[0]);
        } catch { return; }
        if (!Array.isArray(concepts)) return;

        const supabase = createAdminClient();
        if (!supabase) return;
        for (const c of concepts.slice(0, 3)) {
            if (typeof c !== "string" || c.length < 2 || c.length > 50) continue;
            const clean = c.trim();
            // RPC로 upsert + count 증가
            await supabase.rpc("increment_concept", {
                p_user_id: userId,
                p_concept: clean,
            });
        }
    } catch { /* 추출 실패 무시 */ }
}

export async function POST(req: NextRequest) {
    try {
        const authClient = await createClient();
        const {
            data: { user },
            error: authError,
        } = await authClient.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "쏙쌤에게 질문하려면 학생 로그인이 필요해요." },
                { status: 401 },
            );
        }
        if (!GROQ_KEY) {
            return NextResponse.json(
                { error: "쏙쌤이 아직 설정되지 않았어요. 선생님에게 문의해주세요." },
                { status: 503 },
            );
        }

        const body = await req.json();
        const {
            messages,
            mode,
            context,
            currentCode,
            currentLanguage,
            currentError,
            sessionId,
        } = body as {
            messages: Array<{ role: "user" | "assistant"; content: string }>;
            mode?: TutorMode;
            context?: string;
            currentCode?: string;
            currentLanguage?: string;
            currentError?: string;
            sessionId?: string;
        };

        // 입력 검증
        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "메시지가 필요해요." }, { status: 400 });
        }
        const validMessages = messages.every(message =>
            (message?.role === "user" || message?.role === "assistant")
            && typeof message?.content === "string"
            && message.content.trim().length > 0
            && message.content.length <= MAX_CONTENT_CHARS,
        );
        if (!validMessages) {
            return NextResponse.json({ error: "잘못된 메시지 형식" }, { status: 400 });
        }
        const safeMessages = messages.slice(-10).map(message => ({
            role: message.role,
            content: redactPrivateCodes(message.content.trim()),
        }));
        const lastUser = safeMessages[safeMessages.length - 1];
        if (lastUser.role !== "user") {
            return NextResponse.json({ error: "마지막 메시지는 학생 질문이어야 해요." }, { status: 400 });
        }

        const effectiveMode: TutorMode = mode === "direct" ? "direct" : "socratic";
        const verifiedStudentId = user.id;
        const safeContext = typeof context === "string" ? truncate(context, 200) : undefined;
        const safeCode = typeof currentCode === "string" ? truncate(currentCode, MAX_CODE_CHARS) : undefined;
        const safeLanguage = typeof currentLanguage === "string" ? truncate(currentLanguage, 30) : undefined;
        const safeError = typeof currentError === "string" ? truncate(currentError, MAX_ERROR_CHARS) : undefined;

        // Rate Limit
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const rateKey = `${verifiedStudentId}:${ip}`;
        const [minuteResult, dayResult] = await Promise.all([
            rateLimit(`tutor-min:${rateKey}`, { maxRequests: 10, windowMs: 60_000 }),
            rateLimit(`tutor-day:${rateKey}`, { maxRequests: 200, windowMs: 24 * 60 * 60_000 }),
        ]);
        if (!minuteResult.success) {
            return NextResponse.json(
                { error: "질문이 너무 빨라요! 잠시 숨 고르고 다시 물어봐 😊" },
                { status: 429, headers: { "Retry-After": "60" } }
            );
        }
        if (!dayResult.success) {
            return NextResponse.json(
                { error: "오늘은 쏙쌤이 많이 도와줬네! 내일 다시 만나 💤" },
                { status: 429 }
            );
        }

        const effectiveSessionId = sessionId || `sess-${Date.now()}`;
        const contextKey = safeContext || null;

        // 과거 대화 + 약점 병렬 조회
        const [pastExchanges, weakConcepts] = await Promise.all([
            fetchRecentExchanges(verifiedStudentId, effectiveSessionId),
            fetchWeakConcepts(verifiedStudentId),
        ]);

        // 시스템 프롬프트 빌드
        const systemPrompt = buildSystemPrompt({
            mode: effectiveMode,
            context: safeContext,
            currentCode: safeCode,
            currentLanguage: safeLanguage,
            currentError: safeError,
            weakConcepts,
            pastExchanges,
        });

        // 사용자 메시지 저장
        saveConversation(verifiedStudentId, effectiveSessionId, contextKey, "user", lastUser.content);

        // Groq 스트리밍 호출
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...safeMessages,
                ],
                temperature: effectiveMode === "socratic" ? 0.5 : 0.7,
                max_tokens: effectiveMode === "socratic" ? 300 : 1024,
                stream: true,
            }),
        });

        if (!groqRes.ok || !groqRes.body) {
            if (groqRes.status === 429) {
                return NextResponse.json(
                    { error: "쏙쌤이 너무 바빠요. 잠시 후 다시!" },
                    { status: 429 }
                );
            }
            if (process.env.NODE_ENV === "development") console.error("[tutor] groq error:", groqRes.status);
            return NextResponse.json(
                { error: "쏙쌤이 잠시 쉬고 있어요. 다시 시도해주세요." },
                { status: 502 }
            );
        }

        // SSE 스트림 릴레이 + 전문 수집
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullText = "";

        const stream = new ReadableStream({
            async start(controller) {
                // 메타데이터 먼저 전송
                controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ type: "meta", sessionId: effectiveSessionId, mode: effectiveMode })}\n\n`
                ));

                const reader = groqRes.body!.getReader();
                let buffer = "";
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed.startsWith("data:")) continue;
                            const payload = trimmed.slice(5).trim();
                            if (payload === "[DONE]") continue;
                            try {
                                const parsed = JSON.parse(payload);
                                const delta = parsed.choices?.[0]?.delta?.content;
                                if (typeof delta === "string" && delta.length > 0) {
                                    fullText += delta;
                                    controller.enqueue(encoder.encode(
                                        `data: ${JSON.stringify({ type: "token", content: delta })}\n\n`
                                    ));
                                }
                            } catch { /* incomplete JSON, skip */ }
                        }
                    }
                } catch (err) {
                    if (process.env.NODE_ENV === "development") console.error("[tutor stream]", err);
                }

                // 스트림 종료 신호
                controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({ type: "done", fullText })}\n\n`
                ));
                controller.close();

                // 백그라운드: 저장 + 개념 추출
                if (fullText) {
                    saveConversation(verifiedStudentId, effectiveSessionId, contextKey, "assistant", fullText);
                    if (effectiveMode === "direct") {
                        extractAndSaveConcepts(verifiedStudentId, lastUser.content, fullText);
                    }
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no", // Nginx/proxy buffer 비활성
            },
        });
    } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("[tutor] error:", err);
        return NextResponse.json(
            { error: "쏙쌤 연결 오류. 잠시 후 다시 시도해주세요." },
            { status: 500 }
        );
    }
}
