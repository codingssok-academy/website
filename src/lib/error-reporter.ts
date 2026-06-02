/**
 * 경량 에러 리포터 — Supabase error_logs 테이블에 기록
 * 클라이언트/서버 모두 사용 가능
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface ErrorReport {
    source: "client" | "server" | "api";
    message: string;
    stack?: string;
    url?: string;
    metadata?: Record<string, unknown>;
}

let lastReportedAt = 0;
const MIN_INTERVAL = 5000; // 5초 내 중복 방지

export async function reportError(report: ErrorReport): Promise<void> {
    // Rate limit
    const now = Date.now();
    if (now - lastReportedAt < MIN_INTERVAL) return;
    lastReportedAt = now;

    if (!SUPABASE_URL || !SUPABASE_KEY) return;

    try {
        await fetch(`${SUPABASE_URL}/rest/v1/error_logs`, {
            method: "POST",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            body: JSON.stringify({
                source: report.source,
                message: report.message.slice(0, 500),
                stack: report.stack?.slice(0, 2000) || null,
                url: report.url?.slice(0, 500) || (typeof window !== "undefined" ? window.location.href : null),
                user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
                metadata: report.metadata || {},
            }),
        });
    } catch {
        // 에러 리포팅 실패는 무시
    }
}

/** 글로벌 에러 핸들러 등록 (클라이언트 전용) */
export function installGlobalErrorHandler(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (e) => {
        reportError({
            source: "client",
            message: e.message || "Unknown error",
            stack: e.error?.stack,
            metadata: { type: "uncaught", filename: e.filename, lineno: e.lineno },
        });
    });

    window.addEventListener("unhandledrejection", (e) => {
        const message = e.reason instanceof Error ? e.reason.message : String(e.reason);
        reportError({
            source: "client",
            message,
            stack: e.reason instanceof Error ? e.reason.stack : undefined,
            metadata: { type: "unhandledrejection" },
        });
    });
}
