import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

export function isSupabaseConfigured() {
    return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY)
}

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // Server Component에서는 쿠키 설정 불가
                }
            },
        },
    })
}
