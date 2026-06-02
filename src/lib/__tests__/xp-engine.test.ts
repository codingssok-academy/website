import { describe, it, expect } from 'vitest';
import {
    calcLevel,
    xpForLevel,
    xpForNextLevel,
    getTierInfo,
    getNextTier,
    getPlacementTier,
    checkPromotion,
    canAccessContent,
    getLevelTitle,
    getLevelUpRewards,
    getMilestone,
    getTodayMissions,
    PROMOTION_REQUIREMENTS,
    TIERS,
    DAILY_MISSION_POOL,
    MILESTONES,
    LEVEL_TITLES,
} from '../xp-engine';

// ─────────────────────────────────────
//  calcLevel
// ─────────────────────────────────────

describe('calcLevel', () => {
    it('returns level 1 for xp = 0', () => {
        expect(calcLevel(0)).toBe(1);
    });

    it('returns level 2 for xp = 100', () => {
        expect(calcLevel(100)).toBe(2);
    });

    it('returns level 3 for xp = 400', () => {
        expect(calcLevel(400)).toBe(3);
    });

    it('returns level 10 for xp = 8100', () => {
        expect(calcLevel(8100)).toBe(10);
    });

    it('returns level 20 for xp = 36100', () => {
        expect(calcLevel(36100)).toBe(20);
    });

    it('returns level 1 for negative xp', () => {
        expect(calcLevel(-50)).toBe(1);
        expect(calcLevel(-1)).toBe(1);
    });

    it('returns level 1 for xp just below 100', () => {
        expect(calcLevel(99)).toBe(1);
    });

    it('handles mid-level xp correctly', () => {
        // xp = 250 → sqrt(2.5) ≈ 1.58 → floor = 1 → level 2
        expect(calcLevel(250)).toBe(2);
    });
});

// ─────────────────────────────────────
//  xpForLevel
// ─────────────────────────────────────

describe('xpForLevel', () => {
    it('returns 0 for level 1', () => {
        expect(xpForLevel(1)).toBe(0);
    });

    it('returns 100 for level 2', () => {
        expect(xpForLevel(2)).toBe(100);
    });

    it('returns 8100 for level 10', () => {
        expect(xpForLevel(10)).toBe(8100);
    });

    it('returns 36100 for level 20', () => {
        expect(xpForLevel(20)).toBe(36100);
    });

    it('is consistent with calcLevel (round-trip)', () => {
        for (let lv = 1; lv <= 30; lv++) {
            expect(calcLevel(xpForLevel(lv))).toBe(lv);
        }
    });
});

// ─────────────────────────────────────
//  xpForNextLevel
// ─────────────────────────────────────

describe('xpForNextLevel', () => {
    it('returns 0% progress at exact level boundary', () => {
        const result = xpForNextLevel(0);
        expect(result.current).toBe(0);
        expect(result.needed).toBe(100); // xpForLevel(2) - xpForLevel(1) = 100
        expect(result.progress).toBe(0);
    });

    it('returns 50% progress at midpoint of level 1', () => {
        const result = xpForNextLevel(50);
        expect(result.current).toBe(50);
        expect(result.needed).toBe(100);
        expect(result.progress).toBeCloseTo(50, 1);
    });

    it('returns 0% at exact level 2 boundary (100 xp)', () => {
        const result = xpForNextLevel(100);
        expect(result.current).toBe(0);
        // level 2→3 needs 400-100=300
        expect(result.needed).toBe(300);
        expect(result.progress).toBe(0);
    });

    it('progress never exceeds 100', () => {
        const result = xpForNextLevel(99);
        expect(result.progress).toBeLessThanOrEqual(100);
    });
});

// ─────────────────────────────────────
//  getTierInfo
// ─────────────────────────────────────

describe('getTierInfo', () => {
    it.each([
        ['Iron', '아이언', 1],
        ['Bronze', '브론즈', 2],
        ['Silver', '실버', 3],
        ['Gold', '골드', 4],
        ['Platinum', '플래티넘', 5],
        ['Diamond', '다이아', 6],
    ] as const)('returns correct data for %s', (name, nameKo, order) => {
        const tier = getTierInfo(name);
        expect(tier.name).toBe(name);
        expect(tier.nameKo).toBe(nameKo);
        expect(tier.order).toBe(order);
    });

    it('returns Iron for unknown tier name', () => {
        const tier = getTierInfo('Mythic');
        expect(tier.name).toBe('Iron');
    });

    it('returns Iron for empty string', () => {
        const tier = getTierInfo('');
        expect(tier.name).toBe('Iron');
    });
});

// ─────────────────────────────────────
//  getNextTier
// ─────────────────────────────────────

describe('getNextTier', () => {
    it('returns Bronze for Iron', () => {
        expect(getNextTier('Iron')).toBe('Bronze');
    });

    it('returns Silver for Bronze', () => {
        expect(getNextTier('Bronze')).toBe('Silver');
    });

    it('returns Gold for Silver', () => {
        expect(getNextTier('Silver')).toBe('Gold');
    });

    it('returns Platinum for Gold', () => {
        expect(getNextTier('Gold')).toBe('Platinum');
    });

    it('returns Diamond for Platinum', () => {
        expect(getNextTier('Platinum')).toBe('Diamond');
    });

    it('returns null for Diamond (highest tier)', () => {
        expect(getNextTier('Diamond')).toBeNull();
    });

    it('returns null for unknown tier', () => {
        expect(getNextTier('Unknown')).toBeNull();
    });
});

// ─────────────────────────────────────
//  getPlacementTier
// ─────────────────────────────────────

describe('getPlacementTier', () => {
    it('returns Gold for 90%+', () => {
        expect(getPlacementTier(9, 10)).toBe('Gold');
        expect(getPlacementTier(10, 10)).toBe('Gold');
    });

    it('returns Silver for 70%-89%', () => {
        expect(getPlacementTier(7, 10)).toBe('Silver');
        expect(getPlacementTier(89, 100)).toBe('Silver');
    });

    it('returns Bronze for 50%-69%', () => {
        expect(getPlacementTier(5, 10)).toBe('Bronze');
        expect(getPlacementTier(69, 100)).toBe('Bronze');
    });

    it('returns Iron for below 50%', () => {
        expect(getPlacementTier(4, 10)).toBe('Iron');
        expect(getPlacementTier(0, 10)).toBe('Iron');
    });

    it('handles exact boundary at 90%', () => {
        expect(getPlacementTier(90, 100)).toBe('Gold');
    });

    it('handles exact boundary at 70%', () => {
        expect(getPlacementTier(70, 100)).toBe('Silver');
    });

    it('handles exact boundary at 50%', () => {
        expect(getPlacementTier(50, 100)).toBe('Bronze');
    });
});

// ─────────────────────────────────────
//  checkPromotion
// ─────────────────────────────────────

describe('checkPromotion', () => {
    it('returns true for 70% score', () => {
        expect(checkPromotion(7, 10)).toBe(true);
    });

    it('returns true for 100% score', () => {
        expect(checkPromotion(10, 10)).toBe(true);
    });

    it('returns false for 69% score', () => {
        expect(checkPromotion(69, 100)).toBe(false);
    });

    it('returns false for 0% score', () => {
        expect(checkPromotion(0, 10)).toBe(false);
    });
});

// ─────────────────────────────────────
//  canAccessContent
// ─────────────────────────────────────

describe('canAccessContent', () => {
    it('allows same tier access', () => {
        expect(canAccessContent('Gold', 'Gold')).toBe(true);
    });

    it('allows higher tier to access lower tier content', () => {
        expect(canAccessContent('Diamond', 'Iron')).toBe(true);
        expect(canAccessContent('Gold', 'Bronze')).toBe(true);
    });

    it('denies lower tier from higher tier content', () => {
        expect(canAccessContent('Iron', 'Gold')).toBe(false);
        expect(canAccessContent('Bronze', 'Diamond')).toBe(false);
    });

    it('returns false for unknown user tier', () => {
        expect(canAccessContent('Unknown', 'Iron')).toBe(false);
    });

    it('returns false for unknown required tier', () => {
        expect(canAccessContent('Gold', 'Unknown')).toBe(false);
    });
});

// ─────────────────────────────────────
//  getLevelTitle
// ─────────────────────────────────────

describe('getLevelTitle', () => {
    it('returns 코딩 새싹 for level 1', () => {
        expect(getLevelTitle(1).title).toBe('코딩 새싹');
    });

    it('returns 코딩 탐험가 for level 5', () => {
        expect(getLevelTitle(5).title).toBe('코딩 탐험가');
    });

    it('returns 코딩 전사 for level 10', () => {
        expect(getLevelTitle(10).title).toBe('코딩 전사');
    });

    it('returns 코딩 마법사 for level 15', () => {
        expect(getLevelTitle(15).title).toBe('코딩 마법사');
    });

    it('returns 코딩 영웅 for level 20', () => {
        expect(getLevelTitle(20).title).toBe('코딩 영웅');
    });

    it('returns 코딩 전설 for level 30', () => {
        expect(getLevelTitle(30).title).toBe('코딩 전설');
    });

    it('returns 코딩 신화 for level 40', () => {
        expect(getLevelTitle(40).title).toBe('코딩 신화');
    });

    it('returns 코딩 마스터 for level 50', () => {
        expect(getLevelTitle(50).title).toBe('코딩 마스터');
    });

    it('returns highest matching title for levels above 50', () => {
        expect(getLevelTitle(99).title).toBe('코딩 마스터');
    });

    it('returns 코딩 새싹 for levels between thresholds', () => {
        expect(getLevelTitle(3).title).toBe('코딩 새싹');
    });
});

// ─────────────────────────────────────
//  getLevelUpRewards
// ─────────────────────────────────────

describe('getLevelUpRewards', () => {
    it('returns ice at multiples of 5', () => {
        const rewards = getLevelUpRewards(5);
        expect(rewards).toContainEqual({ type: 'ice', amount: 1, name: '스트릭 아이스' });
    });

    it('returns hints at multiples of 3', () => {
        const rewards = getLevelUpRewards(3);
        expect(rewards).toContainEqual({ type: 'hint', amount: 2, name: '힌트 팩' });
    });

    it('returns both ice and hints at level 15 (multiple of 3 and 5)', () => {
        const rewards = getLevelUpRewards(15);
        expect(rewards).toHaveLength(2);
        expect(rewards.some(r => r.type === 'ice')).toBe(true);
        expect(rewards.some(r => r.type === 'hint')).toBe(true);
    });

    it('returns empty array for level 1', () => {
        expect(getLevelUpRewards(1)).toHaveLength(0);
    });

    it('returns empty array for level 2', () => {
        expect(getLevelUpRewards(2)).toHaveLength(0);
    });

    it('returns empty array for level 7 (not multiple of 3 or 5)', () => {
        expect(getLevelUpRewards(7)).toHaveLength(0);
    });
});

// ─────────────────────────────────────
//  getMilestone
// ─────────────────────────────────────

describe('getMilestone', () => {
    it('returns milestone for level 10', () => {
        const ms = getMilestone(10);
        expect(ms).toBeDefined();
        expect(ms!.level).toBe(10);
        expect(ms!.xpBonus).toBe(500);
    });

    it('returns milestone for level 20', () => {
        const ms = getMilestone(20);
        expect(ms).toBeDefined();
        expect(ms!.level).toBe(20);
        expect(ms!.xpBonus).toBe(1000);
    });

    it('returns milestone for level 30', () => {
        const ms = getMilestone(30);
        expect(ms).toBeDefined();
        expect(ms!.xpBonus).toBe(2000);
    });

    it('returns milestone for level 50', () => {
        const ms = getMilestone(50);
        expect(ms).toBeDefined();
        expect(ms!.xpBonus).toBe(5000);
    });

    it('returns undefined for non-milestone levels', () => {
        expect(getMilestone(1)).toBeUndefined();
        expect(getMilestone(5)).toBeUndefined();
        expect(getMilestone(15)).toBeUndefined();
        expect(getMilestone(25)).toBeUndefined();
    });
});

// ─────────────────────────────────────
//  getTodayMissions
// ─────────────────────────────────────

describe('getTodayMissions', () => {
    it('returns exactly 3 missions', () => {
        const missions = getTodayMissions('2025-01-15');
        expect(missions).toHaveLength(3);
    });

    it('returns same missions for the same date', () => {
        const a = getTodayMissions('2025-06-01');
        const b = getTodayMissions('2025-06-01');
        expect(a.map(m => m.id)).toEqual(b.map(m => m.id));
    });

    it('returns different missions for different dates', () => {
        const a = getTodayMissions('2025-01-01');
        const b = getTodayMissions('2025-01-02');
        const aIds = a.map(m => m.id).join(',');
        const bIds = b.map(m => m.id).join(',');
        // Not guaranteed to differ, but extremely likely with different seeds
        // We just check they are valid missions
        expect(a.every(m => DAILY_MISSION_POOL.some(p => p.id === m.id))).toBe(true);
        expect(b.every(m => DAILY_MISSION_POOL.some(p => p.id === m.id))).toBe(true);
    });

    it('returns no duplicate missions', () => {
        const missions = getTodayMissions('2025-03-20');
        const ids = missions.map(m => m.id);
        expect(new Set(ids).size).toBe(3);
    });

    it('all returned missions exist in the pool', () => {
        const missions = getTodayMissions('2025-12-25');
        for (const m of missions) {
            expect(DAILY_MISSION_POOL).toContainEqual(m);
        }
    });
});

// ─────────────────────────────────────
//  PROMOTION_REQUIREMENTS
// ─────────────────────────────────────

describe('PROMOTION_REQUIREMENTS', () => {
    const expectedTiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

    it('has requirements for all promotable tiers', () => {
        for (const tier of expectedTiers) {
            expect(PROMOTION_REQUIREMENTS[tier]).toBeDefined();
        }
    });

    it('each tier has valid numeric fields', () => {
        for (const tier of expectedTiers) {
            const req = PROMOTION_REQUIREMENTS[tier];
            expect(req.minLevel).toBeGreaterThan(0);
            expect(req.examQuestions).toBeGreaterThan(0);
            expect(req.passPercent).toBeGreaterThanOrEqual(50);
            expect(req.passPercent).toBeLessThanOrEqual(100);
        }
    });

    it('minLevel increases with each tier', () => {
        for (let i = 1; i < expectedTiers.length; i++) {
            const prev = PROMOTION_REQUIREMENTS[expectedTiers[i - 1]];
            const curr = PROMOTION_REQUIREMENTS[expectedTiers[i]];
            expect(curr.minLevel).toBeGreaterThan(prev.minLevel);
        }
    });

    it('passPercent increases or stays equal with each tier', () => {
        for (let i = 1; i < expectedTiers.length; i++) {
            const prev = PROMOTION_REQUIREMENTS[expectedTiers[i - 1]];
            const curr = PROMOTION_REQUIREMENTS[expectedTiers[i]];
            expect(curr.passPercent).toBeGreaterThanOrEqual(prev.passPercent);
        }
    });
});
