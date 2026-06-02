import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { teacherFeedbackSchema } from '@/lib/validation'
import { deliverParentFeedbackNotification } from '@/lib/parent-notifications'
import { sendPushToStudent } from '@/lib/web-push'

type DeliverySummary = {
    status: string
    attempted: number
    sent: number
    failed: number
    skipped: number
}

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

        const payload = await request.json()
        const parsed = teacherFeedbackSchema.safeParse(payload)

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.flatten() },
                { status: 400 },
            )
        }

        const input = parsed.data
        const manualRecipient =
            input.parentPhone || input.parentName
                ? {
                    id: null as string | null,
                    parent_name: input.parentName?.trim() || '학부모',
                    parent_phone: input.parentPhone?.trim() || null,
                    kakao_recipient_key: null as string | null,
                    channel_user_key: null as string | null,
                    notifications_enabled: true,
                    receive_feedback_updates: true,
                }
                : null
        const { data: teacherProfile } = await supabase
            .from('profiles')
            .select('role, name, display_name')
            .eq('id', user.id)
            .maybeSingle()

        if (teacherProfile?.role !== 'teacher' && teacherProfile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: '선생님 권한이 필요합니다.' }, { status: 403 })
        }

        const teacherName =
            teacherProfile?.display_name ||
            teacherProfile?.name ||
            user.user_metadata?.display_name ||
            user.user_metadata?.name ||
            '선생님'

        const adminClient = createAdminClient()
        const db = adminClient ?? supabase
        const notifyParent = input.notifyParent && input.deliveryChannel === 'kakao'
        const initialDeliveryStatus = notifyParent
            ? adminClient
                ? 'pending'
                : 'unconfigured'
            : 'portal_only'

        const { data: feedback, error: insertError } = await db
            .from('teacher_feedback')
            .insert({
                student_id: input.studentId,
                teacher_id: user.id,
                teacher_name: teacherName,
                content: input.content.trim(),
                category: input.category,
                course_id: input.courseId || null,
                focus_score: input.focusScore ?? null,
                engagement_score: input.engagementScore ?? null,
                understanding_score: input.understandingScore ?? null,
                homework_summary: input.homeworkSummary?.trim() || null,
                next_plan: input.nextPlan?.trim() || null,
                notify_parent: input.notifyParent,
                delivery_channel: input.deliveryChannel,
                delivery_status: initialDeliveryStatus,
            })
            .select('*')
            .single()

        if (insertError || !feedback) {
            return NextResponse.json(
                { success: false, error: insertError?.message || '피드백 저장에 실패했습니다.' },
                { status: 500 },
            )
        }

        const summary: DeliverySummary = {
            status: initialDeliveryStatus,
            attempted: 0,
            sent: 0,
            failed: 0,
            skipped: 0,
        }

        if (!notifyParent) {
            return NextResponse.json({
                success: true,
                feedback,
                delivery: summary,
                message: '피드백이 저장되었습니다. 학부모 포털에서 바로 확인할 수 있습니다.',
            })
        }

        if (!adminClient) {
            return NextResponse.json({
                success: true,
                feedback,
                delivery: summary,
                warning: 'SUPABASE_SERVICE_ROLE_KEY가 없어 학부모 연락처 조회와 카카오 발송은 건너뛰었습니다.',
                message: '피드백은 저장되었습니다. 카카오 발송은 서버 설정 후 활성화됩니다.',
            })
        }

        const [{ data: studentProfile }, { data: parentLinks, error: parentError }] = await Promise.all([
            adminClient
                .from('profiles')
                .select('name')
                .eq('id', input.studentId)
                .maybeSingle(),
            adminClient
                .from('parent_student_links')
                .select('id, parent_name, parent_phone, kakao_recipient_key, channel_user_key, notifications_enabled, receive_feedback_updates')
                .eq('student_id', input.studentId)
                .eq('notifications_enabled', true)
                .eq('receive_feedback_updates', true),
        ])

        if (parentError) {
            await adminClient
                .from('teacher_feedback')
                .update({ delivery_status: 'failed' })
                .eq('id', feedback.id)

            return NextResponse.json({
                success: true,
                feedback: { ...feedback, delivery_status: 'failed' },
                delivery: { ...summary, status: 'failed' },
                warning: parentError.message,
                message: '피드백은 저장되었지만 학부모 연결 정보를 불러오지 못했습니다.',
            })
        }

        if ((!parentLinks || parentLinks.length === 0) && !manualRecipient) {
            await adminClient
                .from('teacher_feedback')
                .update({ delivery_status: 'no_recipient' })
                .eq('id', feedback.id)

            return NextResponse.json({
                success: true,
                feedback: { ...feedback, delivery_status: 'no_recipient' },
                delivery: { ...summary, status: 'no_recipient' },
                message: '피드백은 저장되었습니다. 연결된 학부모 수신 대상이 없습니다.',
            })
        }

        const studentName = studentProfile?.name || '학생'
        const recipients = [...(parentLinks || [])]

        if (manualRecipient && !recipients.some(parentLink => parentLink.parent_phone === manualRecipient.parent_phone)) {
            recipients.push(manualRecipient)
        }

        for (const parentLink of recipients) {
            summary.attempted += 1
            const delivery = await deliverParentFeedbackNotification({
                recipient: {
                    id: parentLink.id || undefined,
                    parentName: parentLink.parent_name,
                    parentPhone: parentLink.parent_phone,
                    kakaoRecipientKey: parentLink.kakao_recipient_key,
                    channelUserKey: parentLink.channel_user_key,
                },
                studentName,
                teacherName,
                category: input.category,
                content: input.content.trim(),
                courseTitle: input.courseTitle || null,
                focusScore: input.focusScore ?? null,
                engagementScore: input.engagementScore ?? null,
                understandingScore: input.understandingScore ?? null,
                homeworkSummary: input.homeworkSummary?.trim() || null,
                nextPlan: input.nextPlan?.trim() || null,
            })

            if (delivery.status === 'sent') summary.sent += 1
            if (delivery.status === 'failed') summary.failed += 1
            if (delivery.status === 'skipped') summary.skipped += 1

            await adminClient.from('feedback_delivery_logs').insert({
                feedback_id: feedback.id,
                student_id: input.studentId,
                parent_link_id: parentLink.id,
                channel: input.deliveryChannel,
                status: delivery.status,
                provider: delivery.provider,
                response_body: delivery.responseBody,
                error_message: delivery.errorMessage || null,
            })
        }

        summary.status =
            summary.sent > 0 && summary.failed === 0 && summary.skipped === 0
                ? 'sent'
                : summary.sent > 0
                    ? 'partial'
                    : summary.failed > 0
                        ? 'failed'
                        : 'skipped'

        await adminClient
            .from('teacher_feedback')
            .update({
                delivery_status: summary.status,
                delivered_at: summary.sent > 0 ? new Date().toISOString() : null,
            })
            .eq('id', feedback.id)

        // Web Push 알림 (best-effort, 실패해도 응답에 영향 없음)
        sendPushToStudent(input.studentId, {
            title: `${teacherName} 피드백 도착`,
            body: (input.nextPlan?.trim() || input.homeworkSummary?.trim() || input.content.trim()).slice(0, 100),
            tag: `feedback-${feedback.id}`,
            url: '/parent',
        }).catch(() => {})

        return NextResponse.json({
            success: true,
            feedback: {
                ...feedback,
                delivery_status: summary.status,
                delivered_at: summary.sent > 0 ? new Date().toISOString() : null,
            },
            delivery: summary,
            message:
                summary.status === 'sent'
                    ? '피드백이 저장되고 카카오로 전달되었습니다.'
                    : '피드백이 저장되었습니다. 카카오 전달 상태를 확인해주세요.',
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
            },
            { status: 500 },
        )
    }
}
