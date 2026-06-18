import { describe, expect, it } from 'vitest'
import { buildParentCodeRows } from '@/lib/parent-code-rows'
import { REFERENCE_PARENT_CODES } from '@/lib/parent-code-reference'

describe('parent-code-rows', () => {
    it('hides deactivated roster students instead of reviving them as reference rows', () => {
        const target = REFERENCE_PARENT_CODES[0]
        const rows = buildParentCodeRows({
            students: [
                {
                    id: 'student-deactivated',
                    name: target.name,
                    pin: null,
                    status: 'deactivated',
                    auth_user_id: null,
                    class: target.className,
                    created_at: '2026-06-18T00:00:00.000Z',
                },
            ],
            profiles: [],
            progress: [],
        })

        expect(rows.some(row => row.name === target.name)).toBe(false)
    })

    it('does not revive a deleted database student code from the reference table', () => {
        const rows = buildParentCodeRows({
            students: [
                {
                    id: 'student-idayeon',
                    name: '이다연',
                    pin: null,
                    auth_user_id: 'auth-idayeon',
                    class: '프로젝트반',
                    created_at: '2026-06-12T00:00:00.000Z',
                },
            ],
            profiles: [
                {
                    id: 'auth-idayeon',
                    name: '이다연',
                    display_name: '이다연',
                    email: 'idayeon@example.com',
                    role: 'student',
                },
            ],
            progress: [],
        })

        const idayeon = rows.find(row => row.name === '이다연')
        expect(idayeon).toMatchObject({
            code: '',
            source: 'inactive',
            className: '프로젝트반',
            feedbackRows: 20,
        })
    })

    it('keeps a deleted reference-only student inactive after the admin creates a null-pin row', () => {
        const rows = buildParentCodeRows({
            students: [
                {
                    id: 'student-hanboyoon',
                    name: '한보윤',
                    pin: null,
                    auth_user_id: null,
                    class: '프로젝트반',
                    created_at: '2026-06-12T02:00:00.000Z',
                },
            ],
            profiles: [],
            progress: [],
        })

        const hanboyoon = rows.find(row => row.name === '한보윤')
        expect(hanboyoon).toMatchObject({
            code: '',
            source: 'inactive',
            className: '프로젝트반',
            feedbackRows: 11,
        })
    })

    it('uses a database student pin before any reference table value', () => {
        const rows = buildParentCodeRows({
            students: [
                {
                    id: 'student-idayeon',
                    name: '이다연',
                    pin: '12345',
                    auth_user_id: null,
                    class: '프로젝트반',
                    created_at: null,
                },
            ],
            profiles: [],
            progress: [],
        })

        expect(rows.find(row => row.name === '이다연')).toMatchObject({
            code: '12345',
            source: 'database',
        })
    })

    it('keeps reference rows for students that do not exist in the database yet', () => {
        const rows = buildParentCodeRows({
            students: [],
            profiles: [],
            progress: [],
        })

        expect(rows.find(row => row.name === '이다연')).toMatchObject({
            code: '78202',
            source: 'reference',
        })
    })

    it('allows a linked profile progress pin to activate a reference-only row', () => {
        const rows = buildParentCodeRows({
            students: [],
            profiles: [
                {
                    id: 'auth-hanbori',
                    name: '한보리',
                    display_name: '한보리',
                    email: 'hanbori@example.com',
                    role: 'student',
                },
            ],
            progress: [
                {
                    user_id: 'auth-hanbori',
                    completed_units: ['13579'],
                    updated_at: '2026-06-12T01:00:00.000Z',
                },
            ],
        })

        expect(rows.find(row => row.name === '한보리')).toMatchObject({
            code: '13579',
            source: 'database',
            authUserId: 'auth-hanbori',
        })
    })
})
