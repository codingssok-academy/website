/**
 * 환경변수 — NEXT_PUBLIC_* 는 리터럴로 접근해야 Next.js가 빌드 시 인라인함
 */

export const env = {
    get SUPABASE_URL() {
        return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    },
    get SUPABASE_ANON_KEY() {
        return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    },
    get SUPABASE_SERVICE_ROLE_KEY() {
        return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    },
    get KAKAO_BIZ_MESSAGE_ENDPOINT() {
        return process.env.KAKAO_BIZ_MESSAGE_ENDPOINT || ''
    },
    get KAKAO_BIZ_MESSAGE_TOKEN() {
        return process.env.KAKAO_BIZ_MESSAGE_TOKEN || ''
    },
    get TEACHER_CONTACT_EMAIL() {
        return process.env.NEXT_PUBLIC_TEACHER_CONTACT_EMAIL || ''
    },
    get TEACHER_DISPLAY_NAME() {
        return process.env.NEXT_PUBLIC_TEACHER_DISPLAY_NAME || '선생님'
    },
    get PARENT_SESSION_SECRET() {
        return process.env.PARENT_SESSION_SECRET || ''
    },
    get PARENT_PORTAL_SHARED_PIN() {
        return process.env.PARENT_PORTAL_SHARED_PIN || ''
    },
    get VAPID_PUBLIC_KEY() {
        return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    },
    get VAPID_PRIVATE_KEY() {
        return process.env.VAPID_PRIVATE_KEY || ''
    },
    get VAPID_SUBJECT() {
        return process.env.VAPID_SUBJECT || 'mailto:admin@codingssok.com'
    },
}
