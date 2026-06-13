import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateParentPin, PIN_COURSE } from '@/lib/parent-auth'
import { callParentPortalEdge } from '@/lib/parent-edge'
import { REFERENCE_PARENT_CODES, buildReferenceParentCodeRows, findReferenceParentCode } from '@/lib/parent-code-reference'
import {
    buildParentCodeRows,
    findProfileForParentCodeStudent,
    normalizeParentCodePin,
    type ParentCodeProfileRow,
    type ParentCodeProgressRow,
    type ParentCodeStudentRow,
} from '@/lib/parent-code-rows'
import {
    databaseQuery,
    getProfileRoleFromDatabase,
    hasDatabaseAdmin,
    loadParentCodeBaseDataFromDatabase,
    syncProgressPinInDatabase,
    upsertStudentCodeInDatabase,
} from '@/lib/postgres-admin'

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>
type TeacherContext =
    | { adminClient: AdminClient; user: unknown }
    | { databaseAdmin: true; user: unknown }
    | { edgeAdmin: true; accessToken: string; user: unknown }
    | { error: NextResponse }

type EdgeParentCodeBaseData = {
    success: true
    students: ParentCodeStudentRow[]
    profiles: ParentCodeProfileRow[]
    progress: ParentCodeProgressRow[]
    warning?: string | null
}

function isLocalRequest(request: NextRequest) {
    const host = request.headers.get('host') || ''
    return host.startsWith('localhost:') || host.startsWith('127.0.0.1:') || host.startsWith('[::1]:')
}

function normalizeName(input: unknown) {
    return typeof input === 'string' ? input.trim().replace(/\s+/g, '') : ''
}

function normalizePin(input: unknown) {
    return normalizeParentCodePin(input)
}

function assertName(name: string) {
    if (name.length < 2 || name.length > 20 || /[<>"';&\\]/.test(name)) {
        throw new Error('학생 이름을 2~20자 한글 이름으로 입력해주세요.')
    }
}

function assertPin(pin: string) {
    if (!/^\d{5}$/.test(pin)) {
        throw new Error('학부모 인증번호는 숫자 5자리여야 합니다.')
    }
}

function hasAdminClient(context: TeacherContext): context is Extract<TeacherContext, { adminClient: AdminClient }> {
    return 'adminClient' in context
}

function hasEdgeAdmin(context: TeacherContext): context is Extract<TeacherContext, { edgeAdmin: true }> {
    return 'edgeAdmin' in context
}

function normalizeAdminName(value: string | null | undefined) {
    return (value ?? '').replace(/\s+/g, '').trim().toLowerCase()
}

function isApprovedAdminStudent(row: { name?: string | null; class?: string | null; status?: string | null } | null) {
    if (!row || row.status === 'deactivated') return false
    const name = normalizeAdminName(row.name)
    const className = normalizeAdminName(row.class)
    return className === 'admin' || ['구자현', '장민', 'gujahyeon', 'gujahyun', 'jahyeon', 'jangmin'].includes(name)
}

async function isApprovedAdminUser(
    userId: string,
    adminClient: AdminClient | null,
    databaseAdmin: boolean,
) {
    if (adminClient) {
        const { data } = await adminClient
            .from('students')
            .select('name, class, status')
            .eq('auth_user_id', userId)
            .maybeSingle()
        return isApprovedAdminStudent(data)
    }

    if (databaseAdmin) {
        const rows = await databaseQuery<{ name: string | null; class: string | null; status: string | null }>(
            'select name, "class", status from public.students where auth_user_id = $1 limit 1',
            [userId],
        )
        return isApprovedAdminStudent(rows[0] || null)
    }

    return false
}

async function requireTeacherContext(): Promise<TeacherContext> {
    const adminClient = createAdminClient()
    const databaseAdmin = hasDatabaseAdmin()
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user && process.env.NODE_ENV !== 'production') {
        if (adminClient) return { adminClient, user: null }
        if (databaseAdmin) return { databaseAdmin: true, user: null }
    }

    if (!user) {
        return {
            error: NextResponse.json({ success: false, error: '관리자 로그인이 필요합니다.' }, { status: 401 }),
        }
    }

    if (!adminClient && !databaseAdmin) {
        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (!session?.access_token) {
            return {
                error: NextResponse.json({ success: false, error: '관리자 세션을 확인하지 못했습니다.' }, { status: 401 }),
            }
        }
        const edgeRole = await callParentPortalEdge<{ success: true; role: string }>('assertAdmin', {}, session.access_token)
        if (!edgeRole.ok) {
            return {
                error: NextResponse.json(
                    { success: false, error: edgeRole.error || '관리자 권한을 확인하지 못했습니다.' },
                    { status: edgeRole.status || 403 },
                ),
            }
        }
        return { edgeAdmin: true, accessToken: session.access_token, user }
    }

    const role = adminClient
        ? (await adminClient.from('profiles').select('role').eq('id', user.id).maybeSingle()).data?.role
        : await getProfileRoleFromDatabase(user.id)

    if (role !== 'teacher' && role !== 'admin' && !(await isApprovedAdminUser(user.id, adminClient, databaseAdmin))) {
        return {
            error: NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 403 }),
        }
    }

    return adminClient ? { adminClient, user } : { databaseAdmin: true, user }
}

async function loadBaseData(adminClient: AdminClient) {
    const [studentsRes, profilesRes, progressRes] = await Promise.all([
        adminClient
            .from('students')
            .select('id, name, birthday, grade, class, avatar, pin, auth_user_id, status, created_at')
            .order('name', { ascending: true }),
        adminClient.from('profiles').select('id, name, display_name, email, role'),
        adminClient
            .from('study_progress')
            .select('user_id, completed_units, updated_at')
            .eq('course_id', PIN_COURSE),
    ])

    if (studentsRes.error) throw new Error(studentsRes.error.message)

    return {
        students: (studentsRes.data || []) as ParentCodeStudentRow[],
        profiles: ((profilesRes.data || []) as ParentCodeProfileRow[]).filter(profile => profile.role !== 'teacher' && profile.role !== 'admin'),
        progress: (progressRes.data || []) as ParentCodeProgressRow[],
        profileWarning: profilesRes.error?.message || null,
        progressWarning: progressRes.error?.message || null,
    }
}

async function syncProgressPin(
    adminClient: AdminClient,
    userId: string | null | undefined,
    pin: string | null,
) {
    if (!userId) return
    if (!pin) {
        const { error } = await adminClient
            .from('study_progress')
            .delete()
            .eq('user_id', userId)
            .eq('course_id', PIN_COURSE)
        if (error) throw new Error(error.message)
        return
    }

    const { error } = await adminClient.from('study_progress').upsert(
        {
            user_id: userId,
            course_id: PIN_COURSE,
            completed_units: [pin],
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id' },
    )
    if (error) throw new Error(error.message)
}

async function upsertStudentCode(input: {
    adminClient: AdminClient
    name: string
    pin: string
    grade?: string
    className?: string
}) {
    assertName(input.name)
    assertPin(input.pin)

    const { students, profiles } = await loadBaseData(input.adminClient)
    const existing = students.find(student => student.name === input.name) || null
    const profile = existing
        ? findProfileForParentCodeStudent(existing, profiles)
        : profiles.find(item => item.display_name === input.name || item.name === input.name) || null

    const payload = {
        name: input.name,
        birthday: existing?.birthday || '2000-01-01',
        grade: input.grade || existing?.grade || null,
        class: input.className || existing?.class || null,
        pin: input.pin,
        auth_user_id: existing?.auth_user_id || profile?.id || null,
    }

    const query = existing
        ? input.adminClient.from('students').update(payload).eq('id', existing.id).select().single()
        : input.adminClient.from('students').insert(payload).select().single()

    const { data, error } = await query
    if (error || !data) {
        throw new Error(error?.message || '학생 코드를 저장하지 못했습니다.')
    }

    await syncProgressPin(input.adminClient, (data as ParentCodeStudentRow).auth_user_id || profile?.id || null, input.pin)
    return data as ParentCodeStudentRow
}

async function upsertStudentCodeWithDatabase(input: {
    name: string
    pin: string
    grade?: string
    className?: string
}) {
    assertName(input.name)
    assertPin(input.pin)

    const { students, profiles } = await loadParentCodeBaseDataFromDatabase()
    const existing = students.find(student => student.name === input.name) || null
    const profile = existing
        ? findProfileForParentCodeStudent(existing, profiles)
        : profiles.find(item => item.display_name === input.name || item.name === input.name) || null

    const data = await upsertStudentCodeInDatabase({
        id: existing?.id || null,
        name: input.name,
        birthday: existing?.birthday || '2000-01-01',
        grade: input.grade || existing?.grade || null,
        className: input.className || existing?.class || null,
        pin: input.pin,
        authUserId: existing?.auth_user_id || profile?.id || null,
    })

    if (!data) throw new Error('학생 코드를 저장하지 못했습니다.')

    await syncProgressPinInDatabase(data.auth_user_id || profile?.id || null, input.pin)
    return data
}

async function loadResponse(adminClient: AdminClient) {
    const base = await loadBaseData(adminClient)
    return {
        success: true,
        canMutate: true,
        rows: buildParentCodeRows(base),
        warning: base.profileWarning || base.progressWarning || null,
    }
}

async function loadDatabaseResponse() {
    const base = await loadParentCodeBaseDataFromDatabase()
    return {
        success: true,
        canMutate: true,
        rows: buildParentCodeRows(base),
        warning: null,
    }
}

async function loadEdgeResponse(accessToken: string, payload: Record<string, unknown> = { action: 'list' }) {
    const edge = await callParentPortalEdge<EdgeParentCodeBaseData>(
        String(payload.action || 'list'),
        payload,
        accessToken,
    )
    if (!edge.ok) throw new Error(edge.error)
    return {
        success: true,
        canMutate: true,
        rows: buildParentCodeRows({
            students: edge.data.students || [],
            profiles: edge.data.profiles || [],
            progress: edge.data.progress || [],
        }),
        warning: edge.data.warning || null,
    }
}

export async function GET(request: NextRequest) {
    try {
        if (!createAdminClient() && isLocalRequest(request)) {
            return NextResponse.json({
                success: true,
                canMutate: false,
                rows: buildReferenceParentCodeRows(),
                warning: '로컬 환경에 SUPABASE_SERVICE_ROLE_KEY가 없어 기준표 목록만 표시합니다. 실제 발급/재발급/삭제는 배포 환경 또는 서비스 키가 있는 로컬에서 실행됩니다.',
            })
        }
        const context = await requireTeacherContext()
        if ('error' in context) return context.error
        if (hasEdgeAdmin(context)) return NextResponse.json(await loadEdgeResponse(context.accessToken))
        return NextResponse.json(hasAdminClient(context)
            ? await loadResponse(context.adminClient)
            : await loadDatabaseResponse())
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : '학부모 코드 목록을 불러오지 못했습니다.' },
            { status: 500 },
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const context = await requireTeacherContext()
        if ('error' in context) return context.error

        const body = await request.json()
        if (body?.action === 'seedBaseline') {
            if (hasEdgeAdmin(context)) {
                return NextResponse.json(await loadEdgeResponse(context.accessToken, {
                    action: 'seedBaseline',
                    rows: REFERENCE_PARENT_CODES,
                }))
            }
            for (const { name, code, className } of REFERENCE_PARENT_CODES) {
                if (hasAdminClient(context)) {
                    await upsertStudentCode({ adminClient: context.adminClient, name, pin: code, className })
                } else {
                    await upsertStudentCodeWithDatabase({ name, pin: code, className })
                }
            }
            return NextResponse.json(hasAdminClient(context)
                ? await loadResponse(context.adminClient)
                : await loadDatabaseResponse())
        }

        const name = normalizeName(body?.name)
        const pin = normalizePin(body?.pin) || generateParentPin()
        const grade = typeof body?.grade === 'string' ? body.grade.trim() : ''
        const className = typeof body?.className === 'string' ? body.className.trim() : ''
        if (hasEdgeAdmin(context)) {
            assertName(name)
            assertPin(pin)
            return NextResponse.json(await loadEdgeResponse(context.accessToken, {
                action: 'issue',
                name,
                pin,
                grade,
                className,
            }))
        }
        if (hasAdminClient(context)) {
            await upsertStudentCode({ adminClient: context.adminClient, name, pin, grade, className })
            return NextResponse.json(await loadResponse(context.adminClient))
        }
        await upsertStudentCodeWithDatabase({ name, pin, grade, className })
        return NextResponse.json(await loadDatabaseResponse())
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : '학부모 코드를 발급하지 못했습니다.' },
            { status: 500 },
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const context = await requireTeacherContext()
        if ('error' in context) return context.error

        const body = await request.json()
        if (body?.action === 'group') {
            const names = Array.isArray(body?.names)
                ? body.names.map(normalizeName).filter(Boolean)
                : String(body?.names || '')
                      .split(/[,\n]/)
                      .map(normalizeName)
                      .filter(Boolean)
            if (names.length < 2) {
                throw new Error('형제/자매로 묶을 학생 이름을 2명 이상 입력해주세요.')
            }
            const pin = normalizePin(body?.pin) || generateParentPin()
            assertPin(pin)
            if (hasEdgeAdmin(context)) {
                return NextResponse.json(await loadEdgeResponse(context.accessToken, {
                    action: 'group',
                    names,
                    pin,
                }))
            }
            for (const name of names) {
                if (hasAdminClient(context)) {
                    await upsertStudentCode({ adminClient: context.adminClient, name, pin })
                } else {
                    await upsertStudentCodeWithDatabase({ name, pin })
                }
            }
            return NextResponse.json(hasAdminClient(context)
                ? await loadResponse(context.adminClient)
                : await loadDatabaseResponse())
        }

        const name = normalizeName(body?.name)
        const pin = normalizePin(body?.pin) || generateParentPin()
        if (hasEdgeAdmin(context)) {
            assertName(name)
            assertPin(pin)
            return NextResponse.json(await loadEdgeResponse(context.accessToken, {
                action: 'reissue',
                name,
                pin,
            }))
        }
        if (hasAdminClient(context)) {
            await upsertStudentCode({ adminClient: context.adminClient, name, pin })
            return NextResponse.json(await loadResponse(context.adminClient))
        }
        await upsertStudentCodeWithDatabase({ name, pin })
        return NextResponse.json(await loadDatabaseResponse())
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : '학부모 코드를 변경하지 못했습니다.' },
            { status: 500 },
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const context = await requireTeacherContext()
        if ('error' in context) return context.error

        const body = await request.json()
        const name = normalizeName(body?.name)
        assertName(name)

        if (hasEdgeAdmin(context)) {
            return NextResponse.json(await loadEdgeResponse(context.accessToken, {
                action: 'delete',
                name,
            }))
        }

        const { students, profiles } = hasAdminClient(context)
            ? await loadBaseData(context.adminClient)
            : await loadParentCodeBaseDataFromDatabase()
        const existing = students.find(student => student.name === name) || null
        const profile = existing
            ? findProfileForParentCodeStudent(existing, profiles)
            : profiles.find(item => item.display_name === name || item.name === name) || null

        if (existing) {
            if (hasAdminClient(context)) {
                const { error } = await context.adminClient.from('students').update({ pin: null }).eq('id', existing.id)
                if (error) throw new Error(error.message)
            } else {
                await upsertStudentCodeInDatabase({
                    id: existing.id,
                    name,
                    pin: null,
                    birthday: existing.birthday || '2000-01-01',
                    grade: existing.grade || null,
                    className: existing.class || null,
                    authUserId: existing.auth_user_id || profile?.id || null,
                })
            }
        } else {
            const baseline = findReferenceParentCode(name)
            if (baseline) {
                if (hasAdminClient(context)) {
                    const { error } = await context.adminClient.from('students').insert({
                        name,
                        birthday: '2000-01-01',
                        grade: null,
                        class: baseline.className,
                        pin: null,
                        auth_user_id: profile?.id || null,
                    })
                    if (error) throw new Error(error.message)
                } else {
                    await upsertStudentCodeInDatabase({
                        name,
                        pin: null,
                        birthday: '2000-01-01',
                        className: baseline.className,
                        authUserId: profile?.id || null,
                    })
                }
            }
        }
        if (hasAdminClient(context)) {
            await syncProgressPin(context.adminClient, existing?.auth_user_id || profile?.id || null, null)
            return NextResponse.json(await loadResponse(context.adminClient))
        }
        await syncProgressPinInDatabase(existing?.auth_user_id || profile?.id || null, null)

        return NextResponse.json(await loadDatabaseResponse())
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : '학부모 코드를 삭제하지 못했습니다.' },
            { status: 500 },
        )
    }
}
