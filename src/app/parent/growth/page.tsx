"use client";

import { motion } from "framer-motion";
import { useParentDashboard } from "../hooks/useParentDashboard";

const T = {
    radius: { sm: 12, md: 18, lg: 22 },
    shadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(226,232,240,0.6)",
};

const TIER_INFO: Record<string, { color: string; bg: string; border: string; icon: string; next: string }> = {
    Iron: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", icon: "shield", next: "Bronze" },
    Bronze: { color: "#92400e", bg: "#fef3c7", border: "#fde68a", icon: "emoji_events", next: "Silver" },
    Silver: { color: "#475569", bg: "#f1f5f9", border: "#cbd5e1", icon: "military_tech", next: "Gold" },
    Gold: { color: "#b45309", bg: "#fffbeb", border: "#fcd34d", icon: "workspace_premium", next: "Platinum" },
    Platinum: { color: "#0e7490", bg: "#ecfeff", border: "#67e8f9", icon: "diamond", next: "Diamond" },
    Diamond: { color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd", icon: "auto_awesome", next: "Master" },
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface DashData {
    student: { name: string; totalXp: number; level: number; tier: string; streak: number; bestStreak: number; accuracy: number; totalCodeRuns: number; totalProblems: number } | null;
    xp: { total: number; today: number; weekly: { date: string; xp: number }[] };
    activity: { todayMinutes: number; totalMinutes: number; recent: { course_title: string; unit_title: string; duration_seconds: number; created_at: string }[] };
}

export default function ParentGrowthPage() {
    const { data, loading } = useParentDashboard();

    const s = data?.student;
    const xp = data?.xp;
    const act = data?.activity;
    const tier = TIER_INFO[s?.tier || "Iron"] || TIER_INFO.Iron;
    const nextLevelXp = (s?.level || 1) * 150;
    const currentLevelBase = ((s?.level || 1) - 1) * 150;
    const progressPct = Math.min(Math.max(((xp?.total || 0) - currentLevelBase) / (nextLevelXp - currentLevelBase) * 100, 0), 100);
    const weekTotal = xp?.weekly?.reduce((s, w) => s + w.xp, 0) || 0;

    if (loading) {
        return (
            <div style={{ padding: "20px 16px", maxWidth: 480, margin: "0 auto" }}>
                {[0, 1, 2, 3].map(i => (
                    <motion.div key={i} animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                        style={{ height: 80, borderRadius: T.radius.lg, background: "#e2e8f0", marginBottom: 12 }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div style={{ padding: "20px 16px 8px", maxWidth: 480, margin: "0 auto" }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 4, fontVariationSettings: "'FILL' 1", color: "#2563eb" }}>trending_up</span>
                    성장 기록
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                    {s?.name || "학생"}의 성장 여정
                </div>
            </motion.div>

            {/* ───── Level + XP Hero ───── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: "#1a1a1a",
                    borderRadius: T.radius.lg,
                    padding: "24px 20px 20px",
                    marginBottom: 14,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: "rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{s?.level || 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Level</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
                            {xp?.total || 0} <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.6 }}>XP</span>
                        </div>
                    </div>
                    <div style={{
                        padding: "5px 12px", borderRadius: 999,
                        background: "rgba(255,255,255,0.1)",
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{s?.tier || "Iron"}</span>
                    </div>
                </div>

                {/* Progress to next level */}
                <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Lv.{s?.level || 1}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Lv.{(s?.level || 1) + 1}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                        style={{ height: "100%", borderRadius: 999, background: "rgba(255,255,255,0.6)" }}
                    />
                </div>
                <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                    다음 레벨까지 {Math.max(nextLevelXp - (xp?.total || 0), 0)} XP
                </div>
            </motion.div>

            {/* ───── Stats Row ───── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                    { value: s?.streak || 0, unit: "일", label: "연속 학습" },
                    { value: s?.totalCodeRuns || 0, unit: "회", label: "코드 실행" },
                    { value: act?.totalMinutes || 0, unit: "분", label: "총 학습" },
                    { value: data?.studyNotes?.count30d || 0, unit: "개", label: "학습 노트 (30일)" },
                ].map((stat, i) => (
                    <motion.div key={stat.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                        style={{
                            background: "#fff", border: "1px solid #e5e5e5",
                            borderRadius: 14, padding: "14px 10px", textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>
                            {stat.value}<span style={{ fontSize: 11, fontWeight: 500, color: "#a3a3a3" }}>{stat.unit}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#a3a3a3", fontWeight: 500, marginTop: 4 }}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* ───── Weekly XP Chart ───── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{
                    background: "#fff", borderRadius: T.radius.lg, padding: "18px 16px 14px",
                    boxShadow: T.shadow, marginBottom: 14,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>주간 XP</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>
                        이번 주 {weekTotal} XP
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, padding: "0 2px" }}>
                    {(xp?.weekly || []).map((d, i) => {
                        const max = Math.max(...(xp?.weekly || []).map(w => w.xp), 1);
                        const h = Math.max((d.xp / max) * 100, 6);
                        const isToday = d.date === new Date().toISOString().slice(0, 10);
                        const dayIdx = new Date(d.date + "T12:00:00").getDay();
                        return (
                            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                {d.xp > 0 && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 + i * 0.05 }}
                                        style={{ fontSize: 9, fontWeight: 700, color: isToday ? "#1a1a1a" : "#a3a3a3" }}
                                    >
                                        {d.xp}
                                    </motion.span>
                                )}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: h }}
                                    transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                                    style={{
                                        width: "100%", maxWidth: 32, borderRadius: 8,
                                        background: isToday
                                            ? "#1a1a1a"
                                            : d.xp > 0 ? "#d4d4d4" : "#f5f5f5",
                                    }}
                                />
                                <span style={{
                                    fontSize: 10, fontWeight: isToday ? 800 : 500,
                                    color: isToday ? "#1a1a1a" : "#a3a3a3",
                                }}>
                                    {DAYS[dayIdx]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ───── Recent Activity ───── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{
                    background: "#fff", borderRadius: T.radius.lg, padding: "18px 20px",
                    boxShadow: T.shadow, marginBottom: 14,
                }}
            >
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>
                    최근 학습 활동
                </div>
                {(!act?.recent || act.recent.length === 0) ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#a3a3a3" }}>menu_book</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#a3a3a3", fontWeight: 500 }}>
                            학습을 시작하면 여기에 기록돼요
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {act.recent.map((a, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.04 }}
                                style={{
                                    display: "flex", gap: 12, padding: "12px 0",
                                    borderBottom: i < act.recent.length - 1 ? "1px solid #f8fafc" : "none",
                                }}
                            >
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: "#f5f5f5",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                    fontSize: 16,
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#a3a3a3" }}>description</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 700, color: "#0f172a",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {a.unit_title || a.course_title}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                        {a.course_title}
                                        {a.duration_seconds > 0 && ` · ${Math.round(a.duration_seconds / 60)}분`}
                                    </div>
                                </div>
                                <div style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 600, flexShrink: 0, paddingTop: 2 }}>
                                    {a.created_at?.slice(5, 10)}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
