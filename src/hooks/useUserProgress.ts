"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { calcLevel } from "@/lib/xp-engine";

/* ── Types ── */
export interface UserProgress {
    xp: number;
    level: number;
    streak: number;
    best_streak: number;
    lastActiveDate: string;
    completedCourses: string[];
    completedChallenges: string[];
    badges: string[];
    totalProblems: number;
    accuracy: number;
    avgSolveTime: number;
    rank: number;
    tier: string;
    placement_done: boolean;
    points: number;
    goals: GoalProgress[];
}

export interface GoalProgress {
    id: string;
    name: string;
    progress: number; // 0-100
    target: number;
    current: number;
}

const PROGRESS_KEY = "codingssok_progress";

const DEFAULT_PROGRESS: UserProgress = {
    xp: 0,
    level: 1,
    streak: 0,
    best_streak: 0,
    lastActiveDate: new Date().toISOString().split("T")[0],
    completedCourses: [],
    completedChallenges: [],
    badges: [],
    totalProblems: 0,
    accuracy: 0,
    avgSolveTime: 0,
    rank: 999,
    tier: "Bronze",
    placement_done: false,
    points: 0,
    goals: [],
};

function loadProgressLocal(): UserProgress {
    if (typeof window === "undefined") return DEFAULT_PROGRESS;
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : DEFAULT_PROGRESS;
    } catch { return DEFAULT_PROGRESS; }
}

function saveProgressLocal(p: UserProgress) {
    if (typeof window === "undefined") return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

/* ── Hook ── */
export function useUserProgress() {
    const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
    const [userId, setUserId] = useState<string | null>(null);
    const [isSupabase, setIsSupabase] = useState(false);

    // Load from Supabase or localStorage
    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                const sb = createClient();
                const { data: { user } } = await sb.auth.getUser();

                if (user && !cancelled) {
                    setUserId(user.id);

                    // Fetch from user_progress table
                    const { data: up } = await sb
                        .from("user_progress")
                        .select("*")
                        .eq("user_id", user.id)
                        .maybeSingle();

                    // Fetch badges
                    const { data: badges } = await sb
                        .from("user_badges")
                        .select("badge_name")
                        .eq("user_id", user.id);

                    // Fetch completed courses
                    const { data: courses } = await sb
                        .from("user_course_progress")
                        .select("course_id")
                        .eq("user_id", user.id)
                        .eq("is_completed", true);

                    // Fetch completed challenges
                    const { data: challenges } = await sb
                        .from("user_challenges")
                        .select("challenge_id")
                        .eq("user_id", user.id)
                        .eq("status", "completed");

                    // Fetch goals
                    const { data: goals } = await sb
                        .from("user_goals")
                        .select("id, title, target, current")
                        .eq("user_id", user.id)
                        .eq("is_completed", false);

                    if (!cancelled) {
                        const p: UserProgress = {
                            xp: up?.xp ?? 0,
                            level: up?.level ?? 1,
                            streak: up?.streak ?? 0,
                            best_streak: up?.best_streak ?? 0,
                            lastActiveDate: up?.last_active_date ?? new Date().toISOString().split("T")[0],
                            totalProblems: up?.total_problems ?? 0,
                            accuracy: up?.accuracy ?? 0,
                            avgSolveTime: up?.avg_solve_time_minutes ?? 0,
                            rank: up?.rank ?? 999,
                            tier: up?.tier ?? "Bronze",
                            placement_done: up?.placement_done ?? false,
                            points: up?.xp ?? 0,
                            completedCourses: (courses as { course_id: string }[] | null)?.map((c) => c.course_id) ?? [],
                            completedChallenges: (challenges as { challenge_id: string }[] | null)?.map((c) => c.challenge_id) ?? [],
                            badges: (badges as { badge_name: string }[] | null)?.map((b) => b.badge_name) ?? [],
                            goals: (goals as { id: string; title: string; target: number; current: number }[] | null)?.map((g) => ({
                                id: g.id,
                                name: g.title,
                                progress: g.target > 0 ? Math.round((g.current / g.target) * 100) : 0,
                                target: g.target,
                                current: g.current,
                            })) ?? [],
                        };
                        setProgress(p);
                        saveProgressLocal(p); // Cache locally
                        setIsSupabase(true);
                    }
                } else if (!cancelled) {
                    // Fallback: localStorage
                    setProgress(loadProgressLocal());
                }
            } catch {
                // Supabase not available
                if (!cancelled) setProgress(loadProgressLocal());
            }
        }

        init();
        return () => { cancelled = true; };
    }, []);

    // Sync to Supabase helper
    const syncToSupabase = useCallback(async (patch: Record<string, unknown>) => {
        if (!userId) return;
        try {
            const sb = createClient();
            await sb
                .from("user_progress")
                .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        } catch { /* silent */ }
    }, [userId]);

    const update = useCallback((patch: Partial<UserProgress>) => {
        setProgress(prev => {
            const next = { ...prev, ...patch };
            saveProgressLocal(next);
            return next;
        });
        // Sync relevant fields to Supabase
        if (isSupabase) {
            const dbPatch: Record<string, unknown> = {};
            if (patch.xp !== undefined) { dbPatch.xp = patch.xp; dbPatch.level = calcLevel(patch.xp); }
            if (patch.streak !== undefined) dbPatch.streak = patch.streak;
            if (patch.totalProblems !== undefined) dbPatch.total_problems = patch.totalProblems;
            if (patch.rank !== undefined) dbPatch.rank = patch.rank;
            if (patch.tier !== undefined) dbPatch.tier = patch.tier;
            if (Object.keys(dbPatch).length > 0) syncToSupabase(dbPatch);
        }
    }, [isSupabase, syncToSupabase]);

    const addXP = useCallback((amount: number) => {
        // XP 부스터 적용: data-xp-boost="2" 속성 확인
        const boostMultiplier = (typeof document !== 'undefined' &&
            document.documentElement.getAttribute('data-xp-boost') === '2') ? 2 : 1;
        const finalAmount = amount * boostMultiplier;

        setProgress(prev => {
            const newXP = prev.xp + finalAmount;
            const next = { ...prev, xp: newXP, level: calcLevel(newXP) };
            saveProgressLocal(next);
            if (isSupabase) syncToSupabase({ xp: newXP, level: calcLevel(newXP) });
            return next;
        });
    }, [isSupabase, syncToSupabase]);

    const completeChallenge = useCallback(async (id: string) => {
        setProgress(prev => {
            if (prev.completedChallenges.includes(id)) return prev;
            const next = {
                ...prev,
                completedChallenges: [...prev.completedChallenges, id],
                totalProblems: prev.totalProblems + 1,
            };
            saveProgressLocal(next);
            return next;
        });
        if (isSupabase && userId) {
            try {
                const sb = createClient();
                await sb.from("user_challenges").upsert(
                    { user_id: userId, challenge_id: id, status: "completed", completed_at: new Date().toISOString() },
                    { onConflict: "user_id,challenge_id" }
                );
                await syncToSupabase({ total_problems: progress.totalProblems + 1 });
            } catch { /* silent */ }
        }
    }, [isSupabase, userId, progress.totalProblems, syncToSupabase]);

    const completeCourse = useCallback(async (id: string) => {
        setProgress(prev => {
            if (prev.completedCourses.includes(id)) return prev;
            const next = { ...prev, completedCourses: [...prev.completedCourses, id] };
            saveProgressLocal(next);
            return next;
        });
        if (isSupabase && userId) {
            try {
                const sb = createClient();
                await sb.from("user_course_progress").upsert(
                    { user_id: userId, course_id: id, is_completed: true },
                    { onConflict: "user_id,course_id" }
                );
            } catch { /* silent */ }
        }
    }, [isSupabase, userId]);

    const updateStreak = useCallback(() => {
        setProgress(prev => {
            const today = new Date().toISOString().split("T")[0];
            if (prev.lastActiveDate === today) return prev;
            const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
            const streak = prev.lastActiveDate === yesterday ? prev.streak + 1 : 1;
            const best_streak = Math.max(prev.best_streak, streak);
            const next = { ...prev, streak, best_streak, lastActiveDate: today };
            saveProgressLocal(next);
            if (isSupabase) syncToSupabase({ streak, best_streak, last_active_date: today });
            return next;
        });
    }, [isSupabase, syncToSupabase]);

    const updateGoal = useCallback(async (id: string, current: number) => {
        setProgress(prev => {
            const goals = prev.goals.map(g =>
                g.id === id ? { ...g, current, progress: Math.min(100, Math.round((current / g.target) * 100)) } : g
            );
            const next = { ...prev, goals };
            saveProgressLocal(next);
            return next;
        });
        if (isSupabase && userId) {
            try {
                const sb = createClient();
                await sb.from("user_goals").update({ current }).eq("id", id).eq("user_id", userId);
            } catch { /* silent */ }
        }
    }, [isSupabase, userId]);

    const logActivity = useCallback(async (action: string, xpEarned: number = 0, icon: string = "check_circle") => {
        if (isSupabase && userId) {
            try {
                const sb = createClient();
                await sb.from("activity_log").insert({ user_id: userId, action, xp_earned: xpEarned, icon });
            } catch { /* silent */ }
        }
    }, [isSupabase, userId]);

    return {
        progress,
        addXP,
        completeChallenge,
        completeCourse,
        updateStreak,
        updateGoal,
        update,
        logActivity,
        isSupabase,
    };
}
