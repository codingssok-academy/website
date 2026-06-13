"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

/**
 * 학부모 대시보드 데이터 — 클라이언트 캐시 + 백그라운드 갱신
 *
 * 첫 로드: API fetch → 캐시 저장 → 화면 표시
 * 탭 이동: 캐시 즉시 반환 → 백그라운드에서 갱신 → 자동 업데이트
 *
 * 체감: 첫 진입만 로딩, 이후 탭 이동은 즉시
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
    clearParentClientAuth,
    PARENT_DASH_CACHE_KEY,
    PARENT_STUDENT_KEY,
} from "@/lib/parent-client-auth";
const CACHE_TTL = 5 * 60 * 1000; // 5분 — sessionStorage 캐시 (탭 닫으면 초기화)

export interface DashboardData {
    found: boolean;
    student: {
        id: string;
        name: string;
        totalXp: number;
        level: number;
        tier: string;
        streak: number;
        bestStreak: number;
        accuracy: number;
        totalCodeRuns: number;
        totalProblems: number;
        lastActive: string | null;
    } | null;
    xp: { total: number; today: number; weekly: { date: string; xp: number }[] };
    activity: { todayMinutes: number; totalMinutes: number; recent: any[] };
    feedbacks: { id: string; date: string | null; status: string }[];
    codeHistory: any[];
    announcements: { id: string; title: string; content: string; isPinned: boolean; createdAt: string }[];
    studyNotes: { count30d: number; latestAt: string | null };
}

interface CacheEntry {
    data: DashboardData;
    ts: number;
    name: string;
}

function getCache(name: string): DashboardData | null {
    try {
        const raw = sessionStorage.getItem(PARENT_DASH_CACHE_KEY);
        if (!raw) return null;
        const entry: CacheEntry = JSON.parse(raw);
        if (entry.name !== name) return null;
        if (Date.now() - entry.ts > CACHE_TTL) return null;
        return entry.data;
    } catch { return null; }
}

function setCache(name: string, data: DashboardData) {
    try {
        sessionStorage.setItem(PARENT_DASH_CACHE_KEY, JSON.stringify({ data, ts: Date.now(), name }));
    } catch { /* quota exceeded — ignore */ }
}

export function useParentDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const mountedRef = useRef(true);
    const abortRef = useRef<AbortController | null>(null);

    // 언마운트 추적 — setState on unmounted 방지
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortRef.current?.abort();
        };
    }, []);

    // 학생 이름 로드
    useEffect(() => {
        const stored = localStorage.getItem(PARENT_STUDENT_KEY) ?? "";
        setName(stored);
        if (!stored) { setLoading(false); return; }

        // 캐시 먼저 반환
        const cached = getCache(stored);
        if (cached) {
            setData(cached);
            setLoading(false);
        }
    }, []);

    // API fetch (캐시 miss 또는 백그라운드 갱신)
    const fetchDashboard = useCallback(async (studentName: string, isBackground = false) => {
        if (!studentName) return;

        // 기존 요청 취소 (빠른 탭 전환 대응)
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        if (!isBackground && mountedRef.current) setLoading(true);

        try {
            const res = await fetch(
                `/api/parent/v2/dashboard?name=${encodeURIComponent(studentName)}`,
                { signal: controller.signal }
            );
            if (res.status === 401 || res.status === 403) {
                clearParentClientAuth();
                setData(null);
                setName("");
                window.location.reload();
                return;
            }
            const json = await res.json();
            if (controller.signal.aborted || !mountedRef.current) return;
            setData(json);
            setCache(studentName, json);
        } catch (err: unknown) {
            // AbortError는 정상 — 무시
            if ((err as { name?: string })?.name === "AbortError") return;
            if (process.env.NODE_ENV === "development") {
                console.warn("[useParentDashboard] fetch failed:", err);
            }
        } finally {
            if (mountedRef.current && abortRef.current === controller) {
                setLoading(false);
            }
        }
    }, []);

    // 저장된 학생명 로드 후 fetch
    useEffect(() => {
        if (!name) return;
        const cached = getCache(name);
        fetchDashboard(name, !!cached);
    }, [name, fetchDashboard]);

    // 수동 리프레시
    const refresh = useCallback(async () => {
        if (name) await fetchDashboard(name, false);
    }, [name, fetchDashboard]);

    return { data, loading, name, refresh };
}
