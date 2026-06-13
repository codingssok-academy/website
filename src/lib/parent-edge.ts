import { env } from '@/lib/env'

type EdgeResult<T> =
    | { ok: true; status: number; data: T }
    | { ok: false; status: number; error: string }

export async function callParentPortalEdge<T>(
    action: string,
    payload: Record<string, unknown> = {},
    accessToken?: string | null,
): Promise<EdgeResult<T>> {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        return { ok: false, status: 503, error: 'Supabase 공개 설정이 없습니다.' }
    }

    try {
        const response = await fetch(`${env.SUPABASE_URL}/functions/v1/parent-portal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: env.SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken || env.SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ action, ...payload }),
            cache: 'no-store',
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || data?.success === false) {
            return {
                ok: false,
                status: response.status,
                error: data?.error || `Supabase Edge Function 호출 실패 (${response.status})`,
            }
        }
        return { ok: true, status: response.status, data: data as T }
    } catch (error) {
        return {
            ok: false,
            status: 502,
            error: error instanceof Error ? error.message : 'Supabase Edge Function 호출 실패',
        }
    }
}
