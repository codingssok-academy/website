import type { SupabaseClient } from '@supabase/supabase-js'

export const PIN_COURSE = '__parent_pin__'

export interface ParentAccessProfile {
    id: string
    name: string | null
    display_name?: string | null
    email: string | null
    level?: number | null
    total_xp?: number | null
    xp?: number | null
    rank?: string | null
}

export function generateParentPin(): string {
    return String(Math.floor(10000 + Math.random() * 90000))
}

async function findProfileByParentQuery(
    supabase: SupabaseClient,
    studentQuery: string
): Promise<ParentAccessProfile | null> {
    const q = studentQuery.trim()
    if (!q) return null

    if (q.includes('@')) {
        const { data } = await supabase.from('profiles').select('*').eq('email', q).maybeSingle()
        if (data) return data as ParentAccessProfile
    }

    const { data: byDisplayName } = await supabase.from('profiles').select('*').eq('display_name', q).maybeSingle()
    if (byDisplayName) return byDisplayName as ParentAccessProfile

    const { data: byName } = await supabase.from('profiles').select('*').eq('name', q).maybeSingle()
    if (byName) return byName as ParentAccessProfile

    if (q.length > 10) {
        const { data: byId } = await supabase.from('profiles').select('*').eq('id', q).maybeSingle()
        if (byId) return byId as ParentAccessProfile
    }

    return null
}

export async function verifyParentPin(
    supabase: SupabaseClient,
    studentQuery: string,
    pin: string
): Promise<ParentAccessProfile | null> {
    const profile = await findProfileByParentQuery(supabase, studentQuery)
    if (!profile) return null

    const { data: linkedStudents } = await supabase
        .from('students')
        .select('id, name, pin, status, auth_user_id')
        .eq('auth_user_id', profile.id)

    const { data: namedStudents } = await supabase
        .from('students')
        .select('id, name, pin, status, auth_user_id')
        .eq('name', studentQuery)

    const studentRows = [...(linkedStudents || []), ...(namedStudents || [])]
    const student = studentRows.find(row => row.auth_user_id === profile.id) || studentRows[0] || null
    if (student) {
        if (student.status === 'deactivated') return null
        if (student.pin) return student.pin === pin ? profile : null
    }

    const { data: pinData } = await supabase
        .from('study_progress')
        .select('completed_units')
        .eq('user_id', profile.id)
        .eq('course_id', PIN_COURSE)
        .maybeSingle()

    if (!pinData?.completed_units?.[0] || pinData.completed_units[0] !== pin) {
        return null
    }

    return profile
}
