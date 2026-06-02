"use client";
import { useEffect, useRef } from "react";
import { trackMission } from "@/lib/mission-tracker";

const INTERVAL_MS = 60_000; // 1분마다 체크

/**
 * 학습 시간 추적 훅
 * 페이지가 활성화되어 있는 동안 1분마다 study_minutes 미션 진행
 */
export function useStudyTimer() {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            if (!document.hidden) {
                trackMission("study_minutes", 1);
            }
        }, INTERVAL_MS);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);
}
