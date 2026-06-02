"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { resolvePresenceStatus, getPresenceStudyMinutes } from "@/lib/presence";
import type { PresenceRow } from "../types";

/* ═══════════════════════════════════════
   실시간 학생 현황
   /teacher/admin/monitor
   ═══════════════════════════════════════ */

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
    bg: "#f8fafc",
    card: "#ffffff",
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    primaryBorder: "#bfdbfe",
    green: "#059669",
    greenBg: "#f0fdf4",
    greenBorder: "#bbf7d0",
    amber: "#d97706",
    amberBg: "#fffbeb",
    amberBorder: "#fde68a",
    purple: "#7c3aed",
    purpleBg: "#faf5ff",
    purpleBorder: "#e9d5ff",
    slate: "#64748b",
    muted: "#94a3b8",
    border: "#e2e8f0",
    text: "#0f172a",
    textSub: "#475569",
    shadow: "0 1px 6px rgba(0,0,0,0.06), 0 0 0 1px rgba(226,232,240,0.8)",
} as const;

// ─── 활동 상태 아이콘/텍스트 ───────────────────────────────────────────────
function getStateIcon(key: string): string {
    if (key === "active") return "bolt";
    if (key === "attentive") return "menu_book";
    if (key === "idle") return "hourglass_empty";
    if (key === "background") return "tab_unselected";
    return "wifi_off";
}

// ─── 체류 시간 실시간 카운터 훅 ───────────────────────────────────────────
function useLiveMinutes(startedAt: string | null | undefined, isOnline: boolean) {
    const [mins, setMins] = useState(() =>
        isOnline && startedAt
            ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60_000))
            : 0
    );

    useEffect(() => {
        if (!isOnline || !startedAt) { setMins(0); return; }
        const tick = () => setMins(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60_000)));
        tick();
        const id = setInterval(tick, 30_000);
        return () => clearInterval(id);
    }, [isOnline, startedAt]);

    return mins;
}

// ─── 카드 컴포넌트 ─────────────────────────────────────────────────────────
function OnlineStudentCard({ p, now }: { p: PresenceRow; now: number }) {
    const status = resolvePresenceStatus(p, now);
    const studyMins = useLiveMinutes(p.started_at, status.key !== "offline");

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            style={{
                background: C.card,
                borderRadius: 14,
                padding: "16px 18px",
                border: `1px solid ${status.border}`,
                borderLeft: `4px solid ${status.color}`,
                boxShadow: C.shadow,
            }}
        >
            {/* 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 2 }}>{p.student_name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <motion.span
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ width: 7, height: 7, borderRadius: "50%", background: status.color, display: "inline-block" }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 700, color: status.color }}>{status.label}</span>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                        {studyMins}
                        <span style={{ fontSize: 11, fontWeight: 400, color: C.muted, marginLeft: 2 }}>분</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>체류 시간</div>
                    {status.score > 0 && (
                        <div style={{ width: 52, height: 4, borderRadius: 2, background: C.border, marginTop: 5, marginLeft: "auto" }}>
                            <div style={{ width: `${status.score}%`, height: "100%", borderRadius: 2, background: status.color }} />
                        </div>
                    )}
                </div>
            </div>

            {/* 학습 내용 */}
            {(p.course_title || p.unit_title || p.current_focus_label) && (
                <div style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: status.bg,
                    border: `1px solid ${status.border}`,
                    fontSize: 12,
                    color: C.textSub,
                    lineHeight: 1.6,
                }}>
                    {p.course_title && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: C.primary }}>school</span>
                            <span style={{ fontWeight: 700, color: C.primary }}>{p.course_title}</span>
                            {p.unit_title && <span style={{ color: C.slate }}>› {p.unit_title}</span>}
                            {p.page_title && <span style={{ color: C.muted }}>› {p.page_title}</span>}
                        </div>
                    )}
                    {p.current_focus_label && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: status.color }}>{getStateIcon(status.key)}</span>
                            <span>{p.current_focus_label}</span>
                        </div>
                    )}
                    {p.learning_context && (
                        <div style={{ color: C.muted, marginTop: 2, fontSize: 11 }}>{p.learning_context}</div>
                    )}
                </div>
            )}

            {/* 마지막 상호작용 */}
            {p.last_interaction_at && (
                <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
                    마지막 상호작용: {new Date(p.last_interaction_at).toLocaleTimeString("ko", { hour: "2-digit", minute: "2-digit" })}
                </div>
            )}
        </motion.div>
    );
}

function OfflineStudentCard({ p }: { p: PresenceRow }) {
    const lastTime = new Date(p.last_heartbeat);
    const diffMs = Date.now() - lastTime.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffLabel = diffMin < 60
        ? `${diffMin}분 전`
        : diffMin < 1440
            ? `${Math.floor(diffMin / 60)}시간 전`
            : `${Math.floor(diffMin / 1440)}일 전`;

    return (
        <div style={{
            background: C.card,
            borderRadius: 10,
            padding: "12px 14px",
            border: `1px solid ${C.border}`,
            opacity: 0.65,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>{p.student_name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>마지막 접속 {diffLabel}</div>
            {p.course_title && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{p.course_title}</div>
            )}
        </div>
    );
}

// ─── 통계 헤더 카드 ────────────────────────────────────────────────────────
function StatCard({ icon, iconColor, iconBg, value, label }: {
    icon: string; iconColor: string; iconBg: string; value: string | number; label: string;
}) {
    return (
        <div style={{
            background: C.card,
            borderRadius: 14,
            padding: "14px 16px",
            border: `1px solid ${C.border}`,
            boxShadow: C.shadow,
            display: "flex",
            alignItems: "center",
            gap: 12,
        }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: iconColor }}>{icon}</span>
            </div>
            <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3, fontWeight: 600 }}>{label}</div>
            </div>
        </div>
    );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────
export default function MonitorClient() {
    const [presenceList, setPresenceList] = useState<PresenceRow[]>([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [now, setNow] = useState(() => Date.now());
    const supabaseRef = useRef(createClient());

    // 1초마다 `now` 갱신 → 카드 시간 실시간 렌더
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const fetchPresence = useCallback(async () => {
        const { data } = await supabaseRef.current
            .from("student_presence")
            .select("*")
            .order("last_heartbeat", { ascending: false });
        if (data) {
            setPresenceList(data as PresenceRow[]);
            setLastRefresh(new Date());
        }
    }, []);

    // Initial load + Realtime subscription
    useEffect(() => {
        void fetchPresence();

        const ch = supabaseRef.current
            .channel("teacher-presence-v2")
            .on("postgres_changes", { event: "*", schema: "public", table: "student_presence" }, (payload: { new: PresenceRow }) => {
                const row = payload.new as PresenceRow;
                if (!row?.user_id) return;
                setPresenceList(prev => {
                    const idx = prev.findIndex(p => p.user_id === row.user_id);
                    if (idx >= 0) {
                        const next = [...prev];
                        next[idx] = row;
                        return next;
                    }
                    return [row, ...prev];
                });
                setLastRefresh(new Date());
            })
            .subscribe();

        return () => { void supabaseRef.current.removeChannel(ch); };
    }, [fetchPresence]);

    // 30초 자동 갱신 폴링 (Realtime 보조)
    useEffect(() => {
        if (!autoRefresh) return;
        const id = setInterval(() => void fetchPresence(), 30_000);
        return () => clearInterval(id);
    }, [autoRefresh, fetchPresence]);

    const onlineStudents = presenceList.filter(p => resolvePresenceStatus(p, now).key !== "offline");
    const offlineStudents = presenceList.filter(p => resolvePresenceStatus(p, now).key === "offline");

    // 상태별 그룹 통계
    const activeCount = presenceList.filter(p => resolvePresenceStatus(p, now).key === "active").length;
    const idleCount = presenceList.filter(p => ["idle", "background"].includes(resolvePresenceStatus(p, now).key)).length;

    return (
        <div style={{ minHeight: "100vh", background: C.bg }}>
            {/* ── 헤더 ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>실시간 현황</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <motion.span
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block" }}
                        />
                        <span style={{ fontSize: 12, color: C.slate }}>
                            Realtime 연결 중 · 마지막 갱신 {lastRefresh.toLocaleTimeString("ko", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate, cursor: "pointer", padding: "7px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.card }}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={e => setAutoRefresh(e.target.checked)}
                            style={{ accentColor: C.primary }}
                        />
                        30초 자동 갱신
                    </label>
                    <button
                        onClick={() => void fetchPresence()}
                        style={{
                            padding: "7px 14px",
                            borderRadius: 9,
                            border: `1px solid ${C.primaryBorder}`,
                            background: C.primaryLight,
                            color: C.primary,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
                        새로고침
                    </button>
                </div>
            </div>

            {/* ── 통계 카드 ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
                <StatCard icon="groups" iconColor={C.primary} iconBg={C.primaryLight} value={presenceList.length} label="전체 학생" />
                <StatCard icon="sensors" iconColor={C.green} iconBg={C.greenBg} value={onlineStudents.length} label="현재 접속" />
                <StatCard icon="bolt" iconColor={C.green} iconBg={C.greenBg} value={activeCount} label="활발히 학습 중" />
                <StatCard icon="hourglass_empty" iconColor={C.amber} iconBg={C.amberBg} value={idleCount} label="비활동/백그라운드" />
                <StatCard icon="wifi_off" iconColor={C.muted} iconBg="#f1f5f9" value={offlineStudents.length} label="오프라인" />
            </div>

            {/* ── 접속 중 학생 ── */}
            <AnimatePresence>
                {onlineStudents.length > 0 && (
                    <motion.div
                        key="online-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ marginBottom: 28 }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <motion.span
                                animate={{ scale: [1, 1.4, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block" }}
                            />
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.green, margin: 0 }}>
                                접속 중 ({onlineStudents.length})
                            </h3>
                        </div>
                        <motion.div
                            layout
                            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}
                        >
                            <AnimatePresence>
                                {onlineStudents.map(p => (
                                    <OnlineStudentCard key={p.user_id} p={p} now={now} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── 오프라인 학생 ── */}
            {offlineStudents.length > 0 && (
                <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.muted, margin: "0 0 12px" }}>
                        오프라인 ({offlineStudents.length})
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                        {offlineStudents.map(p => (
                            <OfflineStudentCard key={p.user_id} p={p} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── 데이터 없음 ── */}
            {presenceList.length === 0 && (
                <div style={{ textAlign: "center", padding: 72, color: C.muted }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 52, display: "block", marginBottom: 12, opacity: 0.4 }}>sensors_off</span>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>접속 기록이 없습니다</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>학생이 학습 페이지에 접속하면 여기에 표시됩니다</div>
                </div>
            )}
        </div>
    );
}
