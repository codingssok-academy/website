import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import { createNoopSupabaseClient, shouldUseNoopSupabaseClient } from './noop-client'

export function createClient() {
    if (shouldUseNoopSupabaseClient()) {
        return createNoopSupabaseClient() as unknown as ReturnType<typeof createBrowserClient>
    }

    return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}
