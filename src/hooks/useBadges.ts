"use client";
import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════
   배지 & 업적 시스템
   localStorage 기반
   ═══════════════════════════════════════ */

export interface Badge {
    id: string;
    name: string;
    description: string;
    condition: string;       // human-readable condition
    category: "learning" | "special";
    rarity: "common" | "rare" | "epic" | "legendary";
    unlockedAt?: number;     // timestamp when earned
}

export const BADGE_CATALOG: Omit<Badge, "unlockedAt">[] = [
    // Learning badges
    { id: "seedling", name: "새싹", description: "첫 유닛 완료", condition: "유닛 1개 완료", category: "learning", rarity: "common" },
    { id: "coder", name: "코더", description: "첫 코드 실행", condition: "코드 1번 실행", category: "learning", rarity: "common" },
    { id: "sharpshooter", name: "정확왕", description: "연속 10문제 정답", condition: "퀴즈 10연속 정답", category: "learning", rarity: "rare" },
    { id: "speedster", name: "속도왕", description: "5분 내 유닛 완료", condition: "5분 내 1유닛 완료", category: "learning", rarity: "rare" },
    { id: "bookworm", name: "다독가", description: "50유닛 완료", condition: "유닛 50개 완료", category: "learning", rarity: "epic" },
    { id: "genius", name: "천재", description: "100유닛 완료", condition: "유닛 100개 완료", category: "learning", rarity: "epic" },
    { id: "master", name: "마스터", description: "전체 코스 완료!", condition: "모든 코스 100%", category: "learning", rarity: "legendary" },

    // 출석 스트릭
    { id: "streak-3", name: "3일 연속", description: "3일 연속 접속", condition: "streak 3일 이상", category: "learning", rarity: "common" },
    { id: "streak-7", name: "일주일 연속", description: "7일 연속 접속", condition: "streak 7일 이상", category: "learning", rarity: "rare" },
    { id: "streak-30", name: "한 달 연속", description: "30일 연속 접속", condition: "streak 30일 이상", category: "learning", rarity: "epic" },

    // 문제 풀이
    { id: "solve-10", name: "10문제 돌파", description: "문제 10개 풀기", condition: "문제 10개 이상 풀기", category: "learning", rarity: "common" },
    { id: "solve-50", name: "50문제 돌파", description: "문제 50개 풀기", condition: "문제 50개 이상 풀기", category: "learning", rarity: "rare" },
    { id: "solve-100", name: "100문제 마스터", description: "문제 100개 풀기", condition: "문제 100개 이상 풀기", category: "learning", rarity: "epic" },

    // XP
    { id: "xp-500", name: "XP 500", description: "총 XP 500 달성", condition: "XP 500 이상", category: "learning", rarity: "common" },
    { id: "xp-1000", name: "XP 1000", description: "총 XP 1000 달성", condition: "XP 1000 이상", category: "learning", rarity: "rare" },

    // 코스 완료
    { id: "first-course", name: "첫 코스 완료", description: "코스 1개 완료", condition: "코스 1개 이상 완료", category: "learning", rarity: "rare" },

    // 코드 실행
    { id: "first-run", name: "첫 실행", description: "첫 코드 실행", condition: "코드 1번 이상 실행", category: "learning", rarity: "common" },
    { id: "run-100", name: "100번 실행", description: "코드 100번 실행", condition: "코드 100번 이상 실행", category: "learning", rarity: "rare" },

    // Special badges
    { id: "early_bird", name: "아침형", description: "오전 7시 이전 학습", condition: "AM 7시 이전 접속", category: "special", rarity: "rare" },
    { id: "night_owl", name: "올빼미", description: "자정 이후 학습", condition: "AM 12시 이후 접속", category: "special", rarity: "rare" },
    { id: "xmas", name: "크리스마스", description: "12월 25일 학습", condition: "12/25 접속", category: "special", rarity: "epic" },
    { id: "champion", name: "1등", description: "리더보드 1위", condition: "주간 리더보드 1위", category: "special", rarity: "legendary" },
];

const RARITY_COLORS: Record<string, string> = {
    common: "#94a3b8",
    rare: "#3B82F6",
    epic: "#2563eb",
    legendary: "#F59E0B",
};

export { RARITY_COLORS };

const STORAGE_KEY = "codingssok_badges";

function loadBadges(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function useBadges() {
    const [unlockedIds, setUnlockedIds] = useState<string[]>(() => loadBadges());
    const [newBadge, setNewBadge] = useState<Badge | null>(null);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedIds)); } catch { }
    }, [unlockedIds]);

    const unlock = useCallback((badgeId: string) => {
        setUnlockedIds(prev => {
            if (prev.includes(badgeId)) return prev;
            const badge = BADGE_CATALOG.find(b => b.id === badgeId);
            if (badge) {
                setNewBadge({ ...badge, unlockedAt: Date.now() });
                // Auto-clear notification after 4s
                setTimeout(() => setNewBadge(null), 4000);
            }
            return [...prev, badgeId];
        });
    }, []);

    // Auto-check time-based badges
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 7) unlock("early_bird");
        if (hour >= 0 && hour < 5) unlock("night_owl");
        const now = new Date();
        if (now.getMonth() === 11 && now.getDate() === 25) unlock("xmas");
    }, [unlock]);

    // Auto-check stat-based badges (localStorage)
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            // 코드 실행 횟수
            const codeRuns = parseInt(localStorage.getItem("codingssok_code_runs") || "0", 10);
            if (codeRuns >= 1) unlock("coder");
            if (codeRuns >= 1) unlock("first-run");
            if (codeRuns >= 100) unlock("run-100");

            // 스트릭
            const streakRaw = localStorage.getItem("codingssok_streak");
            if (streakRaw) {
                const streakData = JSON.parse(streakRaw);
                const streak = streakData.current || 0;
                if (streak >= 3) unlock("streak-3");
                if (streak >= 7) unlock("streak-7");
                if (streak >= 30) unlock("streak-30");
            }

            // 총 XP
            const progressRaw = localStorage.getItem("codingssok_user_progress");
            if (progressRaw) {
                const prog = JSON.parse(progressRaw);
                const xp = prog.xp || 0;
                if (xp >= 500) unlock("xp-500");
                if (xp >= 1000) unlock("xp-1000");
                // 완료 코스
                const completedCourses = prog.completedCourses?.length || 0;
                if (completedCourses >= 1) unlock("first-course");
            }

            // 문제 풀이 수
            const totalProblems = parseInt(localStorage.getItem("codingssok_total_problems") || "0", 10);
            if (totalProblems >= 10) unlock("solve-10");
            if (totalProblems >= 50) unlock("solve-50");
            if (totalProblems >= 100) unlock("solve-100");
        } catch { /* silent */ }
    }, [unlock]);

    // reward-engine 에서 발행하는 badge-unlocked 이벤트 감지
    useEffect(() => {
        const handler = (e: Event) => {
            const badgeId = (e as CustomEvent).detail as string;
            if (badgeId) unlock(badgeId);
        };
        window.addEventListener("badge-unlocked", handler);
        return () => window.removeEventListener("badge-unlocked", handler);
    }, [unlock]);

    const allBadges: Badge[] = BADGE_CATALOG.map(b => ({
        ...b,
        unlockedAt: unlockedIds.includes(b.id) ? Date.now() : undefined,
    }));

    const unlockedCount = unlockedIds.length;
    const totalCount = BADGE_CATALOG.length;

    return {
        allBadges, unlockedIds, unlockedCount, totalCount,
        unlock, newBadge, setNewBadge,
        RARITY_COLORS,
    };
}
