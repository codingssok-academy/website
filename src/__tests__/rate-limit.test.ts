import { describe, it, expect } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
const itWithRedis = hasRedis ? it : it.skip

describe('Rate Limiter', () => {
    it('allows requests within limit', async () => {
        const key = `test-${Date.now()}`
        const result = await rateLimit(key, { maxRequests: 5, windowMs: 10_000 })
        expect(result.success).toBe(true)
        expect(result.remaining).toBeGreaterThanOrEqual(0)
    })

    itWithRedis('blocks requests exceeding limit', async () => {
        const key = `test-block-${Date.now()}`
        for (let i = 0; i < 5; i++) {
            await rateLimit(key, { maxRequests: 5, windowMs: 10_000 })
        }
        const result = await rateLimit(key, { maxRequests: 5, windowMs: 10_000 })
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
    })

    itWithRedis('resets after window expires', async () => {
        const key = `test-reset-${Date.now()}`
        for (let i = 0; i < 3; i++) {
            await rateLimit(key, { maxRequests: 3, windowMs: 100 })
        }
        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 150))
        const result = await rateLimit(key, { maxRequests: 3, windowMs: 100 })
        expect(result.success).toBe(true)
    })
})
