import { describe, expect, it } from 'vitest'
import { generateParentPin, PIN_COURSE, verifyParentPin } from '@/lib/parent-auth'

type MockProfile = {
    id: string
    name: string | null
    email: string | null
    level?: number | null
    total_xp?: number | null
    xp?: number | null
    rank?: string | null
}

function createSupabaseMock(input: {
    profiles: MockProfile[]
    pins: Record<string, string>
}) {
    return {
        from(table: string) {
            const filters = new Map<string, string>()
            return {
                select() {
                    return this
                },
                eq(column: string, value: string) {
                    filters.set(column, value)
                    return this
                },
                async maybeSingle() {
                    if (table === 'profiles') {
                        const email = filters.get('email')
                        const name = filters.get('name')
                        const id = filters.get('id')
                        const profile =
                            input.profiles.find(item => (email ? item.email === email : false)) ||
                            input.profiles.find(item => (name ? item.name === name : false)) ||
                            input.profiles.find(item => (id ? item.id === id : false)) ||
                            null

                        return { data: profile, error: null }
                    }

                    if (table === 'study_progress') {
                        const userId = filters.get('user_id') || ''
                        const courseId = filters.get('course_id')
                        const pin = courseId === PIN_COURSE ? input.pins[userId] : null
                        return {
                            data: pin ? { completed_units: [pin] } : null,
                            error: null,
                        }
                    }

                    return { data: null, error: null }
                },
            }
        },
    }
}

describe('parent-auth', () => {
    it('generates a 5-digit numeric PIN', () => {
        const pin = generateParentPin()
        expect(pin).toMatch(/^\d{5}$/)
    })

    it('verifies a parent PIN by email lookup', async () => {
        const supabase = createSupabaseMock({
            profiles: [{ id: 'student-1', name: '민수', email: 'minsu@example.com' }],
            pins: { 'student-1': '123456' },
        })

        const profile = await verifyParentPin(
            supabase as never,
            'minsu@example.com',
            '123456'
        )

        expect(profile?.id).toBe('student-1')
    })

    it('verifies a parent PIN by student name lookup', async () => {
        const supabase = createSupabaseMock({
            profiles: [{ id: 'student-2', name: '서연', email: 'seoyeon@example.com' }],
            pins: { 'student-2': '654321' },
        })

        const profile = await verifyParentPin(supabase as never, '서연', '654321')
        expect(profile?.email).toBe('seoyeon@example.com')
    })

    it('supports long student id lookup when the query looks like an id', async () => {
        const supabase = createSupabaseMock({
            profiles: [{ id: 'student-profile-id-12345', name: '지우', email: 'jiwoo@example.com' }],
            pins: { 'student-profile-id-12345': '222333' },
        })

        const profile = await verifyParentPin(
            supabase as never,
            'student-profile-id-12345',
            '222333'
        )

        expect(profile?.name).toBe('지우')
    })

    it('rejects an invalid parent PIN', async () => {
        const supabase = createSupabaseMock({
            profiles: [{ id: 'student-3', name: '하준', email: 'hajun@example.com' }],
            pins: { 'student-3': '111111' },
        })

        const profile = await verifyParentPin(supabase as never, '하준', '999999')
        expect(profile).toBeNull()
    })
})
