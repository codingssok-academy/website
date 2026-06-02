"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

/* ── Courses ── */
export interface Course {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    category: string;
    difficulty: string;
    total_lessons: number;
    html_path: string | null;
    xp_reward: number;
    sort_order: number;
}

export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetch() {
            try {
                const sb = createClient();
                const { data } = await sb
                    .from("courses")
                    .select("*")
                    .eq("is_published", true)
                    .order("sort_order");
                if (!cancelled && data) setCourses(data);
            } catch (e) { if (process.env.NODE_ENV === 'development') console.error('[useCourses] fetch failed:', e); }
            if (!cancelled) setLoading(false);
        }
        fetch();
        return () => { cancelled = true; };
    }, []);

    return { courses, loading };
}

/* ── Challenges ── */
export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
    xp_reward: number;
    time_limit_minutes: number;
    code_template: string;
    test_cases: Array<{ input: string; expected: string }>;
    scheduled_date: string | null;
}

export function useChallenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [todayChallenge, setTodayChallenge] = useState<Challenge | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetch() {
            try {
                const sb = createClient();
                const today = new Date().toISOString().split("T")[0];

                // Today's challenge
                const { data: todayData } = await sb
                    .from("challenges")
                    .select("*")
                    .eq("scheduled_date", today)
                    .eq("is_active", true)
                    .limit(1)
                    .single();

                // Recent challenges
                const { data: allData } = await sb
                    .from("challenges")
                    .select("*")
                    .eq("is_active", true)
                    .order("scheduled_date", { ascending: false })
                    .limit(10);

                if (!cancelled) {
                    if (todayData) setTodayChallenge(todayData);
                    if (allData) setChallenges(allData);
                }
            } catch (e) { if (process.env.NODE_ENV === 'development') console.error('[useChallenges] fetch failed:', e); }
            if (!cancelled) setLoading(false);
        }
        fetch();
        return () => { cancelled = true; };
    }, []);

    return { challenges, todayChallenge, loading };
}

/* ── User Badges ── */
export interface Badge {
    id: string;
    badge_name: string;
    badge_icon: string;
    badge_bg: string;
    badge_color: string;
    earned_at: string;
}

export function useUserBadges() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetch() {
            try {
                const sb = createClient();
                const { data: { user } } = await sb.auth.getUser();
                if (user) {
                    const { data } = await sb
                        .from("user_badges")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("earned_at", { ascending: false });
                    if (!cancelled && data) setBadges(data);
                }
            } catch (e) { if (process.env.NODE_ENV === 'development') console.error('[useUserBadges] fetch failed:', e); }
            if (!cancelled) setLoading(false);
        }
        fetch();
        return () => { cancelled = true; };
    }, []);

    return { badges, loading };
}

/* ── User Goals ── */
export interface Goal {
    id: string;
    title: string;
    description: string;
    icon: string;
    target: number;
    current: number;
    unit: string;
    deadline: string | null;
    color: string;
    light_bg: string;
    border_color: string;
    is_completed: boolean;
}

export function useUserGoals() {
    const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
    const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetch() {
            try {
                const sb = createClient();
                const { data: { user } } = await sb.auth.getUser();
                if (user) {
                    const { data: active } = await sb
                        .from("user_goals")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("is_completed", false)
                        .order("created_at");
                    const { data: completed } = await sb
                        .from("user_goals")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("is_completed", true)
                        .order("created_at", { ascending: false });
                    if (!cancelled) {
                        if (active) setActiveGoals(active);
                        if (completed) setCompletedGoals(completed);
                    }
                }
            } catch (e) { if (process.env.NODE_ENV === 'development') console.error('[useUserGoals] fetch failed:', e); }
            if (!cancelled) setLoading(false);
        }
        fetch();
        return () => { cancelled = true; };
    }, []);

    return { activeGoals, completedGoals, loading };
}

/* ── Leaderboard ── */
export interface LeaderboardEntry {
    user_id: string;
    name: string;
    email: string;
    xp: number;
    level: number;
    streak: number;
    tier: string;
    rank: number;
}

export function useLeaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetch() {
            try {
                const sb = createClient();
                const { data: { user } } = await sb.auth.getUser();

                const { data } = await sb
                    .from("leaderboard_view")
                    .select("*")
                    .limit(20);

                if (!cancelled && data) {
                    const rows = data as LeaderboardEntry[];
                    setEntries(rows);
                    if (user) {
                        const mine = rows.find((e) => e.user_id === user.id);
                        if (mine) setMyRank(mine);
                    }
                }
            } catch (e) { if (process.env.NODE_ENV === 'development') console.error('[useLeaderboard] fetch failed:', e); }
            if (!cancelled) setLoading(false);
        }
        fetch();
        return () => { cancelled = true; };
    }, []);

    return { entries, myRank, loading };
}

/* ── Activity Log ── */
export interface ActivityEntry {
    id: string;
    action: string;
    xp_earned: number;
    icon: string;
    icon_bg: string;
    icon_color: string;
    created_at: string;
}

export function useActivityLog(limit: number = 10) {
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetch() {
            try {
                const sb = createClient();
                const { data: { user } } = await sb.auth.getUser();
                if (user) {
                    const { data } = await sb
                        .from("activity_log")
                        .select("*")
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(limit);
                    if (!cancelled && data) setActivities(data);
                }
            } catch (e) { if (process.env.NODE_ENV === 'development') console.error('[useActivityLog] fetch failed:', e); }
            if (!cancelled) setLoading(false);
        }
        fetch();
        return () => { cancelled = true; };
    }, [limit]);

    return { activities, loading };
}
