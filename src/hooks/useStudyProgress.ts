"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";

const LOCAL_KEY = (courseId: string) => `codingssok_completed_${courseId}`;

export function useStudyProgress(userId: string | undefined, courseId: string) {
    const supabase = useMemo(() => createClient(), []);
    const [completedUnits, setCompletedUnits] = useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set();
        try { const s = localStorage.getItem(LOCAL_KEY(courseId)); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
    });
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "local" | "error">("idle");

    // Load from Supabase on mount
    useEffect(() => {
        if (!userId) return;
        (async () => {
            const { data } = await supabase
                .from("study_progress")
                .select("completed_units")
                .eq("user_id", userId)
                .eq("course_id", courseId)
                .maybeSingle();
            if (data?.completed_units) {
                const remote = new Set<string>(data.completed_units);
                // Merge local + remote
                setCompletedUnits(prev => {
                    const merged = new Set([...prev, ...remote]);
                    localStorage.setItem(LOCAL_KEY(courseId), JSON.stringify([...merged]));
                    return merged;
                });
            }
        })();
    }, [userId, courseId, supabase]);

    const setUnitCompleted = useCallback(async (unitId: string, completed: boolean) => {
        const next = new Set(completedUnits);
        if (completed) next.add(unitId); else next.delete(unitId);
        setCompletedUnits(next);

        let localSaved = false;
        try {
            localStorage.setItem(LOCAL_KEY(courseId), JSON.stringify([...next]));
            localSaved = true;
        } catch {}

        if (!userId) {
            setSaveStatus(localSaved ? "local" : "error");
            return { savedToCloud: false, savedLocally: localSaved };
        }

        setSaveStatus("saving");
        const { error } = await supabase.from("study_progress").upsert({
            user_id: userId,
            course_id: courseId,
            completed_units: [...next],
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,course_id" });

        setSaveStatus(error ? (localSaved ? "local" : "error") : "saved");
        return { savedToCloud: !error, savedLocally: localSaved };
    }, [completedUnits, userId, courseId, supabase]);

    // Legacy-compatible toggle for the other courses.
    const toggleUnit = useCallback((unitId: string) => {
        void setUnitCompleted(unitId, !completedUnits.has(unitId));
    }, [completedUnits, setUnitCompleted]);

    return { completedUnits, toggleUnit, setUnitCompleted, saveStatus };
}
