'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProblemSets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sets, error } = await supabase
    .from('problem_sets')
    .select('*, problems(count)')
    .eq('is_published', true)
    .order('sort_order')

  if (error) return { data: null, error: error.message }

  // Get user's solve stats per set
  if (user) {
    const { data: submissions } = await supabase
      .from('problem_submissions')
      .select('problem_id, is_correct')
      .eq('student_id', user.id)
      .eq('is_correct', true)

    const solvedProblemIds = new Set(submissions?.map(s => s.problem_id) || [])

    // N+1 방지: 모든 문제를 한번에 조회
    const setIds = (sets || []).map(s => s.id)
    const { data: allProblems } = await supabase
      .from('problems')
      .select('id, set_id')
      .in('set_id', setIds)

    const problemsBySet = new Map<string, string[]>()
    allProblems?.forEach(p => {
      const list = problemsBySet.get(p.set_id) || []
      list.push(p.id)
      problemsBySet.set(p.set_id, list)
    })

    const setsWithStats = (sets || []).map(set => {
      const problemIds = problemsBySet.get(set.id) || []
      const solvedCount = problemIds.filter(id => solvedProblemIds.has(id)).length
      return {
        ...set,
        total_problems: problemIds.length,
        solved_count: solvedCount,
      }
    })

    return { data: setsWithStats, error: null }
  }

  return { data: sets, error: null }
}

export async function getProblemsInSet(setId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: problems, error } = await supabase
    .from('problems')
    .select('id, set_id, title, description, input_description, output_description, sample_input, sample_output, answer, difficulty, problem_type, xp_reward, sort_order')
    .eq('set_id', setId)
    .order('sort_order')

  if (error) return { data: null, error: error.message }

  // Get user's submission status for each problem
  if (user && problems) {
    const { data: submissions } = await supabase
      .from('problem_submissions')
      .select('problem_id, is_correct, submitted_at')
      .eq('student_id', user.id)

    const submissionMap = new Map<string, { attempted: boolean; solved: boolean; attempts: number }>()
    submissions?.forEach(s => {
      const existing = submissionMap.get(s.problem_id)
      if (existing) {
        existing.attempts++
        if (s.is_correct) existing.solved = true
      } else {
        submissionMap.set(s.problem_id, {
          attempted: true,
          solved: s.is_correct,
          attempts: 1,
        })
      }
    })

    const problemsWithStatus = problems.map(p => ({
      ...p,
      status: submissionMap.get(p.id) || { attempted: false, solved: false, attempts: 0 },
    }))

    return { data: problemsWithStatus, error: null }
  }

  return { data: problems, error: null }
}

export async function getProblemById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('problems')
    .select('*, problem_sets(title)')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function submitSolution(problemId: string, answer: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  // Get the problem to check answer
  const { data: problem } = await supabase
    .from('problems')
    .select('answer, xp_reward')
    .eq('id', problemId)
    .single()

  if (!problem) return { error: '문제를 찾을 수 없습니다.' }

  // Get attempt number
  const { count } = await supabase
    .from('problem_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('problem_id', problemId)
    .eq('student_id', user.id)

  const attemptNumber = (count || 0) + 1
  const isCorrect = problem.answer ?
    answer.trim().toLowerCase() === problem.answer.trim().toLowerCase() : false

  const { error } = await supabase.from('problem_submissions').insert({
    problem_id: problemId,
    student_id: user.id,
    answer,
    is_correct: isCorrect,
    attempt_number: attemptNumber,
  })

  if (error) return { error: error.message }

  // Log activity
  await supabase.from('activity_logs').insert({
    student_id: user.id,
    activity_type: 'problem_submit',
    metadata: { problem_id: problemId, is_correct: isCorrect },
  })

  revalidatePath('/dashboard/learning/problems')
  return { error: null, isCorrect, attemptNumber }
}

export async function getSubmissionHistory(problemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: '인증이 필요합니다.' }

  const { data, error } = await supabase
    .from('problem_submissions')
    .select('id, problem_id, answer, is_correct, attempt_number, submitted_at')
    .eq('problem_id', problemId)
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createProblemSet(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { error } = await supabase.from('problem_sets').insert({
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    category: formData.get('category') as string || null,
    difficulty: formData.get('difficulty') as string || 'beginner',
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/learning/problems')
  return { error: null }
}

export async function createProblem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { error } = await supabase.from('problems').insert({
    set_id: formData.get('set_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    input_description: formData.get('input_description') as string || null,
    output_description: formData.get('output_description') as string || null,
    sample_input: formData.get('sample_input') as string || null,
    sample_output: formData.get('sample_output') as string || null,
    answer: formData.get('answer') as string || null,
    difficulty: parseInt(formData.get('difficulty') as string || '1'),
    problem_type: formData.get('problem_type') as string || 'text',
    xp_reward: parseInt(formData.get('xp_reward') as string || '10'),
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/learning/problems')
  return { error: null }
}

export async function getStudentProblemStats(studentId: string) {
  const supabase = await createClient()

  const { data: submissions, error } = await supabase
    .from('problem_submissions')
    .select('problem_id, is_correct, submitted_at')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const totalSubmissions = submissions?.length || 0
  const correctSubmissions = submissions?.filter(s => s.is_correct).length || 0
  const uniqueProblems = new Set(submissions?.map(s => s.problem_id)).size
  const solvedProblems = new Set(
    submissions?.filter(s => s.is_correct).map(s => s.problem_id)
  ).size

  return {
    data: {
      totalSubmissions,
      correctSubmissions,
      uniqueProblems,
      solvedProblems,
      accuracy: totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0,
      recentSubmissions: submissions?.slice(0, 20) || [],
    },
    error: null,
  }
}
