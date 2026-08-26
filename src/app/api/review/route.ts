import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

const REVIEW_SYSTEM_PROMPT = `당신은 코딩쏙 아카데미의 AI 코드 리뷰어입니다.
학생의 코드를 분석해서 왜 틀렸는지 쉽게 설명해주세요.

응답 형식 (반드시 이 순서로, 각 섹션은 줄바꿈으로 구분):

1. 어떤 부분이 틀렸는지
(코드에서 문제가 되는 부분을 짧게 지적해주세요)

2. 왜 그렇게 동작하는지
(초등학생도 이해할 수 있게 비유나 쉬운 말로 설명해주세요)

3. 어떻게 고치면 되는지
(구체적인 힌트를 주세요. 단, 정답 코드는 절대 주지 마세요)

규칙:
- 친근하고 따뜻한 말투 사용 (학생이 실망하지 않도록)
- 이모지 적절히 사용
- 정답 코드는 절대 제공 금지
- 한국어로만 답변
- 답변은 간결하게 (너무 길지 않게)`;

export async function POST(req: NextRequest) {
    // 인증: 로그인된 사용자만 코드 리뷰 사용 가능
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // Rate limit: 사용자당 분당 5회
    const { success: rateLimitOk } = await rateLimit(`review:${user.id}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rateLimitOk) {
        return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }

    const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
    const MODEL = process.env.NAVA_MODEL || "qwen2.5-coder:7b";

    try {
        const body = await req.json();
        const { code, language, problemTitle, expectedOutput, actualOutput } = body as {
            code: string;
            language: string;
            problemTitle: string;
            expectedOutput: string;
            actualOutput: string;
        };

        if (!code || !language || !problemTitle) {
            return NextResponse.json(
                { error: '필수 데이터가 누락되었습니다.' },
                { status: 400 }
            );
        }

        const userMessage = `문제: ${problemTitle}
언어: ${language}

학생 코드:
\`\`\`${language}
${code}
\`\`\`

예상 출력:
${expectedOutput || '(없음)'}

실제 출력:
${actualOutput || '(없음 또는 오류)'}

위 코드를 분석해서 왜 틀렸는지 힌트를 주세요.`;

        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL, stream: false,
                    messages: [
                        { role: 'system', content: REVIEW_SYSTEM_PROMPT },
                        { role: 'user', content: userMessage },
                    ],
                    options: {
                        temperature: 0.5,
                        num_predict: 1024,
                    },
                }),
            });

        if (!res.ok) {
            const err = await res.text();
            console.error('[AI Review] Ollama error:', res.status, err?.slice(0, 200));
            return NextResponse.json(
                { error: '쏙쌤이 지금 쉬고 있어요. 잠시 후 다시 시도해주세요.' },
                { status: 502 }
            );
        }

        const data = await res.json();
        const text = data.message?.content || '리뷰를 생성하지 못했어요';

        return NextResponse.json({ content: text });
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('[AI Review] Error:', err);
        }
        return NextResponse.json(
            { error: 'AI 리뷰 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
