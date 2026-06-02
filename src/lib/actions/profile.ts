'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProfileStats(userId: string) {
  const supabase = await createClient()

  // Profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, display_name, avatar_url, role, bio, total_xp, level, rank, created_at')
    .eq('id', userId)
    .single()

  if (!profile) return { data: null, error: '프로필을 찾을 수 없습니다.' }

  // Problem stats
  const { data: submissions } = await supabase
    .from('problem_submissions')
    .select('problem_id, is_correct')
    .eq('student_id', userId)

  const totalSubmissions = submissions?.length || 0
  const solvedProblems = new Set(
    submissions?.filter(s => s.is_correct).map(s => s.problem_id)
  ).size

  // Notes count
  const { count: notesCount } = await supabase
    .from('study_notes')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId)

  // Materials viewed
  const { count: materialsViewed } = await supabase
    .from('material_views')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', userId)

  // XP history
  const { data: xpLogs } = await supabase
    .from('xp_logs')
    .select('amount, reason, created_at')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Rank exams
  const { data: rankExams } = await supabase
    .from('rank_exams')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false })

  return {
    data: {
      profile,
      stats: {
        totalSubmissions,
        solvedProblems,
        accuracy: totalSubmissions > 0 ? Math.round((submissions?.filter(s => s.is_correct).length || 0) / totalSubmissions * 100) : 0,
        notesCount: notesCount || 0,
        materialsViewed: materialsViewed || 0,
      },
      xpLogs: xpLogs || [],
      rankExams: rankExams || [],
    },
    error: null,
  }
}

export async function getActivityHeatmap(userId: string) {
  const supabase = await createClient()

  // Get activity for the last 365 days
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data, error } = await supabase
    .from('activity_logs')
    .select('activity_date, count')
    .eq('student_id', userId)
    .gte('activity_date', oneYearAgo.toISOString().split('T')[0])
    .order('activity_date')

  if (error) return { data: null, error: error.message }

  // Aggregate by date
  const heatmap: Record<string, number> = {}
  data?.forEach(log => {
    const date = log.activity_date
    heatmap[date] = (heatmap[date] || 0) + (log.count || 1)
  })

  return { data: heatmap, error: null }
}

export async function getRecentActivity(userId: string) {
  const supabase = await createClient()

  // Recent problem submissions
  const { data: recentSubmissions } = await supabase
    .from('problem_submissions')
    .select(`
      id, is_correct, submitted_at, attempt_number,
      problems (title, difficulty)
    `)
    .eq('student_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(10)

  // Recent material views
  const { data: recentViews } = await supabase
    .from('material_views')
    .select(`
      id, viewed_at,
      learning_materials (title, category)
    `)
    .eq('student_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(10)

  // Recent notes
  const { data: recentNotes } = await supabase
    .from('study_notes')
    .select(`
      id, updated_at,
      learning_materials (title, category)
    `)
    .eq('student_id', userId)
    .order('updated_at', { ascending: false })
    .limit(10)

  return {
    data: {
      submissions: recentSubmissions || [],
      materialViews: recentViews || [],
      notes: recentNotes || [],
    },
    error: null,
  }
}
