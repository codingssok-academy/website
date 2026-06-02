"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════
   실시간 학생 모니터링 위젯
   Supabase activity_log Realtime 구독
   선생님 관리 패널에 삽입 가능
   ═══════════════════════════════════════ */

interface LiveEvent {
    id: string;
    studentName: string;
    action: string;
    emoji: string;
    timestamp: number;
    color: string;
}

const ACTION_MAP: Record<string, { emoji: string; color: string }> = {
    "unit_complete": { emoji: "menu_book", color: "#059669" },
    "quiz_correct": { emoji: "check_circle", color: "#2563eb" },
    "quiz_wrong": { emoji: "cancel", color: "#DC2626" },
    "code_run": { emoji: "▶️", color: "#0EA5E9" },
    "login": { emoji: "waving_hand", color: "#F59E0B" },
    "badge_earned": { emoji: "military_tech", color: "#2563eb" },
    "streak_checkin": { emoji: "local_fire_department", color: "#EF4444" },
    "level_up": { emoji: "⬆️", color: "#6366F1" },
};

const DEFAULT_ACTION = { emoji: "push_pin", color: "#94a3b8" };

function mapActivityToEvent(row: {
    id: string;
    user_name?: string;
    action?: string;
    created_at?: string;
}): LiveEvent {
    const actionInfo = ACTION_MAP[row.action || ""] || DEFAULT_ACTION;
    const actionLabel = row.action?.replace(/_/g, " ") || "활동";
    return {
        id: row.id,
        studentName: row.user_name || "학생",
        action: actionLabel,
        emoji: actionInfo.emoji,
        timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        color: actionInfo.color,
    };
}

export default function LiveMonitor() {
    const [events, setEvents] = useState<LiveEvent[]>([]);
    const [isLive, setIsLive] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabaseRef = useRef(createClient());

    // Load recent activity
    const loadRecent = useCallback(async () => {
        const supabase = supabaseRef.current;
        const { data } = await supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

        if (data && data.length > 0) {
            setEvents(data.map(mapActivityToEvent));
        } else {
            setEvents([]);
        }
        setLoading(false);
    }, []);

    // Count recently active users (last 5 min)
    const countOnline = useCallback(async () => {
        const supabase = supabaseRef.current;
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count } = await supabase
            .from("activity_log")
            .select("user_name", { count: "exact", head: true })
            .gte("created_at", fiveMinAgo);
        setOnlineCount(count || 0);
    }, []);

    useEffect(() => {
        loadRecent();
        countOnline();
    }, [loadRecent, countOnline]);

    // Realtime subscription
    useEffect(() => {
        if (!isLive) return;
        const supabase = supabaseRef.current;
        const channel = supabase
            .channel("live-monitor")
            .on(
                "postgres_changes" as never,
                { event: "INSERT", schema: "public", table: "activity_log" },
                (payload: { new: { id: string; user_name?: string; action?: string; created_at?: string } }) => {
                    const newEvent = mapActivityToEvent(payload.new);
                    setEvents(prev => [newEvent, ...prev].slice(0, 20));
                    countOnline();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isLive, countOnline]);

    return (
        <div style={{
            background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
            overflow: "hidden", maxHeight: 500,
        }}>
            {/* Header */}
            <div style={{
                padding: "14px 20px", borderBottom: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#f8fafc",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.div
                        animate={isLive ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ width: 8, height: 8, borderRadius: "50%", background: isLive ? "#EF4444" : "#94a3b8" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#172554" }}>실시간 모니터</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        · {onlineCount}명 최근 활동
                    </span>
                </div>
                <button
                    onClick={() => setIsLive(!isLive)}
                    style={{
                        padding: "4px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
                        background: isLive ? "#FEF2F2" : "#ECFDF5", fontSize: 11, fontWeight: 600,
                        color: isLive ? "#DC2626" : "#059669", cursor: "pointer",
                    }}
                >
                    {isLive ? "일시정지" : "재개"}
                </button>
            </div>

            {/* Event feed */}
            <div style={{ padding: "8px 12px", overflowY: "auto", maxHeight: 400 }}>
                {loading ? (
                    <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
                        로딩 중...
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
                        아직 활동 기록이 없습니다
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {events.map(event => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: "auto" }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "8px 10px", borderRadius: 8,
                                    marginBottom: 4,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{event.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "#172554" }}>{event.studentName}</span>
                                    <span style={{ fontSize: 12, color: "#94a3b8" }}> · {event.action}</span>
                                </div>
                                <span style={{ fontSize: 10, color: "#cbd5e1" }}>
                                    {formatTimeAgo(event.timestamp)}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

function formatTimeAgo(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}
