"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { getLevelTitle } from "@/lib/xp-engine";
import StudentBottomNav from "./components/StudentBottomNav";
import { PageTransition } from "@/components/motion/page-transition";

/* ── Mobile Top Header ── */
function MobileHeader() {
    const { user, signOut } = useAuth();
    const { progress } = useUserProgress();
    const levelInfo = getLevelTitle(progress.level);
    const [hasNotif, setHasNotif] = useState(false);

    /* Check for unread notifications (homework + chat combined) */
    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        async function check() {
            try {
                const { createClient } = await import("@/lib/supabase");
                const sb = createClient();

                const { count } = await sb
                    .from("messages")
                    .select("id", { count: "exact", head: true })
                    .eq("recipient_id", user!.id)
                    .eq("read", false);

                if (!cancelled) setHasNotif((count ?? 0) > 0);
            } catch {
                /* silent */
            }
        }

        check();
        return () => { cancelled = true; };
    }, [user]);

    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                background: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                paddingTop: "env(safe-area-inset-top)",
            }}
            aria-label="앱 헤더"
        >
            <div
                style={{
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 16px",
                    maxWidth: 480,
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                {/* Logo */}
                <Link href="/dashboard/learning" style={{ textDecoration: "none" }} aria-label="홈으로">
                    <motion.div
                        whileTap={{ scale: 0.96 }}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 18, color: "#fff", fontVariationSettings: "'FILL' 1" }}
                            >
                                school
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: 17,
                                fontWeight: 800,
                                color: "#0f172a",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            코딩<span style={{ color: "#2563eb" }}>쏙</span>
                        </span>
                    </motion.div>
                </Link>

                {/* Right: Name + Level badge + Notification */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Level badge */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: `${levelInfo.color}12`,
                            border: `1px solid ${levelInfo.color}20`,
                            borderRadius: 999,
                            padding: "3px 9px",
                        }}
                    >
                        <span style={{ fontSize: 12 }}>{levelInfo.icon}</span>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: levelInfo.color,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Lv.{progress.level}
                        </span>
                    </div>

                    {/* Student name */}
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 5 }}>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#1e293b",
                                maxWidth: 72,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {user?.name || "학생"}
                        </span>
                    </div>

                    {/* Notification bell */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {}}
                        aria-label="알림"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            position: "relative",
                            flexShrink: 0,
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{
                                fontSize: 20,
                                color: "#64748b",
                                fontVariationSettings: "'FILL' 0",
                            }}
                        >
                            notifications
                        </span>
                        {hasNotif && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    position: "absolute",
                                    top: 6,
                                    right: 6,
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#ef4444",
                                    border: "2px solid #fff",
                                }}
                            />
                        )}
                    </motion.button>
                </div>
            </div>
        </header>
    );
}

/* ── Main Mobile Layout ── */
export default function MobileAppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    /* Pages that get full-screen treatment (no header/bottom nav) */
    const isFullscreenPage =
        pathname.startsWith("/dashboard/learning/courses/") ||
        pathname.startsWith("/dashboard/learning/live") ||
        pathname.startsWith("/dashboard/learning/dm");

    if (isFullscreenPage) {
        return (
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    overflowX: "hidden",
                    overflowY: "auto",
                    background: "#ffffff",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
            >
                {children}
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100dvh",
                display: "flex",
                flexDirection: "column",
                background: "#eff6ff",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                overflowX: "hidden",
                WebkitFontSmoothing: "antialiased",
            }}
        >
            <MobileHeader />

            {/* Scrollable content with bottom nav clearance */}
            <main
                style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingBottom: "calc(64px + env(safe-area-inset-bottom) + 16px)",
                    WebkitOverflowScrolling: "touch",
                }}
                aria-label="메인 콘텐츠"
            >
                <PageTransition>{children}</PageTransition>
            </main>

            <StudentBottomNav />
        </div>
    );
}
