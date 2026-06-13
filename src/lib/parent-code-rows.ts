import { REFERENCE_PARENT_CODES, findReferenceParentCode } from '@/lib/parent-code-reference'

export type ParentCodeStudentRow = {
    id: string
    name: string
    birthday?: string | null
    grade?: string | null
    class?: string | null
    avatar?: string | null
    pin?: string | null
    auth_user_id?: string | null
    status?: string | null
    created_at?: string | null
}

export type ParentCodeProfileRow = {
    id: string
    name: string | null
    display_name: string | null
    email: string | null
    role?: string | null
}

export type ParentCodeProgressRow = {
    user_id: string
    completed_units: string[] | null
    updated_at: string | null
}

export type ParentCodeRow = {
    id: string
    studentId: string | null
    authUserId: string | null
    name: string
    code: string
    feedbackRows: number
    issuedAt: string | null
    grade: string
    className: string
    linked: boolean
    source: 'database' | 'reference' | 'inactive'
}

function isReservedAdminName(name: string) {
    return ['구자현', '장민'].includes(name.trim().replace(/\s+/g, ''))
}

export function normalizeParentCodePin(input: unknown) {
    if (typeof input !== 'string') return ''
    const pin = input.replace(/\D/g, '').slice(0, 5)
    return /^\d{5}$/.test(pin) ? pin : ''
}

export function findProfileForParentCodeStudent(
    student: ParentCodeStudentRow,
    profiles: ParentCodeProfileRow[],
) {
    if (student.auth_user_id) {
        const byId = profiles.find(profile => profile.id === student.auth_user_id)
        if (byId) return byId
    }
    return profiles.find(profile => profile.display_name === student.name || profile.name === student.name) || null
}

export function buildParentCodeRows(input: {
    students: ParentCodeStudentRow[]
    profiles: ParentCodeProfileRow[]
    progress: ParentCodeProgressRow[]
}) {
    const progressByUserId = new Map(
        input.progress.map(row => [row.user_id, { pin: row.completed_units?.[0] || '', updatedAt: row.updated_at }]),
    )
    const rows = new Map<string, ParentCodeRow>()

    for (const student of input.students) {
        if (student.status === 'deactivated' || student.class === 'admin' || isReservedAdminName(student.name)) continue

        const profile = findProfileForParentCodeStudent(student, input.profiles)
        const progressPin = profile ? progressByUserId.get(profile.id) : null
        const baseline = findReferenceParentCode(student.name)
        const dbCode = normalizeParentCodePin(student.pin || '') || normalizeParentCodePin(progressPin?.pin || '')

        rows.set(student.name, {
            id: student.id,
            studentId: student.id,
            authUserId: profile?.id || student.auth_user_id || null,
            name: student.name,
            code: dbCode,
            feedbackRows: baseline?.feedbackRows || 0,
            issuedAt: student.created_at || progressPin?.updatedAt || null,
            grade: student.grade || '',
            className: student.class || baseline?.className || '',
            linked: Boolean(profile?.id || student.auth_user_id),
            source: dbCode ? 'database' : 'inactive',
        })
    }

    for (const { name, code, feedbackRows, className } of REFERENCE_PARENT_CODES) {
        if (rows.has(name)) continue
        const profile = input.profiles.find(item => item.display_name === name || item.name === name)
        const progressPin = profile ? progressByUserId.get(profile.id) : null
        rows.set(name, {
            id: `reference-${name}`,
            studentId: null,
            authUserId: profile?.id || null,
            name,
            code: normalizeParentCodePin(progressPin?.pin || '') || code,
            feedbackRows,
            issuedAt: progressPin?.updatedAt || null,
            grade: '',
            className,
            linked: Boolean(profile?.id),
            source: progressPin?.pin ? 'database' : 'reference',
        })
    }

    const orderByName = new Map(REFERENCE_PARENT_CODES.map((row, index) => [row.name, index]))
    return [...rows.values()].sort((a, b) => {
        const orderA = orderByName.get(a.name) ?? Number.MAX_SAFE_INTEGER
        const orderB = orderByName.get(b.name) ?? Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name, 'ko')
    })
}
