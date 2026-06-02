"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedCounter from "./components/ui/AnimatedCounter";
import Confetti from "./components/ui/Confetti";
import Shimmer from "./components/ui/Shimmer";
import PullToRefresh from "./components/ui/PullToRefresh";
import { hapticCelebration } from "./components/ui/haptic";
import { useParentDashboard } from "./hooks/useParentDashboard";

const STUDENT_KEY = "codingssok_parent_student";

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
    radius: { sm: 12, md: 18, lg: 22, xl: 28 },
    shadow: {
        soft: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(226,232,240,0.6)",
        glow: (c: string) => `0 4px 20px ${c}25, 0 0 0 1px ${c}20`,
    },
    font: "'Pretendard', 'Noto Sans KR', sans-serif",
} as const;

// ─── Time-based theming ─────────────────────────────────────────────────────
function getTimeTheme() {
    const h = new Date().getHours();
    if (h < 6) return { greeting: "늦은 밤이에요", bg: "#111111", textColor: "#e5e5e5", subColor: "#888", cardBg: "rgba(255,255,255,0.06)", cardBorder: "rgba(255,255,255,0.08)" };
    if (h < 12) return { greeting: "좋은 아침이에요", bg: "#fafaf9", textColor: "#1a1a1a", subColor: "#737373", cardBg: "rgba(0,0,0,0.03)", cardBorder: "rgba(0,0,0,0.06)" };
    if (h < 18) return { greeting: "안녕하세요", bg: "#fafafa", textColor: "#1a1a1a", subColor: "#737373", cardBg: "rgba(0,0,0,0.03)", cardBorder: "rgba(0,0,0,0.06)" };
    return { greeting: "수고하셨어요", bg: "#18181b", textColor: "#e5e5e5", subColor: "#a1a1aa", cardBg: "rgba(255,255,255,0.06)", cardBorder: "rgba(255,255,255,0.08)" };
}

// ─── Narrative generator ────────────────────────────────────────────────────
function generateNarrative(data: V2Data): string[] {
    const lines: string[] = [];
    const s = data.student;
    const xp = data.xp;
    const act = data.activity;
    const name = s?.name || "학생";

    if (xp?.today > 0) {
        lines.push(`${name}이(가) 오늘 ${xp.today} XP를 획득했어요.`);
    }
    if (act?.todayMinutes > 0) {
        lines.push(`오늘 ${act.todayMinutes}분 동안 학습했어요.`);
    }
    if (act?.recent?.[0]?.unit_title) {
        lines.push(`최근에 "${act.recent[0].unit_title}"을 공부했어요.`);
    }
    if (s?.streak && s.streak >= 3) {
        lines.push(`${s.streak}일 연속 학습 중이에요! 대단해요.`);
    }
    if (lines.length === 0) {
        lines.push(`${name}의 학습 현황을 확인해보세요.`);
    }
    return lines.slice(0, 3);
}

// ─── Level helpers ──────────────────────────────────────────────────────────
const TIER_EMOJI: Record<string, string> = {
    Iron: "shield", Bronze: "emoji_events", Silver: "military_tech",
    Gold: "workspace_premium", Platinum: "diamond", Diamond: "auto_awesome",
};

function getLevelProgress(xp: number, level: number) {
    const base = (level - 1) * 150;
    const next = level * 150;
    const progress = Math.min(((xp - base) / (next - base)) * 100, 100);
    return { progress: Math.max(progress, 0), remaining: Math.max(next - xp, 0), next };
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface V2Data {
    found: boolean;
    student: { name: string; totalXp: number; level: number; tier: string; streak: number; bestStreak: number; lastActive: string | null } | null;
    xp: { total: number; today: number; weekly: { date: string; xp: number }[] };
    activity: { todayMinutes: number; totalMinutes: number; recent: any[] };
    feedbacks: { id: string; date: string | null; status: string }[];
    announcements?: { id: string; title: string; content: string; isPinned: boolean; createdAt: string }[];
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ParentHomePage() {
    const { data, loading, name, refresh } = useParentDashboard();

    const theme = useMemo(getTimeTheme, []);

    const [showConfetti, setShowConfetti] = useState(false);
    useEffect(() => {
        if (data?.student?.streak && data.student.streak >= 3) {
            setShowConfetti(true);
            hapticCelebration();
            const t = setTimeout(() => setShowConfetti(false), 4000);
            return () => clearTimeout(t);
        }
    }, [data?.student?.streak]);

    const s = data?.student;
    const xp = data?.xp;
    const act = data?.activity;
    const fb = data?.feedbacks;
    const narrative = data ? generateNarrative(data) : [];
    const lvl = getLevelProgress(xp?.total || 0, s?.level || 1);
    const isDark = new Date().getHours() < 6 || new Date().getHours() >= 18;

    return (
        <PullToRefresh onRefresh={refresh}>
        <div style={{ padding: "0 0 8px", maxWidth: 480, margin: "0 auto" }}>
            <Confetti trigger={showConfetti} />
            {/* ───── Hero Section with time-based gradient ───── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    background: theme.bg,
                    padding: "28px 20px 24px",
                    borderRadius: `0 0 ${T.radius.xl}px ${T.radius.xl}px`,
                    marginBottom: 20,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Greeting */}
                <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: theme.subColor, marginBottom: 6 }}>
                        {theme.greeting}, 학부모님
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: theme.textColor, lineHeight: 1.3 }}>
                        {name ? `${name}의 학습 현황` : "학습 현황"}
                    </div>
                </motion.div>

                {/* Narrative story */}
                {!loading && narrative.length > 0 && (
                    <motion.div
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        style={{
                            marginTop: 16,
                            padding: "14px 16px",
                            borderRadius: T.radius.md,
                            background: theme.cardBg,
                            backdropFilter: "blur(12px)",
                            border: `1px solid ${theme.cardBorder}`,
                        }}
                    >
                        {narrative.map((line, i) => (
                            <div key={i} style={{
                                fontSize: 13, fontWeight: 600, color: theme.textColor,
                                lineHeight: 1.7, opacity: 1 - i * 0.15,
                            }}>
                                {line}
                            </div>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            <div style={{ padding: "0 16px" }}>
                {/* ───── Loading Shimmer ───── */}
                {loading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <Shimmer height={140} radius={T.radius.lg} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <Shimmer height={72} radius={T.radius.md} />
                            <Shimmer height={72} radius={T.radius.md} />
                        </div>
                        <Shimmer height={100} radius={T.radius.lg} />
                    </div>
                )}

                {!loading && data && (
                    <>
                        {/* ───── Level Card ───── */}
                        {s && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                style={{
                                    background: "#fff",
                                    borderRadius: T.radius.lg,
                                    padding: "20px",
                                    boxShadow: T.shadow.soft,
                                    marginBottom: 14,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                                    {/* Level badge */}
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 14,
                                        background: "#1a1a1a",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>
                                            {s.level}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ fontSize: 16, fontWeight: 900, color: "#1a1a1a" }}>
                                                Level {s.level}
                                            </span>
                                            <span style={{
                                                padding: "2px 8px", borderRadius: 999,
                                                fontSize: 10, fontWeight: 600,
                                                background: "#f5f5f5", color: "#737373",
                                            }}>
                                                {s.tier}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                                            다음 레벨까지 {lvl.remaining} XP
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <AnimatedCounter value={xp?.total || 0} style={{ fontSize: 20, fontWeight: 900, color: "#1a1a1a" }} />
                                        <div style={{ fontSize: 10, color: "#a3a3a3", fontWeight: 500 }}>Total XP</div>
                                    </div>
                                </div>
                                {/* XP Progress bar */}
                                <div style={{ height: 6, borderRadius: 999, background: "#f0f0f0", overflow: "hidden" }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${lvl.progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                        style={{
                                            height: "100%", borderRadius: 999,
                                            background: "#1a1a1a",
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* ───── Streak celebration ───── */}
                        {s && s.streak >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                                style={{
                                    padding: "14px 18px",
                                    borderRadius: T.radius.md,
                                    background: "#fafaf9",
                                    border: "1px solid #e5e5e5",
                                    marginBottom: 14,
                                    display: "flex", alignItems: "center", gap: 12,
                                }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: "#f5f5f4", display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>{s.streak}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>
                                        {s.streak}일 연속 학습 중
                                    </div>
                                    <div style={{ fontSize: 11, color: "#a3a3a3", marginTop: 1 }}>
                                        최고 기록 {s.bestStreak}일
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ───── 공지사항 ───── */}
                        {data.announcements && data.announcements.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.27 }}
                                style={{ marginBottom: 14 }}
                            >
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: "#737373",
                                    marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#a3a3a3" }}>campaign</span>
                                    학원 공지
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {data.announcements.slice(0, 2).map((a) => (
                                        <div
                                            key={a.id}
                                            style={{
                                                background: "#fff",
                                                border: "1px solid #e5e5e5",
                                                borderLeft: a.isPinned ? "3px solid #1a1a1a" : "1px solid #e5e5e5",
                                                borderRadius: 12,
                                                padding: "12px 14px",
                                            }}
                                        >
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
                                            }}>
                                                {a.isPinned && (
                                                    <span style={{
                                                        padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                                                        background: "#1a1a1a", color: "#fff",
                                                    }}>고정</span>
                                                )}
                                                <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", flex: 1 }}>
                                                    {a.title}
                                                </span>
                                                <span style={{ fontSize: 10, color: "#a3a3a3" }}>
                                                    {a.createdAt?.slice(5, 10)}
                                                </span>
                                            </div>
                                            {a.content && (
                                                <div style={{
                                                    fontSize: 12, color: "#737373", lineHeight: 1.6,
                                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                                }}>
                                                    {a.content}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ───── Today Summary Cards ───── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                            {[
                                { value: `+${xp?.today || 0}`, label: "오늘 XP" },
                                { value: `${act?.todayMinutes || 0}분`, label: "오늘 학습" },
                            ].map((c, i) => (
                                <motion.div
                                    key={c.label}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    style={{
                                        background: "#fff",
                                        border: "1px solid #e5e5e5",
                                        borderRadius: 14,
                                        padding: "16px",
                                    }}
                                >
                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>{c.value}</div>
                                    <div style={{ fontSize: 11, color: "#a3a3a3", fontWeight: 500, marginTop: 4 }}>{c.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* ───── Weekly XP Sparkline ───── */}
                        {xp?.weekly && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                style={{
                                    background: "#fff",
                                    borderRadius: T.radius.lg,
                                    padding: "16px 18px 14px",
                                    boxShadow: T.shadow.soft,
                                    marginBottom: 14,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>주간 활동</span>
                                    <Link href="/parent/growth" style={{ fontSize: 11, color: "#737373", fontWeight: 500, textDecoration: "none" }}>
                                        더보기 →
                                    </Link>
                                </div>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64 }}>
                                    {xp.weekly.map((d, i) => {
                                        const max = Math.max(...xp.weekly.map(w => w.xp), 1);
                                        const h = Math.max((d.xp / max) * 52, 4);
                                        const isToday = d.date === new Date().toISOString().slice(0, 10);
                                        const dayIdx = new Date(d.date + "T12:00:00").getDay();
                                        return (
                                            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: h }}
                                                    transition={{ duration: 0.6, delay: 0.4 + i * 0.04 }}
                                                    style={{
                                                        width: "100%", maxWidth: 28, borderRadius: 6,
                                                        background: isToday
                                                            ? "#1a1a1a"
                                                            : d.xp > 0 ? "#d4d4d4" : "#f5f5f5",
                                                    }}
                                                />
                                                <span style={{
                                                    fontSize: 10, fontWeight: isToday ? 800 : 500,
                                                    color: isToday ? "#1a1a1a" : "#a3a3a3",
                                                }}>
                                                    {["일", "월", "화", "수", "목", "금", "토"][dayIdx]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* ───── Quick links ───── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                            {[
                                { href: "/parent/feedback", label: "수업 피드백", count: fb?.length || 0 },
                                { href: "/parent/growth", label: "성장 기록", count: act?.recent?.length || 0 },
                            ].map((link, i) => (
                                <motion.div key={link.href} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                                    <Link href={link.href} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "14px 16px", borderRadius: 14,
                                        background: "#fff", border: "1px solid #e5e5e5",
                                        textDecoration: "none",
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{link.label}</div>
                                            <div style={{ fontSize: 11, color: "#a3a3a3" }}>{link.count}건</div>
                                        </div>
                                        <span style={{ fontSize: 13, color: "#a3a3a3" }}>→</span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* ───── Empty state ───── */}
                        {!s && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "48px 20px" }}>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#a3a3a3" }}>school</span>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
                                    아직 학습 기록이 없어요
                                </div>
                                <div style={{ fontSize: 13, color: "#a3a3a3", lineHeight: 1.6 }}>
                                    {name}이(가) 코딩쏙에서 학습을 시작하면<br />여기에 성장 기록이 나타나요.
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
        </PullToRefresh>
    );
}
