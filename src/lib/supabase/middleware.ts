import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    request.cookies.set(name, value)
                    response.cookies.set(name, value, options)
                })
            },
        },
    })

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const needsTeacherAuth = pathname.startsWith('/teacher') && pathname !== '/teacher/login'

    if (needsTeacherAuth && !user) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/teacher/login'
        redirectUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    return response
}
