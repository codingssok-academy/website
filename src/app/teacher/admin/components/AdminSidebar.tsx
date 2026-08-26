"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    ClipboardList,
    FolderOpen,
    Home,
    LogOut,
    Megaphone,
    PanelLeftClose,
    PanelLeftOpen,
    UserCog,
    Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAdmin } from "../context";

const NAV_ITEMS = [
    { href: "/teacher/admin", label: "학부모 코드 관리", icon: UserCog },
    { href: "/teacher/admin/students", label: "학생 계정 관리", icon: Users },
    { href: "/teacher/admin/files", label: "학생 파일함", icon: FolderOpen },
    { href: "/teacher/admin/growth", label: "Growth 2.0 성장관리", icon: ClipboardList },
    { href: "/teacher/admin/announcements", label: "전체 메시지", icon: Megaphone },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { currentTeacher } = useAdmin();
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        document.body.classList.toggle("admin-sidebar-collapsed", collapsed);
        return () => document.body.classList.remove("admin-sidebar-collapsed");
    }, [collapsed]);

    const teacherDisplayName =
        currentTeacher?.display_name || currentTeacher?.name || currentTeacher?.email || "관리자";

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
        } finally {
            window.location.href = "/teacher/login";
        }
    };

    return (
        <>
            <header className="admin-mobile-header" style={mobileHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                    <Image src="/icon.png" alt="코딩쏙" width={32} height={32} style={mobileLogoStyle} />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#f8fafc" }}>코딩쏙 관리자</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>학생 운영 관리</div>
                    </div>
                </div>
            </header>

            <aside className="admin-sidebar-desktop" style={{ ...sidebarStyle, width: collapsed ? 76 : 240 }}>
                <div style={{ padding: collapsed ? "18px 12px" : "22px 18px 18px", borderBottom: "1px solid rgba(148,163,184,0.18)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <Image src="/icon.png" alt="코딩쏙" width={40} height={40} style={logoStyle} />
                            {!collapsed && (
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: "#f8fafc" }}>코딩쏙</div>
                                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 800, letterSpacing: "0.1em" }}>
                                        ADMIN
                                    </div>
                                </div>
                            )}
                        </div>
                        {!collapsed && (
                            <button
                                type="button"
                                onClick={() => setCollapsed(true)}
                                title="사이드바 접기"
                                style={collapseButtonStyle}
                            >
                                <PanelLeftClose size={18} />
                            </button>
                        )}
                    </div>
                    {collapsed && (
                        <button
                            type="button"
                            onClick={() => setCollapsed(false)}
                            title={"사이드바 열기"}
                            style={{ ...collapseButtonStyle, margin: "14px auto 0" }}
                        >
                            <PanelLeftOpen size={18} />
                        </button>
                    )}
                </div>

                <nav style={{ flex: 1, padding: collapsed ? 10 : 12 }}>
                    {!collapsed && <div style={sectionLabelStyle}>운영 메뉴</div>}
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <button
                                key={item.href}
                                type="button"
                                onClick={() => router.push(item.href)}
                                title={collapsed ? item.label : undefined}
                                style={{
                                    ...navButtonStyle,
                                    justifyContent: collapsed ? "center" : "flex-start",
                                    marginTop: item.href === NAV_ITEMS[0].href ? 0 : 6,
                                    background: active ? "rgba(37, 99, 235, 0.18)" : "transparent",
                                    color: active ? "#bfdbfe" : "#94a3b8",
                                    padding: collapsed ? 0 : "0 12px",
                                }}
                            >
                                <Icon size={21} strokeWidth={2.4} />
                                {!collapsed && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div style={{ borderTop: "1px solid rgba(148,163,184,0.18)", padding: collapsed ? 10 : 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, marginBottom: 10 }}>
                        <div style={avatarStyle}>{teacherDisplayName.slice(0, 1)}</div>
                        {!collapsed && (
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {teacherDisplayName}
                                </div>
                                <div style={{ fontSize: 10, color: "#64748b" }}>관리자 계정</div>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        title={collapsed ? "홈페이지" : undefined}
                        style={{ ...footerButtonStyle, justifyContent: collapsed ? "center" : "flex-start" }}
                    >
                        <Home size={17} strokeWidth={2.3} />
                        {!collapsed && "홈페이지"}
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutLoading}
                        title={collapsed ? "로그아웃" : undefined}
                        style={{ ...footerButtonStyle, justifyContent: collapsed ? "center" : "flex-start", color: "#f87171", opacity: logoutLoading ? 0.65 : 1 }}
                    >
                        <LogOut size={17} strokeWidth={2.3} />
                        {!collapsed && (logoutLoading ? "로그아웃 중..." : "로그아웃")}
                    </button>
                </div>
            </aside>

            <style>{`
                @media (min-width: 768px) {
                    .admin-sidebar-desktop { display: flex !important; }
                    .admin-mobile-header { display: none !important; }
                }
                @media (max-width: 767px) {
                    .admin-sidebar-desktop { display: none !important; }
                    .admin-mobile-header { display: flex !important; }
                }
            `}</style>
        </>
    );
}

const sidebarStyle = {
    minHeight: "100vh",
    background: "#07111f",
    borderRight: "1px solid rgba(148,163,184,0.18)",
    display: "flex",
    flexDirection: "column" as const,
    position: "fixed" as const,
    left: 0,
    top: 0,
    zIndex: 50,
    transition: "width 180ms ease",
};

const mobileHeaderStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 51,
    height: "calc(54px + env(safe-area-inset-top, 0px))",
    padding: "env(safe-area-inset-top, 0px) 16px 0",
    alignItems: "center",
    background: "#07111f",
    borderBottom: "1px solid rgba(148,163,184,0.18)",
};

const logoStyle = {
    width: 40,
    height: 40,
    borderRadius: 10,
    objectFit: "contain" as const,
    background: "#ffffff",
};

const mobileLogoStyle = {
    width: 32,
    height: 32,
    borderRadius: 8,
    objectFit: "contain" as const,
    background: "#ffffff",
};

const collapseButtonStyle = {
    width: 34,
    height: 34,
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 10,
    background: "rgba(15,23,42,0.72)",
    color: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
};

const sectionLabelStyle = {
    padding: "4px 10px 9px",
    fontSize: 10,
    fontWeight: 900,
    color: "#475569",
    letterSpacing: "0.12em",
};

const navButtonStyle = {
    width: "100%",
    minHeight: 44,
    border: "none",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "left" as const,
    transition: "background 160ms ease, color 160ms ease",
};

const avatarStyle = {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 900,
};

const footerButtonStyle = {
    width: "100%",
    minHeight: 34,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 8px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "left" as const,
};

