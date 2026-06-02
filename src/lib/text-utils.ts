/**
 * 순수 텍스트 유틸 — DOMPurify/jsdom 의존 없음.
 *
 * 담당자 'parent 페이지 ㅈㄴ 느려' 진단 결과:
 *   isomorphic-dompurify → jsdom → html-encoding-sniffer → encoding-lite.js
 *   체인이 Vercel Lambda 환경에서 ERR_REQUIRE_ESM (CJS/ESM interop) 발생.
 *   sanitize.ts module evaluation 시점에 throw → dashboard route module load 실패.
 *
 * 해결: server route(특히 /api/parent/v2/dashboard)에서 stripHtml/truncate만
 * 필요할 땐 sanitize.ts 대신 이 파일을 import해서 jsdom 체인 차단.
 */

/**
 * HTML 태그 제거 — 순수 regex 기반. SSR/Edge/Node 어디서든 안전.
 *
 * - <br> → \n
 * - </p>, </div> → \n\n
 * - 모든 태그 제거
 * - HTML 엔티티 디코딩 (nbsp, lt, gt, quot, #39, amp)
 * - 연속 빈 줄 정리
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

/** 최대 길이 제한 (프리뷰용) — 초과 시 '…' 추가 */
export function truncate(input: string, max: number = 200): string {
    if (!input) return "";
    if (input.length <= max) return input;
    return input.slice(0, max) + "…";
}
