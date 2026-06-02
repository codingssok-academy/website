import DOMPurify from 'isomorphic-dompurify';

// 교재 iframe은 같은 도메인이므로 sandbox 제거 (DOMPurify가 자동 추가하는 것 방지)
// try/catch — server-side에서 isomorphic-dompurify의 jsdom lazy-load가 실패할 수 있음
// (Next.js 16 + Turbopack 번들 환경). 실패 시 dashboard route handler module-load 자체가
// 깨져 lambda init crash → X-Matched-Path: /500 정적 fallback. addHook이 없어도
// sanitizeHTML 호출 자체는 동작하므로 silent skip.
let hookRegistered = false;
function ensureIframeSandboxHook() {
    if (hookRegistered) return;
    hookRegistered = true;
    try {
        if (typeof DOMPurify.addHook === 'function') {
            DOMPurify.addHook('afterSanitizeAttributes', (node) => {
                if (node.tagName === 'IFRAME') {
                    node.removeAttribute('sandbox');
                }
            });
        }
    } catch { /* server-side init 실패 — hook 없이 진행 */ }
}

/**
 * HTML 콘텐츠를 살균하여 XSS 공격을 방지합니다.
 * iframe(교재), img, code 블록 등은 허용합니다.
 * isomorphic-dompurify를 사용하여 SSR/CSR 모두에서 동작합니다.
 */
export function sanitizeHTML(dirty: string): string {
    ensureIframeSandboxHook();
    return DOMPurify.sanitize(dirty, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['target', 'rel', 'style', 'class', 'data-code', 'sandbox', 'src'],
        ALLOW_DATA_ATTR: true,
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
}

/**
 * HTML 태그를 제거하고 순수 텍스트만 남긴다.
 * React의 기본 escape는 XSS는 막지만, 태그 리터럴(<b>굵게</b>)이 그대로 보이므로
 * 프리뷰/텍스트 전용 표시용으로 사용.
 *
 * - <br> → \n
 * - </p>, </div> → \n\n
 * - 모든 태그 제거
 * - HTML 엔티티 디코딩
 */
export function stripHtml(input: string): string {
    if (!input) return "";
    return input
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div)>/gi, "\n\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/** 최대 길이 제한 (프리뷰용) */
export function truncate(input: string, max: number = 200): string {
    if (!input) return "";
    if (input.length <= max) return input;
    return input.slice(0, max) + "…";
}
