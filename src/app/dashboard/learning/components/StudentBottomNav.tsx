"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface NavTab {
    icon: string;
    label: string;
    href: string;
    badgeKey?: "chat";
}

const TABS: NavTab[] = [
    { icon: "home", label: "홈", href: "/dashboard/learning" },
    { icon: "menu_book", label: "학습", href: "/dashboard/learning/courses" },
    { icon: "code", label: "연습장", href: "/dashboard/learning/practice" },
    { icon: "chat", label: "채팅", href: "/dashboard/learning/dm", badgeKey: "chat" },
    { icon: "person", label: "내 정보", href: "/dashboard/learning/badges" },
];

export default function StudentBottomNav() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [chatCount, setChatCount] = useState(0);

    const isActive = (href: string) =>
        href === "/dashboard/learning"
            ? pathname === href
            : pathname.startsWith(href);

    /* Real-time unread chat count */
    useEffect(() => {
        if (!user) return;

        async function fetchUnread() {
            try {
                const sb = createClient();
                const { count } = await sb
                    .from("messages")
                    .select("id", { count: "exact", head: true })
                    .eq("recipient_id", user!.id)
                    .eq("read", false);

                setChatCount(count ?? 0);
            } catch {
                /* silent */
            }
        }

        fetchUnread();

        /* Supabase real-time subscription */
        const sb = createClient();
        const channel = sb
            .channel("unread-messages")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                    filter: `recipient_id=eq.${user.id}`,
                },
                () => fetchUnread()
            )
            .subscribe();

        return () => {
            sb.removeChannel(channel);
        };
    }, [user]);

    const getBadgeCount = (key?: "chat") => {
        if (key === "chat") return chatCount;
        return 0;
    };

    return (
        <nav
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                paddingBottom: "env(safe-area-inset-bottom)",
                height: "calc(64px + env(safe-area-inset-bottom))",
                display: "flex",
                alignItems: "flex-start",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
            }}
            aria-label="하단 내비게이션"
        >
            {TABS.map((tab) => {
                const active = isActive(tab.href);
                const badge = getBadgeCount(tab.badgeKey);

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 3,
                            height: 64,
                            textDecoration: "none",
                            position: "relative",
                            WebkitTapHighlightColor: "transparent",
                        }}
                        aria-label={tab.label}
                        aria-current={active ? "page" : undefined}
                    >
                        {/* Active indicator bar */}
                        <AnimatePresence>
                            {active && (
                                <motion.div
                                    layoutId="bottom-nav-indicator"
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    exit={{ opacity: 0, scaleX: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: 32,
                                        height: 3,
                                        borderRadius: "0 0 4px 4px",
                                        background: "linear-gradient(to right, #2563eb, #3b82f6)",
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Active pill background */}
                        {active && (
                            <motion.div
                                layoutId="bottom-nav-pill"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{
                                    position: "absolute",
                                    top: 8,
                                    width: 44,
                                    height: 28,
                                    borderRadius: 8,
                                    background: "#eff6ff",
                                    pointerEvents: "none",
                                }}
                            />
                        )}

                        {/* Icon wrapper */}
                        <div style={{ position: "relative", zIndex: 1 }}>
                            <motion.span
                                className="material-symbols-outlined"
                                animate={
                                    active
                                        ? { fontVariationSettings: "'FILL' 1" }
                                        : { fontVariationSettings: "'FILL' 0" }
                                }
                                style={{
                                    fontSize: 22,
                                    color: active ? "#2563eb" : "#94a3b8",
                                    fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                                    display: "block",
                                    transition: "color 0.2s",
                                }}
                            >
                                {tab.icon}
                            </motion.span>

                            {/* Badge */}
                            <AnimatePresence>
                                {badge > 0 && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                        style={{
                                            position: "absolute",
                                            top: -4,
                                            right: -6,
                                            minWidth: 16,
                                            height: 16,
                                            borderRadius: 8,
                                            background: "#ef4444",
                                            color: "#fff",
                                            fontSize: 9,
                                            fontWeight: 800,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            padding: "0 4px",
                                            border: "2px solid #fff",
                                            lineHeight: 1,
                                        }}
                                        aria-label={`${badge}개 안 읽음`}
                                    >
                                        {badge > 9 ? "9+" : badge}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Label */}
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: active ? 700 : 500,
                                color: active ? "#2563eb" : "#94a3b8",
                                transition: "color 0.2s",
                                lineHeight: 1,
                                zIndex: 1,
                            }}
                        >
                            {tab.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
