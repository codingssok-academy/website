import { createHmac, timingSafeEqual } from 'crypto'
import type { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const PARENT_SESSION_COOKIE = 'codingssok_parent_session'
const PARENT_SESSION_TTL_MS = 1000 * 60 * 60 * 12

export interface ParentSessionPayload {
    studentId: string
    studentIds?: string[]
    studentNames?: string[]
    parentPin?: string
    parentName: string
    issuedAt: number
    expiresAt: number
}

function hasVercelUrl() {
    const value = (process.env.VERCEL_URL || '').trim()
    return Boolean(value && value !== '""' && value !== "''")
}

function getSessionSecret() {
    if (!env.PARENT_SESSION_SECRET) {
        if (!hasVercelUrl()) {
            return 'codingssok-local-parent-session-secret'
        }
        throw new Error('PARENT_SESSION_SECRET is not configured.')
    }
    return env.PARENT_SESSION_SECRET
}

function toBase64Url(input: Buffer | string) {
    return Buffer.from(input).toString('base64url')
}

function fromBase64Url(input: string) {
    return Buffer.from(input, 'base64url')
}

function sign(payload: string) {
    return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
}

export function createParentSessionToken(input: {
    studentId: string
    studentIds?: string[]
    studentNames?: string[]
    parentPin?: string | null
    parentName?: string | null
}) {
    const now = Date.now()
    const parentPin = (input.parentPin || '').replace(/\D/g, '').slice(0, 5)
    const payload: ParentSessionPayload = {
        studentId: input.studentId,
        studentIds: input.studentIds?.filter(Boolean).slice(0, 5),
        studentNames: input.studentNames?.map(name => name.trim()).filter(Boolean).slice(0, 5),
        parentPin: /^\d{5}$/.test(parentPin) ? parentPin : undefined,
        parentName: (input.parentName || '').trim().slice(0, 60),
        issuedAt: now,
        expiresAt: now + PARENT_SESSION_TTL_MS,
    }
    const encodedPayload = toBase64Url(JSON.stringify(payload))
    const signature = sign(encodedPayload)
    return `${encodedPayload}.${signature}`
}

export function verifyParentSessionToken(token: string | undefined | null) {
    if (!token) return null
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return null

    const expectedSignature = sign(encodedPayload)
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
        return null
    }

    try {
        const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8')) as ParentSessionPayload
        if (!payload.studentId || payload.expiresAt < Date.now()) {
            return null
        }
        return payload
    } catch {
        return null
    }
}

export function setParentSessionCookie(
    response: NextResponse,
    token: string
) {
    response.cookies.set(PARENT_SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: Math.floor(PARENT_SESSION_TTL_MS / 1000),
    })
}

export function clearParentSessionCookie(response: NextResponse) {
    response.cookies.set(PARENT_SESSION_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    })
}
