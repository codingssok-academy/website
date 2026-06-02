"use client";
import { useState, useEffect, useCallback } from "react";
import { getTodayMissions, type DailyMissionDef } from "@/lib/xp-engine";

const STORAGE_KEY = "codingssok_daily_missions";

export interface MissionProgress {
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

function loadState(): DailyMissionState {
    if (typeof window === "undefined") return { date: "", missions: [] };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { date: "", missions: [] };
        const parsed = JSON.parse(raw) as DailyMissionState;
        if (parsed.date !== getToday()) return { date: "", missions: [] };
        return parsed;
    } catch { return { date: "", missions: [] }; }
}

function saveState(state: DailyMissionState) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* silent */ }
}

export function useDailyMissions() {
    const [todayMissions] = useState<DailyMissionDef[]>(() => getTodayMissions());
    const [progress, setProgress] = useState<MissionProgress[]>([]);

    // 초기화: 오늘 날짜 미션 로드/생성
    useEffect(() => {
        const today = getToday();
        const saved = loadState();

        if (saved.date === today && saved.missions.length > 0) {
            setProgress(saved.missions);
        } else {
            const initial = todayMissions.map(m => ({
                id: m.id,
                current: 0,
                completed: false,
                claimed: false,
            }));
            setProgress(initial);
            saveState({ date: today, missions: initial });
        }
    }, [todayMissions]);

    // trackMission() 에서 발행하는 커스텀 이벤트 감지 → state 동기화
    useEffect(() => {
        const sync = () => {
            const saved = loadState();
            if (saved.missions.length > 0) setProgress(saved.missions);
        };
        window.addEventListener("mission-progress", sync);
        return () => window.removeEventListener("mission-progress", sync);
    }, []);

    // 미션 진행도 업데이트
    const updateMission = useCallback((condition: DailyMissionDef["condition"], amount: number = 1) => {
        setProgress(prev => {
            const next = prev.map(mp => {
                const def = todayMissions.find(m => m.id === mp.id);
                if (!def || def.condition !== condition || mp.completed) return mp;
                const newCurrent = mp.current + amount;
                const completed = newCurrent >= def.target;
                return { ...mp, current: newCurrent, completed };
            });
            saveState({ date: getToday(), missions: next });
            return next;
        });
    }, [todayMissions]);

    // 보상 수령
    const claimReward = useCallback((missionId: string): number => {
        let reward = 0;
        setProgress(prev => {
            const next = prev.map(mp => {
                if (mp.id !== missionId || !mp.completed || mp.claimed) return mp;
                const def = todayMissions.find(m => m.id === missionId);
                reward = def?.xpReward || 0;
                return { ...mp, claimed: true };
            });
            saveState({ date: getToday(), missions: next });
            return next;
        });
        return reward;
    }, [todayMissions]);

    const completedCount = progress.filter(p => p.completed).length;
    const claimedCount = progress.filter(p => p.claimed).length;
    const allCompleted = completedCount === todayMissions.length;
    const allClaimed = claimedCount === todayMissions.length;

    return {
        todayMissions,
        progress,
        updateMission,
        claimReward,
        completedCount,
        claimedCount,
        allCompleted,
        allClaimed,
    };
}
