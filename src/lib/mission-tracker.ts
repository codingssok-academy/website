/**
 * 일일 미션 진행도 트래커 — 독립 유틸리티
 * useDailyMissions 훅과 동일한 localStorage 키를 공유하여
 * 어떤 페이지에서든 미션 진행도를 업데이트할 수 있음
 */
import { getTodayMissions, type DailyMissionDef } from './xp-engine';

const STORAGE_KEY = 'codingssok_daily_missions';

interface MissionProgress {
    id: string;
    current: number;
    completed: boolean;
    claimed: boolean;
}

interface DailyMissionState {
    date: string;
    missions: MissionProgress[];
}

function getToday() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * 미션 진행도 업데이트 (브라우저 전용)
 * 호출하면 해당 condition 의 미션을 amount 만큼 진행시킴
 */
export function trackMission(condition: DailyMissionDef['condition'], amount: number = 1) {
    if (typeof window === 'undefined') return;

    const today = getToday();
    let state: DailyMissionState;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        state = raw ? JSON.parse(raw) : { date: '', missions: [] };
        if (state.date !== today) state = { date: '', missions: [] };
    } catch {
        state = { date: '', missions: [] };
    }

    // 오늘 미션이 없으면 초기화
    const todayMissions = getTodayMissions();
    if (state.missions.length === 0) {
        state = {
            date: today,
            missions: todayMissions.map(m => ({
                id: m.id, current: 0, completed: false, claimed: false,
            })),
        };
    }

    // condition 에 맞는 미션 진행
    let changed = false;
    state.missions = state.missions.map(mp => {
        const def = todayMissions.find(m => m.id === mp.id);
        if (!def || def.condition !== condition || mp.completed) return mp;
        const newCurrent = mp.current + amount;
        const completed = newCurrent >= def.target;
        changed = true;
        return { ...mp, current: newCurrent, completed };
    });

    if (changed) {
        state.date = today;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* silent */ }
        // 커스텀 이벤트 발행 → useDailyMissions 훅이 리스너로 동기화
        window.dispatchEvent(new CustomEvent('mission-progress'));
    }
}
