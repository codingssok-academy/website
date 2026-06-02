"use client";
import { useState, useEffect, useCallback } from "react";

/* ── 오답 노트 ──
   퀴즈 오답을 자동 수집하고 복습용으로 관리합니다.
   localStorage 기반, 사용자별·코스별 분류.
*/

export interface WrongAnswer {
    id: string;            // `${courseId}__${unitId}__${pageId}__${quizIdx}`
    courseId: string;
    unitTitle: string;
    pageTitle: string;
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    timestamp: number;
    reviewCount: number;   // 복습 횟수
    mastered: boolean;     // 완전 이해 표시
}

const STORAGE_KEY = "codingssok_wrong_answers";

function loadAll(): WrongAnswer[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveAll(items: WrongAnswer[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { }
}

export function useWrongAnswers() {
    const [items, setItems] = useState<WrongAnswer[]>(() => loadAll());

    // Persist on change
    useEffect(() => { saveAll(items); }, [items]);

    const addWrongAnswer = useCallback((entry: Omit<WrongAnswer, "timestamp" | "reviewCount" | "mastered">) => {
        setItems(prev => {
            // Deduplicate by id
            const exists = prev.findIndex(w => w.id === entry.id);
            const newEntry: WrongAnswer = {
                ...entry,
                timestamp: Date.now(),
                reviewCount: 0,
                mastered: false,
            };
            if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = { ...newEntry, reviewCount: prev[exists].reviewCount };
                return updated;
            }
            return [newEntry, ...prev];
        });
    }, []);

    const markReviewed = useCallback((id: string) => {
        setItems(prev => prev.map(w =>
            w.id === id ? { ...w, reviewCount: w.reviewCount + 1 } : w
        ));
    }, []);

    const markMastered = useCallback((id: string) => {
        setItems(prev => prev.map(w =>
            w.id === id ? { ...w, mastered: true } : w
        ));
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(w => w.id !== id));
    }, []);

    const unreviewedCount = items.filter(w => !w.mastered).length;

    return { items, addWrongAnswer, markReviewed, markMastered, removeItem, unreviewedCount };
}
