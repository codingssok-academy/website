"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAdmin } from "../context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";

// Bottom nav: 4 key tabs only
const BOTTOM_NAV_ITEMS = [
    { id: "students", path: "/teacher/admin", icon: "group", label: "학생" },
    { id: "feedback", path: "/teacher/admin/feedback", icon: "rate_review", label: "피드백" },
    { id: "chat", path: "/teacher/admin/chat", icon: "chat", label: "채팅" },
    { id: "settings", path: "/teacher/admin/settings", icon: "manage_accounts", label: "설정" },
] as const;

// Sidebar: all items except 수업자료 and 오늘 할일
const SIDEBAR_NAV_ITEMS = [
    { id: "students", path: "/teacher/admin", icon: "group", label: "학생 관리" },
    { id: "feedback", path: "/teacher/admin/feedback", icon: "rate_review", label: "학부모 피드백" },
    { id: "monitor", path: "/teacher/admin/monitor", icon: "monitor_heart", label: "실시간 현황" },
    { id: "chat", path: "/teacher/admin/chat", icon: "chat", label: "채팅" },
    { id: "announcements", path: "/teacher/admin/announcements", icon: "campaign", label: "공지 작성" },
    { id: "settings", path: "/teacher/admin/settings", icon: "manage_accounts", label: "계정 설정" },
] as const;

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { currentTeacher } = useAdmin();
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    const teacherDisplayName = currentTeacher?.display_name || currentTeacher?.name || currentTeacher?.email || "선생님";
    const teacherRoleLabel = currentTeacher?.role === "admin" ? "관리자" : "선생님";
    const teacherInitial = teacherDisplayName.charAt(0);

    useEffect(() => {
        const loadBadges = async () => {
            try {
                const sb = createClient();
                const { data: { user } } = await sb.auth.getUser();
                if (user) {
                    const { data: chatData } = await sb
                        .from("chat_messages")
                        .select("id", { count: "exact" })
                        .eq("receiver_id", user.id)
                        .eq("is_read", false);
                    setUnreadChatCount(chatData?.length ?? 0);
                }
            } catch {
                // 뱃지 로드 실패는 무시
            }
        };
        loadBadges();
        const interval = setInterval(loadBadges, 30_000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            const sb = createClient();
            await sb.auth.signOut();
        } finally {
            window.location.href = "/teacher/login";
        }
    };

    const getActiveId = () => {
        if (pathname === "/teacher/admin") return "students";
        const segment = pathname.replace("/teacher/admin/", "").split("/")[0];
        return SIDEBAR_NAV_ITEMS.find(n => n.id === segment)?.id || "students";
    };

    const activeId = getActiveId();

    const getBadge = (id: string) => {
        if (id === "chat" && unreadChatCount > 0) return unreadChatCount;
        return 0;
    };

    return (
        <>
            {/* ── MOBILE TOP HEADER (< md) ── */}
            <header className="admin-mobile-header" style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 51,
                background: "#0f172a",
                borderBottom: "1px solid #1e293b",
                height: "calc(52px + env(safe-area-inset-top, 0px))",
                paddingTop: "env(safe-area-inset-top, 0px)",
                display: "flex", alignItems: "center",
                padding: "env(safe-area-inset-top, 0px) 16px 0",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", height: 52 }}>
                    <img
                        src="/images/promo/logo-codingssok.png"
                        alt="코딩쏙"
                        style={{ width: 30, height: 30, borderRadius: 8, objectFit: "contain", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>코딩쏙 Admin</div>
                        <div style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>
                            {teacherDisplayName} · {teacherRoleLabel}
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {unreadChatCount > 0 && (
                            <span style={{
                                minWidth: 18, height: 18, borderRadius: 9,
                                background: "#ef4444", color: "#fff",
                                fontSize: 10, fontWeight: 800,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                padding: "0 5px",
                            }}>
                                {unreadChatCount > 99 ? "99+" : unreadChatCount}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* ── DESKTOP SIDEBAR (md+) ── */}
            <aside style={{
                width: 240, minHeight: "100vh", background: "#0f172a",
                borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column",
                position: "fixed", left: 0, top: 0, zIndex: 50,
            }} className="admin-sidebar-desktop">
                {/* Header */}
                <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1e293b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                            src="/images/promo/logo-codingssok.png"
                            alt="코딩쏙"
                            style={{ width: 38, height: 38, borderRadius: 11, objectFit: "contain", flexShrink: 0 }}
                        />
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>코딩쏙</div>
                            <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin Console</div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px 8px" }}>
                        메뉴
                    </div>
                    {SIDEBAR_NAV_ITEMS.map(item => {
                        const isActive = activeId === item.id;
                        const badge = getBadge(item.id);
                        return (
                            <button
                                key={item.id}
                                onClick={() => router.push(item.path)}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                                    padding: "10px 12px", borderRadius: 10, border: "none",
                                    background: isActive ? "rgba(37,99,235,0.15)" : "transparent",
                                    color: isActive ? "#60a5fa" : "#64748b",
                                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                                    cursor: "pointer", transition: "all 0.15s",
                                    marginBottom: 2, position: "relative", textAlign: "left",
                                }}
                            >
                                {isActive && (
                                    <div style={{
                                        position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                                        width: 3, height: 20, borderRadius: 2,
                                        background: "linear-gradient(180deg, #2563eb, #6366f1)",
                                    }} />
                                )}
                                <span className="material-symbols-outlined" style={{
                                    fontSize: 20,
                                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                                    color: isActive ? "#60a5fa" : "#475569",
                                }}>
                                    {item.icon}
                                </span>
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {badge > 0 && (
                                    <span style={{
                                        minWidth: 18, height: 18, borderRadius: 9,
                                        background: item.id === "chat" ? "#ef4444" : "#f59e0b",
                                        color: "#fff", fontSize: 10, fontWeight: 800,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        padding: "0 4px", flexShrink: 0,
                                    }}>
                                        {badge > 99 ? "99+" : badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{ borderTop: "1px solid #1e293b" }}>
                    <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                            background: "linear-gradient(135deg, #1d4ed8, #4f46e5)",
                            color: "#fff", fontSize: 13, fontWeight: 800,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {teacherInitial}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {teacherDisplayName}
                            </div>
                            <div style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>{teacherRoleLabel}</div>
                        </div>
                        <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 999,
                            background: currentTeacher?.role === "admin" ? "rgba(251,191,36,0.15)" : "rgba(37,99,235,0.15)",
                            color: currentTeacher?.role === "admin" ? "#fbbf24" : "#60a5fa",
                            flexShrink: 0,
                        }}>
                            {teacherRoleLabel}
                        </span>
                    </div>
                    <div style={{ padding: "4px 8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
                        <button
                            onClick={() => router.push("/")}
                            style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 12px", borderRadius: 8, border: "none",
                                background: "transparent", color: "#334155", fontSize: 12,
                                cursor: "pointer", transition: "color 0.15s", textAlign: "left",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#334155")}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>home</span>
                            홈으로
                        </button>
                        <button
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 12px", borderRadius: 8, border: "none",
                                background: "transparent", color: "#ef4444", fontSize: 12,
                                cursor: logoutLoading ? "not-allowed" : "pointer",
                                opacity: logoutLoading ? 0.6 : 1, textAlign: "left",
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>logout</span>
                            {logoutLoading ? "로그아웃 중..." : "로그아웃"}
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── MOBILE BOTTOM NAV (< md) ── */}
            <nav className="admin-bottom-nav" style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
                background: "#ffffff", borderTop: "1px solid #e2e8f0",
                display: "flex", alignItems: "stretch",
                height: 64,
                paddingBottom: "env(safe-area-inset-bottom)",
            }}>
                {BOTTOM_NAV_ITEMS.map(item => {
                    const isActive = activeId === item.id;
                    const badge = getBadge(item.id);
                    return (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            style={{
                                flex: 1, display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                gap: 3, border: "none", background: "transparent",
                                cursor: "pointer", padding: "8px 4px", position: "relative",
                                color: isActive ? "#2563eb" : "#94a3b8",
                            }}
                        >
                            <div style={{ position: "relative" }}>
                                <span className="material-symbols-outlined" style={{
                                    fontSize: 24,
                                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                                    color: isActive ? "#2563eb" : "#94a3b8",
                                    display: "block",
                                }}>
                                    {item.icon}
                                </span>
                                {badge > 0 && (
                                    <span style={{
                                        position: "absolute", top: -4, right: -6,
                                        minWidth: 16, height: 16, borderRadius: 8,
                                        background: "#ef4444", color: "#fff",
                                        fontSize: 9, fontWeight: 800,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        padding: "0 3px",
                                    }}>
                                        {badge > 99 ? "99+" : badge}
                                    </span>
                                )}
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: isActive ? 700 : 500,
                                color: isActive ? "#2563eb" : "#94a3b8",
                                lineHeight: 1,
                            }}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div style={{
                                    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                                    width: 32, height: 2, borderRadius: 1,
                                    background: "#2563eb",
                                }} />
                            )}
                        </button>
                    );
                })}
            </nav>

            <style>{`
                @media (min-width: 768px) {
                    .admin-sidebar-desktop { display: flex !important; }
                    .admin-bottom-nav { display: none !important; }
                    .admin-mobile-header { display: none !important; }
                }
                @media (max-width: 767px) {
                    .admin-sidebar-desktop { display: none !important; }
                    .admin-bottom-nav { display: flex !important; }
                    .admin-mobile-header { display: flex !important; }
                }
            `}</style>
        </>
    );
}
