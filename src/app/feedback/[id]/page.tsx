import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

interface FeedbackContent {
    lessons?: string
    homework?: string
    attitude_score?: number
    attitude_comment?: string
    focus_score?: number
    participation_score?: number
    understanding_score?: number
    understanding_comment?: string
    special_notes?: string
    image_url?: string
}

interface PageProps {
    params: Promise<{ id: string }>
}

function maskName(name: string): string {
    if (!name || name.length < 2) return name
    if (name.length === 2) return name[0] + 'O'
    const mid = Math.floor(name.length / 2)
    return name[0] + 'O' + name[name.length - 1]
}

function Stars({ score, max = 5 }: { score: number; max?: number }) {
    return (
        <span style={{ letterSpacing: 2 }}>
            {Array.from({ length: max }, (_, i) => (
                <span
                    key={i}
                    style={{ color: i < score ? '#f59e0b' : '#d1d5db', fontSize: 18 }}
                >
                    {i < score ? '★' : '☆'}
                </span>
            ))}
        </span>
    )
}

function ScoreRow({ label, score, comment }: { label: string; score?: number; comment?: string }) {
    if (!score) return null
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 13, color: '#64748b', width: 100, flexShrink: 0, paddingTop: 2 }}>{label}</span>
            <div>
                <Stars score={score} />
                {comment && (
                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0', lineHeight: 1.6 }}>{comment}</p>
                )}
            </div>
        </div>
    )
}

export default async function PublicFeedbackPage({ params }: PageProps) {
    const { id } = await params

    const supabase = createServerClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        { cookies: { getAll: () => [], setAll: () => {} } },
    )

    // Try teacher_feedback by id first, then feedback_pages by slug
    let data: any = null
    const { data: d1, error: e1 } = await supabase
        .from('teacher_feedback')
        .select('id, student_id, student_name, date, content, teacher_name, created_at')
        .eq('id', id)
        .single()

    if (!e1 && d1) {
        data = d1
    } else {
        // Fallback: try feedback_pages by slug (for shared feedback URLs)
        const { data: d2 } = await supabase
            .from('feedback_pages')
            .select('*')
            .eq('slug', id)
            .single()
        if (d2) {
            data = {
                id: d2.id,
                student_name: d2.student_name,
                date: d2.date,
                content: JSON.stringify({
                    lessons: d2.learn || '',
                    homework: d2.homework || '',
                    special_notes: d2.extra || '',
                }),
                teacher_name: '선생님',
                created_at: d2.created_at,
            }
        }
    }

    if (!data) {
        notFound()
    }

    let parsed: FeedbackContent = {}
    try {
        const c = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
        if (c && typeof c === 'object') parsed = c as FeedbackContent
    } catch {
        parsed = { lessons: typeof data.content === 'string' ? data.content : '' }
    }

    const studentName = data.student_name || '학생'
    const maskedName = maskName(studentName)
    const dateStr = data.date
        ? new Date(data.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date(data.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    const teacherName = data.teacher_name || '선생님'

    return (
        <html lang="ko">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>수업 피드백 - {maskedName} 학생</title>
                <meta name="robots" content="noindex" />
            </head>
            <body style={{ margin: 0, padding: 0, background: '#f0f4f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', minHeight: '100vh' }}>
                <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 48px' }}>

                    {/* Header card */}
                    <div style={{
                        background: '#3b82f6',
                        borderRadius: '20px 20px 0 0',
                        padding: '28px 28px 24px',
                        textAlign: 'center',
                        color: '#fff',
                    }}>
                        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8, letterSpacing: 1 }}>
                            코딩쏙 코딩학원
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                            수업 피드백
                        </div>
                        <div style={{ fontSize: 14, opacity: 0.9 }}>
                            {maskedName} 학생 &middot; {dateStr}
                        </div>
                    </div>

                    {/* Main card */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '0 0 20px 20px',
                        padding: '28px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    }}>

                        {/* 배운 내용 */}
                        {parsed.lessons && (
                            <Section title="배운 내용">
                                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {parsed.lessons}
                                </p>
                            </Section>
                        )}

                        {/* 과제 */}
                        {parsed.homework && (
                            <Section title="과제">
                                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {parsed.homework}
                                </p>
                            </Section>
                        )}

                        {/* 수업 평가 */}
                        {(parsed.attitude_score || parsed.focus_score || parsed.participation_score || parsed.understanding_score) && (
                            <Section title="수업 평가">
                                <div>
                                    <ScoreRow label="수업태도" score={parsed.attitude_score} comment={parsed.attitude_comment} />
                                    <ScoreRow label="집중도" score={parsed.focus_score} />
                                    <ScoreRow label="참여도" score={parsed.participation_score} />
                                    <ScoreRow label="이해도 / 성취도" score={parsed.understanding_score} comment={parsed.understanding_comment} />
                                </div>
                            </Section>
                        )}

                        {/* 특이사항 */}
                        {parsed.special_notes && (
                            <Section title="특이사항">
                                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {parsed.special_notes}
                                </p>
                            </Section>
                        )}

                        {/* 이미지 */}
                        {parsed.image_url && (
                            <Section title="첨부 이미지">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={parsed.image_url}
                                    alt="수업 이미지"
                                    style={{ width: '100%', borderRadius: 12, display: 'block' }}
                                />
                            </Section>
                        )}

                        {/* Teacher note */}
                        <div style={{
                            marginTop: 28,
                            padding: '14px 18px',
                            borderRadius: 12,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: 13,
                            color: '#64748b',
                            textAlign: 'center',
                        }}>
                            {teacherName} 선생님이 작성한 피드백입니다
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#94a3b8' }}>
                        코딩쏙 코딩학원
                    </div>
                </div>
            </body>
        </html>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <h3 style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: 1,
                margin: '0 0 10px',
            }}>
                {title}
            </h3>
            {children}
        </div>
    )
}
