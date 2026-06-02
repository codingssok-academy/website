import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { deliverParentFeedbackNotification } from '@/lib/parent-notifications'

function sanitize(value: unknown) {
    return typeof value === 'string' ? value.trim() : ''
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

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, name, display_name')
            .eq('id', user.id)
            .maybeSingle()

        if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
            return NextResponse.json({ success: false, error: '선생님 권한이 필요합니다.' }, { status: 403 })
        }

        const body = await request.json()
        const parentName = sanitize(body.parentName) || '학부모'
        const parentPhone = sanitize(body.parentPhone) || null
        const kakaoRecipientKey = sanitize(body.kakaoRecipientKey) || null
        const channelUserKey = sanitize(body.channelUserKey) || null
        const studentName = sanitize(body.studentName) || '운영 테스트 학생'
        const message = sanitize(body.message) || '운영 테스트 메시지입니다.'

        if (!parentPhone && !kakaoRecipientKey && !channelUserKey) {
            return NextResponse.json(
                { success: false, error: '전화번호 또는 카카오 수신 키를 하나 이상 입력해주세요.' },
                { status: 400 }
            )
        }

        const teacherName =
            profile?.display_name ||
            profile?.name ||
            user.user_metadata?.display_name ||
            user.user_metadata?.name ||
            '선생님'

        const delivery = await deliverParentFeedbackNotification({
            recipient: {
                parentName,
                parentPhone,
                kakaoRecipientKey,
                channelUserKey,
            },
            studentName,
            teacherName,
            category: 'test',
            content: message,
            courseTitle: '운영 점검',
            nextPlan: '이 메시지가 도착하면 카카오 전달 경로가 정상입니다.',
        })

        return NextResponse.json({
            success: true,
            checks: {
                kakaoEndpointConfigured: Boolean(env.KAKAO_BIZ_MESSAGE_ENDPOINT),
                kakaoTokenConfigured: Boolean(env.KAKAO_BIZ_MESSAGE_TOKEN),
            },
            delivery,
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '카카오 테스트 발송에 실패했습니다.',
            },
            { status: 500 }
        )
    }
}
