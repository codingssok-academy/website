'use server'

import { createClient } from '@/lib/supabase/server'

export async function getNote(materialId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: '인증이 필요합니다.' }

  const { data, error } = await supabase
    .from('study_notes')
    .select('*')
    .eq('student_id', user.id)
    .eq('material_id', materialId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function saveNote(materialId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { error } = await supabase.from('study_notes').upsert({
    student_id: user.id,
    material_id: materialId,
    content,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'student_id,material_id' })

  if (error) return { error: error.message }
  return { error: null }
}

export async function getStudentNotes(studentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('study_notes')
    .select(`
      *,
      learning_materials (id, title, category)
    `)
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getAllNotesForMaterial(materialId: string) {
  const supabase = await createClient()

  // 교사/관리자만 모든 학생 노트 열람 가능
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: '인증이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    return { data: null, error: '권한이 없습니다.' }
  }

  const { data, error } = await supabase
    .from('study_notes')
    .select(`
      id, content, updated_at, student_id,
      profiles (id, name)
    `)
    .eq('material_id', materialId)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
