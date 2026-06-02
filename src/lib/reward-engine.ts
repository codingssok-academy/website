/**
 * 보상 엔진 — 레벨업/마일스톤/티어 보상을 실제로 지급
 * awardXP 후 레벨업이 감지되면 이 모듈의 함수들이 호출됨
 */
import { createClient } from '@/lib/supabase';
import {
    getLevelUpRewards, getMilestone, getTierReward,
    calcLevel, type LevelUpReward, type TierReward,
    TIERS, getTierInfo, getNextTier,
    PROMOTION_REQUIREMENTS,
} from './xp-engine';

// ── 스트릭 아이스 지급 (localStorage) ──
export function grantIceItems(amount: number) {
    if (typeof window === 'undefined') return;
    try {
        const key = 'codingssok_streak';
        const raw = localStorage.getItem(key);
        if (raw) {
            const data = JSON.parse(raw);
            data.iceItems = (data.iceItems || 0) + amount;
            localStorage.setItem(key, JSON.stringify(data));
        }
    } catch { /* silent */ }
}

// ── 힌트 지급 (localStorage) ──
export function grantHints(amount: number) {
    if (typeof window === 'undefined') return;
    try {
        const key = 'codingssok_hints';
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, String(current + amount));
    } catch { /* silent */ }
}

// ── XP 부스터 지급 (localStorage) ──
export function grantXpBoost(days: number, multiplier: number) {
    if (typeof window === 'undefined' || days <= 0) return;
    try {
        const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
        localStorage.setItem('codingssok_xp_boost', JSON.stringify({
            expiry,
            multiplier,
        }));
    } catch { /* silent */ }
}

// ── XP 부스터 확인 ──
export function getActiveXpBoost(): { multiplier: number; expiresAt: number } | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem('codingssok_xp_boost');
        if (!raw) return null;
        const data = JSON.parse(raw);
        const expires = data.expiresAt || data.expiry;
        if (expires && expires > Date.now()) {
            return { multiplier: data.multiplier || 2, expiresAt: expires };
        }
        localStorage.removeItem('codingssok_xp_boost');
        return null;
    } catch { return null; }
}

// ── 프로필 이펙트 저장 ──
function grantProfileEffect(effect: string) {
    if (typeof window === 'undefined' || !effect) return;
    try {
        const key = 'codingssok_profile_effects';
        const raw = localStorage.getItem(key);
        const effects: string[] = raw ? JSON.parse(raw) : [];
        if (!effects.includes(effect)) {
            effects.push(effect);
            localStorage.setItem(key, JSON.stringify(effects));
        }
    } catch { /* silent */ }
}

// ── 뱃지 해금 (localStorage — useBadges와 동일 키) ──
function unlockBadge(badgeId: string) {
    if (typeof window === 'undefined') return;
    try {
        const key = 'codingssok_badges';
        const raw = localStorage.getItem(key);
        const badges: string[] = raw ? JSON.parse(raw) : [];
        if (!badges.includes(badgeId)) {
            badges.push(badgeId);
            localStorage.setItem(key, JSON.stringify(badges));
            // useBadges 훅 동기화 이벤트
            window.dispatchEvent(new CustomEvent('badge-unlocked', { detail: badgeId }));
        }
    } catch { /* silent */ }
}

// ── 레벨업 보상 실제 지급 ──
function applyLevelUpRewards(rewards: LevelUpReward[]) {
    for (const r of rewards) {
        switch (r.type) {
            case 'ice': grantIceItems(r.amount); break;
            case 'hint': grantHints(r.amount); break;
            case 'badge': unlockBadge(r.name.replace(/\s/g, '_').toLowerCase()); break;
            case 'xp_boost':
                grantXpBoost(1, 2);
                break;
        }
    }
}

/**
 * 레벨업 시 호출 — 레벨업 보상 + 마일스톤 보상 처리
 * @returns 마일스톤 보너스 XP (있으면)
 */
export async function processLevelUp(userId: string, oldLevel: number, newLevel: number): Promise<number> {
    let bonusXp = 0;

    // 건너뛴 레벨도 모두 보상 (한번에 여러 레벨 오를 수 있음)
    for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
        // 레벨업 보상
        const rewards = getLevelUpRewards(lv);
        applyLevelUpRewards(rewards);

        // 마일스톤 보상
        const milestone = getMilestone(lv);
        if (milestone) {
            bonusXp += milestone.xpBonus;
            applyLevelUpRewards(milestone.rewards);
        }
    }

    // 마일스톤 보너스 XP 지급 (Supabase)
    if (bonusXp > 0) {
        const supabase = createClient();
        const { data } = await supabase
            .from('user_progress')
            .select('xp')
            .eq('user_id', userId)
            .single();

        if (data) {
            const newXp = (data.xp || 0) + bonusXp;
            const recalcLevel = calcLevel(newXp);
            await supabase.from('user_progress').update({
                xp: newXp,
                level: recalcLevel,
                updated_at: new Date().toISOString(),
            }).eq('user_id', userId);

            await supabase.from('activity_log').insert({
                user_id: userId,
                action: `마일스톤 보상 (Lv.${newLevel})`,
                xp_earned: bonusXp,
                icon: 'emoji_events',
                icon_bg: '#fef3c7',
                icon_color: '#d97706',
            });
        }
    }

    return bonusXp;
}

/**
 * 승급 자격 확인 (자동 승급 X — 승급전 페이지에서 시험 통과 필요)
 * 다음 티어 승급 조건을 충족하는지 체크만 하고, 실제 승급은 하지 않음
 */
export async function checkPromotionEligibility(userId: string): Promise<{
    eligible: boolean;
    nextTier: string | null;
    currentTier: string;
    requirements?: typeof PROMOTION_REQUIREMENTS[string];
    met?: { level: boolean; units: boolean; codeRuns: boolean; streak: boolean };
}> {
    const supabase = createClient();

    const { data } = await supabase
        .from('user_progress')
        .select('tier, level, xp, placement_done, total_problems')
        .eq('user_id', userId)
        .single();

    if (!data) return { eligible: false, nextTier: null, currentTier: 'Iron' };

    const currentTier = data.tier || 'Iron';
    const nextTier = getNextTier(currentTier);
    if (!nextTier) return { eligible: false, nextTier: null, currentTier };

    const req = PROMOTION_REQUIREMENTS[nextTier];
    if (!req) return { eligible: false, nextTier, currentTier };

    // 스트릭 정보는 localStorage에서 (streak-checkin.ts가 currentStreak로 저장)
    let streakDays = 0;
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem('codingssok_streak');
            if (raw) {
                const streakData = JSON.parse(raw);
                streakDays = streakData.currentStreak || 0;
            }
        } catch { /* silent */ }
    }

    // 완료 유닛 수는 localStorage에서
    let completedUnits = 0;
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem('codingssok_progress');
            if (raw) {
                const prog = JSON.parse(raw);
                completedUnits = prog.completedCourses?.length || 0;
            }
        } catch { /* silent */ }
    }

    // 코드 실행 횟수
    let codeRuns = 0;
    if (typeof window !== 'undefined') {
        try {
            codeRuns = parseInt(localStorage.getItem('codingssok_code_runs') || '0', 10);
        } catch { /* silent */ }
    }

    const met = {
        level: data.level >= req.minLevel,
        units: completedUnits >= req.minUnits,
        codeRuns: codeRuns >= req.minCodeRuns,
        streak: streakDays >= req.minStreak,
    };

    const eligible = met.level && met.units && met.codeRuns && met.streak;

    return { eligible, nextTier, currentTier, requirements: req, met };
}

/**
 * 승급전 통과 후 호출 — 티어 승급 + 보상 실제 지급
 * 승급전 페이지(promotion/page.tsx)에서만 호출됨
 */
export async function grantTierPromotion(userId: string, newTier: string): Promise<TierReward | undefined> {
    const supabase = createClient();
    const reward = getTierReward(newTier);
    const tierInfo = getTierInfo(newTier);

    // DB 업데이트
    await supabase.from('user_progress').update({
        tier: newTier,
        placement_done: true,
        updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    if (reward) {
        // XP 보너스
        if (reward.xpBonus > 0) {
            const { data: current } = await supabase
                .from('user_progress')
                .select('xp')
                .eq('user_id', userId)
                .single();

            if (current) {
                const newXp = (current.xp || 0) + reward.xpBonus;
                await supabase.from('user_progress').update({
                    xp: newXp,
                    level: calcLevel(newXp),
                }).eq('user_id', userId);

                await supabase.from('activity_log').insert({
                    user_id: userId,
                    action: `${tierInfo.nameKo} 티어 승급 보상`,
                    xp_earned: reward.xpBonus,
                    icon: 'military_tech',
                    icon_bg: '#dbeafe',
                    icon_color: tierInfo.color,
                });
            }
        }

        // 뱃지
        if (reward.badgeId) unlockBadge(reward.badgeId);

        // 아이스
        if (reward.iceItems > 0) grantIceItems(reward.iceItems);

        // 힌트
        if (reward.hints > 0) grantHints(reward.hints);

        // XP 부스터
        if (reward.xpBoostDays > 0) grantXpBoost(reward.xpBoostDays, reward.xpBoostMultiplier);

        // 프로필 이펙트
        if (reward.profileEffect) grantProfileEffect(reward.profileEffect);

        // 보상 기록
        await supabase.from('tier_rewards_claimed').insert({
            user_id: userId,
            tier: newTier,
            xp_bonus: reward.xpBonus,
            badge_id: reward.badgeId,
            title_unlocked: reward.title,
            theme_unlocked: reward.themeUnlock,
        }).then(() => {}); // ignore duplicate errors
    }

    return reward;
}

/**
 * 이전 호환용 — checkTierPromotion은 이제 자격 확인만 하고 실제 승급 X
 * (xp-client.ts에서 호출되는 부분 — 이제 승급전 알림만 표시)
 */
export async function checkTierPromotion(userId: string): Promise<{ promoted: boolean; newTier?: string; reward?: ReturnType<typeof getTierReward> }> {
    // 자동 승급 제거됨 — 승급전 페이지를 통해서만 승급 가능
    // 대신 승급 자격이 되면 알림 이벤트만 발행
    const result = await checkPromotionEligibility(userId);
    if (result.eligible && result.nextTier && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('promotion-eligible', {
            detail: { nextTier: result.nextTier },
        }));
    }
    return { promoted: false };
}

/**
 * 업적 뱃지 체크 — 유저 통계를 보고 해금 조건 확인
 */
export function checkAchievementBadges(stats: {
    completedUnits: number;
    codeRuns: number;
    quizStreak: number;
    leaderboardRank?: number;
}) {
    if (stats.completedUnits >= 1) unlockBadge('seedling');
    if (stats.codeRuns >= 1) unlockBadge('coder');
    if (stats.quizStreak >= 10) unlockBadge('sharpshooter');
    if (stats.completedUnits >= 50) unlockBadge('bookworm');
    if (stats.completedUnits >= 100) unlockBadge('genius');
    if (stats.leaderboardRank === 1) unlockBadge('champion');
}

/**
 * 일일 미션 클레임을 Supabase에 기록
 */
export async function recordMissionClaim(userId: string, missionId: string, xpReward: number) {
    const supabase = createClient();
    await supabase.from('daily_mission_claims').insert({
        user_id: userId,
        mission_id: missionId,
        xp_reward: xpReward,
    }).then(() => {}); // ignore duplicate errors
}
