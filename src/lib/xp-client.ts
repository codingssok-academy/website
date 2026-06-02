/**
 * XP 클라이언트 함수 — 서버 API 경유
 * 클라이언트에서 직접 Supabase를 조작하지 않고 /api/xp 를 통해 서버에서 검증 후 처리
 */
import { createClient } from '@/lib/supabase';
import { XP_REWARDS, XP_PENALTIES } from './xp-engine';
import { trackMission } from './mission-tracker';

export interface XpResult {
    xp: number;
    level: number;
    levelUp: boolean;
    delta: number;
    duplicate: boolean;
}

/**
 * XP 지급 요청
 * @param actionType - XP_TABLE 키 (lesson_view, quiz_correct, unit_complete, code_run, attendance, challenge_complete)
 * @param itemId     - 유닛 ID, 퀴즈 ID, 챌린지 ID 등 중복 방지용 고유 식별자
 */
export async function awardXP(
    actionType: string,
    itemId: string,
): Promise<XpResult | undefined> {
    try {
        const res = await fetch('/api/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'award', type: actionType, item_id: itemId }),
        });

        if (!res.ok) return undefined;

        const data: XpResult = await res.json();

        if (typeof window !== 'undefined' && (data.delta ?? 0) > 0 && !data.duplicate) {
            window.dispatchEvent(new CustomEvent('xp-earned', { detail: { amount: data.delta } }));
        }

        return data;
    } catch {
        return undefined;
    }
}

export async function deductXP(
    _userId: string,
    _amount: number,
    reason: string,
): Promise<{ xp: number; level: number }> {
    try {
        const type = findPenaltyKey(_amount) || 'wrong_answer';
        const res = await fetch('/api/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deduct', type, reason }),
        });
        if (!res.ok) return { xp: 0, level: 1 };
        return await res.json();
    } catch {
        return { xp: 0, level: 1 };
    }
}

export async function checkAttendance(userId: string) {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', userId)
        .eq('check_date', today)
        .single();

    if (existing) return { alreadyChecked: true, xp: 0 };

    await supabase.from('attendance').insert({
        user_id: userId,
        check_date: today,
        xp_earned: XP_REWARDS.attendance,
    });

    const { data: progress } = await supabase
        .from('user_progress')
        .select('streak, best_streak, last_active_date')
        .eq('user_id', userId)
        .single();

    if (progress) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const isConsecutive = progress.last_active_date === yesterdayStr;
        const newStreak = isConsecutive ? (progress.streak || 0) + 1 : 1;
        const newBest = Math.max(newStreak, progress.best_streak || 0);

        await supabase.from('user_progress').update({
            streak: newStreak,
            best_streak: newBest,
            last_active_date: today,
        }).eq('user_id', userId);
    }

    // item_id: 날짜 기반 — 하루 1회 dedup 보장
    const result = await awardXP('attendance', `attendance:${today}`);
    trackMission('login');
    return { alreadyChecked: false, ...result };
}

/** Reverse-lookup XP_PENALTIES key from amount */
function findPenaltyKey(amount: number): string | undefined {
    for (const [key, val] of Object.entries(XP_PENALTIES)) {
        if (val === amount) return key;
    }
    return undefined;
}
