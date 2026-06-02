"use client";

/**
 * Gamification Sync Layer
 * Synchronizes localStorage gamification data with Supabase for cross-device support.
 *
 * localStorage keys synced:
 *   codingssok_streak        -> user_progress.streak_data (JSONB)
 *   codingssok_badges        -> user_badges table (upsert each badge)
 *   codingssok_hints         -> user_progress.hints_count (integer)
 *   codingssok_xp_boost      -> user_progress.xp_boost_data (JSONB)
 *   codingssok_profile_effects -> user_progress.profile_effects (JSONB)
 *   codingssok_code_runs     -> user_progress.total_code_runs (integer)
 */

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

// ── localStorage helpers ──

function lsGet(key: string): string | null {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(key); } catch { return null; }
}

function lsSet(key: string, value: string) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(key, value); } catch { /* silent */ }
}

function lsGetJSON<T>(key: string, fallback: T): T {
    const raw = lsGet(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ── Push: localStorage -> Supabase ──

export async function syncGamificationToSupabase(userId: string): Promise<void> {
    if (typeof window === "undefined" || !userId) return;

    try {
        const supabase = createClient();

        const streakData = lsGetJSON("codingssok_streak", {});
        const profileEffects = lsGetJSON<string[]>("codingssok_profile_effects", []);
        const totalCodeRuns = parseInt(lsGet("codingssok_code_runs") || "0", 10);
        const badges: string[] = lsGetJSON("codingssok_badges", []);

        // Upsert gamification fields into user_progress
        // NOTE: hints_count and xp_boost_data are NOT pushed from localStorage
        // to prevent client-side manipulation. These are managed server-side only.
        await supabase
            .from("user_progress")
            .upsert(
                {
                    user_id: userId,
                    streak_data: streakData,
                    profile_effects: profileEffects,
                    total_code_runs: totalCodeRuns,
                    gamification_synced_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );

        // Upsert badges individually
        if (badges.length > 0) {
            const badgeRows = badges.map((badge) => ({
                user_id: userId,
                badge_name: badge,
                earned_at: new Date().toISOString(),
            }));
            await supabase
                .from("user_badges")
                .upsert(badgeRows, { onConflict: "user_id,badge_name" });
        }
    } catch {
        // Silent — don't block UI on sync failure
    }
}

// ── Pull: Supabase -> localStorage ──

export async function syncGamificationFromSupabase(userId: string): Promise<void> {
    if (typeof window === "undefined" || !userId) return;

    try {
        const supabase = createClient();

        // Fetch gamification columns from user_progress
        const { data: up } = await supabase
            .from("user_progress")
            .select("streak_data, hints_count, xp_boost_data, profile_effects, total_code_runs, gamification_synced_at")
            .eq("user_id", userId)
            .single();

        if (!up || !up.gamification_synced_at) return; // No server data yet

        const serverTime = new Date(up.gamification_synced_at).getTime();

        // Check local timestamp to avoid overwriting newer local data
        const localSyncRaw = lsGet("codingssok_gamification_synced_at");
        const localTime = localSyncRaw ? new Date(localSyncRaw).getTime() : 0;

        if (serverTime <= localTime) return; // Local data is newer or same

        // Server data is newer — overwrite localStorage
        if (up.streak_data && Object.keys(up.streak_data).length > 0) {
            lsSet("codingssok_streak", JSON.stringify(up.streak_data));
        }

        if (up.hints_count != null && up.hints_count > 0) {
            lsSet("codingssok_hints", String(up.hints_count));
        }

        if (up.xp_boost_data && Object.keys(up.xp_boost_data).length > 0) {
            lsSet("codingssok_xp_boost", JSON.stringify(up.xp_boost_data));
        }

        if (up.profile_effects && Array.isArray(up.profile_effects) && up.profile_effects.length > 0) {
            lsSet("codingssok_profile_effects", JSON.stringify(up.profile_effects));
        }

        if (up.total_code_runs != null && up.total_code_runs > 0) {
            lsSet("codingssok_code_runs", String(up.total_code_runs));
        }

        // Fetch badges from user_badges table
        const { data: badges } = await supabase
            .from("user_badges")
            .select("badge_name")
            .eq("user_id", userId);

        if (badges && badges.length > 0) {
            const localBadges: string[] = lsGetJSON("codingssok_badges", []);
            const serverBadges = (badges as { badge_name: string }[]).map((b) => b.badge_name);
            // Merge: keep union of local and server badges
            const merged = Array.from(new Set([...localBadges, ...serverBadges]));
            lsSet("codingssok_badges", JSON.stringify(merged));
        }

        // Update local sync timestamp
        lsSet("codingssok_gamification_synced_at", up.gamification_synced_at);
    } catch {
        // Silent — don't block UI on sync failure
    }
}

// ── Hook: auto-sync on mount + interval ──

const SYNC_INTERVAL_MS = 60_000; // 60 seconds

export function useGamificationSync(userId: string | null) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!userId) return;

        // Pull from server on mount (new device / fresh login)
        syncGamificationFromSupabase(userId);

        // Push to server periodically
        intervalRef.current = setInterval(() => {
            syncGamificationToSupabase(userId);
        }, SYNC_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [userId]);
}
