"use client";

import { getLinkedStudentNames } from "@/lib/student-family";

export const STUDENT_KEY = "codingssok_parent_student";
export const ALLOWED_STUDENTS_KEY = "codingssok_parent_allowed_students";
export const PARENT_STUDENT_CHANGED_EVENT = "codingssok-parent-student-changed";

export function readAllowedStudentNames(fallbackName?: string | null) {
    const fallbackNames = fallbackName ? getLinkedStudentNames(fallbackName) : [];

    try {
        const raw = localStorage.getItem(ALLOWED_STUDENTS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
            const names = parsed.filter((item): item is string => typeof item === "string" && item.trim().length >= 2);
            const mergedNames = Array.from(new Set([...names, ...fallbackNames]));
            if (mergedNames.length) return mergedNames;
        }
    } catch { /* ignore */ }

    return fallbackNames;
}

export function saveParentStudentAccess(studentName: string) {
    const allowedNames = getLinkedStudentNames(studentName);
    localStorage.setItem(STUDENT_KEY, studentName);
    localStorage.setItem(ALLOWED_STUDENTS_KEY, JSON.stringify(allowedNames));
    dispatchParentStudentChanged(studentName);
    return allowedNames;
}

export function selectAllowedStudent(studentName: string, fallbackName?: string | null) {
    const allowedNames = readAllowedStudentNames(fallbackName ?? localStorage.getItem(STUDENT_KEY));
    if (!allowedNames.includes(studentName)) return false;
    localStorage.setItem(STUDENT_KEY, studentName);
    localStorage.setItem(ALLOWED_STUDENTS_KEY, JSON.stringify(allowedNames));
    dispatchParentStudentChanged(studentName);
    return true;
}

export function clearParentStudentAccess() {
    localStorage.removeItem(STUDENT_KEY);
    localStorage.removeItem(ALLOWED_STUDENTS_KEY);
    dispatchParentStudentChanged("");
}

export function dispatchParentStudentChanged(studentName: string) {
    window.dispatchEvent(new CustomEvent(PARENT_STUDENT_CHANGED_EVENT, { detail: studentName }));
}
