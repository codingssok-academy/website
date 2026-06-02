/**
 * GET /api/leaderboard?limit=20
 * leaderboard 뷰에서 상위 학생 조회 (read-only, 캐시 60s)
 * 뷰 없으면 user_progress + profiles JOIN으로 fallback
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const revalidate = 60;

export interface LeaderboardPlayer {
    rank: number;
    user_id: string;
    name: string;
    xp: number;
    level: number;
}

function anonymizeName(name: string | null | undefined): string {
    if (!name || name.trim().length === 0) return "익명";
    const trimmed = name.trim();
    return trimmed[0] + "OO"; // 항상 첫글자 + OO
}

function isRealStudent(name: string | null | undefined): boolean {
    if (!name) return false;
    return /^[가-힣]{2,4}$/.test(name.trim());
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam ?? "20", 10) || 20, 1), 100);

    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ players: [], total: 0, source: "no-supabase" });
        }

        const sb = await createClient();

        // 1차: leaderboard 뷰 시도
        const { data: viewData, error: viewErr } = await sb
            .from("leaderboard")
            .select("*")
            .limit(limit);

        if (!viewErr && viewData && viewData.length > 0) {
            const players: LeaderboardPlayer[] = viewData
                .filter((row: Record<string, unknown>) => isRealStudent(row.name as string))
                .map((row: Record<string, unknown>, i: number) => ({
                    rank: i + 1,
                    user_id: row.user_id as string,
                    name: anonymizeName(row.name as string),
                    xp: (row.xp as number) ?? 0,
                    level: (row.level as number) ?? 1,
                }));
            return NextResponse.json({ players, total: players.length });
        }

        // fallback: user_progress + profiles JOIN (XP > 0만, 실제 학생만)
        const { data: fallback, error: fallbackErr } = await sb
            .from("user_progress")
            .select("user_id, xp, level, profiles!inner(name)")
            .gt("xp", 0)
            .order("xp", { ascending: false })
            .limit(limit);

        if (fallbackErr || !fallback) {
            console.error("[leaderboard] fallback error:", fallbackErr?.message);
            return NextResponse.json({ players: [], total: 0, error: "db_unavailable" });
        }

        const players: LeaderboardPlayer[] = fallback
            .filter(row => {
                const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                const name = (profile as { name?: string } | null)?.name || "";
                return /^[가-힣]{2,4}$/.test(name); // 한글 2~4자만 (가짜 계정 필터)
            })
            .map((row, i) => {
                const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                return {
                    rank: i + 1,
                    user_id: row.user_id,
                    name: anonymizeName((profile as { name?: string } | null)?.name),
                    xp: row.xp ?? 0,
                    level: row.level ?? 1,
                };
            });

        return NextResponse.json({ players, total: players.length });
    } catch (err) {
        console.error("[leaderboard] exception:", err);
        return NextResponse.json({ players: [], total: 0, error: "internal_error" }, { status: 500 });
    }
}
