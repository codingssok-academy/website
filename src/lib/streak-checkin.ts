/**
 * 스트릭 체크인 — 훅 외부에서 호출 가능한 순수 함수
 * useStreak 훅과 동일한 localStorage 키를 직접 조작
 */

const STORAGE_KEY = "codingssok_streak";

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
    activeDates: string[];
    iceItems: number;
    frozenDates: string[];
    totalDays: number;
}

function getToday(): string {
    return new Date().toISOString().slice(0, 10);
}

function getYesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function defaultStreak(): StreakData {
    return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: "",
        activeDates: [],
        iceItems: 1,
        frozenDates: [],
        totalDays: 0,
    };
}

/**
 * 출석 체크인: localStorage의 스트릭 데이터를 직접 업데이트
 * useStreak 훅이 마운트되면 자동으로 최신 값을 읽어 동기화됨
 */
export default function streakCheckIn(): void {
    if (typeof window === "undefined") return;

    let data: StreakData;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        data = raw ? (JSON.parse(raw) as StreakData) : defaultStreak();
    } catch {
        data = defaultStreak();
    }

    const today = getToday();
    if (data.lastActiveDate === today) return; // 이미 체크인됨

    const yesterday = getYesterday();
    let newStreak = data.currentStreak;
    const newActiveDates = [...(data.activeDates ?? [])];

    if (data.lastActiveDate === yesterday || data.lastActiveDate === "") {
        newStreak += 1;
    } else if ((data.frozenDates ?? []).includes(yesterday)) {
        newStreak += 1;
    } else {
        newStreak = 1;
    }

    if (!newActiveDates.includes(today)) {
        newActiveDates.push(today);
    }

    const updated: StreakData = {
        ...data,
        currentStreak: newStreak,
        longestStreak: Math.max(data.longestStreak ?? 0, newStreak),
        lastActiveDate: today,
        activeDates: newActiveDates,
        totalDays: newActiveDates.length,
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch { /* silent */ }
}
