import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deliverParentFeedbackNotification } from '@/lib/parent-notifications'

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const deliveryLogId = typeof body.deliveryLogId === 'string' ? body.deliveryLogId.trim() : ''
        if (!deliveryLogId) {
            return NextResponse.json({ success: false, error: 'deliveryLogId가 필요합니다.' }, { status: 400 })
        }

        const adminClient = createAdminClient()
        if (!adminClient) {
            return NextResponse.json(
                { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY가 없어 재전송을 실행할 수 없습니다.' },
                { status: 503 }
            )
        }

        const { data: log, error: logError } = await adminClient
            .from('feedback_delivery_logs')
            .select('id, feedback_id, student_id, parent_link_id, channel, status')
            .eq('id', deliveryLogId)
            .maybeSingle()

        if (logError || !log) {
            return NextResponse.json(
                { success: false, error: logError?.message || '재전송할 로그를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        if (!log.parent_link_id) {
            return NextResponse.json(
                { success: false, error: '수동 입력 수신자는 재전송할 수 없습니다. 학부모 링크를 다시 확인해주세요.' },
                { status: 400 }
            )
        }

        const [{ data: feedback, error: feedbackError }, { data: parentLink, error: parentLinkError }, { data: studentProfile }] = await Promise.all([
            adminClient
                .from('teacher_feedback')
                .select('id, teacher_name, content, category, course_id, focus_score, engagement_score, understanding_score, homework_summary, next_plan')
                .eq('id', log.feedback_id)
                .maybeSingle(),
            adminClient
                .from('parent_student_links')
                .select('id, parent_name, parent_phone, kakao_recipient_key, channel_user_key, notifications_enabled, receive_feedback_updates')
                .eq('id', log.parent_link_id)
                .maybeSingle(),
            adminClient
                .from('profiles')
                .select('name')
                .eq('id', log.student_id)
                .maybeSingle(),
        ])

        if (feedbackError || !feedback) {
            return NextResponse.json(
                { success: false, error: feedbackError?.message || '피드백 원본을 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        if (parentLinkError || !parentLink) {
            return NextResponse.json(
                { success: false, error: parentLinkError?.message || '학부모 연결 정보를 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        if (!parentLink.notifications_enabled || !parentLink.receive_feedback_updates) {
            return NextResponse.json(
                { success: false, error: '이 학부모는 현재 피드백 수신이 꺼져 있어 재전송할 수 없습니다.' },
                { status: 400 }
            )
        }

        const delivery = await deliverParentFeedbackNotification({
            recipient: {
                id: parentLink.id,
                parentName: parentLink.parent_name,
                parentPhone: parentLink.parent_phone,
                kakaoRecipientKey: parentLink.kakao_recipient_key,
                channelUserKey: parentLink.channel_user_key,
            },
            studentName: studentProfile?.name || '학생',
            teacherName: feedback.teacher_name || '선생님',
            category: feedback.category || 'lesson',
            content: feedback.content,
            courseTitle: feedback.course_id || null,
            focusScore: feedback.focus_score ?? null,
            engagementScore: feedback.engagement_score ?? null,
            understandingScore: feedback.understanding_score ?? null,
            homeworkSummary: feedback.homework_summary ?? null,
            nextPlan: feedback.next_plan ?? null,
        })

        await adminClient.from('feedback_delivery_logs').insert({
            feedback_id: log.feedback_id,
            student_id: log.student_id,
            parent_link_id: log.parent_link_id,
            channel: log.channel,
            status: delivery.status,
            provider: delivery.provider,
            response_body: delivery.responseBody,
            error_message: delivery.errorMessage || null,
        })

        await adminClient
            .from('teacher_feedback')
            .update({
                delivery_status: delivery.status === 'sent' ? 'sent' : delivery.status,
                delivered_at: delivery.status === 'sent' ? new Date().toISOString() : null,
            })
            .eq('id', log.feedback_id)

        return NextResponse.json({
            success: true,
            delivery,
            message:
                delivery.status === 'sent'
                    ? '카카오 재전송이 완료되었습니다.'
                    : `카카오 재전송 결과: ${delivery.status}`,
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '카카오 재전송에 실패했습니다.',
            },
            { status: 500 }
        )
    }
}
