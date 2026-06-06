"use client";

import { useEffect, useState, useMemo, ReactNode, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { getLevelTitle, xpForNextLevel, getTierFrame, getTierInfo } from "@/lib/xp-engine";
import { useUserProgress } from "@/hooks/useUserProgress";
import { GamificationBar } from "./components/GamificationBar";
import StreakWidget from "@/components/ui/StreakWidget";
import DailyMissions from "@/components/ui/DailyMissions";
import Leaderboard from "@/components/ui/Leaderboard";
import FriendChallenges from "@/components/ui/FriendChallenges";
import BadgeNotification from "@/components/ui/BadgeNotification";
import PromotionNotification from "@/components/ui/PromotionNotification";
import { XPToast } from "@/components/ui/XPToast";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import { useGamificationSync } from "@/lib/gamification-sync";
import { recordMissionClaim } from "@/lib/reward-engine";
import { PageTransition } from "@/components/motion/page-transition";
import { GlowPulse } from "@/components/motion/motion";
import { Spotlight, MorphingGradient } from "@/components/motion/premium";
import ProfileEffect from "@/components/ui/ProfileEffect";
import { useProfileEffect } from "@/hooks/useProfileEffect";
import { useRouter } from "next/navigation";
import { COURSES } from "@/data/courses";
import StudentSwRegister from "./StudentSwRegister";
import MobileAppLayout from "./MobileAppLayout";

/* ── Quick Search Component ── */
function QuickSearch({ scrolled }: { scrolled: boolean }) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const items: { label: string; sub: string; href: string }[] = [];
        // Search courses
        for (const c of COURSES) {
            if (c.title.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q)) {
                items.push({ label: c.title, sub: c.subtitle || "", href: `/dashboard/learning/courses/${c.id}` });
            }
        }
        // Search nav pages
        const pages = [
            { label: "문제 은행", sub: "코딩 문제 풀기", href: "/dashboard/learning/problems" },
            { label: "연습장", sub: "자유 코딩 연습", href: "/dashboard/learning/practice" },
            { label: "승급전", sub: "티어 승급 시험", href: "/dashboard/learning/promotion" },
            { label: "제출 기록", sub: "코드 제출 이력", href: "/dashboard/learning/submissions" },
            { label: "배지", sub: "획득한 배지", href: "/dashboard/learning/badges" },
            { label: "상점", sub: "XP로 아이템 구매", href: "/dashboard/learning/store" },
            { label: "코드골프", sub: "짧은 코드 챌린지", href: "/dashboard/learning/codegolf" },
            { label: "C-Studio", sub: "코드 에디터", href: "/dashboard/compiler" },
        ];
        for (const p of pages) {
            if (p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) {
                items.push(p);
            }
        }
        return items.slice(0, 6);
    }, [query]);

    // Ctrl+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <div className="hidden md:flex" style={{ position: "relative" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 18, zIndex: 1 }}>search</span>
            <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                style={{
                    paddingLeft: 42, paddingRight: 60, paddingTop: 9, paddingBottom: 9,
                    background: scrolled ? "rgba(241,245,249,0.7)" : "rgba(241,245,249,0.4)",
                    border: "1px solid rgba(226,232,240,0.6)", borderRadius: 999,
                    fontSize: 13, width: 260, outline: "none", color: "#475569",
                    transition: "all 0.3s",
                }}
                placeholder="코스, 문제 검색..."
            />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#94a3b8", fontWeight: 600, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>Ctrl+K</span>
            <AnimatePresence>
                {open && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{
                            position: "absolute", top: "100%", left: 0, right: 0, marginTop: 8,
                            background: "#fff", borderRadius: 16, overflow: "hidden",
                            boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
                            zIndex: 100,
                        }}>
                        {results.map((r, i) => (
                            <button key={i}
                                onMouseDown={() => { router.push(r.href); setQuery(""); setOpen(false); }}
                                style={{
                                    display: "flex", flexDirection: "column", gap: 2, width: "100%",
                                    padding: "12px 18px", border: "none", background: "transparent",
                                    cursor: "pointer", textAlign: "left", borderBottom: "1px solid #f8fafc",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{r.label}</span>
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.sub}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Nav Items (한글화 + 새 메뉴) ── */
const NAV_ITEMS = [
    { icon: "dashboard", label: "대시보드", href: "/dashboard/learning" },
    { icon: "chat", label: "1:1 채팅", href: "/dashboard/learning/dm", badge: "chat" },
    { icon: "quiz", label: "문제 은행", href: "/dashboard/learning/problems" },
    { icon: "edit_note", label: "연습장", href: "/dashboard/learning/practice" },
    { icon: "military_tech", label: "승급전", href: "/dashboard/learning/promotion" },
    { icon: "leaderboard", label: "랭킹", href: "/dashboard/learning/leaderboard" },
    { icon: "history", label: "제출 기록", href: "/dashboard/learning/submissions" },
    { icon: "cast", label: "라이브 수업", href: "/dashboard/learning/live" },
];

/* ── Auth Guard ── */
function AuthGate({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    useEffect(() => {
        if (loading) return;
        if (!user) {
            window.location.href = "/login";
        }
    }, [loading, user]);
    if (loading) return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", position: "relative", overflow: "hidden" }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, position: "relative", zIndex: 10 }}
            >
                <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 80, height: 80, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
                >
                    <img src="/images/promo/logo-codingssok.png" alt="코딩쏙" width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ fontSize: 15, color: "#475569", fontWeight: 600, letterSpacing: "-0.01em" }}
                >코딩쏙 로딩 중...</motion.p>
            </motion.div>
        </div>
    );
    if (!user) return null;
    return <>{children}</>;
}

/* ── useLiveSession hook — checks for active live session ── */
function useLiveSession() {
    const [hasLive, setHasLive] = useState(false);
    const polledRef = useRef(false);

    useEffect(() => {
        if (polledRef.current) return;
        polledRef.current = true;
        (async () => {
            try {
                const { createClient } = await import("@/lib/supabase");
                const sb = createClient();
                const { data } = await sb
                    .from("live_sessions")
                    .select("id")
                    .eq("is_active", true)
                    .limit(1)
                    .maybeSingle();
                setHasLive(!!data);
            } catch { /* ignore */ }
        })();

        // poll every 30s
        const interval = setInterval(async () => {
            try {
                const { createClient } = await import("@/lib/supabase");
                const sb = createClient();
                const { data } = await sb
                    .from("live_sessions")
                    .select("id")
                    .eq("is_active", true)
                    .limit(1)
                    .maybeSingle();
                setHasLive(!!data);
            } catch { /* ignore */ }
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    return hasLive;
}

/* ── Left Sidebar ── */
function LeftSidebar({ progress, addXP, hasLive }: { progress: import("@/hooks/useUserProgress").UserProgress; addXP: (n: number) => void; hasLive: boolean }) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const isActive = (href: string) => href === "/dashboard/learning" ? pathname === href : pathname.startsWith(href);
    const allItems = NAV_ITEMS;
    const isAdmin = false;

    // 읽지 않은 알림 (채팅)
    const unreadBadges: Record<string, number> = {
        chat: 0,
    };

    return (
        <aside style={{ display: "none" }} className="lg:!block lg:col-span-2">
            <div style={{ position: "sticky", top: 128, maxHeight: "calc(100vh - 10rem)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }} className="hide-scrollbar">
                <Spotlight size={200} color="rgba(14,165,233,0.04)" style={{ borderRadius: 20 }}>
                    <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {allItems.map((item, i) => {
                            const badgeKey = (item as { badge?: string }).badge;
                            const unread = badgeKey ? (unreadBadges[badgeKey] ?? 0) : 0;
                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03, duration: 0.3 }}
                                    whileHover={!isActive(item.href) ? { x: 4, backgroundColor: "rgba(240,249,255,0.5)" } : {}}
                                    style={{ borderRadius: 14 }}
                                >
                                    <Link href={item.href}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12, padding: "11px 18px",
                                            borderRadius: 14, fontSize: 13, fontWeight: isActive(item.href) ? 700 : 500,
                                            textDecoration: "none", transition: "all 0.2s", position: "relative",
                                            ...(isActive(item.href) ? {
                                                background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(59,130,246,0.07))",
                                                color: "#0369a1",
                                                border: "1px solid rgba(14,165,233,0.15)",
                                                boxShadow: "0 2px 8px rgba(14,165,233,0.08), inset 0 1px 0 rgba(255,255,255,0.5)"
                                            } : {
                                                background: "transparent", color: "#64748b",
                                                border: "1px solid transparent",
                                            })
                                        }}
                                    >
                                        {isActive(item.href) && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                style={{
                                                    position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                                                    width: 3, height: 20, borderRadius: 4,
                                                    background: "linear-gradient(to bottom, #0ea5e9, #3b82f6)",
                                                    boxShadow: "0 0 8px rgba(14,165,233,0.4)",
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <motion.span
                                            className="material-symbols-outlined"
                                            style={{ fontSize: 20, color: isActive(item.href) ? "#0ea5e9" : undefined }}
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >{item.icon}</motion.span>
                                        <span style={{ flex: 1 }}>{item.label}</span>
                                        {/* Live dot */}
                                        {item.href === "/dashboard/learning/live" && hasLive && !isActive(item.href) && (
                                            <motion.div
                                                animate={{ opacity: [1, 0.3, 1] }}
                                                transition={{ duration: 1.2, repeat: Infinity }}
                                                style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px rgba(239,68,68,0.7)" }}
                                            />
                                        )}
                                        {/* Unread badge */}
                                        {unread > 0 && !isActive(item.href) && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                style={{
                                                    minWidth: 18, height: 18, borderRadius: 9,
                                                    background: "#ef4444", color: "#fff",
                                                    fontSize: 10, fontWeight: 800,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    padding: "0 5px", boxShadow: "0 0 6px rgba(239,68,68,0.5)",
                                                }}
                                            >{unread}</motion.div>
                                        )}
                                        {isActive(item.href) && (
                                            <motion.div
                                                layoutId="sidebar-dot"
                                                style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9" }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>
                </Spotlight>

                {isAdmin ? (
                    <div style={{ marginTop: 24, padding: "0 8px" }}>
                        <div style={{
                            border: "1px solid rgba(191,219,254,0.9)",
                            background: "linear-gradient(135deg, rgba(239,246,255,0.95), rgba(255,255,255,0.9))",
                            borderRadius: 16,
                            padding: 16,
                            color: "#1e3a8a",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 900 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>admin_panel_settings</span>
                                관리자 전용
                            </div>
                            <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: 1.6, color: "#475569", fontWeight: 600 }}>
                                구자현 계정은 학생 학습 플랫폼이 아니라 트랙 배정과 관리자 페이지로만 이동합니다.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 게이미피케이션 */}
                        <div style={{ marginTop: 24, padding: "0 8px", display: "flex", flexDirection: "column", gap: 12 }}>
                            <GamificationBar progress={progress} compact />
                            <DailyMissions onClaimXP={(amt, missionId) => {
                                addXP(amt);
                                if (user?.id) recordMissionClaim(user.id, missionId, amt);
                            }} />
                            <StreakWidget />
                            <Leaderboard />
                            <FriendChallenges />
                        </div>

                        {/* 오늘의 챌린지 카드 */}
                        <div style={{ marginTop: 32, padding: "0 8px" }}>
                            <div style={{
                                position: "relative", borderRadius: 24, padding: 20, overflow: "hidden",
                                boxShadow: "0 25px 50px -12px rgba(99,102,241,0.2)",
                            }}>
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom right, #0f172a, #172554, #0f172a)" }} />
                                <div style={{ position: "absolute", right: -16, top: -16, width: 128, height: 128, background: "rgba(14,165,233,0.2)", borderRadius: "50%", filter: "blur(48px)" }} />
                                <div style={{ position: "relative", zIndex: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                        <div style={{ padding: 6, background: "rgba(234,179,8,0.2)", borderRadius: 8, border: "1px solid rgba(234,179,8,0.3)" }}>
                                            <span className="material-symbols-outlined" style={{ color: "#facc15", fontSize: 18, display: "block" }}>bolt</span>
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 999, color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>오늘의 챌린지</span>
                                    </div>
                                    <h4 style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>C언어 도전하기</h4>
                                    <p style={{ fontSize: 12, color: "rgba(203,213,225,0.8)", marginBottom: 16, fontWeight: 300, lineHeight: 1.6 }}>매일 새로운 C언어 문제에 도전해보세요!</p>
                                    <GlowPulse color="rgba(99,102,241,0.5)">
                                        <Link href="/dashboard/learning/courses" style={{
                                            display: "flex", width: "100%", padding: "10px 0", justifyContent: "center", alignItems: "center", gap: 8,
                                            background: "linear-gradient(to right, #0ea5e9, #3b82f6)", color: "#fff", borderRadius: 12, fontSize: 12, fontWeight: 700,
                                            textDecoration: "none", boxShadow: "0 10px 15px -3px rgba(14,165,233,0.25)"
                                        }}>
                                            도전 시작
                                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>arrow_forward</span>
                                        </Link>
                                    </GlowPulse>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* 하단 프로필 + 로그아웃 */}
                <div style={{ marginTop: 24, padding: "0 8px 8px" }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 14px", borderRadius: 14,
                        background: "rgba(248,250,252,0.8)",
                        border: "1px solid rgba(226,232,240,0.6)",
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0,
                        }}>
                            {(user?.name?.charAt(0) || "?").toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user?.name || "학생"}
                            </div>
                            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>
                                {user?.role === "teacher" || ["구담당자", "장민"].includes(user?.name || "") ? "관리자" : "학생"}
                            </div>
                        </div>
                        {/* 관리자 페이지 버튼 — 구담당자/장민만 */}
                        {(user?.role === "teacher" || ["구담당자", "장민"].includes(user?.name || "")) && (
                            <Link
                                href="/teacher/admin"
                                title="관리자 페이지"
                                style={{
                                    width: 30, height: 30, borderRadius: 10, border: "none",
                                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, textDecoration: "none",
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#fff" }}>admin_panel_settings</span>
                            </Link>
                        )}
                        <motion.button
                            onClick={signOut}
                            title="로그아웃"
                            aria-label="로그아웃"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                width: 30, height: 30, borderRadius: 10, border: "none",
                                background: "rgba(254,242,242,0.8)", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#ef4444" }}>logout</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

/* ── Top Navbar (scroll-aware) ── */
function XpChip({ xp, level }: { xp: number; level: number }) {
    const info = getLevelTitle(level);
    const { progress } = xpForNextLevel(xp);
    return (
        <div className="hidden md:flex" style={{
            alignItems: "center", gap: 8, padding: "6px 14px",
            borderRadius: 12, background: `${info.color}10`,
            border: `1px solid ${info.color}25`,
        }}>
            <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: info.color, fontVariationSettings: "'FILL' 1" }}
            >
                {info.icon}
            </span>
            <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: info.color, lineHeight: 1 }}>
                    Lv.{level} {info.title}
                </div>
                <div style={{ width: 60, height: 3, background: "#e2e8f0", borderRadius: 2, marginTop: 3 }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: info.color, borderRadius: 2, transition: "width 0.5s" }} />
                </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b" }}>{xp.toLocaleString()}</span>
        </div>
    );
}

/* ── Homework Dot Badge ── */
function HomeworkDot({ count }: { count: number }) {
    const [hovered, setHovered] = useState(false);
    const router = useRouter();

    if (count === 0) return null;

    return (
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push("/dashboard/learning")}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                role="button"
                tabIndex={0}
                aria-label={`미완료 숙제 ${count}개`}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push("/dashboard/learning"); }}
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ef4444",
                    cursor: "pointer",
                    boxShadow: "0 0 0 2px #fff, 0 0 8px rgba(239,68,68,0.6)",
                    flexShrink: 0,
                }}
            />
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute",
                            top: "calc(100% + 10px)",
                            right: 0,
                            minWidth: 140,
                            background: "#fff",
                            borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
                            padding: "10px 14px",
                            zIndex: 100,
                            pointerEvents: "none",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 15, color: "#ef4444", fontVariationSettings: "'FILL' 1" }}
                            >
                                assignment_late
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", whiteSpace: "nowrap" }}>
                                숙제 {count}개 남음
                            </span>
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, marginTop: 3 }}>
                            클릭하면 숙제 페이지로 이동
                        </div>
                        {/* Arrow */}
                        <div style={{
                            position: "absolute",
                            top: -5,
                            right: 3,
                            width: 10,
                            height: 10,
                            background: "#fff",
                            transform: "rotate(45deg)",
                            boxShadow: "-2px -2px 4px rgba(0,0,0,0.04)",
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Navbar({ onMenuOpen, xp, level, tier }: { onMenuOpen: () => void; xp: number; level: number; tier: string }) {
    const { user, signOut } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const activeEffect = useProfileEffect();
    const isAdmin = false;
    // 숙제 기능 제거됨

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
                position: "sticky", top: 0, zIndex: 50, width: "100%",
                background: scrolled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
                backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "blur(12px)",
                WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "blur(12px)",
                borderBottom: `1px solid ${scrolled ? "rgba(226,232,240,0.5)" : "rgba(255,255,255,0.3)"}`,
                boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" : "none",
                transition: "background 0.3s, border-bottom 0.3s, box-shadow 0.3s, backdrop-filter 0.3s",
            }}
        >
            <div style={{ maxWidth: 1800, margin: "0 auto", padding: "0 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", height: 76, alignItems: "center" }}>
                    {/* Logo → 홈페이지 */}
                    <Link href="/dashboard/learning/courses">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textDecoration: "none" }}
                    >
                        <motion.div
                            whileHover={{ rotate: 8, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            style={{
                                width: 42, height: 42, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                                background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", color: "#fff",
                                boxShadow: "0 8px 24px -4px rgba(14,165,233,0.35)"
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>school</span>
                        </motion.div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a" }}>
                                코딩<span style={{ color: "#0ea5e9" }}>쏙</span>
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em" }}>{isAdmin ? "트랙 배정 OS" : "학습 대시보드"}</span>
                        </div>
                    </motion.div>
                    </Link>

                    {/* Right */}
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        {/* Search with quick-nav */}
                        {!isAdmin && <QuickSearch scrolled={scrolled} />}

                        {/* XP Chip */}
                        {!isAdmin && <XpChip xp={xp} level={level} />}

                        {/* C-Studio Button */}
                        {!isAdmin && <motion.a
                            href="/dashboard/compiler"
                            whileHover={{ scale: 1.05, boxShadow: "0 4px 16px rgba(99,102,241,0.25)" }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: "6px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                                background: "linear-gradient(135deg, #1e1e2e, #0a0a0a)",
                                color: "#a5b4fc", fontSize: 11, fontWeight: 700, textDecoration: "none",
                                display: "flex", alignItems: "center", gap: 6,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(165,180,252,0.1)",
                                letterSpacing: 0.5, whiteSpace: "nowrap" as const,
                            }}
                        >
                            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>&gt;_</span>
                            C-Studio
                        </motion.a>}

                        {/* 랭킹 버튼 */}
                        {!isAdmin && <a href="/dashboard/learning/leaderboard" style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '8px 14px', borderRadius: 10,
                            background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)',
                            color: '#eab308', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>leaderboard</span>
                            랭킹
                        </a>}

                        {/* Admin Button */}
                        {isAdmin ? (
                            <>
                            <a href="/teacher/admin" style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                                color: '#fff', fontSize: 12, fontWeight: 800,
                                textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>route</span>
                                트랙 배정
                            </a>
                            <a href="/teacher/admin" style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                                color: '#fff', fontSize: 12, fontWeight: 700,
                                textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>admin_panel_settings</span>
                                관리자
                            </a>
                            </>
                        ) : user?.role === 'teacher' && (
                            <a href="/teacher/admin" style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                                color: '#fff', fontSize: 12, fontWeight: 700,
                                textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>admin_panel_settings</span>
                                관리자
                            </a>
                        )}

                        {/* User */}
                        <div className="hidden sm:flex" style={{ alignItems: "center", gap: 16, paddingLeft: 20, borderLeft: "1px solid rgba(226,232,240,0.5)" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{user?.name || "학생"}</span>
                                    {/* 숙제 기능 제거됨 */}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <motion.span
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px rgba(34,197,94,0.4)" }}
                                    />
                                    <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>접속 중</span>
                                </div>
                            </div>
                            <ProfileEffect effect={activeEffect} size={42}>
                                <motion.button
                                    onClick={signOut} title="로그아웃" aria-label="로그아웃"
                                    whileHover={{ scale: 1.08, boxShadow: "0 8px 24px rgba(14,165,233,0.2)" }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    style={{
                                        width: 42, height: 42, borderRadius: "50%", padding: 2,
                                        background: getTierInfo(tier).gradient,
                                        boxShadow: getTierFrame(tier).shadow, cursor: "pointer", border: "none",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}
                                >
                                    <div style={{
                                        width: "100%", height: "100%", borderRadius: "50%",
                                        background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center",
                                        color: getTierInfo(tier).color, fontWeight: 700, fontSize: 14,
                                        border: getTierFrame(tier).border,
                                    }}>
                                        {(user?.name?.charAt(0) || "?").toUpperCase()}
                                    </div>
                                </motion.button>
                            </ProfileEffect>
                        </div>

                        {/* Mobile menu */}
                        <motion.button
                            onClick={onMenuOpen} className="lg:hidden"
                            aria-label="메뉴 열기"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                padding: 8, color: "#64748b", background: "transparent", border: "none",
                                borderRadius: 12, cursor: "pointer"
                            }}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}

/* ── Mobile Drawer (AnimatePresence) ── */
function MobileDrawer({ isOpen, onClose, hasLive }: { isOpen: boolean; onClose: () => void; hasLive: boolean }) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const isActive = (href: string) => href === "/dashboard/learning" ? pathname === href : pathname.startsWith(href);
    const allItems = NAV_ITEMS;
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 60 }}
                        className="lg:hidden"
                    />
                    <motion.aside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                            position: "fixed", top: 0, left: 0, zIndex: 70, width: 288, height: "100vh",
                            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)", padding: 24,
                            borderRight: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                            display: "flex", flexDirection: "column"
                        }}
                        className="lg:hidden"
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>school</span>
                                </div>
                                <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>코딩<span style={{ color: "#0ea5e9" }}>쏙</span></span>
                            </div>
                            <motion.button
                                onClick={onClose}
                                aria-label="메뉴 닫기"
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                style={{ width: 32, height: 32, borderRadius: 10, border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#64748b" }}>close</span>
                            </motion.button>
                        </div>
                        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {allItems.map((item, i) => (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Link href={item.href} onClick={onClose} style={{
                                        display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderRadius: 12,
                                        fontSize: 14, fontWeight: 600, textDecoration: "none",
                                        ...(isActive(item.href) ? { background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.06))", color: "#0369a1", border: "1px solid rgba(14,165,233,0.12)" } : { color: "#64748b", border: "1px solid transparent" })
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                                        {item.label}
                                        {item.href === "/dashboard/learning/live" && hasLive && !isActive(item.href) && (
                                            <motion.div
                                                animate={{ opacity: [1, 0.3, 1] }}
                                                transition={{ duration: 1.2, repeat: Infinity }}
                                                style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px rgba(239,68,68,0.7)" }}
                                            />
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                        </nav>
                        <div style={{ flex: 1 }} />
                        <motion.button
                            onClick={signOut}
                            whileHover={{ scale: 1.02, background: "rgba(254,242,242,0.8)" }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                display: "flex", alignItems: "center", gap: 10, width: "100%",
                                padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(226,232,240,0.8)",
                                background: "rgba(241,245,249,0.6)", color: "#64748b",
                                fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 16,
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ef4444" }}>logout</span>
                            로그아웃
                        </motion.button>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

/* ── Auto Attendance Check ── */
// xp-client.checkAttendance 호출 + streak checkIn 통합
// localStorage로 하루 1회 보장 (서버 중복 방지 보조)
function useAttendanceCheck(userId: string | undefined) {
    const markedRef = useRef(false);
    useEffect(() => {
        if (!userId || markedRef.current) return;

        const today = new Date().toISOString().split("T")[0];
        const lsKey = `codingssok_attendance_${userId}`;
        if (typeof window !== "undefined" && localStorage.getItem(lsKey) === today) return;

        markedRef.current = true;
        (async () => {
            try {
                const { checkAttendance } = await import("@/lib/xp-client");
                const result = await checkAttendance(userId);
                if (!result?.alreadyChecked) {
                    // streak checkIn (localStorage 기반)
                    const { default: lsCheckIn } = await import("@/lib/streak-checkin");
                    lsCheckIn();
                    if (typeof window !== "undefined") {
                        localStorage.setItem(lsKey, today);
                    }
                } else {
                    // 이미 체크됐어도 localStorage 동기화
                    if (typeof window !== "undefined") {
                        localStorage.setItem(lsKey, today);
                    }
                }
            } catch { /* 출석 체크 실패 조용히 처리 */ }
        })();
    }, [userId]);
}

/* ── PWA / Mobile detection hook ── */
function useMobilePwa(): boolean {
    const [isMobilePwa, setIsMobilePwa] = useState(false);

    useEffect(() => {
        function detect() {
            const standalone =
                window.matchMedia("(display-mode: standalone)").matches ||
                (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
            const mobile = window.innerWidth < 768;
            setIsMobilePwa(standalone || mobile);
        }

        detect();

        const mq = window.matchMedia("(display-mode: standalone)");
        mq.addEventListener("change", detect);
        window.addEventListener("resize", detect, { passive: true });

        return () => {
            mq.removeEventListener("change", detect);
            window.removeEventListener("resize", detect);
        };
    }, []);

    return isMobilePwa;
}

/* ── Layout ── */
function LearningHeadTags() {
    useEffect(() => {
        const tags = [
            { id: "student-manifest", tag: "link", attrs: { rel: "manifest", href: "/manifest-student.json" } },
            { id: "student-mobile-web-app", tag: "meta", attrs: { name: "mobile-web-app-capable", content: "yes" } },
            { id: "student-apple-mobile-web-app", tag: "meta", attrs: { name: "apple-mobile-web-app-capable", content: "yes" } },
            { id: "student-apple-status-bar", tag: "meta", attrs: { name: "apple-mobile-web-app-status-bar-style", content: "default" } },
            { id: "student-apple-title", tag: "meta", attrs: { name: "apple-mobile-web-app-title", content: "코딩쏙 학습" } },
            { id: "student-apple-touch-icon", tag: "link", attrs: { rel: "apple-touch-icon", href: "/images/promo/logo-codingssok.png" } },
        ] as const;

        for (const item of tags) {
            let el = document.head.querySelector<HTMLElement>(`[data-learning-head="${item.id}"]`);
            if (!el) {
                el = document.createElement(item.tag);
                el.dataset.learningHead = item.id;
                document.head.appendChild(el);
            }
            for (const [key, value] of Object.entries(item.attrs)) {
                el.setAttribute(key, value);
            }
        }
    }, []);

    return null;
}

function LearningLayoutInner({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [xpToasts, setXpToasts] = useState<{ id: number; amount: number }[]>([]);
    const pathname = usePathname();
    const { progress, addXP } = useUserProgress();
    const { user } = useAuth();
    const hasLive = useLiveSession();
    const isMobilePwa = useMobilePwa();
    useStudyTimer();
    useGamificationSync(user?.id ?? null);
    useAttendanceCheck(user?.id);

    useEffect(() => {
        const handler = (e: Event) => {
            const amount = (e as CustomEvent<{ amount: number }>).detail?.amount;
            if (!amount || amount <= 0) return;
            const id = Date.now() + Math.random();
            setXpToasts(prev => {
                const next = [...prev, { id, amount }];
                return next.slice(-3); // 최대 3개만 표시
            });
        };
        window.addEventListener('xp-earned', handler);
        return () => window.removeEventListener('xp-earned', handler);
    }, []);

    // 3D 대시보드 + 코스 상세 페이지에서는 레이아웃 크롬 없이 전체화면
    const isMainDashboard = pathname === "/dashboard/learning";
    const isCourseDetail = pathname.startsWith("/dashboard/learning/courses/");
    const isLivePage = pathname.startsWith("/dashboard/learning/live");
    const isFullscreen = isMainDashboard || isCourseDetail || isLivePage;

    return (
        <AuthProvider>
            <AuthGate>
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" />
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />

                <BadgeNotification />
                <PromotionNotification />

                {/* XP 획득 토스트 */}
                <AnimatePresence>
                    {xpToasts.map((toast, idx) => (
                        <XPToast
                            key={toast.id}
                            amount={toast.amount}
                            stackIndex={idx}
                            onDone={() => setXpToasts(prev => prev.filter(t => t.id !== toast.id))}
                        />
                    ))}
                </AnimatePresence>

                {/* Mobile PWA shell — overrides desktop layout on small screens */}
                {isMobilePwa ? (
                    <MobileAppLayout>{children}</MobileAppLayout>
                ) : isFullscreen ? (
                    /* 전체화면 모드 — 레이아웃 크롬 없음 */
                    <div style={{ position: "fixed", inset: 0, overflowX: "hidden", overflowY: "auto" }}>
                        {children}
                    </div>
                ) : (
                    /* 서브페이지 — 기존 레이아웃 */
                    <>
                        <style>{`
                            @keyframes spin { to { transform: rotate(360deg); } }
                            .lg\\:!block { display: block !important; }
                            @media (max-width: 1023px) { .lg\\:!block { display: none !important; } }
                        `}</style>

                        <div style={{
                            minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative",
                            overflowX: "hidden", fontSize: 16,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            background: "#ffffff",
                            backgroundAttachment: "fixed",
                            WebkitFontSmoothing: "antialiased",
                        }}>


                            <Navbar onMenuOpen={() => setSidebarOpen(true)} xp={progress.xp} level={progress.level} tier={progress.tier} />
                            <MobileDrawer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} hasLive={hasLive} />

                            {/* Main Grid */}
                            <main style={{
                                flex: 1, maxWidth: 1800, width: "100%", margin: "0 auto",
                                padding: "40px 24px",
                                display: "grid", gridTemplateColumns: "1fr",
                                gap: 32, position: "relative", zIndex: 10,
                            }} className="lg:!grid-cols-12">
                                <style>{`
                                    @media (min-width: 1024px) {
                                        .lg\\:!grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
                                        .lg\\:col-span-2 { grid-column: span 2 / span 2; }
                                        .lg\\:col-span-10 { grid-column: span 10 / span 10; }
                                    }
                                `}</style>
                                <LeftSidebar progress={progress} addXP={addXP} hasLive={hasLive} />
                                <div className="lg:col-span-10">
                                    <PageTransition>
                                        {children}
                                    </PageTransition>
                                </div>
                            </main>
                        </div>
                    </>
                )}
            </AuthGate>
        </AuthProvider>
    );
}

export default function LearningLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <LearningHeadTags />
            {false && <head>
                <link rel="manifest" href="/manifest-student.json" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="코딩쏙 학습" />
                <link rel="apple-touch-icon" href="/images/promo/logo-codingssok.png" />
            </head>}
            <StudentSwRegister />
            <LearningLayoutInner>{children}</LearningLayoutInner>
        </>
    );
}
