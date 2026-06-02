/**
 * XP/레벨 엔진 — 코딩쏙 아카데미
 * 경험치 계산, 레벨업, 티어, 보상, 미션 유틸리티
 */

// ═══════════════════════════════════════
//  XP 보상 / 패널티
// ═══════════════════════════════════════

export const XP_REWARDS = {
    attendance: 10,
    homework_submit: 30,
    lesson_complete: 20,
    daily_mission: 50,
    challenge_easy: 80,
    challenge_medium: 120,
    challenge_hard: 200,
    promotion_pass: 500,
    code_submit: 15,
} as const;

export const XP_PENALTIES = {
    wrong_answer: 5,
} as const;

// ═══════════════════════════════════════
//  레벨 계산
// ═══════════════════════════════════════

export function calcLevel(xp: number): number {
    if (xp < 0) return 1;
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level: number): number {
    return (level - 1) * (level - 1) * 100;
}

export function xpForNextLevel(currentXp: number): { current: number; needed: number; progress: number } {
    const level = calcLevel(currentXp);
    const currentLevelXp = xpForLevel(level);
    const nextLevelXp = xpForLevel(level + 1);
    const diff = nextLevelXp - currentLevelXp;
    const progress = diff > 0 ? ((currentXp - currentLevelXp) / diff) * 100 : 100;
    return { current: currentXp - currentLevelXp, needed: diff, progress: Math.min(progress, 100) };
}

// ═══════════════════════════════════════
//  티어 (6단계 — 챌린저/그랜드마스터 제거)
// ═══════════════════════════════════════

export const RANK_EXAM_MIN_LEVEL = 10;

export const UNRANKED_TIER = {
    name: 'Unranked', nameKo: '배치 전', icon: 'help', color: '#94a3b8',
    gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', order: 0,
};

export const TIERS = [
    { name: 'Iron', nameKo: '아이언', icon: 'shield', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)', order: 1 },
    { name: 'Bronze', nameKo: '브론즈', icon: 'looks_3', color: '#b45309', gradient: 'linear-gradient(135deg, #b45309, #d97706)', order: 2 },
    { name: 'Silver', nameKo: '실버', icon: 'looks_two', color: '#9ca3af', gradient: 'linear-gradient(135deg, #9ca3af, #d1d5db)', order: 3 },
    { name: 'Gold', nameKo: '골드', icon: 'looks_one', color: '#ca8a04', gradient: 'linear-gradient(135deg, #ca8a04, #eab308)', order: 4 },
    { name: 'Platinum', nameKo: '플래티넘', icon: 'diamond', color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)', order: 5 },
    { name: 'Diamond', nameKo: '다이아', icon: 'workspace_premium', color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', order: 6 },
] as const;

export function getTierInfo(tierName: string) {
    return TIERS.find(t => t.name === tierName) || TIERS[0];
}

export function getDisplayTier(tierName: string, level: number, placementDone?: boolean) {
    if (!placementDone && level < RANK_EXAM_MIN_LEVEL) return UNRANKED_TIER;
    return getTierInfo(tierName);
}

export function getTierByOrder(order: number) {
    return TIERS.find(t => t.order === order) || TIERS[0];
}

export function getPlacementTier(score: number, total: number): string {
    const pct = (score / total) * 100;
    if (pct >= 90) return 'Gold';
    if (pct >= 70) return 'Silver';
    if (pct >= 50) return 'Bronze';
    return 'Iron';
}

export function checkPromotion(score: number, total: number): boolean {
    return (score / total) * 100 >= 70;
}

export function getNextTier(currentTier: string): string | null {
    const current = TIERS.find(t => t.name === currentTier);
    if (!current || current.order >= 6) return null;
    return getTierByOrder(current.order + 1).name;
}

// ── XP 부스터 유틸 ──

/** 클라이언트 전용: DOM attribute에서 부스터 배율 읽기 */
export function getBoostMultiplier(): number {
    if (typeof document === 'undefined') return 1;
    const boost = document.documentElement.getAttribute('data-xp-boost');
    return boost === '2' ? 2 : 1;
}

/** 클라이언트 전용: 부스터 적용된 최종 XP 계산 */
export function calcXpWithBoost(baseXp: number): number {
    return baseXp * getBoostMultiplier();
}

// ═══════════════════════════════════════
//  레벨 타이틀
// ═══════════════════════════════════════

export const LEVEL_TITLES = [
    { minLevel: 1, title: '코딩 새싹', icon: 'eco', color: '#22c55e' },
    { minLevel: 5, title: '코딩 탐험가', icon: 'explore', color: '#3b82f6' },
    { minLevel: 10, title: '코딩 전사', icon: 'swords', color: '#2563eb' },
    { minLevel: 15, title: '코딩 마법사', icon: 'auto_fix_high', color: '#f59e0b' },
    { minLevel: 20, title: '코딩 영웅', icon: 'shield_person', color: '#ef4444' },
    { minLevel: 30, title: '코딩 전설', icon: 'star', color: '#ec4899' },
    { minLevel: 40, title: '코딩 신화', icon: 'whatshot', color: '#06b6d4' },
    { minLevel: 50, title: '코딩 마스터', icon: 'workspace_premium', color: '#8b5cf6' },
] as const;

export function getLevelTitle(level: number) {
    for (let i = LEVEL_TITLES.length - 1; i >= 0; i--) {
        if (level >= LEVEL_TITLES[i].minLevel) return LEVEL_TITLES[i];
    }
    return LEVEL_TITLES[0];
}

// ═══════════════════════════════════════
//  티어 달성 보상
// ═══════════════════════════════════════

export interface TierReward {
    tier: string;
    xpBonus: number;
    badgeId: string | null;
    title: string | null;        // 칭호
    themeUnlock: string | null;   // 테마 해금
    frameColor: string | null;    // 프로필 테두리 색상
    iceItems: number;             // 스트릭 아이스
    hints: number;                // 힌트
    xpBoostDays: number;          // XP 부스터 (일수, 0이면 없음)
    xpBoostMultiplier: number;    // XP 배율 (1.5x, 2x 등)
    profileEffect: string | null; // 프로필 이펙트
    description: string;
}

export const TIER_REWARDS: TierReward[] = [
    {
        tier: 'Iron', xpBonus: 200, badgeId: 'tier_iron', title: null,
        themeUnlock: null, frameColor: '#6b7280',
        iceItems: 0, hints: 0, xpBoostDays: 0, xpBoostMultiplier: 1, profileEffect: null,
        description: '아이언 달성! +200 XP',
    },
    {
        tier: 'Bronze', xpBonus: 500, badgeId: 'tier_bronze', title: '도전자',
        themeUnlock: null, frameColor: '#b45309',
        iceItems: 1, hints: 3, xpBoostDays: 0, xpBoostMultiplier: 1, profileEffect: null,
        description: '브론즈 달성! +500 XP, 아이스 1개, 힌트 3개',
    },
    {
        tier: 'Silver', xpBonus: 1000, badgeId: 'tier_silver', title: '실력자',
        themeUnlock: 'theme_silver', frameColor: '#9ca3af',
        iceItems: 2, hints: 5, xpBoostDays: 0, xpBoostMultiplier: 1, profileEffect: null,
        description: '실버 달성! +1,000 XP, 실버 테마, 아이스 2개, 힌트 5개',
    },
    {
        tier: 'Gold', xpBonus: 2000, badgeId: 'tier_gold', title: '코딩 달인',
        themeUnlock: 'theme_gold', frameColor: '#ca8a04',
        iceItems: 3, hints: 10, xpBoostDays: 0, xpBoostMultiplier: 1, profileEffect: 'gold_glow',
        description: '골드 달성! +2,000 XP, 골드 테마, 프로필 이펙트, 아이스 3개, 힌트 10개',
    },
    {
        tier: 'Platinum', xpBonus: 3000, badgeId: 'tier_platinum', title: '엘리트',
        themeUnlock: 'theme_platinum', frameColor: '#0891b2',
        iceItems: 5, hints: 15, xpBoostDays: 7, xpBoostMultiplier: 1.5, profileEffect: 'platinum_crystal',
        description: '플래티넘 달성! +3,000 XP, 1.5x XP 부스터(7일), 아이스 5개, 힌트 15개',
    },
    {
        tier: 'Diamond', xpBonus: 5000, badgeId: 'tier_diamond', title: '전설의 코더',
        themeUnlock: 'theme_diamond', frameColor: '#2563eb',
        iceItems: 10, hints: 30, xpBoostDays: 30, xpBoostMultiplier: 2, profileEffect: 'diamond_aurora',
        description: '다이아 달성! +5,000 XP, 2x XP 부스터(30일), 아이스 10개, 힌트 30개',
    },
];

export function getTierReward(tierName: string): TierReward | undefined {
    return TIER_REWARDS.find(r => r.tier === tierName);
}

// ═══════════════════════════════════════
//  승급전 요구사항
// ═══════════════════════════════════════

export interface PromotionRequirement {
    minLevel: number;
    minUnits: number;
    minCodeRuns: number;
    minStreak: number;
    examQuestions: number;
    passPercent: number;
}

export const PROMOTION_REQUIREMENTS: Record<string, PromotionRequirement> = {
    'Bronze': { minLevel: 10, minUnits: 0, minCodeRuns: 0, minStreak: 0, examQuestions: 10, passPercent: 50 },
    'Silver': { minLevel: 15, minUnits: 5, minCodeRuns: 0, minStreak: 0, examQuestions: 15, passPercent: 60 },
    'Gold': { minLevel: 20, minUnits: 10, minCodeRuns: 50, minStreak: 0, examQuestions: 20, passPercent: 70 },
    'Platinum': { minLevel: 30, minUnits: 20, minCodeRuns: 0, minStreak: 7, examQuestions: 25, passPercent: 75 },
    'Diamond': { minLevel: 40, minUnits: 30, minCodeRuns: 0, minStreak: 30, examQuestions: 30, passPercent: 80 },
};

export function getPromotionRequirement(tierName: string): PromotionRequirement | undefined {
    return PROMOTION_REQUIREMENTS[tierName];
}

// ═══════════════════════════════════════
//  레벨업 보상
// ═══════════════════════════════════════

export interface LevelUpReward {
    type: 'ice' | 'hint' | 'xp_boost' | 'badge';
    amount: number;
    name: string;
}

/** 매 레벨업마다 기본 보상 */
export function getLevelUpRewards(newLevel: number): LevelUpReward[] {
    const rewards: LevelUpReward[] = [];

    // 매 레벨: 아이스 1개
    if (newLevel % 5 === 0) {
        rewards.push({ type: 'ice', amount: 1, name: '스트릭 아이스' });
    }

    // 매 3레벨: 힌트 2개
    if (newLevel % 3 === 0) {
        rewards.push({ type: 'hint', amount: 2, name: '힌트 팩' });
    }

    return rewards;
}

// ═══════════════════════════════════════
//  마일스톤 보상 (Lv.10, 20, 30, 50)
// ═══════════════════════════════════════

export interface MilestoneReward {
    level: number;
    xpBonus: number;
    rewards: LevelUpReward[];
    description: string;
}

export const MILESTONES: MilestoneReward[] = [
    {
        level: 10, xpBonus: 500,
        rewards: [{ type: 'ice', amount: 3, name: '스트릭 아이스 x3' }, { type: 'badge', amount: 1, name: '10레벨 배지' }],
        description: 'Lv.10 달성! 승급전 해금!',
    },
    {
        level: 20, xpBonus: 1000,
        rewards: [{ type: 'ice', amount: 5, name: '스트릭 아이스 x5' }, { type: 'hint', amount: 10, name: '힌트 팩 x10' }],
        description: 'Lv.20 달성! 중급 코더!',
    },
    {
        level: 30, xpBonus: 2000,
        rewards: [{ type: 'xp_boost', amount: 1, name: '2배 XP 부스터' }, { type: 'badge', amount: 1, name: '30레벨 배지' }],
        description: 'Lv.30 달성! 고급 챌린지 해금!',
    },
    {
        level: 50, xpBonus: 5000,
        rewards: [{ type: 'badge', amount: 1, name: '마스터 배지' }, { type: 'ice', amount: 10, name: '스트릭 아이스 x10' }],
        description: 'Lv.50 달성! 코딩 마스터!',
    },
];

export function getMilestone(level: number): MilestoneReward | undefined {
    return MILESTONES.find(m => m.level === level);
}

// ═══════════════════════════════════════
//  일일 미션 정의
// ═══════════════════════════════════════

export interface DailyMissionDef {
    id: string;
    name: string;
    description: string;
    target: number;
    xpReward: number;
    icon: string;       // StatIcon type or badge id
    condition: 'code_run' | 'quiz_solve' | 'lesson_complete' | 'login' | 'study_minutes' | 'challenge_complete';
}

/** 일일 미션 풀 — 매일 3개 랜덤 선택 */
export const DAILY_MISSION_POOL: DailyMissionDef[] = [
    { id: 'run3', name: '코드 실행 3회', description: '코드를 3번 실행하세요', target: 3, xpReward: 30, icon: 'coder', condition: 'code_run' },
    { id: 'run5', name: '코드 실행 5회', description: '코드를 5번 실행하세요', target: 5, xpReward: 50, icon: 'coder', condition: 'code_run' },
    { id: 'quiz3', name: '퀴즈 3문제', description: '퀴즈를 3문제 풀어보세요', target: 3, xpReward: 40, icon: 'sharpshooter', condition: 'quiz_solve' },
    { id: 'quiz5', name: '퀴즈 5문제', description: '퀴즈를 5문제 풀어보세요', target: 5, xpReward: 60, icon: 'sharpshooter', condition: 'quiz_solve' },
    { id: 'quiz10', name: '퀴즈 10문제', description: '퀴즈를 10문제 풀어보세요', target: 10, xpReward: 100, icon: 'sharpshooter', condition: 'quiz_solve' },
    { id: 'lesson1', name: '레슨 1개 완료', description: '레슨을 1개 완료하세요', target: 1, xpReward: 30, icon: 'bookworm', condition: 'lesson_complete' },
    { id: 'lesson3', name: '레슨 3개 완료', description: '레슨을 3개 완료하세요', target: 3, xpReward: 80, icon: 'bookworm', condition: 'lesson_complete' },
    { id: 'login', name: '오늘 출석', description: '오늘 학습에 참여하세요', target: 1, xpReward: 20, icon: 'early_bird', condition: 'login' },
    { id: 'study15', name: '15분 학습', description: '15분 이상 학습하세요', target: 15, xpReward: 40, icon: 'genius', condition: 'study_minutes' },
    { id: 'study30', name: '30분 학습', description: '30분 이상 학습하세요', target: 30, xpReward: 70, icon: 'genius', condition: 'study_minutes' },
];

/** 고정 3개 미션 (항상 동일) */
export const FIXED_DAILY_MISSIONS: DailyMissionDef[] = [
    { id: "solve3", name: "문제 3개 풀기", description: "오늘 문제 3개를 풀어보세요", target: 3, xpReward: 50, icon: "sharpshooter", condition: "quiz_solve" },
    { id: "code5", name: "코드 5번 실행", description: "코드를 5번 실행하세요", target: 5, xpReward: 30, icon: "coder", condition: "code_run" },
    { id: "unit1", name: "유닛 1개 완료", description: "유닛 1개를 완료하세요", target: 1, xpReward: 40, icon: "bookworm", condition: "lesson_complete" },
];

/** 날짜 기반 시드로 오늘의 미션 3개 선택 */
export function getTodayMissions(date?: string): DailyMissionDef[] {
    const d = date || new Date().toISOString().slice(0, 10);
    // 날짜 문자열을 숫자 시드로 변환
    let seed = 0;
    for (let i = 0; i < d.length; i++) seed = (seed * 31 + d.charCodeAt(i)) | 0;

    const pool = [...DAILY_MISSION_POOL];
    const selected: DailyMissionDef[] = [];

    for (let i = 0; i < 3 && pool.length > 0; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const idx = seed % pool.length;
        selected.push(pool[idx]);
        pool.splice(idx, 1);
    }

    return selected;
}

// ═══════════════════════════════════════
//  주간 리더보드 유틸
// ═══════════════════════════════════════

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    xp: number;
    level: number;
    tier: string;
    isCurrentUser?: boolean;
}

/** 상위 3명 보너스 XP */
export const LEADERBOARD_REWARDS = [
    { rank: 1, xpBonus: 300, label: '1위' },
    { rank: 2, xpBonus: 150, label: '2위' },
    { rank: 3, xpBonus: 80, label: '3위' },
] as const;

// ═══════════════════════════════════════
//  티어별 프로필 프레임
// ═══════════════════════════════════════

export function getTierFrame(tierName: string): { border: string; shadow: string } {
    const tier = getTierInfo(tierName);
    return {
        border: `2px solid ${tier.color}`,
        shadow: `0 0 12px ${tier.color}40, 0 0 4px ${tier.color}20`,
    };
}

// ═══════════════════════════════════════
//  티어별 접근 제한
// ═══════════════════════════════════════

/** 특정 콘텐츠에 접근 가능한 최소 티어 */
export function canAccessContent(userTierName: string, requiredTierName: string): boolean {
    const userTier = TIERS.find(t => t.name === userTierName);
    const reqTier = TIERS.find(t => t.name === requiredTierName);
    if (!userTier || !reqTier) return false;
    return userTier.order >= reqTier.order;
}
