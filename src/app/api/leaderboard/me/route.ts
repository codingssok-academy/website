/**
 * GET /api/leaderboard/me
 * 현재 로그인 사용자의 랭킹 + XP 반환
 * Auth 필요, 캐시 없음 (사용자별 동적)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const sb = await createClient();
        const { data: { user }, error: authErr } = await sb.auth.getUser();

        if (authErr || !user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        // 1차: leaderboard 뷰에서 내 순위 찾기
        const { data: viewData, error: viewErr } = await sb
            .from("leaderboard")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!viewErr && viewData) {
            return NextResponse.json({
                rank: (viewData as Record<string, unknown>).rank ?? null,
                xp: (viewData as Record<string, unknown>).xp ?? 0,
                level: (viewData as Record<string, unknown>).level ?? 1,
            });
        }

        // fallback: user_progress에서 xp 가져온 뒤 순위 계산
        const { data: me, error: meErr } = await sb
            .from("user_progress")
            .select("xp, level")
            .eq("user_id", user.id)
            .maybeSingle();

        if (meErr || !me) {
            return NextResponse.json({ rank: null, xp: 0, level: 1 });
        }

        // 나보다 XP 많은 사람 수 + 1 = 내 순위
        const { count, error: countErr } = await sb
            .from("user_progress")
            .select("user_id", { count: "exact", head: true })
            .gt("xp", me.xp);

        const rank = countErr ? null : (count ?? 0) + 1;

        return NextResponse.json({
            rank,
            xp: me.xp ?? 0,
            level: me.level ?? 1,
        });
    } catch (err) {
        console.error("[leaderboard/me] exception:", err);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
