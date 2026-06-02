"use client";
import { useCallback, useState } from "react";

/* ═══════════════════════════════════════
   카카오톡 알림 연동 훅
   
   카카오 알림톡 API 래퍼
   실제 발송은 서버 API 라우트 필요
   클라이언트에서는 UI 로직만 처리
   ═══════════════════════════════════════ */

export interface KakaoNotification {
    id: string;
    templateCode: string;
    recipientName: string;
    recipientPhone: string;
    message: string;
    status: "pending" | "sent" | "failed";
    timestamp: number;
}

// 알림 템플릿 종류
export const KAKAO_TEMPLATES = {
    homework: {
        code: "HOMEWORK_REMIND",
        title: "숙제 알림",
        template: "안녕하세요, {{studentName}} 학부모님!\n{{studentName}} 학생의 숙제 안내드립니다.\n\n과목: {{subject}}\n마감: {{deadline}}\n\n코딩쏙 아카데미 드림",
    },
    attendance: {
        code: "ATTENDANCE_NOTIFY",
        title: "출석 확인",
        template: "안녕하세요, {{studentName}} 학부모님!\n{{studentName}} 학생이 오늘 수업에 출석했습니다.\n\n이번 달 출석률: {{rate}}%\n연속 출석: {{streak}}일\n\n코딩쏙 아카데미",
    },
    achievement: {
        code: "ACHIEVEMENT_NOTIFY",
        title: "성취 알림",
        template: "축하합니다!\n{{studentName}} 학생이 새로운 성취를 달성했습니다!\n\n{{badge}}\n현재 XP: {{xp}}\n레벨: {{level}}\n\n코딩쏙 아카데미",
    },
    schedule: {
        code: "SCHEDULE_CHANGE",
        title: "일정 변경",
        template: "안녕하세요, {{studentName}} 학부모님.\n수업 일정 변경을 안내드립니다.\n\n변경 전: {{oldDate}}\n변경 후: {{newDate}}\n\n문의: 010-XXXX-XXXX\n코딩쏙 아카데미",
    },
} as const;

const STORAGE_KEY = "codingssok_kakao_log";

function loadLog(): KakaoNotification[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function useKakaoNotify() {
    const [log, setLog] = useState<KakaoNotification[]>(() => loadLog());
    const [isSending, setIsSending] = useState(false);

    const send = useCallback(async (
        templateCode: string,
        recipientName: string,
        recipientPhone: string,
        message: string,
    ): Promise<{ success: boolean; message: string }> => {
        setIsSending(true);

        let result: { success: boolean; message: string };
        try {
            const res = await fetch('/api/kakao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateCode, recipientName, recipientPhone, message }),
            });
            const data = await res.json();
            result = { success: data.success ?? false, message: data.message ?? '알 수 없는 오류' };
        } catch {
            result = { success: false, message: '카카오 알림 서비스가 설정되지 않았습니다.' };
        }

        const notification: KakaoNotification = {
            id: Math.random().toString(36).slice(2),
            templateCode,
            recipientName,
            recipientPhone,
            message,
            status: result.success ? "sent" : "failed",
            timestamp: Date.now(),
        };

        setLog(prev => {
            const next = [notification, ...prev].slice(0, 50);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
            return next;
        });

        setIsSending(false);
        return result;
    }, []);

    const sendBulk = useCallback(async (
        templateCode: string,
        recipients: { name: string; phone: string }[],
        messageTemplate: string,
    ): Promise<{ success: number; failed: number }> => {
        setIsSending(true);
        let success = 0;

        for (const r of recipients) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const notification: KakaoNotification = {
                id: Math.random().toString(36).slice(2),
                templateCode,
                recipientName: r.name,
                recipientPhone: r.phone,
                message: messageTemplate.replace("{{studentName}}", r.name),
                status: "sent",
                timestamp: Date.now(),
            };
            setLog(prev => {
                const next = [notification, ...prev].slice(0, 50);
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
                return next;
            });
            success++;
        }

        setIsSending(false);
        return { success, failed: 0 };
    }, []);

    return { log, send, sendBulk, isSending, KAKAO_TEMPLATES };
}
