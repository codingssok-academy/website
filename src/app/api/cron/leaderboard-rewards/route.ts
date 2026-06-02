import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 주간 리더보드 보상 분배 API
 * 매주 월요일 00:00 UTC에 Vercel Cron으로 호출
 * 또는 관리자 페이지에서 수동 호출 가능
 */

const REWARDS = [
    { rank: 1, xpBonus: 300 },
    { rank: 2, xpBonus: 150 },
    { rank: 3, xpBonus: 80 },
];

function getLastWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const diff = dayOfWeek === 0 ? 7 : dayOfWeek;
    const lastMonday = new Date(now);
    lastMonday.setUTCDate(now.getUTCDate() - diff - 6); // last week monday
    return lastMonday.toISOString().split('T')[0];
}

function getThisWeekStart(): string {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diff);
    return monday.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
    try {
        // 인증: Vercel Cron 시크릿 또는 관리자 토큰
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 으로 호출
        if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
            // Cron secret 일치 — 통과
        } else {
            // 관리자 호출인지 확인 (Supabase JWT 검증)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (!supabaseUrl || !supabaseKey) {
                return NextResponse.json({ error: 'Not configured' }, { status: 500 });
            }

            const token = authHeader?.replace('Bearer ', '');
            if (!token) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            // JWT를 실제로 검증
            const authClient = createClient(supabaseUrl, supabaseKey);
            const { data: { user }, error: userError } = await authClient.auth.getUser(token);
            if (userError || !user) {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }

            // 관리자 권한 확인
            const { data: profile } = await authClient
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const weekStart = getThisWeekStart();

        // 이미 이번 주 보상 분배했는지 확인
        const { data: existingRewards } = await supabase
            .from('leaderboard_rewards')
            .select('id')
            .eq('week_start', weekStart)
            .limit(1);

        if (existingRewards && existingRewards.length > 0) {
            return NextResponse.json({
                success: true,
                message: `이번 주(${weekStart}) 보상은 이미 분배됨`,
                skipped: true,
            });
        }

        // 상위 3명 조회
        const { data: top3 } = await supabase
            .from('user_progress')
            .select('user_id, xp, level')
            .order('xp', { ascending: false })
            .limit(3);

        if (!top3 || top3.length === 0) {
            return NextResponse.json({
                success: true,
                message: '리더보드에 유저가 없습니다',
                awarded: [],
            });
        }

        const awarded: { userId: string; rank: number; xpBonus: number }[] = [];

        for (let i = 0; i < Math.min(top3.length, REWARDS.length); i++) {
            const user = top3[i];
            const reward = REWARDS[i];

            // XP 지급
            const newXp = (user.xp || 0) + reward.xpBonus;
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

            await supabase.from('user_progress').update({
                xp: newXp,
                level: newLevel,
                updated_at: new Date().toISOString(),
            }).eq('user_id', user.user_id);

            // 활동 로그
            await supabase.from('activity_log').insert({
                user_id: user.user_id,
                action: `주간 리더보드 ${i + 1}위 보상`,
                xp_earned: reward.xpBonus,
                icon: 'emoji_events',
                icon_bg: '#fef3c7',
                icon_color: '#d97706',
            });

            // 보상 기록
            await supabase.from('leaderboard_rewards').insert({
                user_id: user.user_id,
                week_start: weekStart,
                rank: i + 1,
                xp_bonus: reward.xpBonus,
            });

            awarded.push({
                userId: user.user_id,
                rank: i + 1,
                xpBonus: reward.xpBonus,
            });
        }

        return NextResponse.json({
            success: true,
            message: `${weekStart} 주간 보상 분배 완료`,
            awarded,
        });
    } catch (error) {
        console.error('[Leaderboard Rewards]', error);
        return NextResponse.json(
            { error: '보상 분배 중 오류 발생' },
            { status: 500 }
        );
    }
}

// Vercel Cron은 GET도 지원
export async function GET(req: NextRequest) {
    return POST(req);
}
