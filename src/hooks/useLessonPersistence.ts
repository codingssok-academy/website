"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    emptyLessonProgress,
    lessonAnswerPath,
    lessonProgressPath,
    normalizeLessonAnswer,
    normalizeLessonProgress,
    type LessonAnswerSnapshot,
    type LessonSessionProgress,
} from "@/lib/python-core-learning";

export type PersistenceStatus = "idle" | "loading" | "saving" | "saved" | "local" | "error";

type StoredRow = { field_index?: number; answer_text?: string; updated_at?: string };

const storageKey = (path: string) => `codingssok_lesson_state_${path}`;

function readLocal<T>(path: string, normalize: (value: unknown) => T | null): T | null {
    try {
        const raw = localStorage.getItem(storageKey(path));
        return raw ? normalize(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
}

function writeLocal(path: string, value: unknown): boolean {
    try {
        localStorage.setItem(storageKey(path), JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

async function readRemote<T>(path: string, normalize: (value: unknown) => T | null): Promise<T | null> {
    const response = await fetch(`/api/answers?page_path=${encodeURIComponent(path)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`답안 조회 실패 (${response.status})`);
    const payload = await response.json() as { answers?: StoredRow[] };
    const row = payload.answers?.find((item) => item.field_index === 0);
    if (!row?.answer_text) return null;
    const normalized = normalize(JSON.parse(row.answer_text));
    if (!normalized) return null;
    if (row.updated_at && typeof normalized === "object") {
        return { ...normalized, updatedAt: row.updated_at };
    }
    return normalized;
}

async function writeRemote(path: string, value: unknown): Promise<void> {
    const response = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            page_path: path,
            answers: [{ field_index: 0, answer_text: JSON.stringify(value) }],
        }),
    });
    if (!response.ok) throw new Error(`답안 저장 실패 (${response.status})`);
}

export function useLessonAnswerPersistence({
    enabled,
    userId,
    courseId,
    unitId,
    pageId,
    answer,
    onRestore,
}: {
    enabled: boolean;
    userId?: string;
    courseId: string;
    unitId?: string;
    pageId?: string;
    answer: Omit<LessonAnswerSnapshot, "version" | "updatedAt">;
    onRestore: (answer: LessonAnswerSnapshot) => void;
}) {
    const path = useMemo(
        () => enabled && unitId && pageId ? lessonAnswerPath(courseId, unitId, pageId) : "",
        [courseId, enabled, pageId, unitId],
    );
    const [status, setStatus] = useState<PersistenceStatus>("idle");
    const [hydratedPath, setHydratedPath] = useState("");
    useEffect(() => {
        if (!path) return;
        let cancelled = false;

        const hydrate = async () => {
            await Promise.resolve();
            if (cancelled) return;
            setStatus("loading");
            const local = readLocal(path, normalizeLessonAnswer);
            let chosen = local;
            let remoteFailed = false;

            if (userId) {
                try {
                    const remote = await readRemote(path, normalizeLessonAnswer);
                    if (remote && (!chosen || Date.parse(remote.updatedAt) >= Date.parse(chosen.updatedAt))) chosen = remote;
                } catch {
                    remoteFailed = true;
                }
            }

            if (cancelled) return;
            if (chosen) onRestore(chosen);
            setHydratedPath(path);
            setStatus(remoteFailed ? (local ? "local" : "error") : userId ? "saved" : chosen ? "local" : "idle");
        };

        void hydrate();
        return () => { cancelled = true; };
    }, [onRestore, path, userId]);

    const saveAnswer = useCallback(async () => {
        if (!path || hydratedPath !== path) return;
        const value: LessonAnswerSnapshot = { version: 1, ...answer, updatedAt: new Date().toISOString() };
        const localSaved = writeLocal(path, value);
        setStatus("saving");
        if (!userId) {
            setStatus(localSaved ? "local" : "error");
            return;
        }
        try {
            await writeRemote(path, value);
            setStatus("saved");
        } catch {
            setStatus(localSaved ? "local" : "error");
        }
    }, [answer, hydratedPath, path, userId]);

    useEffect(() => {
        if (!path || hydratedPath !== path) return;
        const timer = setTimeout(() => {
            void saveAnswer();
        }, 650);
        return () => clearTimeout(timer);
    }, [hydratedPath, path, saveAnswer]);

    return { status, retry: saveAnswer };
}

export function useLessonSessionProgress({
    enabled,
    userId,
    courseId,
    unitId,
}: {
    enabled: boolean;
    userId?: string;
    courseId: string;
    unitId?: string;
}) {
    const path = useMemo(
        () => enabled && unitId ? lessonProgressPath(courseId, unitId) : "",
        [courseId, enabled, unitId],
    );
    const [progress, setProgress] = useState<LessonSessionProgress>(emptyLessonProgress);
    const [status, setStatus] = useState<PersistenceStatus>("idle");
    const [hydratedPath, setHydratedPath] = useState("");

    useEffect(() => {
        if (!path) return;
        let cancelled = false;

        const hydrate = async () => {
            await Promise.resolve();
            if (cancelled) return;
            setStatus("loading");
            const local = readLocal(path, normalizeLessonProgress);
            let chosen = local;
            let remoteFailed = false;
            if (userId) {
                try {
                    const remote = await readRemote(path, normalizeLessonProgress);
                    if (remote && (!chosen || Date.parse(remote.updatedAt) >= Date.parse(chosen.updatedAt))) chosen = remote;
                } catch {
                    remoteFailed = true;
                }
            }
            if (cancelled) return;
            setProgress(chosen ?? emptyLessonProgress());
            setHydratedPath(path);
            setStatus(remoteFailed ? (local ? "local" : "error") : userId ? "saved" : chosen ? "local" : "idle");
        };

        void hydrate();
        return () => { cancelled = true; };
    }, [path, userId]);

    const saveProgress = useCallback(async () => {
        if (!path || hydratedPath !== path) return;
        const value = { ...progress, updatedAt: new Date().toISOString() };
        const localSaved = writeLocal(path, value);
        setStatus("saving");
        if (!userId) {
            setStatus(localSaved ? "local" : "error");
            return;
        }
        try {
            await writeRemote(path, value);
            setStatus("saved");
        } catch {
            setStatus(localSaved ? "local" : "error");
        }
    }, [hydratedPath, path, progress, userId]);

    useEffect(() => {
        if (!path || hydratedPath !== path) return;
        const timer = setTimeout(() => {
            void saveProgress();
        }, 650);
        return () => clearTimeout(timer);
    }, [hydratedPath, path, saveProgress]);

    const markPageVisited = useCallback((pageId: string) => {
        setProgress((current) => current.visitedPageIds.includes(pageId) ? current : {
            ...current,
            visitedPageIds: [...current.visitedPageIds, pageId],
        });
    }, []);

    const markQuizCorrect = useCallback((pageId: string) => {
        setProgress((current) => current.correctQuizPageIds.includes(pageId) ? current : {
            ...current,
            correctQuizPageIds: [...current.correctQuizPageIds, pageId],
        });
    }, []);

    const markProblemSuccessful = useCallback((problemId: number) => {
        setProgress((current) => current.successfulProblemIds.includes(problemId) ? current : {
            ...current,
            successfulProblemIds: [...current.successfulProblemIds, problemId],
        });
    }, []);

    const setActivityCompleted = useCallback((pageId: string, completed: boolean) => {
        setProgress((current) => {
            const alreadyCompleted = current.completedActivityPageIds.includes(pageId);
            if (alreadyCompleted === completed) return current;
            return {
                ...current,
                completedActivityPageIds: completed
                    ? [...current.completedActivityPageIds, pageId]
                    : current.completedActivityPageIds.filter((id) => id !== pageId),
            };
        });
    }, []);

    return {
        progress,
        status,
        retry: saveProgress,
        ready: Boolean(path) && hydratedPath === path,
        markPageVisited,
        markQuizCorrect,
        markProblemSuccessful,
        setActivityCompleted,
    };
}
