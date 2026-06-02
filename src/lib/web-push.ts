import webPush from 'web-push'
import { env } from '@/lib/env'
import { createAdminClient } from '@/lib/supabase/admin'

let configured = false

function ensureConfigured() {
    if (configured) return
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
        throw new Error('VAPID keys not configured. Run: node scripts/generate-vapid-keys.mjs')
    }
    webPush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)
    configured = true
}

export interface PushSubscriptionRecord {
    id: string
    student_id: string
    endpoint: string
    keys_p256dh: string
    keys_auth: string
    parent_name: string | null
    created_at: string
}

export async function savePushSubscription(input: {
    studentId: string
    subscription: PushSubscriptionJSON
    parentName?: string | null
}) {
    const adminClient = createAdminClient()
    if (!adminClient) throw new Error('Admin client not available')

    const keys = input.subscription.keys as Record<string, string> | undefined

    const { error } = await adminClient
        .from('push_subscriptions')
        .upsert(
            {
                student_id: input.studentId,
                endpoint: input.subscription.endpoint,
                keys_p256dh: keys?.p256dh || '',
                keys_auth: keys?.auth || '',
                parent_name: input.parentName?.slice(0, 60) || null,
            },
            { onConflict: 'endpoint' }
        )

    if (error) throw new Error(error.message)
}

export async function removePushSubscription(endpoint: string) {
    const adminClient = createAdminClient()
    if (!adminClient) return

    await adminClient.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

export async function sendPushToAllStudents(payload: {
    title: string
    body: string
    tag?: string
    url?: string
}) {
    ensureConfigured()

    const adminClient = createAdminClient()
    if (!adminClient) return { sent: 0, failed: 0 }

    const { data: subscriptions } = await adminClient
        .from('push_subscriptions')
        .select('*')

    if (!subscriptions?.length) return { sent: 0, failed: 0 }

    let sent = 0
    let failed = 0
    const staleEndpoints: string[] = []

    for (const sub of subscriptions) {
        try {
            await webPush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys_p256dh,
                        auth: sub.keys_auth,
                    },
                },
                JSON.stringify(payload),
                { TTL: 60 * 60 }
            )
            sent++
        } catch (err: unknown) {
            const statusCode = (err as { statusCode?: number })?.statusCode
            if (statusCode === 404 || statusCode === 410) {
                staleEndpoints.push(sub.endpoint)
            }
            failed++
        }
    }

    if (staleEndpoints.length > 0) {
        await adminClient
            .from('push_subscriptions')
            .delete()
            .in('endpoint', staleEndpoints)
    }

    return { sent, failed }
}

export async function sendPushToStudents(studentIds: string[], payload: {
    title: string
    body: string
    tag?: string
    url?: string
}) {
    ensureConfigured()

    const adminClient = createAdminClient()
    if (!adminClient) return { sent: 0, failed: 0 }

    const { data: subscriptions } = await adminClient
        .from('push_subscriptions')
        .select('*')
        .in('student_id', studentIds)

    if (!subscriptions?.length) return { sent: 0, failed: 0 }

    let sent = 0
    let failed = 0
    const staleEndpoints: string[] = []

    for (const sub of subscriptions) {
        try {
            await webPush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys_p256dh,
                        auth: sub.keys_auth,
                    },
                },
                JSON.stringify(payload),
                { TTL: 60 * 60 }
            )
            sent++
        } catch (err: unknown) {
            const statusCode = (err as { statusCode?: number })?.statusCode
            if (statusCode === 404 || statusCode === 410) {
                staleEndpoints.push(sub.endpoint)
            }
            failed++
        }
    }

    if (staleEndpoints.length > 0) {
        await adminClient
            .from('push_subscriptions')
            .delete()
            .in('endpoint', staleEndpoints)
    }

    return { sent, failed }
}

export async function sendPushToStudent(studentId: string, payload: {
    title: string
    body: string
    tag?: string
    url?: string
}) {
    ensureConfigured()

    const adminClient = createAdminClient()
    if (!adminClient) return { sent: 0, failed: 0 }

    const { data: subscriptions } = await adminClient
        .from('push_subscriptions')
        .select('*')
        .eq('student_id', studentId)

    if (!subscriptions?.length) return { sent: 0, failed: 0 }

    let sent = 0
    let failed = 0
    const staleEndpoints: string[] = []

    for (const sub of subscriptions) {
        try {
            await webPush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys_p256dh,
                        auth: sub.keys_auth,
                    },
                },
                JSON.stringify(payload),
                { TTL: 60 * 60 }
            )
            sent++
        } catch (err: unknown) {
            const statusCode = (err as { statusCode?: number })?.statusCode
            if (statusCode === 404 || statusCode === 410) {
                staleEndpoints.push(sub.endpoint)
            }
            failed++
        }
    }

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
        await adminClient
            .from('push_subscriptions')
            .delete()
            .in('endpoint', staleEndpoints)
    }

    return { sent, failed }
}
