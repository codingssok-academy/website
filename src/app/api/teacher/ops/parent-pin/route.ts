import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateParentPin, PIN_COURSE } from '@/lib/parent-auth'

type ParentAccessAttemptRow = {
    id: string
    success: boolean
    failure_reason: string | null
    attempted_at: string
}

async function requireTeacherSession() {
    const supabase = await createClient()
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return { error: NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 }) }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
        return { error: NextResponse.json({ success: false, error: '선생님 권한이 필요합니다.' }, { status: 403 }) }
    }

    return { supabase }
}

async function loadOrCreatePin(studentId: string) {
    const adminClient = createAdminClient()
    if (!adminClient) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY가 없어 학부모 접속 코드를 관리할 수 없습니다.')
    }

    const { data: existing, error: existingError } = await adminClient
        .from('study_progress')
        .select('completed_units, updated_at')
        .eq('user_id', studentId)
        .eq('course_id', PIN_COURSE)
        .maybeSingle()

    if (existingError) {
        throw new Error(existingError.message)
    }

    const currentPin = existing?.completed_units?.[0]
    if (currentPin) {
        return {
            adminClient,
            pin: currentPin,
            updatedAt: existing?.updated_at || null,
        }
    }

    const newPin = generateParentPin()
    const updatedAt = new Date().toISOString()
    const { error: upsertError } = await adminClient.from('study_progress').upsert(
        {
            user_id: studentId,
            course_id: PIN_COURSE,
            completed_units: [newPin],
            updated_at: updatedAt,
        },
        { onConflict: 'user_id,course_id' }
    )

    if (upsertError) {
        throw new Error(upsertError.message)
    }

    return {
        adminClient,
        pin: newPin,
        updatedAt,
    }
}

async function loadParentPinDiagnostics(studentId: string) {
    const { adminClient, pin, updatedAt } = await loadOrCreatePin(studentId)

    const { data: accessData, error: accessError } = await adminClient
        .from('parent_access_attempts')
        .select('id, success, failure_reason, attempted_at')
        .eq('student_id', studentId)
        .order('attempted_at', { ascending: false })
        .limit(8)

    const recentAccesses = (accessData || []) as ParentAccessAttemptRow[]
    const accessSummary = recentAccesses.reduce(
        (acc, attempt) => {
            acc.total += 1
            if (attempt.success) acc.success += 1
            else acc.failed += 1
            if (attempt.failure_reason === 'rate_limited') acc.rateLimited += 1
            return acc
        },
        { total: 0, success: 0, failed: 0, rateLimited: 0 }
    )

    return {
        pin,
        updatedAt,
        accessSummary,
        recentAccesses: recentAccesses.map(attempt => ({
            id: attempt.id,
            success: attempt.success,
            failureReason: attempt.failure_reason || null,
            attemptedAt: attempt.attempted_at,
        })),
        warning: accessError
            ? 'parent_access_attempts 테이블이 아직 없어 최근 부모 로그인 기록은 표시되지 않습니다. v15 migration 적용 후 활성화됩니다.'
            : undefined,
    }
}

export async function GET(request: NextRequest) {
    const auth = await requireTeacherSession()
    if ('error' in auth) {
        return auth.error
    }

    try {
        const studentId = request.nextUrl.searchParams.get('studentId')?.trim()
        if (!studentId) {
            return NextResponse.json({ success: false, error: 'studentId가 필요합니다.' }, { status: 400 })
        }

        const diagnostics = await loadParentPinDiagnostics(studentId)
        return NextResponse.json({
            success: true,
            ...diagnostics,
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '학부모 접속 코드를 불러오지 못했습니다.',
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireTeacherSession()
    if ('error' in auth) {
        return auth.error
    }

    try {
        const body = await request.json()
        const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : ''
        if (!studentId) {
            return NextResponse.json({ success: false, error: 'studentId가 필요합니다.' }, { status: 400 })
        }

        const adminClient = createAdminClient()
        if (!adminClient) {
            return NextResponse.json(
                { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY가 없어 학부모 접속 코드를 재발급할 수 없습니다.' },
                { status: 503 }
            )
        }

        const newPin = generateParentPin()
        const updatedAt = new Date().toISOString()
        const { error: upsertError } = await adminClient.from('study_progress').upsert(
            {
                user_id: studentId,
                course_id: PIN_COURSE,
                completed_units: [newPin],
                updated_at: updatedAt,
            },
            { onConflict: 'user_id,course_id' }
        )

        if (upsertError) {
            throw new Error(upsertError.message)
        }

        const diagnostics = await loadParentPinDiagnostics(studentId)
        return NextResponse.json({
            success: true,
            ...diagnostics,
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '학부모 접속 코드를 재발급하지 못했습니다.',
            },
            { status: 500 }
        )
    }
}
