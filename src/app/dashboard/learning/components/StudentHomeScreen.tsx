"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { getLevelTitle, xpForNextLevel } from "@/lib/xp-engine";
import { createClient } from "@/lib/supabase";

interface CourseProgressItem {
    id: string;
    title: string;
    progress: number; // 0-100
    color: string;
}

interface ActivityItem {
    id: string;
    action: string;
    created_at: string;
}

interface CourseProgressRow {
    course_id: string;
    course_title: string | null;
    progress_percent: number | null;
}

const COURSE_COLORS: Record<string, string> = {
    "c-language": "#2563eb",
    "python-basics": "#7c3aed",
    "coding-basics": "#0891b2",
    "html-css": "#ea580c",
    default: "#3b82f6",
};

function timeAgo(ts: string): string {
    const d = Date.now() - new Date(ts).getTime();
    if (d < 60000) return "방금 전";
    if (d < 3600000) return `${Math.floor(d / 60000)}분 전`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}시간 전`;
    return `${Math.floor(d / 86400000)}일 전`;
}

/* ── Animated Progress Bar ── */
function ProgressBar({
    value,
    color,
    height = 8,
}: {
    value: number;
    color: string;
    height?: number;
}) {
    return (
        <div
            style={{
                height,
                background: "#eff6ff",
                borderRadius: 6,
                overflow: "hidden",
                flex: 1,
            }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                style={{
                    height: "100%",
                    borderRadius: 6,
                    background: `linear-gradient(to right, ${color}, ${color}cc)`,
                }}
            />
        </div>
    );
}

/* ── Section Header ── */
function SectionHeader({
    icon,
    title,
    href,
    delay,
}: {
    icon: string;
    title: string;
    href?: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay }}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: "#2563eb", fontVariationSettings: "'FILL' 1" }}
                >
                    {icon}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{title}</span>
            </div>
            {href && (
                <Link
                    href={href}
                    style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}
                >
                    전체 보기
                </Link>
            )}
        </motion.div>
    );
}

/* ── Quick Menu Card ── */
function QuickCard({
    icon,
    label,
    sub,
    href,
    iconBg,
    iconColor,
    delay,
}: {
    icon: string;
    label: string;
    sub: string;
    href: string;
    iconBg: string;
    iconColor: string;
    delay: number;
}) {
    return (
        <Link href={href} style={{ textDecoration: "none", flex: 1, minWidth: 0 }}>
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileTap={{ scale: 0.95 }}
                style={{
                    background: "#ffffff",
                    borderRadius: 18,
                    padding: "16px 12px",
                    boxShadow: "0 2px 16px rgba(37,99,235,0.07), 0 0 0 1px rgba(37,99,235,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 10,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize: 22,
                            color: iconColor,
                            fontVariationSettings: "'FILL' 1",
                        }}
                    >
                        {icon}
                    </span>
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>
                        {label}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 2 }}>
                        {sub}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

/* ── Course Row ── */
function CourseRow({ item, delay }: { item: CourseProgressItem; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay }}
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: item.color,
                            flexShrink: 0,
                        }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{item.title}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.progress}%</span>
            </div>
            <ProgressBar value={item.progress} color={item.color} />
        </motion.div>
    );
}

/* ── Main Component ── */
export default function StudentHomeScreen() {
    const { user } = useAuth();
    const { progress } = useUserProgress();
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [courseProgress, setCourseProgress] = useState<CourseProgressItem[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const levelInfo = getLevelTitle(progress.level);
    const { progress: xpProgress, needed: xpNeeded } = xpForNextLevel(progress.xp);
    const xpRemaining = xpNeeded - progress.xp;

    const greetingHour = new Date().getHours();
    const greeting =
        greetingHour < 12 ? "좋은 아침" : greetingHour < 18 ? "안녕" : "좋은 저녁";

    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        async function load() {
            try {
                const sb = createClient();

                /* Course progress */
                const { data: cp } = await sb
                    .from("user_course_progress")
                    .select("course_id, progress_percent, course_title")
                    .eq("user_id", user!.id)
                    .order("updated_at", { ascending: false })
                    .limit(4);

                if (cp && !cancelled) {
                    const progressRows = cp as CourseProgressRow[];
                    setCourseProgress(
                        progressRows.map((c) => ({
                            id: c.course_id,
                            title: c.course_title ?? c.course_id,
                            progress: c.progress_percent ?? 0,
                            color: COURSE_COLORS[c.course_id] ?? COURSE_COLORS.default,
                        }))
                    );
                }

                /* Activity log */
                const { data: acts } = await sb
                    .from("activity_log")
                    .select("id, action, created_at")
                    .eq("user_id", user!.id)
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (!cancelled) setActivities(acts ?? []);
            } catch {
                /* silent fallback */
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [user]);

    /* Track today's study minutes from localStorage */
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        const key = `codingssok_study_${today}`;
        const stored = parseInt(localStorage.getItem(key) ?? "0", 10);
        setTodayMinutes(stored);

        const interval = setInterval(() => {
            if (!document.hidden) {
                const next = parseInt(localStorage.getItem(key) ?? "0", 10) + 1;
                localStorage.setItem(key, String(next));
                setTodayMinutes(next);
            }
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                padding: "20px 16px 0",
                display: "flex",
                flexDirection: "column",
                gap: 24,
                maxWidth: 480,
                margin: "0 auto",
                width: "100%",
            }}
        >
            {/* ── Profile Card ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 60%, #60a5fa 100%)",
                    borderRadius: 24,
                    padding: "22px 20px 20px",
                    boxShadow: "0 8px 32px rgba(37,99,235,0.25), 0 2px 8px rgba(37,99,235,0.15)",
                    position: "relative",
                    overflow: "hidden",
                }}
                aria-label="프로필 카드"
            >
                {/* Background decoration */}
                <div
                    style={{
                        position: "absolute",
                        top: -20,
                        right: -20,
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.08)",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -30,
                        right: 20,
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        pointerEvents: "none",
                    }}
                />

                {/* Top row: greeting + level badge */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: "rgba(255,255,255,0.75)",
                                marginBottom: 4,
                            }}
                        >
                            {greeting}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                                style={{
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: "#ffffff",
                                    letterSpacing: "-0.03em",
                                    lineHeight: 1.2,
                                }}
                            >
                                {user?.name || "학생"}님
                            </div>
                            <Link
                                href="/dashboard/learning/leaderboard"
                                aria-label="실시간 랭킹 보기"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "5px 10px",
                                    borderRadius: 999,
                                    background: "rgba(255,255,255,0.22)",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid rgba(255,255,255,0.35)",
                                    color: "#fff",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    transition: "background 0.2s",
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>leaderboard</span>
                                실시간 랭킹
                            </Link>
                        </div>
                    </div>

                    {/* Level badge */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: "rgba(255,255,255,0.18)",
                            borderRadius: 999,
                            padding: "6px 12px",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.25)",
                        }}
                    >
                        <span style={{ fontSize: 15 }}>{levelInfo.icon}</span>
                        <span
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#ffffff",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Lv.{progress.level} {levelInfo.title}
                        </span>
                    </div>
                </div>

                {/* XP progress bar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                            경험치 {progress.xp.toLocaleString()} XP
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                            {xpRemaining > 0 ? `다음 레벨까지 ${xpRemaining.toLocaleString()} XP` : "레벨업 가능!"}
                        </span>
                    </div>
                    <div
                        style={{
                            height: 8,
                            background: "rgba(255,255,255,0.2)",
                            borderRadius: 6,
                            overflow: "hidden",
                        }}
                        role="progressbar"
                        aria-valuenow={xpProgress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="레벨 경험치 진행도"
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress}%` }}
                            transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                            style={{
                                height: "100%",
                                borderRadius: 6,
                                background: "linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
                            }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* ── Today Summary Banner ── */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                aria-label="오늘 현황"
                style={{
                    background: "#ffffff",
                    borderRadius: 20,
                    padding: "16px 18px",
                    boxShadow: "0 2px 16px rgba(37,99,235,0.07), 0 0 0 1px rgba(37,99,235,0.06)",
                    display: "flex",
                    gap: 0,
                }}
            >
                {/* Study time */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 0",
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: "#eff6ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 22, color: "#2563eb", fontVariationSettings: "'FILL' 1" }}
                        >
                            timer
                        </span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 800,
                                color: "#0f172a",
                                lineHeight: 1.1,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {todayMinutes}분
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>
                            오늘 학습
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div
                    style={{
                        width: 1,
                        background: "#f1f5f9",
                        margin: "4px 0",
                        alignSelf: "stretch",
                    }}
                />

                {/* Level */}
                <Link
                    href="/dashboard/learning/badges"
                    style={{
                        flex: 1,
                        textDecoration: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 0",
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: `${levelInfo.color}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: 22,
                                color: levelInfo.color,
                                fontVariationSettings: "'FILL' 1",
                            }}
                        >
                            military_tech
                        </span>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 800,
                                color: "#0f172a",
                                lineHeight: 1.1,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Lv.{progress.level}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>
                            {levelInfo.title}
                        </div>
                    </div>
                </Link>
            </motion.section>

            {/* ── Quick Menu Grid ── */}
            <section aria-label="빠른 메뉴">
                <SectionHeader icon="grid_view" title="빠른 메뉴" delay={0.18} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <QuickCard
                        icon="menu_book"
                        label="내 코스"
                        sub="학습 진도 확인"
                        href="/dashboard/learning/courses"
                        iconBg="#eff6ff"
                        iconColor="#2563eb"
                        delay={0.2}
                    />
                    <QuickCard
                        icon="code"
                        label="연습장"
                        sub="코드 직접 실행"
                        href="/dashboard/learning/playground"
                        iconBg="#f0fdf4"
                        iconColor="#16a34a"
                        delay={0.24}
                    />
                    <QuickCard
                        icon="emoji_events"
                        label="정보올림피아드 대회"
                        sub="알고리즘 학습 카드"
                        href="/dashboard/learning/courses/12"
                        iconBg="#fefce8"
                        iconColor="#ca8a04"
                        delay={0.28}
                    />
                    <QuickCard
                        icon="chat"
                        label="선생님 채팅"
                        sub="1:1 질문하기"
                        href="/dashboard/learning/dm"
                        iconBg="#fdf4ff"
                        iconColor="#9333ea"
                        delay={0.32}
                    />
                </div>
            </section>

            {/* ── Course Progress ── */}
            <section aria-label="학습 진도">
                <SectionHeader
                    icon="bar_chart"
                    title="학습 진도"
                    href="/dashboard/learning/courses"
                    delay={0.35}
                />
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.38 }}
                    style={{
                        background: "#ffffff",
                        borderRadius: 20,
                        padding: "18px 16px",
                        boxShadow: "0 2px 16px rgba(37,99,235,0.07), 0 0 0 1px rgba(37,99,235,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                    }}
                >
                    {courseProgress.length === 0
                        ? [
                              {
                                  id: "c-language",
                                  title: "C언어",
                                  progress: 0,
                                  color: COURSE_COLORS["c-language"],
                              },
                              {
                                  id: "python-basics",
                                  title: "Python",
                                  progress: 0,
                                  color: COURSE_COLORS["python-basics"],
                              },
                          ].map((c, i) => <CourseRow key={c.id} item={c} delay={0.4 + i * 0.06} />)
                        : courseProgress.map((c, i) => (
                              <CourseRow key={c.id} item={c} delay={0.4 + i * 0.06} />
                          ))}
                </motion.div>
            </section>

            {/* ── Recent Activity ── */}
            <section aria-label="최근 활동" style={{ paddingBottom: 8 }}>
                <SectionHeader icon="history" title="최근 활동" delay={0.5} />
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.52 }}
                    style={{
                        background: "#ffffff",
                        borderRadius: 20,
                        padding: "4px 0",
                        boxShadow: "0 2px 16px rgba(37,99,235,0.07), 0 0 0 1px rgba(37,99,235,0.05)",
                        overflow: "hidden",
                    }}
                >
                    {activities.length === 0 ? (
                        <div
                            style={{
                                padding: "24px 16px",
                                textAlign: "center",
                                color: "#94a3b8",
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            아직 활동 기록이 없어요
                        </div>
                    ) : (
                        activities.map((act, i) => (
                            <motion.div
                                key={act.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.54 + i * 0.04 }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "12px 16px",
                                    borderBottom:
                                        i < activities.length - 1 ? "1px solid #f1f5f9" : "none",
                                }}
                            >
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        background: "#eff6ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontSize: 16,
                                            color: "#3b82f6",
                                            fontVariationSettings: "'FILL' 1",
                                        }}
                                    >
                                        bolt
                                    </span>
                                </div>
                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        color: "#334155",
                                        fontWeight: 500,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {act.action}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: "#94a3b8",
                                        fontWeight: 500,
                                        flexShrink: 0,
                                    }}
                                >
                                    {timeAgo(act.created_at)}
                                </span>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </section>
        </div>
    );
}
