import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { createNoopSupabaseClient, shouldUseNoopSupabaseClient } from "@/lib/supabase/noop-client";

export function isSupabaseConfigured() {
    return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

export function isLocalPreviewAuthEnabled() {
    if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return false;
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export function createClient() {
    if (shouldUseNoopSupabaseClient()) {
        return createNoopSupabaseClient() as unknown as ReturnType<typeof createBrowserClient>;
    }

    return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
