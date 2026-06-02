import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 })
        }

        const admin = createAdminClient()
        if (!admin) {
            return NextResponse.json({ error: 'Server error' }, { status: 500 })
        }

        const { data, error } = await admin
            .from('teacher_feedback')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (error || !data) {
            return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, feedback: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
