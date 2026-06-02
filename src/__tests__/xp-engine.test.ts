import { describe, it, expect } from 'vitest'
import { calcLevel, xpForLevel, xpForNextLevel, getPlacementTier, checkPromotion, getNextTier, getDisplayTier, XP_REWARDS, getLevelTitle, LEVEL_TITLES, RANK_EXAM_MIN_LEVEL, UNRANKED_TIER } from '@/lib/xp-engine'

describe('XP Engine', () => {
    describe('calcLevel', () => {
        it('returns 1 for 0 XP', () => {
            expect(calcLevel(0)).toBe(1)
        })

        it('returns 2 for 100 XP', () => {
            expect(calcLevel(100)).toBe(2)
        })

        it('returns 3 for 400 XP', () => {
            expect(calcLevel(400)).toBe(3)
        })

        it('returns correct level for 1000 XP', () => {
            expect(calcLevel(1000)).toBe(4)
        })

        it('handles negative XP gracefully', () => {
            expect(calcLevel(-100)).toBe(1)
        })
    })

    describe('xpForLevel', () => {
        it('returns 0 for level 1', () => {
            expect(xpForLevel(1)).toBe(0)
        })

        it('returns 100 for level 2', () => {
            expect(xpForLevel(2)).toBe(100)
        })

        it('returns 400 for level 3', () => {
            expect(xpForLevel(3)).toBe(400)
        })
    })

    describe('xpForNextLevel', () => {
        it('returns correct progress info', () => {
            const result = xpForNextLevel(150)
            expect(result.current).toBe(50) // 150 - 100 (level 2 starts at 100)
            expect(result.needed).toBe(300) // 400 - 100
            expect(result.progress).toBeGreaterThan(0)
            expect(result.progress).toBeLessThanOrEqual(100)
        })
    })

    describe('getPlacementTier', () => {
        it('returns Gold for 90%+', () => {
            expect(getPlacementTier(9, 10)).toBe('Gold')
        })

        it('returns Silver for 70-89%', () => {
            expect(getPlacementTier(7, 10)).toBe('Silver')
        })

        it('returns Bronze for 50-69%', () => {
            expect(getPlacementTier(5, 10)).toBe('Bronze')
        })

        it('returns Iron for <50%', () => {
            expect(getPlacementTier(3, 10)).toBe('Iron')
        })
    })

    describe('checkPromotion', () => {
        it('returns true for 70%+', () => {
            expect(checkPromotion(7, 10)).toBe(true)
        })

        it('returns false for <70%', () => {
            expect(checkPromotion(6, 10)).toBe(false)
        })
    })

    describe('getNextTier', () => {
        it('returns Bronze after Iron', () => {
            expect(getNextTier('Iron')).toBe('Bronze')
        })

        it('returns null for Challenger', () => {
            expect(getNextTier('Challenger')).toBeNull()
        })
    })

    describe('XP_REWARDS', () => {
        it('has all expected reward types', () => {
            expect(XP_REWARDS.attendance).toBe(10)
            expect(XP_REWARDS.homework_submit).toBe(30)
            expect(XP_REWARDS.lesson_complete).toBe(20)
            expect(XP_REWARDS.challenge_hard).toBe(200)
        })
    })

    describe('getLevelTitle', () => {
        it('returns 코딩 새싹 for level 1', () => {
            expect(getLevelTitle(1).title).toBe('코딩 새싹')
            expect(getLevelTitle(1).icon).toBe('eco')
        })

        it('returns 코딩 탐험가 for level 5', () => {
            expect(getLevelTitle(5).title).toBe('코딩 탐험가')
        })

        it('returns 코딩 마스터 for level 50+', () => {
            expect(getLevelTitle(50).title).toBe('코딩 마스터')
            expect(getLevelTitle(100).title).toBe('코딩 마스터')
        })

        it('returns highest matching title for intermediate levels', () => {
            expect(getLevelTitle(15).title).toBe('코딩 마법사')
            expect(getLevelTitle(29).title).toBe('코딩 영웅')
            expect(getLevelTitle(30).title).toBe('코딩 전설')
        })
    })

    describe('LEVEL_TITLES', () => {
        it('has 8 tiers ordered by minLevel', () => {
            expect(LEVEL_TITLES).toHaveLength(8)
            for (let i = 1; i < LEVEL_TITLES.length; i++) {
                expect(LEVEL_TITLES[i].minLevel).toBeGreaterThan(LEVEL_TITLES[i - 1].minLevel)
            }
        })
    })

    describe('RANK_EXAM_MIN_LEVEL', () => {
        it('is set to 10', () => {
            expect(RANK_EXAM_MIN_LEVEL).toBe(10)
        })

        it('requires reasonable XP to reach', () => {
            const xpNeeded = xpForLevel(RANK_EXAM_MIN_LEVEL)
            expect(xpNeeded).toBe(8100) // (10-1)^2 * 100
            expect(xpNeeded).toBeLessThan(10000)
        })
    })

    describe('getDisplayTier', () => {
        it('returns Unranked for low level without placement', () => {
            const tier = getDisplayTier('Iron', 5, false)
            expect(tier.name).toBe(UNRANKED_TIER.name)
        })

        it('returns actual tier at min level with placement', () => {
            const tier = getDisplayTier('Silver', RANK_EXAM_MIN_LEVEL, true)
            expect(tier.name).toBe('Silver')
        })

        it('returns actual tier above min level even without placement', () => {
            const tier = getDisplayTier('Gold', RANK_EXAM_MIN_LEVEL + 1, false)
            expect(tier.name).not.toBe(UNRANKED_TIER.name)
        })
    })
})
