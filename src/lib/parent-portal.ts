import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

type ParentPortalRow = Record<string, unknown>

function createReadonlyClient(): SupabaseClient {
    const adminClient = createAdminClient()
    if (adminClient) return adminClient

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    }

    return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
}

export interface ParentDashboardSnapshot {
    student: {
        id: string
        name: string
        email: string
        level: number
        total_xp: number
        rank: string
    }
    dailyReports: ParentPortalRow[]
    schedules: ParentPortalRow[]
    attendance: ParentPortalRow[]
    teacherFeedbacks: ParentPortalRow[]
    parentFeedbacks: ParentPortalRow[]
    codeSubmissions: ParentPortalRow[]
    xpLogs: ParentPortalRow[]
    studyProgress: ParentPortalRow[]
    homeworkList: ParentPortalRow[]
    submissions: ParentPortalRow[]
    homeworkError: boolean
    presence: ParentPortalRow | null
}

export async function loadParentDashboardSnapshot(studentId: string): Promise<ParentDashboardSnapshot> {
    const db = createReadonlyClient()

    let profile: any = null;
    try {
        const { data, error } = await db
            .from('profiles')
            .select('id, name, email, level, total_xp, xp, rank')
            .eq('id', studentId)
            .maybeSingle()
        if (!error && data) profile = data;
    } catch { /* ignore */ }

    if (!profile) {
        // Fallback: return minimal profile
        profile = { id: studentId, name: '학생', email: '', level: 1, total_xp: 0, xp: 0, rank: 'beginner' };
    }

    // 각 테이블 조회 — 테이블이 없어도 에러 무시
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function safeQuery(fn: () => PromiseLike<{ data: any; error: any }>) {
        try {
            const { data, error } = await fn();
            return error ? [] : (data || []);
        } catch { return []; }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function safeSingle(fn: () => PromiseLike<{ data: any; error: any }>) {
        try {
            const { data, error } = await fn();
            return error ? null : data;
        } catch { return null; }
    }

    const [
        dailyReports, schedules, attendance, teacherFeedbacks,
        parentFeedbacks, codeSubmissions, xpLogs, studyProgress, presence,
        homeworkList, submissions,
    ] = await Promise.all([
        safeQuery(() => db.from('daily_reports').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(30)),
        safeQuery(() => db.from('class_schedules').select('*').eq('student_id', studentId).eq('is_active', true)),
        safeQuery(() => db.from('attendance').select('*').eq('user_id', studentId).order('check_date', { ascending: false }).limit(90)),
        safeQuery(() => db.from('teacher_feedback').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(50)),
        safeQuery(() => db.from('parent_feedback').select('*').eq('student_id', studentId).order('created_at', { ascending: false })),
        safeQuery(() => db.from('code_submissions').select('*').eq('user_id', studentId).order('created_at', { ascending: false }).limit(100)),
        safeQuery(() => db.from('xp_logs').select('*').eq('user_id', studentId).order('created_at', { ascending: false }).limit(60)),
        safeQuery(() => db.from('study_progress').select('course_id, completed_units, updated_at').eq('user_id', studentId).neq('course_id', '__parent_pin__')),
        safeSingle(() => db.from('student_presence').select('*').eq('user_id', studentId).maybeSingle()),
        safeQuery(() => db.from('homework').select('id, title, description, due_date, course_id, assigned_to, is_active, created_at').eq('is_active', true).or(`assigned_to.eq.${studentId},assigned_to.is.null`).order('created_at', { ascending: false }).limit(20)),
        safeQuery(() => db.from('homework_submissions').select('id, homework_id, user_id, content, score, feedback, submitted_at').eq('user_id', studentId).order('submitted_at', { ascending: false }).limit(50)),
    ])

    return {
        student: {
            id: profile.id,
            name: profile.name || '학생',
            email: profile.email || '',
            level: profile.level || 1,
            total_xp: profile.total_xp || profile.xp || 0,
            rank: profile.rank || '',
        },
        dailyReports: dailyReports as ParentPortalRow[],
        schedules: schedules as ParentPortalRow[],
        attendance: attendance as ParentPortalRow[],
        teacherFeedbacks: teacherFeedbacks as ParentPortalRow[],
        parentFeedbacks: parentFeedbacks as ParentPortalRow[],
        codeSubmissions: codeSubmissions as ParentPortalRow[],
        xpLogs: xpLogs as ParentPortalRow[],
        studyProgress: studyProgress as ParentPortalRow[],
        homeworkList: homeworkList as ParentPortalRow[],
        submissions: submissions as ParentPortalRow[],
        homeworkError: false,
        presence: presence as ParentPortalRow | null,
    }
}
