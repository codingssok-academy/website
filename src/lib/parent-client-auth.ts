export const PARENT_STUDENT_KEY = "codingssok_parent_student";
export const PARENT_VERIFIED_KEY = "codingssok_parent_verified_v2";
export const PARENT_ALLOWED_STUDENTS_KEY = "codingssok_parent_allowed_students_v2";
export const PARENT_DASH_CACHE_KEY = "codingssok_dash_cache";

export function clearParentClientAuth() {
    try {
        globalThis.localStorage?.removeItem(PARENT_STUDENT_KEY);
        globalThis.localStorage?.removeItem(PARENT_VERIFIED_KEY);
        globalThis.localStorage?.removeItem(PARENT_ALLOWED_STUDENTS_KEY);
        globalThis.sessionStorage?.removeItem(PARENT_DASH_CACHE_KEY);
    } catch {
        // Storage can be unavailable in private mode or non-browser runtimes.
    }
}

export function readAllowedStudentNames() {
    try {
        const raw = globalThis.localStorage?.getItem(PARENT_ALLOWED_STUDENTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
            ? [...new Set(parsed.map(item => String(item || "").trim()).filter(Boolean))]
            : [];
    } catch {
        return [];
    }
}

export function writeAllowedStudentNames(names: string[]) {
    try {
        const normalized = [...new Set(names.map(name => name.trim()).filter(Boolean))];
        globalThis.localStorage?.setItem(PARENT_ALLOWED_STUDENTS_KEY, JSON.stringify(normalized));
    } catch {
        // Storage can be unavailable in private mode or non-browser runtimes.
    }
}

export function selectAllowedStudent(name: string) {
    const normalized = name.trim().replace(/\s+/g, "");
    if (!normalized) return;
    globalThis.localStorage?.setItem(PARENT_STUDENT_KEY, normalized);
    globalThis.dispatchEvent?.(new CustomEvent("codingssok-parent-student-change", { detail: { name: normalized } }));
}
