import { describe, expect, it, beforeEach } from 'vitest'
import {
    clearParentClientAuth,
    PARENT_DASH_CACHE_KEY,
    PARENT_STUDENT_KEY,
    PARENT_VERIFIED_KEY,
} from '@/lib/parent-client-auth'

describe('parent-client-auth', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
    })

    it('clears only parent authentication state and dashboard cache', () => {
        localStorage.setItem(PARENT_STUDENT_KEY, '이다연')
        localStorage.setItem(PARENT_VERIFIED_KEY, 'true')
        localStorage.setItem('unrelated_local_key', 'keep')
        sessionStorage.setItem(PARENT_DASH_CACHE_KEY, 'cached')
        sessionStorage.setItem('unrelated_session_key', 'keep')

        clearParentClientAuth()

        expect(localStorage.getItem(PARENT_STUDENT_KEY)).toBeNull()
        expect(localStorage.getItem(PARENT_VERIFIED_KEY)).toBeNull()
        expect(sessionStorage.getItem(PARENT_DASH_CACHE_KEY)).toBeNull()
        expect(localStorage.getItem('unrelated_local_key')).toBe('keep')
        expect(sessionStorage.getItem('unrelated_session_key')).toBe('keep')
    })
})
