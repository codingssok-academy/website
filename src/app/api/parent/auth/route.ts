import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PIN_COURSE } from '@/lib/parent-auth'
import { createParentSessionToken, setParentSessionCookie } from '@/lib/parent-session'
import { findReferenceParentCode } from '@/lib/parent-code-reference'
import { callParentPortalEdge } from '@/lib/parent-edge'
import { findParentAuthInDatabase, hasDatabaseAdmin } from '@/lib/postgres-admin'

function isLocalRequest(request: NextRequest) {
    const host = request.headers.get('host') || ''
    return host.startsWith('localhost:') || host.startsWith('127.0.0.1:') || host.startsWith('[::1]:')
}

type StudentRow = {
    id: string
    name: string
    pin?: string | null
    auth_user_id?: string | null
    status?: string | null
}

type ProfileRow = {
    id: string
    name: string | null
    display_name: string | null
}

type EdgeParentAuthResponse = {
    success: true
    studentName: string
    studentId: string
}

function normalizeName(input: unknown) {
    return typeof input === 'string' ? input.trim().replace(/\s+/g, '') : ''
}

function normalizePin(input: unknown) {
    return typeof input === 'string' ? input.replace(/\D/g, '').slice(0, 5) : ''
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const name = normalizeName(body?.name)
        const pin = normalizePin(body?.pin)

        if (name.length < 2 || name.length > 20 || !/^\d{5}$/.test(pin)) {
            return NextResponse.json(
                { success: false, error: '학생 이름과 학부모 인증번호 5자리를 확인해주세요.' },
                { status: 400 },
            )
        }

        const adminClient = createAdminClient()
        if (!adminClient) {
            if (hasDatabaseAdmin()) {
                const auth = await findParentAuthInDatabase(name, pin)
                if (auth.status === 'deactivated') {
                    return NextResponse.json(
                        { success: false, error: '비활성화된 학생입니다. 선생님에게 문의해주세요.' },
                        { status: 403 },
                    )
                }
                if (auth.status === 'ok' && auth.studentId) {
                    const response = NextResponse.json({
                        success: true,
                        studentName: name,
                        studentId: auth.studentId,
                    })
                    setParentSessionCookie(response, createParentSessionToken({ studentId: auth.studentId, parentName: name }))
                    return response
                }
                return NextResponse.json(
                    { success: false, error: '학생 이름 또는 학부모 인증번호가 맞지 않습니다.' },
                    { status: 401 },
                )
            }
            if (isLocalRequest(request)) {
                const reference = findReferenceParentCode(name)
                if (reference?.code === pin) {
                    const response = NextResponse.json({
                        success: true,
                        studentName: name,
                        studentId: `reference:${name}`,
                        mode: 'reference',
                    })
                    setParentSessionCookie(response, createParentSessionToken({ studentId: `reference:${name}`, parentName: name }))
                    return response
                }
                if (reference) {
                    return NextResponse.json(
                        { success: false, error: '학생 이름 또는 학부모 인증번호가 맞지 않습니다.' },
                        { status: 401 },
                    )
                }
                return NextResponse.json(
                    { success: false, error: '학생 이름 또는 학부모 인증번호가 맞지 않습니다.' },
                    { status: 401 },
                )
            }
            const edgeAuth = await callParentPortalEdge<EdgeParentAuthResponse>('auth', { name, pin })
            if (edgeAuth.ok) {
                const response = NextResponse.json({
                    success: true,
                    studentName: edgeAuth.data.studentName || name,
                    studentId: edgeAuth.data.studentId,
                    mode: 'edge',
                })
                setParentSessionCookie(response, createParentSessionToken({ studentId: edgeAuth.data.studentId, parentName: name }))
                return response
            }

            return NextResponse.json(
                { success: false, error: edgeAuth.error || '학부모 인증 서버 설정이 없습니다.' },
                { status: edgeAuth.status || 503 },
            )
        }

        const [studentsRes, profilesRes] = await Promise.all([
            adminClient.from('students').select('id, name, pin, auth_user_id, status').eq('name', name).limit(5),
            adminClient.from('profiles').select('id, name, display_name').or(`name.eq.${name},display_name.eq.${name}`).limit(5),
        ])

        if (studentsRes.error) throw new Error(studentsRes.error.message)

        const students = (studentsRes.data || []) as StudentRow[]
        const profiles = (profilesRes.data || []) as ProfileRow[]
        if (students.some(student => student.status === 'deactivated')) {
            return NextResponse.json(
                { success: false, error: '비활성화된 학생입니다. 선생님에게 문의해주세요.' },
                { status: 403 },
            )
        }

        const profileById = new Map(profiles.map(profile => [profile.id, profile]))
        const profileByName = profiles.find(profile => profile.name === name || profile.display_name === name) || null

        const matchedStudent =
            students.find(student => student.pin === pin) ||
            students.find(student => {
                const profile = student.auth_user_id ? profileById.get(student.auth_user_id) : null
                return profile && (profile.name === name || profile.display_name === name) && student.pin === pin
            }) ||
            null

        let sessionStudentId = matchedStudent?.auth_user_id || matchedStudent?.id || profileByName?.id || null

        if (!matchedStudent && profileByName) {
            const { data: progress, error: progressError } = await adminClient
                .from('study_progress')
                .select('completed_units')
                .eq('user_id', profileByName.id)
                .eq('course_id', PIN_COURSE)
                .maybeSingle()
            if (progressError) throw new Error(progressError.message)
            if (progress?.completed_units?.[0] === pin) {
                sessionStudentId = profileByName.id
            }
        }

        if (!sessionStudentId) {
            return NextResponse.json(
                { success: false, error: '학생 이름 또는 학부모 인증번호가 맞지 않습니다.' },
                { status: 401 },
            )
        }

        const response = NextResponse.json({
            success: true,
            studentName: name,
            studentId: sessionStudentId,
        })
        setParentSessionCookie(response, createParentSessionToken({ studentId: sessionStudentId, parentName: name }))
        return response
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : '학부모 인증 중 오류가 발생했습니다.' },
            { status: 500 },
        )
    }
}
