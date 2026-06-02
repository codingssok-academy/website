import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createParentSessionToken,
    verifyParentSessionToken,
} from '@/lib/parent-session'

describe('parent-session', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-17T10:00:00.000Z'))
        process.env.PARENT_SESSION_SECRET = 'test-parent-session-secret'
    })

    afterEach(() => {
        vi.useRealTimers()
        delete process.env.PARENT_SESSION_SECRET
    })

    it('creates and verifies a signed parent session token', () => {
        const token = createParentSessionToken({
            studentId: 'student-1',
            parentName: '학부모 홍길동',
        })

        const payload = verifyParentSessionToken(token)
        expect(payload).not.toBeNull()
        expect(payload?.studentId).toBe('student-1')
        expect(payload?.parentName).toBe('학부모 홍길동')
        expect(payload?.issuedAt).toBe(new Date('2026-03-17T10:00:00.000Z').getTime())
    })

    it('rejects a tampered token', () => {
        const token = createParentSessionToken({
            studentId: 'student-2',
            parentName: 'parent',
        })
        const tampered = `${token.slice(0, -1)}x`

        expect(verifyParentSessionToken(tampered)).toBeNull()
    })

    it('rejects an expired token', () => {
        const token = createParentSessionToken({
            studentId: 'student-3',
            parentName: 'guardian',
        })

        vi.advanceTimersByTime(1000 * 60 * 60 * 12 + 1)
        expect(verifyParentSessionToken(token)).toBeNull()
    })

    it('requires PARENT_SESSION_SECRET when creating tokens', () => {
        delete process.env.PARENT_SESSION_SECRET

        expect(() =>
            createParentSessionToken({
                studentId: 'student-4',
                parentName: 'tester',
            })
        ).toThrow('PARENT_SESSION_SECRET is not configured.')
    })
})
