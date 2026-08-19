import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type TeacherProfile = {
    id: string
    email: string | null
    role: string | null
    name: string | null
    display_name: string | null
}

async function requireTeacher() {
    const supabase = await createClient()
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            error: NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 }),
        }
    }

    const adminClient = createAdminClient()
    const profileClient = adminClient ?? supabase
    const { data: profile, error: profileError } = await profileClient
        .from('profiles')
        .select('id, email, role, name, display_name')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError || !profile) {
        return {
            error: NextResponse.json(
                { success: false, error: profileError?.message || '계정 정보를 찾을 수 없습니다.' },
                { status: 404 },
            ),
        }
    }

    if (profile.role !== 'teacher' && profile.role !== 'admin') {
        return {
            error: NextResponse.json({ success: false, error: '선생님 권한이 필요합니다.' }, { status: 403 }),
        }
    }

    return {
        supabase,
        adminClient,
        user,
        profile: profile as TeacherProfile,
    }
}

export async function GET() {
    try {
        const context = await requireTeacher()
        if ('error' in context) return context.error

        const { adminClient, profile, user } = context
        let accounts: TeacherProfile[] = [profile]
        let warning: string | null = null

        if (adminClient) {
            const { data, error } = await adminClient
                .from('profiles')
                .select('id, email, role, name, display_name')
                .in('role', ['teacher', 'admin'])

            if (error) {
                warning = error.message
            } else if (data?.length) {
                accounts = (data as TeacherProfile[]).sort((a, b) => {
                    const roleCompare = (a.role || '').localeCompare(b.role || '')
                    if (roleCompare !== 0) return roleCompare
                    return (a.display_name || a.name || a.email || '').localeCompare(
                        b.display_name || b.name || b.email || '',
                        'ko',
                    )
                })
            }
        } else {
            warning = 'SUPABASE_SERVICE_ROLE_KEY가 없어 현재 로그인 계정만 표시합니다.'
        }

        return NextResponse.json({
            success: true,
            current: {
                ...profile,
                email: profile.email || user.email || null,
            },
            accounts: accounts.map(account => ({
                ...account,
                email:
                    account.id === profile.id
                        ? account.email || user.email || null
                        : account.email,
            })),
            warning,
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '계정 정보를 불러오지 못했습니다.',
            },
            { status: 500 },
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const context = await requireTeacher()
        if ('error' in context) return context.error

        const payload = await request.json()
        const name = typeof payload?.name === 'string' ? payload.name.trim() : ''
        const displayName =
            typeof payload?.displayName === 'string' ? payload.displayName.trim() : ''

        if (!displayName) {
            return NextResponse.json(
                { success: false, error: '표시 이름을 입력해주세요.' },
                { status: 400 },
            )
        }

        const db = context.adminClient ?? context.supabase
        const { data, error } = await db
            .from('profiles')
            .update({
                name: name || null,
                display_name: displayName,
            })
            .eq('id', context.profile.id)
            .select('id, email, role, name, display_name')
            .single()

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: error?.message || '계정 정보를 저장하지 못했습니다.' },
                { status: 500 },
            )
        }

        return NextResponse.json({
            success: true,
            current: data,
            message: '계정 정보가 저장되었습니다.',
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '계정 저장 중 오류가 발생했습니다.',
            },
            { status: 500 },
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const context = await requireTeacher()
        if ('error' in context) return context.error

        const payload = await request.json()
        const password = typeof payload?.password === 'string' ? payload.password : ''

        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: '비밀번호는 8자 이상이어야 합니다.' },
                { status: 400 },
            )
        }

        const { error } = await context.supabase.auth.updateUser({ password })

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message || '비밀번호를 변경하지 못했습니다.' },
                { status: 400 },
            )
        }

        return NextResponse.json({
            success: true,
            message: '비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.',
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '비밀번호 변경 중 오류가 발생했습니다.',
            },
            { status: 500 },
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const context = await requireTeacher()
        if ('error' in context) return context.error

        if (context.profile.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: '관리자 계정만 이전 관리자 계정을 삭제할 수 있습니다.' },
                { status: 403 },
            )
        }

        const payload = await request.json().catch(() => ({}))
        if (payload?.action !== 'removeFormerAdministrator' || payload?.confirmationName !== '구자현') {
            return NextResponse.json(
                { success: false, error: '삭제 확인 정보가 올바르지 않습니다.' },
                { status: 400 },
            )
        }

        const admin = context.adminClient
        if (!admin) {
            return NextResponse.json(
                { success: false, error: '운영 계정 관리 설정을 확인해주세요.' },
                { status: 503 },
            )
        }

        const [{ data: profiles, error: profileReadError }, { data: students, error: studentReadError }] =
            await Promise.all([
                admin
                    .from('profiles')
                    .select('id,name,display_name,email,role')
                    .or('name.eq.구자현,display_name.eq.구자현'),
                admin
                    .from('students')
                    .select('id,name,auth_user_id,class,status')
                    .eq('name', '구자현'),
            ])

        if (profileReadError || studentReadError) {
            return NextResponse.json(
                {
                    success: false,
                    error: profileReadError?.message || studentReadError?.message || '삭제 대상을 확인하지 못했습니다.',
                },
                { status: 500 },
            )
        }

        const targetAuthIds = new Set<string>()
        for (const profile of profiles || []) targetAuthIds.add(profile.id)
        for (const student of students || []) {
            if (student.auth_user_id) targetAuthIds.add(student.auth_user_id)
        }

        const allProfilesAreAdmins = (profiles || []).every(profile => profile.role === 'admin')
        const allStudentsAreAdmins = (students || []).every(student => student.class === 'admin')
        if (targetAuthIds.size !== 3 || !allProfilesAreAdmins || !allStudentsAreAdmins) {
            return NextResponse.json(
                { success: false, error: '확인된 삭제 대상이 예상한 구자현 관리자 계정 3개와 일치하지 않습니다.' },
                { status: 409 },
            )
        }

        if (targetAuthIds.has(context.user.id)) {
            return NextResponse.json(
                { success: false, error: '현재 로그인한 관리자 계정은 삭제할 수 없습니다.' },
                { status: 400 },
            )
        }

        for (const userId of targetAuthIds) {
            const { error } = await admin.auth.admin.deleteUser(userId)
            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 })
            }
        }

        const { error: studentDeleteError } = await admin.from('students').delete().eq('name', '구자현')
        if (studentDeleteError) {
            return NextResponse.json({ success: false, error: studentDeleteError.message }, { status: 500 })
        }

        const { error: profileDeleteError } = await admin
            .from('profiles')
            .delete()
            .or('name.eq.구자현,display_name.eq.구자현')
        if (profileDeleteError) {
            return NextResponse.json({ success: false, error: profileDeleteError.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            removedAuthAccounts: targetAuthIds.size,
            removedStudentRows: (students || []).length,
            removedProfileRows: (profiles || []).length,
            message: '구자현 관리자 계정을 삭제했습니다.',
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '계정 삭제 중 오류가 발생했습니다.',
            },
            { status: 500 },
        )
    }
}
