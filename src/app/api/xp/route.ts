import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calcLevel } from '@/lib/xp-engine';
import { rateLimit } from '@/lib/rate-limit';

/**
 * XP 보상 테이블 — action_type 기준 고정 금액
 * challenge_complete는 item_id에 인코딩된 금액 사용 (50-200 범위 검증)
 */
const XP_TABLE: Record<string, number> = {
    lesson_view: 10,
    quiz_correct: 20,
    unit_complete: 30,
    code_run: 5,
    attendance: 15,
};

const CODE_RUN_DAILY_MAX = 20;
const CHALLENGE_XP_MIN = 50;
const CHALLENGE_XP_MAX = 200;

export async function POST(req: NextRequest) {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. Rate limit: 30 req/min per user
    const { success: rlOk } = await rateLimit(`xp:${user.id}`, { maxRequests: 30, windowMs: 60_000 });
    if (!rlOk) {
        return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
    }

    // 3. Parse + validate body
    let body: { action?: string; type?: string; item_id?: string; reason?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    const { action, type: actionType, item_id } = body;

    if (action !== 'award') {
        return NextResponse.json({ error: '잘못된 action입니다.' }, { status: 400 });
    }

    if (!actionType || typeof actionType !== 'string') {
        return NextResponse.json({ error: 'type이 필요합니다.' }, { status: 400 });
    }

    if (!item_id || typeof item_id !== 'string') {
        return NextResponse.json({ error: 'item_id가 필요합니다.' }, { status: 400 });
    }

    // 4. Resolve XP amount
    let amount: number;

    if (actionType === 'challenge_complete') {
        // item_id 형식: "{difficulty}:{challenge_id}"  예) "Easy:abc123" | "Hard:xyz789"
        // difficulty 부분으로 XP 결정, challenge_id 부분으로 dedup
        const DIFFICULTY_XP: Record<string, number> = {
            Easy: 50,
            Medium: 100,
            Hard: 200,
        };
        const sepIdx = item_id.indexOf(':');
        const difficulty = sepIdx > 0 ? item_id.slice(0, sepIdx) : item_id;
        if (DIFFICULTY_XP[difficulty] === undefined) {
            return NextResponse.json(
                { error: `challenge_complete item_id 형식: "Easy|Medium|Hard:{challenge_id}"` },
                { status: 400 },
            );
        }
        amount = DIFFICULTY_XP[difficulty];
    } else if (XP_TABLE[actionType] !== undefined) {
        amount = XP_TABLE[actionType];
    } else {
        return NextResponse.json({ error: `허용되지 않은 action_type: ${actionType}` }, { status: 400 });
    }

    // 5. code_run: 오늘 daily cap 체크 (UNIQUE 인서트 이전에 처리)
    if (actionType === 'code_run') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from('xp_history')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('action_type', 'code_run')
            .gte('created_at', todayStart.toISOString());

        if ((count ?? 0) >= CODE_RUN_DAILY_MAX) {
            // 현재 진행 상황만 반환 — XP 지급 없음
            const { data: progress } = await supabase
                .from('user_progress')
                .select('xp, level')
                .eq('user_id', user.id)
                .single();

            return NextResponse.json({
                duplicate: true,
                delta: 0,
                xp: progress?.xp ?? 0,
                level: progress?.level ?? 1,
                levelUp: false,
                reason: 'daily_cap',
            });
        }
    }

    // 6. INSERT into xp_history — UNIQUE(user_id, action_type, item_id) 충돌 시 skip
    const { error: insertErr } = await supabase
        .from('xp_history')
        .insert({
            user_id: user.id,
            action_type: actionType,
            item_id,
            xp_amount: amount,
        });

    if (insertErr) {
        // Postgres unique violation code: 23505
        if (insertErr.code === '23505') {
            const { data: progress } = await supabase
                .from('user_progress')
                .select('xp, level')
                .eq('user_id', user.id)
                .single();

            return NextResponse.json({
                duplicate: true,
                delta: 0,
                xp: progress?.xp ?? 0,
                level: progress?.level ?? 1,
                levelUp: false,
            });
        }
        console.error('[xp] xp_history insert error:', insertErr.code, insertErr.message);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }

    // 7. XP boost 적용 (서버 DB 기준)
    const { data: progress } = await supabase
        .from('user_progress')
        .select('xp, level, xp_boost_data')
        .eq('user_id', user.id)
        .single();

    let finalAmount = amount;
    if (progress?.xp_boost_data) {
        try {
            const boost = typeof progress.xp_boost_data === 'string'
                ? JSON.parse(progress.xp_boost_data)
                : progress.xp_boost_data;
            if (boost?.expiresAt && boost.expiresAt > Date.now() && boost.multiplier > 1) {
                finalAmount = Math.round(amount * boost.multiplier);
            }
        } catch { /* ignore malformed boost data */ }
    }

    // 8. user_progress.xp 갱신 + 레벨 재계산
    const currentXp = progress?.xp ?? 0;
    const newXp = currentXp + finalAmount;
    const oldLevel = progress?.level ?? 1;
    const newLevel = calcLevel(newXp);
    const levelUp = newLevel > oldLevel;

    const { error: upsertErr } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            xp: newXp,
            level: newLevel,
            last_active_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (upsertErr) {
        console.error('[xp] user_progress upsert error:', upsertErr.message);
        // xp_history는 이미 커밋됨 — 불일치 최소화 위해 에러 반환
        return NextResponse.json({ error: '진행 상황 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({
        xp: newXp,
        level: newLevel,
        levelUp,
        delta: finalAmount,
        duplicate: false,
    });
}
