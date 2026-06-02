import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'

type DeliveryLogRow = {
    id: string
    feedback_id: string
    student_id: string
    parent_link_id: string | null
    channel: string
    status: string
    provider: string | null
    error_message: string | null
    attempted_at: string
}

type ParentAccessAttemptRow = {
    id: string
    success: boolean
    failure_reason: string | null
    attempted_at: string
    student_id: string | null
}

type ReadinessItem = {
    id: string
    label: string
    done: boolean
    blocking: boolean
    detail: string
    action: string
}

export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: '선생님 권한이 필요합니다.' }, { status: 403 })
        }

        const checks = {
            serviceRoleConfigured: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
            kakaoEndpointConfigured: Boolean(env.KAKAO_BIZ_MESSAGE_ENDPOINT),
            kakaoTokenConfigured: Boolean(env.KAKAO_BIZ_MESSAGE_TOKEN),
            parentSessionSecretConfigured: Boolean(env.PARENT_SESSION_SECRET),
        }

        const adminClient = createAdminClient()
        if (!adminClient) {
            const readinessItems: ReadinessItem[] = [
                {
                    id: 'service-role',
                    label: 'SUPABASE_SERVICE_ROLE_KEY',
                    done: checks.serviceRoleConfigured,
                    blocking: true,
                    detail: '학부모 포털 서버 조회, 부모 PIN 관리, 카카오 전달 로그 분석에 필요합니다.',
                    action: '배포 환경변수에 service role key를 추가하세요.',
                },
                {
                    id: 'parent-session-secret',
                    label: 'PARENT_SESSION_SECRET',
                    done: checks.parentSessionSecretConfigured,
                    blocking: true,
                    detail: '학부모 세션 쿠키 서명 검증에 필요합니다.',
                    action: '충분히 긴 랜덤 문자열을 환경변수에 설정하세요.',
                },
            ]
            return NextResponse.json({
                success: true,
                checks,
                parentRecipients: null,
                parentAccess: null,
                recentParentAccesses: [],
                recentDeliveries: [],
                readiness: {
                    score: Math.round((readinessItems.filter(item => item.done).length / readinessItems.length) * 100),
                    blockingCount: readinessItems.filter(item => item.blocking && !item.done).length,
                    items: readinessItems,
                },
                summary: { total: 0, sent: 0, failed: 0, skipped: 0 },
                warning: 'SUPABASE_SERVICE_ROLE_KEY가 없어 최근 전달 로그와 운영 통계를 불러오지 못했습니다.',
            })
        }

        const [linksRes, logsRes, parentAccessRes, feedbackSchemaRes, presenceSchemaRes, teacherPolicyHelperRes] = await Promise.all([
            adminClient
                .from('parent_student_links')
                .select('id, student_id, parent_name, parent_phone, kakao_recipient_key, channel_user_key, notifications_enabled, receive_live_updates, receive_feedback_updates'),
            adminClient
                .from('feedback_delivery_logs')
                .select('id, feedback_id, student_id, parent_link_id, channel, status, provider, error_message, attempted_at')
                .order('attempted_at', { ascending: false })
                .limit(25),
            adminClient
                .from('parent_access_attempts')
                .select('id, success, failure_reason, attempted_at, student_id')
                .order('attempted_at', { ascending: false })
                .limit(20),
            adminClient
                .from('teacher_feedback')
                .select('id, delivery_status, delivered_at, next_plan, homework_summary')
                .limit(1),
            adminClient
                .from('student_presence')
                .select('user_id, activity_state, current_focus_label, session_origin, learning_context')
                .limit(1),
            adminClient.rpc('is_teacher_or_admin', { uid: user.id }),
        ])

        const links = linksRes.data || []
        const logs = (logsRes.data || []) as DeliveryLogRow[]
        const parentAccessAttempts = (parentAccessRes.data || []) as ParentAccessAttemptRow[]

        const uniqueStudentIds = Array.from(
            new Set(
                [...logs.map(log => log.student_id), ...parentAccessAttempts.map(item => item.student_id)]
                    .filter(Boolean)
            )
        ) as string[]
        const uniqueParentLinkIds = Array.from(new Set(logs.map(log => log.parent_link_id).filter(Boolean))) as string[]

        const [studentsRes, linkedRecipientsRes] = await Promise.all([
            uniqueStudentIds.length > 0
                ? adminClient.from('profiles').select('id, name').in('id', uniqueStudentIds)
                : Promise.resolve({ data: [], error: null }),
            uniqueParentLinkIds.length > 0
                ? adminClient.from('parent_student_links').select('id, parent_name').in('id', uniqueParentLinkIds)
                : Promise.resolve({ data: [], error: null }),
        ])

        const studentNameMap = new Map<string, string>(
            (studentsRes.data || []).map(row => [row.id, row.name || '학생'])
        )
        const parentNameMap = new Map<string, string>(
            (linkedRecipientsRes.data || []).map(row => [row.id, row.parent_name || '학부모'])
        )

        const recentDeliveries = logs.map(log => ({
            id: log.id,
            feedbackId: log.feedback_id,
            studentId: log.student_id,
            studentName: studentNameMap.get(log.student_id) || '학생',
            parentLinkId: log.parent_link_id,
            parentName: log.parent_link_id ? (parentNameMap.get(log.parent_link_id) || '학부모') : '수동 입력 수신자',
            channel: log.channel,
            status: log.status,
            provider: log.provider || null,
            attemptedAt: log.attempted_at,
            errorMessage: log.error_message || null,
        }))

        const summary = logs.reduce(
            (acc, log) => {
                acc.total += 1
                if (log.status === 'sent') acc.sent += 1
                else if (log.status === 'failed') acc.failed += 1
                else acc.skipped += 1
                return acc
            },
            { total: 0, sent: 0, failed: 0, skipped: 0 }
        )

        const parentRecipients = {
            totalLinks: links.length,
            feedbackEnabled: links.filter(link => link.notifications_enabled && link.receive_feedback_updates).length,
            liveEnabled: links.filter(link => link.notifications_enabled && link.receive_live_updates).length,
            missingDeliveryTarget: links.filter(link => !link.parent_phone && !link.kakao_recipient_key && !link.channel_user_key).length,
        }

        const readinessItems: ReadinessItem[] = [
            {
                id: 'service-role',
                label: 'SUPABASE_SERVICE_ROLE_KEY',
                done: checks.serviceRoleConfigured,
                blocking: true,
                detail: '학부모 포털 서버 조회와 운영 로그 집계에 필요합니다.',
                action: '배포 환경변수에 service role key를 넣으세요.',
            },
            {
                id: 'parent-session-secret',
                label: 'PARENT_SESSION_SECRET',
                done: checks.parentSessionSecretConfigured,
                blocking: true,
                detail: '학부모 세션 쿠키 서명에 필요합니다.',
                action: '충분히 긴 랜덤 문자열을 환경변수에 설정하세요.',
            },
            {
                id: 'kakao-endpoint',
                label: 'KAKAO_BIZ_MESSAGE_ENDPOINT',
                done: checks.kakaoEndpointConfigured,
                blocking: true,
                detail: '카카오 알림/재전송 요청이 도착할 엔드포인트입니다.',
                action: '카카오 비즈 메시지 연동 엔드포인트를 설정하세요.',
            },
            {
                id: 'kakao-token',
                label: 'KAKAO_BIZ_MESSAGE_TOKEN',
                done: checks.kakaoTokenConfigured,
                blocking: true,
                detail: '카카오 비즈 메시지 인증 토큰입니다.',
                action: '카카오 발송 토큰을 환경변수에 넣으세요.',
            },
            {
                id: 'migration-v13',
                label: 'v13 Parent Engagement',
                done: !linksRes.error && !logsRes.error && !feedbackSchemaRes.error,
                blocking: true,
                detail: '학부모 링크, 전달 로그, 구조화된 피드백 컬럼이 준비되어야 합니다.',
                action: 'migration_v13_parent_engagement.sql 을 적용하세요.',
            },
            {
                id: 'migration-v14',
                label: 'v14 Teacher Auth Security',
                done: !teacherPolicyHelperRes.error,
                blocking: true,
                detail: 'teacher/admin helper 함수와 보안 정책이 준비되어야 합니다.',
                action: 'migration_v14_teacher_auth_security.sql 을 적용하세요.',
            },
            {
                id: 'migration-v15',
                label: 'v15 Parent Portal Security',
                done: !parentAccessRes.error && !presenceSchemaRes.error,
                blocking: true,
                detail: '부모 로그인 시도 기록과 부모 포털 보안 정책이 준비되어야 합니다.',
                action: 'migration_v15_parent_portal_security.sql 을 적용하세요.',
            },
            {
                id: 'linked-parents',
                label: '학부모 전달 대상 등록',
                done: parentRecipients.feedbackEnabled > 0,
                blocking: false,
                detail: '실제 피드백을 받을 학부모 링크가 1명 이상 연결되어야 합니다.',
                action: '학생 상세에서 학부모 이름/연락처/카카오 키를 등록하세요.',
            },
            {
                id: 'delivery-targets',
                label: '전달 정보 누락 정리',
                done: parentRecipients.totalLinks === 0 ? false : parentRecipients.missingDeliveryTarget === 0,
                blocking: false,
                detail: '전화번호 또는 카카오 수신 키가 비어 있으면 알림이 건너뜁니다.',
                action: '누락된 학부모 링크에 전화번호나 recipient key를 채우세요.',
            },
        ]

        const readiness = {
            score: Math.round((readinessItems.filter(item => item.done).length / readinessItems.length) * 100),
            blockingCount: readinessItems.filter(item => item.blocking && !item.done).length,
            items: readinessItems,
        }

        const parentAccess = parentAccessRes.error
            ? null
            : parentAccessAttempts.reduce(
                (acc, attempt) => {
                    acc.total += 1
                    if (attempt.success) acc.success += 1
                    else acc.failed += 1
                    if (attempt.failure_reason === 'rate_limited') acc.rateLimited += 1
                    return acc
                },
                { total: 0, success: 0, failed: 0, rateLimited: 0 }
            )

        const recentParentAccesses = parentAccessRes.error
            ? []
            : parentAccessAttempts.map(attempt => ({
                id: attempt.id,
                studentId: attempt.student_id,
                studentName: attempt.student_id ? (studentNameMap.get(attempt.student_id) || '학생') : '미확인 학생',
                success: attempt.success,
                failureReason: attempt.failure_reason || null,
                attemptedAt: attempt.attempted_at,
            }))

        return NextResponse.json({
            success: true,
            checks,
            parentRecipients,
            parentAccess,
            readiness,
            summary,
            recentDeliveries,
            recentParentAccesses,
            warning: parentAccessRes.error
                ? 'parent_access_attempts 테이블이 아직 없어 부모 로그인 시도 통계는 표시되지 않습니다. v15 migration 적용 후 활성화됩니다.'
                : undefined,
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '운영 진단 정보를 불러오지 못했습니다.',
            },
            { status: 500 }
        )
    }
}
