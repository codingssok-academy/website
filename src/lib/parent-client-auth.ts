export const PARENT_STUDENT_KEY = "codingssok_parent_student";
export const PARENT_VERIFIED_KEY = "codingssok_parent_verified_v2";
export const PARENT_DASH_CACHE_KEY = "codingssok_dash_cache";

export function clearParentClientAuth() {
    try {
        globalThis.localStorage?.removeItem(PARENT_STUDENT_KEY);
        globalThis.localStorage?.removeItem(PARENT_VERIFIED_KEY);
        globalThis.sessionStorage?.removeItem(PARENT_DASH_CACHE_KEY);
    } catch {
        // Storage can be unavailable in private mode or non-browser runtimes.
    }
}
