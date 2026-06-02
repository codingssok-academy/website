/**
 * 뱃지 카탈로그 — 중앙 정의
 * useBadges.ts의 BADGE_CATALOG와 동기화됨
 */

export interface BadgeDef {
    id: string;
    name: string;
    desc: string;
    icon: string;       // Material Symbols icon name
    condition: string;  // human-readable unlock condition
    category: "streak" | "problems" | "xp" | "courses" | "code" | "special";
    rarity: "common" | "rare" | "epic" | "legendary";
}

export const BADGES: BadgeDef[] = [
    // 출석 스트릭
    { id: "streak-3", name: "3일 연속", desc: "3일 연속 접속", icon: "local_fire_department", condition: "streak >= 3", category: "streak", rarity: "common" },
    { id: "streak-7", name: "일주일 연속", desc: "7일 연속 접속", icon: "whatshot", condition: "streak >= 7", category: "streak", rarity: "rare" },
    { id: "streak-30", name: "한 달 연속", desc: "30일 연속 접속", icon: "verified", condition: "streak >= 30", category: "streak", rarity: "epic" },

    // 문제 풀이
    { id: "solve-10", name: "10문제 돌파", desc: "문제 10개 풀기", icon: "star", condition: "totalProblems >= 10", category: "problems", rarity: "common" },
    { id: "solve-50", name: "50문제 돌파", desc: "문제 50개 풀기", icon: "star_half", condition: "totalProblems >= 50", category: "problems", rarity: "rare" },
    { id: "solve-100", name: "100문제 마스터", desc: "문제 100개 풀기", icon: "stars", condition: "totalProblems >= 100", category: "problems", rarity: "epic" },

    // XP
    { id: "xp-500", name: "XP 500", desc: "총 XP 500 달성", icon: "bolt", condition: "xp >= 500", category: "xp", rarity: "common" },
    { id: "xp-1000", name: "XP 1000", desc: "총 XP 1000 달성", icon: "electric_bolt", condition: "xp >= 1000", category: "xp", rarity: "rare" },

    // 코스 완료
    { id: "first-course", name: "첫 코스 완료", desc: "코스 1개 완료", icon: "school", condition: "completedCourses >= 1", category: "courses", rarity: "rare" },

    // 코드 실행
    { id: "first-run", name: "첫 실행", desc: "첫 코드 실행", icon: "play_circle", condition: "codeRuns >= 1", category: "code", rarity: "common" },
    { id: "run-100", name: "100번 실행", desc: "코드 100번 실행", icon: "speed", condition: "codeRuns >= 100", category: "code", rarity: "rare" },
];

export const BADGE_CATEGORY_LABELS: Record<BadgeDef["category"], string> = {
    streak: "출석 스트릭",
    problems: "문제 풀이",
    xp: "경험치",
    courses: "코스 완료",
    code: "코드 실행",
    special: "특별",
};
