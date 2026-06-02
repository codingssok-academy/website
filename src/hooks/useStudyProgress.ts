"use client";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase";

const LOCAL_KEY = (courseId: string) => `codingssok_completed_${courseId}`;

export function useStudyProgress(userId: string | undefined, courseId: string) {
    const supabase = useMemo(() => createClient(), []);
    const [completedUnits, setCompletedUnits] = useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set();
        try { const s = localStorage.getItem(LOCAL_KEY(courseId)); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
    });
    const syncRef = useRef(false);

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
            syncRef.current = true;
        })();
    }, [userId, courseId, supabase]);

    // Toggle completion
    const toggleUnit = useCallback((unitId: string) => {
        setCompletedUnits(prev => {
            const next = new Set(prev);
            if (next.has(unitId)) next.delete(unitId); else next.add(unitId);
            // Save to localStorage
            localStorage.setItem(LOCAL_KEY(courseId), JSON.stringify([...next]));
            // Save to Supabase
            if (userId) {
                supabase.from("study_progress").upsert({
                    user_id: userId,
                    course_id: courseId,
                    completed_units: [...next],
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id,course_id" }).then(() => {});
            }
            return next;
        });
    }, [userId, courseId, supabase]);

    return { completedUnits, toggleUnit };
}
