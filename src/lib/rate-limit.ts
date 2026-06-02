/**
 * Upstash Redis 기반 Rate Limiter
 * Vercel serverless 환경에서도 인스턴스 간 공유됨
 *
 * 담당자 진단('parent 페이지 5초 latency'): Vercel 로그에 'Upstash Redis Unable to f...'
 * warning. Redis 연결이 매 요청마다 5초 timeout까지 hang → fixed cost.
 *
 * Fix:
 *   1. UPSTASH_REDIS_REST_URL/TOKEN env 없으면 즉시 success 반환 (Redis 호출 X)
 *   2. env 있어도 800ms timeout으로 race → Redis stale이어도 빠른 fallback
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const HAS_REDIS = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const RL_TIMEOUT_MS = 800;

const redis = HAS_REDIS ? Redis.fromEnv() : null;

const limiters = new Map<string, Ratelimit>()

function getLimiter(windowMs: number, maxRequests: number): Ratelimit | null {
    if (!redis) return null;
    const key = `${windowMs}:${maxRequests}`
    let limiter = limiters.get(key)
    if (!limiter) {
        limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
            analytics: false,
            prefix: 'cs-rl',
        })
        limiters.set(key, limiter)
    }
    return limiter
}

export async function rateLimit(
    key: string,
    { maxRequests = 10, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {}
): Promise<{ success: boolean; remaining: number }> {
    if (!HAS_REDIS) {
        // Redis env 미설정 — 즉시 허용 (가용성 우선)
        return { success: true, remaining: maxRequests }
    }
    try {
        const limiter = getLimiter(windowMs, maxRequests)
        if (!limiter) return { success: true, remaining: maxRequests }
        // 800ms timeout race — Redis stale/지연 시 fallback (요청 통과)
        const result = await Promise.race([
            limiter.limit(key),
            new Promise<{ success: true; remaining: number }>(resolve =>
                setTimeout(() => resolve({ success: true, remaining: maxRequests }), RL_TIMEOUT_MS)
            ),
        ])
        return { success: (result as any).success, remaining: (result as any).remaining ?? maxRequests }
    } catch {
        return { success: true, remaining: maxRequests }
    }
}
