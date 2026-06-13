/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { PIN_COURSE } from '@/lib/parent-auth'
import type {
    ParentCodeProfileRow,
    ParentCodeProgressRow,
    ParentCodeStudentRow,
} from '@/lib/parent-code-rows'

type PoolLike = {
    query<T = any>(text: string, values?: unknown[]): Promise<{ rows: T[] }>
}

const globalForPg = globalThis as unknown as { __codingssokPgPool?: PoolLike }

function cleanDatabaseUrl() {
    const value = (process.env.DATABASE_URL || '').trim()
    if (!value || value === '""' || value === "''") return ''
    return value
}

export function hasDatabaseAdmin() {
    const databaseUrl = cleanDatabaseUrl()
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const projectRef = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
    return Boolean(databaseUrl && projectRef && databaseUrl.includes(projectRef))
}

function getPool(): PoolLike {
    if (globalForPg.__codingssokPgPool) return globalForPg.__codingssokPgPool

    const databaseUrl = cleanDatabaseUrl()
    if (!databaseUrl) throw new Error('DATABASE_URL is not configured.')

    const { Pool } = require('pg')
    globalForPg.__codingssokPgPool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('supabase.co') || databaseUrl.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : undefined,
        max: 3,
    })
    return globalForPg.__codingssokPgPool as PoolLike
}

export async function databaseQuery<T = any>(text: string, values: unknown[] = []) {
    const result = await getPool().query<T>(text, values)
    return result.rows
}

export async function getProfileRoleFromDatabase(userId: string) {
    const rows = await databaseQuery<{ role: string | null }>(
        'select role from public.profiles where id = $1 limit 1',
        [userId],
    )
    return rows[0]?.role || null
}

export async function loadParentCodeBaseDataFromDatabase() {
    const [students, profiles, progress] = await Promise.all([
        databaseQuery<ParentCodeStudentRow>(
            'select id, name, birthday, grade, "class", avatar, pin, auth_user_id, created_at from public.students order by name asc',
        ),
        databaseQuery<ParentCodeProfileRow>(
            'select id, name, display_name, email, role from public.profiles',
        ),
        databaseQuery<ParentCodeProgressRow>(
            'select user_id, completed_units, updated_at from public.study_progress where course_id = $1',
            [PIN_COURSE],
        ),
    ])

    return {
        students,
        profiles: profiles.filter(profile => profile.role !== 'teacher' && profile.role !== 'admin'),
        progress,
        profileWarning: null,
        progressWarning: null,
    }
}

export async function syncProgressPinInDatabase(userId: string | null | undefined, pin: string | null) {
    if (!userId) return
    if (!pin) {
        await databaseQuery(
            'delete from public.study_progress where user_id = $1 and course_id = $2',
            [userId, PIN_COURSE],
        )
        return
    }

    await databaseQuery(
        `
        insert into public.study_progress (user_id, course_id, completed_units, updated_at)
        values ($1, $2, $3, now())
        on conflict (user_id, course_id)
        do update set completed_units = excluded.completed_units, updated_at = excluded.updated_at
        `,
        [userId, PIN_COURSE, [pin]],
    )
}

export async function upsertStudentCodeInDatabase(input: {
    id?: string | null
    name: string
    pin: string | null
    birthday?: string | null
    grade?: string | null
    className?: string | null
    authUserId?: string | null
}) {
    if (input.id) {
        const rows = await databaseQuery<ParentCodeStudentRow>(
            `
            update public.students
            set name = $2,
                birthday = $3,
                grade = $4,
                "class" = $5,
                pin = $6,
                auth_user_id = $7
            where id = $1
            returning id, name, birthday, grade, "class", avatar, pin, auth_user_id, created_at
            `,
            [
                input.id,
                input.name,
                input.birthday || '2000-01-01',
                input.grade || null,
                input.className || null,
                input.pin,
                input.authUserId || null,
            ],
        )
        return rows[0] || null
    }

    const rows = await databaseQuery<ParentCodeStudentRow>(
        `
        insert into public.students (name, birthday, grade, "class", pin, auth_user_id)
        values ($1, $2, $3, $4, $5, $6)
        returning id, name, birthday, grade, "class", avatar, pin, auth_user_id, created_at
        `,
        [
            input.name,
            input.birthday || '2000-01-01',
            input.grade || null,
            input.className || null,
            input.pin,
            input.authUserId || null,
        ],
    )
    return rows[0] || null
}

export async function findParentAuthInDatabase(name: string, pin: string) {
    const students = await databaseQuery<Pick<ParentCodeStudentRow, 'id' | 'name' | 'pin' | 'auth_user_id'> & { status?: string | null }>(
        'select id, name, pin, auth_user_id, status from public.students where name = $1 limit 5',
        [name],
    )
    const profileIds = students.map(student => student.auth_user_id).filter(Boolean)
    const profiles = await databaseQuery<{ id: string; name: string | null; display_name: string | null }>(
        `
        select id, name, display_name
        from public.profiles
        where name = $1
           or display_name = $1
           or id = any($2::uuid[])
        limit 10
        `,
        [name, profileIds],
    )

    if (students.some(student => student.status === 'deactivated')) {
        return { status: 'deactivated' as const, studentId: null }
    }

    const profileById = new Map(profiles.map(profile => [profile.id, profile]))
    const profileByName = profiles.find(profile => profile.name === name || profile.display_name === name) || null
    const matchedStudent = students.find(student => student.pin === pin) ||
        students.find(student => {
            const profile = student.auth_user_id ? profileById.get(student.auth_user_id) : null
            return profile && (profile.name === name || profile.display_name === name) && student.pin === pin
        }) ||
        null

    if (matchedStudent) {
        return { status: 'ok' as const, studentId: matchedStudent.auth_user_id || matchedStudent.id }
    }

    if (profileByName) {
        const progress = await databaseQuery<{ completed_units: string[] | null }>(
            'select completed_units from public.study_progress where user_id = $1 and course_id = $2 limit 1',
            [profileByName.id, PIN_COURSE],
        )
        if (progress[0]?.completed_units?.[0] === pin) {
            return { status: 'ok' as const, studentId: profileByName.id }
        }
    }

    return { status: 'not_found' as const, studentId: null }
}

export async function canParentSessionReadStudentFromDatabase(studentId: string, name: string) {
    const [profiles, students, progress] = await Promise.all([
        databaseQuery<{ name: string | null; display_name: string | null }>(
            'select name, display_name from public.profiles where id = $1 limit 1',
            [studentId],
        ),
        databaseQuery<Pick<ParentCodeStudentRow, 'id' | 'name' | 'pin' | 'auth_user_id'>>(
            'select id, name, pin, auth_user_id from public.students where id = $1 or auth_user_id = $1 limit 5',
            [studentId],
        ),
        databaseQuery<{ completed_units: string[] | null }>(
            'select completed_units from public.study_progress where user_id = $1 and course_id = $2 limit 1',
            [studentId, PIN_COURSE],
        ),
    ])

    const profileName = profiles[0]?.display_name || profiles[0]?.name || ''
    const matchingStudent = students.find(student => student.name === name)
    const hasActiveStudentPin = Boolean(matchingStudent?.pin)
    const hasActiveProgressPin = Boolean(progress[0]?.completed_units?.[0])

    return (profileName === name && hasActiveProgressPin) || Boolean(matchingStudent && hasActiveStudentPin)
}
