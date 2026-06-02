import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const ATTEMPT_WINDOW_MS = 1000 * 60 * 10
const MAX_ATTEMPTS_PER_IP = 18
const MAX_ATTEMPTS_PER_QUERY = 8

function hashValue(value: string) {
    return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export function getParentAccessIp(request: NextRequest) {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0]?.trim() || 'unknown'
    }

    return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function getParentAccessThrottleStatus(
    adminClient: SupabaseClient,
    sourceIp: string,
    studentQuery: string
) {
    const since = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString()
    const ipHash = hashValue(sourceIp)
    const queryHash = hashValue(studentQuery)

    try {
        const [ipAttemptsRes, queryAttemptsRes] = await Promise.all([
            adminClient
                .from('parent_access_attempts')
                .select('id', { count: 'exact', head: true })
                .eq('ip_hash', ipHash)
                .gte('attempted_at', since),
            adminClient
                .from('parent_access_attempts')
                .select('id', { count: 'exact', head: true })
                .eq('query_hash', queryHash)
                .gte('attempted_at', since),
        ])

        const ipAttempts = ipAttemptsRes.count || 0
        const queryAttempts = queryAttemptsRes.count || 0

        return {
            blocked: ipAttempts >= MAX_ATTEMPTS_PER_IP || queryAttempts >= MAX_ATTEMPTS_PER_QUERY,
            retryAfterSeconds: Math.ceil(ATTEMPT_WINDOW_MS / 1000),
            ipAttempts,
            queryAttempts,
        }
    } catch {
        return {
            blocked: false,
            retryAfterSeconds: 0,
            ipAttempts: 0,
            queryAttempts: 0,
        }
    }
}

export async function recordParentAccessAttempt(input: {
    adminClient: SupabaseClient
    sourceIp: string
    studentQuery: string
    studentId?: string | null
    success: boolean
    failureReason?: string | null
    userAgent?: string | null
}) {
    try {
        await input.adminClient.from('parent_access_attempts').insert({
            ip_hash: hashValue(input.sourceIp),
            query_hash: hashValue(input.studentQuery),
            student_id: input.studentId || null,
            success: input.success,
            failure_reason: input.failureReason || null,
            user_agent: input.userAgent?.slice(0, 255) || null,
        })
    } catch {
        // Ignore logging failures so login itself does not break.
    }
}
