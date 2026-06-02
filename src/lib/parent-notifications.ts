import { env } from '@/lib/env'

export interface ParentRecipient {
    id?: string
    parentName: string
    parentPhone?: string | null
    kakaoRecipientKey?: string | null
    channelUserKey?: string | null
}

export interface ParentFeedbackNotificationPayload {
    recipient: ParentRecipient
    studentName: string
    teacherName: string
    category: string
    content: string
    courseTitle?: string | null
    focusScore?: number | null
    engagementScore?: number | null
    understandingScore?: number | null
    homeworkSummary?: string | null
    nextPlan?: string | null
}

export interface NotificationDeliveryResult {
    status: 'sent' | 'failed' | 'skipped'
    provider: string
    responseBody: unknown
    errorMessage?: string
}

function formatScore(label: string, value?: number | null) {
    if (!value) return null
    return `${label} ${value}/5`
}

export function buildParentFeedbackMessage(payload: ParentFeedbackNotificationPayload) {
    const lines = [
        `[코딩쏙] ${payload.studentName} 학생 수업 피드백`,
        `선생님: ${payload.teacherName}`,
    ]

    if (payload.courseTitle) lines.push(`과정: ${payload.courseTitle}`)

    lines.push(`피드백: ${payload.content}`)

    const scores = [
        formatScore('집중도', payload.focusScore),
        formatScore('참여도', payload.engagementScore),
        formatScore('이해도', payload.understandingScore),
    ].filter(Boolean)

    if (scores.length > 0) lines.push(`평가: ${scores.join(' · ')}`)
    if (payload.homeworkSummary) lines.push(`숙제: ${payload.homeworkSummary}`)
    if (payload.nextPlan) lines.push(`다음 수업: ${payload.nextPlan}`)

    return lines.join('\n')
}

export async function deliverParentFeedbackNotification(payload: ParentFeedbackNotificationPayload): Promise<NotificationDeliveryResult> {
    if (!env.KAKAO_BIZ_MESSAGE_ENDPOINT) {
        return {
            status: 'skipped',
            provider: 'unconfigured',
            responseBody: { reason: 'KAKAO_BIZ_MESSAGE_ENDPOINT is missing' },
        }
    }

    if (!payload.recipient.parentPhone && !payload.recipient.kakaoRecipientKey && !payload.recipient.channelUserKey) {
        return {
            status: 'skipped',
            provider: 'recipient-missing',
            responseBody: { reason: 'parent recipient information is missing' },
        }
    }

    const response = await fetch(env.KAKAO_BIZ_MESSAGE_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(env.KAKAO_BIZ_MESSAGE_TOKEN
                ? { Authorization: `Bearer ${env.KAKAO_BIZ_MESSAGE_TOKEN}` }
                : {}),
        },
        body: JSON.stringify({
            type: 'teacher_feedback',
            channel: 'kakao',
            recipient: {
                name: payload.recipient.parentName,
                phone: payload.recipient.parentPhone || null,
                kakaoRecipientKey: payload.recipient.kakaoRecipientKey || null,
                channelUserKey: payload.recipient.channelUserKey || null,
            },
            message: buildParentFeedbackMessage(payload),
            metadata: {
                studentName: payload.studentName,
                teacherName: payload.teacherName,
                category: payload.category,
            },
        }),
        cache: 'no-store',
    })

    const raw = await response.text()
    let parsed: unknown = raw
    try {
        parsed = raw ? JSON.parse(raw) : null
    } catch {
        parsed = raw
    }

    if (!response.ok) {
        return {
            status: 'failed',
            provider: 'external',
            responseBody: parsed,
            errorMessage: `${response.status} ${response.statusText}`,
        }
    }

    return {
        status: 'sent',
        provider: 'external',
        responseBody: parsed,
    }
}
