import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { compileRequestSchema } from '@/lib/validation';

// Godbolt compiler IDs per language
const COMPILER_MAP: Record<string, { id: string; lang: string }> = {
    c:          { id: 'cg141',         lang: 'c' },
    cpp:        { id: 'g141',          lang: 'c++' },
    python:     { id: 'python312',     lang: 'python' },
    javascript: { id: 'v8trunk',       lang: 'javascript' },
    java:       { id: 'java2100',      lang: 'java' },
};

const STDIN_MAX_LENGTH = 1000;
const GODBOLT_TIMEOUT_MS = 5_000;
const STDOUT_MAX_BYTES = 10 * 1024; // 10KB

// 연속 제출 방지: IP+문제별 마지막 제출 시각 (in-memory, serverless 환경에서 베스트에포트)
const lastSubmitMap = new Map<string, number>();
const SUBMIT_COOLDOWN_MS = 1_000;

export async function POST(req: NextRequest) {
    try {
        // Rate Limiting: IP 기반 분당 20회 제한
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { success: rateLimitOk } = await rateLimit(`compile:${ip}`, { maxRequests: 20, windowMs: 60_000 });
        if (!rateLimitOk) {
            return NextResponse.json(
                { success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }

        const body = await req.json();
        const parsed = compileRequestSchema.safeParse(body);
        if (!parsed.success) {
            const msg = parsed.error.issues?.[0]?.message || '잘못된 요청입니다.';
            return NextResponse.json({ success: false, error: msg }, { status: 400 });
        }

        let code = parsed.data.code;
        const language = parsed.data.language;
        const stdin = parsed.data.stdin;

        // 연속 제출 방지: 1초 이내 동일 IP 재제출 차단
        const cooldownKey = `${ip}:${language}`;
        const now = Date.now();
        const lastSubmit = lastSubmitMap.get(cooldownKey) ?? 0;
        if (now - lastSubmit < SUBMIT_COOLDOWN_MS) {
            return NextResponse.json(
                { success: false, error: '너무 빠른 재제출입니다. 잠시 후 다시 시도해주세요.' },
                { status: 429 }
            );
        }
        lastSubmitMap.set(cooldownKey, now);

        const compiler = COMPILER_MAP[language] || COMPILER_MAP.c;

        // Java: Godbolt doesn't use filenames, so remove 'public' from class
        // to avoid "should be declared in Main.java" error
        if (language === 'java') {
            code = code.replace(/public\s+class\s+/g, 'class ');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GODBOLT_TIMEOUT_MS);

        let res: Response;
        const startTime = Date.now();
        try {
            res = await fetch(`https://godbolt.org/api/compiler/${compiler.id}/compile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    source: code,
                    compiler: compiler.id,
                    options: {
                        userArguments: '',
                        executeParameters: { args: '', stdin },
                        compilerOptions: { executorRequest: true },
                        filters: { execute: true },
                    },
                }),
                signal: controller.signal,
            });
        } catch (fetchErr: unknown) {
            if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
                return NextResponse.json({ success: false, error: '컴파일 요청이 시간 초과되었습니다. (5초)', language }, { status: 504 });
            }
            return NextResponse.json({ success: false, error: '컴파일 서버에 연결할 수 없습니다.', language }, { status: 502 });
        } finally {
            clearTimeout(timeoutId);
        }
        const executionTime = Date.now() - startTime;

        if (res.status === 429) {
            return NextResponse.json({ success: false, error: '컴파일 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.', language }, { status: 429 });
        }
        if (!res.ok) {
            return NextResponse.json({ success: false, error: `컴파일러 서버 오류 (${res.status})`, language }, { status: 502 });
        }

        const data = await res.json();
        const exitCode = data.code ?? -1;

        // stdout 10KB 제한
        let stdout = (data.stdout || []).map((l: { text: string }) => l.text).join('\n');
        if (stdout.length > STDOUT_MAX_BYTES) {
            stdout = stdout.slice(0, STDOUT_MAX_BYTES) + '\n[출력이 너무 깁니다. 10KB에서 잘렸습니다.]';
        }

        const stderr = (data.stderr || []).map((l: { text: string }) => l.text).join('\n');
        const buildResult = (data.buildResult?.stderr || []).map((l: { text: string }) => l.text).join('\n');

        // Godbolt execResult에서 메모리 정보 추출 (지원 시)
        const memoryUsed: number | undefined = data.execResult?.memoryBytes ?? undefined;

        return NextResponse.json({
            success: exitCode === 0 && !buildResult,
            exitCode,
            stdout,
            stderr: buildResult || stderr,
            language,
            executionTime,
            ...(memoryUsed !== undefined && { memoryUsed }),
        });
    } catch {
        return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
