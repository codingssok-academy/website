"use client";

import { useState, useEffect, useCallback, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

const PARENT_PORTAL_HREF = "/parent/feedback";

const navLinks = [
    { name: "커리큘럼", href: "#curriculum" },
    { name: "수강료", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
    { name: "문의", href: "#contact" },
    { name: "학습 플랫폼", href: "/dashboard/learning" },
];

function PillButton({
    children,
    href,
    onClick,
}: {
    children: ReactNode;
    href: string;
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const w = 160;
    const h = 54;
    const idlePath = "M27,0 L133,0 C168.505,0 168.505,54 133,54 L27,54 C-8.505,54 -8.505,0 27,0";
    const hoverPath = "M23,0 L137,0 C172.505,0 172.505,54 137,54 L23,54 C-12.505,54 -12.505,0 23,0";

    return (
        <a
            href={href}
            onClick={onClick}
            className="btn-plain"
            style={{ width: w, height: h }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="btn-plain__inner">
                <span className="btn-plain__text">{children}</span>
                <motion.span
                    className="btn-plain__arrow"
                    animate={{ x: isHovered ? 4 : 0 }}
                    transition={{ duration: 0.3, ease: [0.645, 0.045, 0.355, 1] }}
                />
            </span>
            <svg
                className="btn-plain__background"
                width="10"
                height="10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                overflow="visible"
                preserveAspectRatio="none"
                style={{ width: w, height: h }}
            >
                <motion.path
                    d={idlePath}
                    className="btn-plain__path"
                    animate={{ d: isHovered ? hoverPath : idlePath }}
                    transition={{ duration: 0.4, ease: [0.645, 0.045, 0.355, 1] }}
                />
                <motion.path
                    d={idlePath}
                    className="btn-plain__path"
                    animate={{ d: isHovered ? hoverPath : idlePath }}
                    transition={{ duration: 0.4, ease: [0.645, 0.045, 0.355, 1], delay: 0.03 }}
                />
            </svg>
        </a>
    );
}

function ParentPortalButton({
    className,
    onClick,
    compact = false,
}: {
    className?: string;
    onClick?: () => void;
    compact?: boolean;
}) {
    return (
        <Link
            href={PARENT_PORTAL_HREF}
            aria-label="학부모 포털"
            className={className}
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: compact ? 38 : 40,
                padding: compact ? "8px 12px" : "8px 18px",
                borderRadius: compact ? 9 : 10,
                border: "1px solid #dbeafe",
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(8px)",
                color: "#1e40af",
                fontSize: compact ? 12 : 13,
                fontWeight: 800,
                letterSpacing: 0,
                textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
            }}
        >
            학부모 포털
        </Link>
    );
}

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);
    const [authLoading, setAuthLoading] = useState(() => isSupabaseConfigured());
    const router = useRouter();

    useEffect(() => {
        const handler = (e: Event) => { e.preventDefault(); };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setAuthLoading(false);
            return;
        }

        let mounted = true;
        const sb = createClient();
        sb.auth.getUser()
            .then(({ data }: { data: { user: { id: string } | null } }) => {
                if (!mounted) return;
                if (!data.user) {
                    setAuthLoading(false);
                    return;
                }
                sb.from("profiles")
                    .select("name, role")
                    .eq("id", data.user.id)
                    .maybeSingle()
                    .then(({ data: profile }: { data: { name: string | null; role: string | null } | null }) => {
                        if (!mounted) return;
                        setUser(profile ? {
                            name: profile.name ?? undefined,
                            role: profile.role ?? undefined,
                        } : null);
                    })
                    .finally(() => {
                        if (mounted) setAuthLoading(false);
                    });
            })
            .catch(() => {
                if (mounted) setAuthLoading(false);
            });

        return () => { mounted = false; };
    }, []);

    const handleSignOut = useCallback(async () => {
        if (isSupabaseConfigured()) {
            const sb = createClient();
            await sb.auth.signOut({ scope: "local" });
        }
        setUser(null);
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith("sb-") || key.includes("supabase") || key === "codingssok_user" || key === "codingssok_role") {
                localStorage.removeItem(key);
            }
        }
        router.push("/login");
    }, [router]);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll);
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const ids = navLinks.filter(link => link.href.startsWith("#")).map(link => link.href.replace("#", ""));
        const observers: IntersectionObserver[] = [];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
                { rootMargin: "-40% 0px -55% 0px" },
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach(observer => observer.disconnect());
    }, []);

    const handleNavClick = useCallback((e: MouseEvent<HTMLAnchorElement>, href: string) => {
        if (!href.startsWith("#")) {
            setIsMobileMenuOpen(false);
            return;
        }
        e.preventDefault();
        const el = document.getElementById(href.replace("#", ""));
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: "smooth" });
        }
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
    }, []);

    const isAdmin = user?.role === "teacher" || user?.role === "admin";

    return (
        <>
            <motion.nav
                className="site-head"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.645, 0.045, 0.355, 1] }}
                style={{
                    background: isScrolled ? "rgba(253, 250, 245, 0.92)" : "transparent",
                    backdropFilter: isScrolled ? "blur(12px)" : "none",
                    WebkitBackdropFilter: isScrolled ? "blur(12px)" : "none",
                }}
            >
                <div className="site-head__inner">
                    <Link href="/" className="s__logo" style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
                        <Image
                            src="/icon.png"
                            alt="코딩쏙"
                            width={140}
                            height={48}
                            style={{ objectFit: "contain", height: 36, width: "auto" }}
                            priority
                        />
                    </Link>

                    <div className="nav-main" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <ParentPortalButton />

                        {!authLoading && (
                            user ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#334155", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {user.name ?? "사용자"}
                                    </span>
                                    {isAdmin && (
                                        <Link href="/teacher/admin" style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                                            관리자
                                        </Link>
                                    )}
                                    {!isAdmin && (
                                        <Link href="/dashboard/learning/files" style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #bfdbfe", background: "rgba(239,246,255,0.92)", color: "#2563eb", fontSize: 13, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>
                                            내 파일함
                                        </Link>
                                    )}
                                    <button onClick={handleSignOut} style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login" style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", color: "#64748b", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                                    로그인
                                </Link>
                            )
                        )}

                        <div style={{ position: "relative" }} onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
                            <motion.a
                                href="#contact"
                                onClick={(e) => handleNavClick(e, "#contact")}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 32px", background: "linear-gradient(135deg, #0ea5e9, #3b82f6, #3b82f6)", backgroundSize: "200% 200%", borderRadius: 16, color: "white", fontWeight: 700, fontSize: 15, letterSpacing: "0.03em", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(14,165,233,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset", perspective: "600px", textDecoration: "none" }}
                                whileHover={{ scale: 1.05, rotateX: -3, rotateY: 5, boxShadow: "0 8px 32px rgba(14,165,233,0.5), 0 0 60px rgba(99,102,241,0.2), 0 0 0 1px rgba(255,255,255,0.2) inset" }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                                <span>상담 예약</span>
                                <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none" animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                    <path d="M4 6l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </motion.svg>
                            </motion.a>

                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                        style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid rgba(14,165,233,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(14,165,233,0.08)", padding: 8, minWidth: 200, zIndex: 200 }}
                                    >
                                        {navLinks.map((link, i) => (
                                            <motion.a
                                                key={link.name}
                                                href={link.href}
                                                onClick={(e) => handleNavClick(e, link.href)}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, color: activeSection === link.href.replace("#", "") ? "#0ea5e9" : "#334155", fontWeight: 500, fontSize: 14, textDecoration: "none" }}
                                                whileHover={{ backgroundColor: "rgba(14,165,233,0.08)", x: 4 }}
                                            >
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: activeSection === link.href.replace("#", "") ? "#0ea5e9" : "#cbd5e1" }} />
                                                {link.name}
                                            </motion.a>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="mobile-head-actions">
                        <ParentPortalButton className="mobile-parent-portal-link" compact />
                        <button type="button" aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"} className={`s__toggle ${isMobileMenuOpen ? "is-open" : ""}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <span className="s__toggle__lines">
                                <span className="s__toggle__line" />
                                <span className="s__toggle__line" />
                            </span>
                        </button>
                    </div>
                </div>
            </motion.nav>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ position: "fixed", inset: 0, zIndex: 99, background: "var(--color-beige)", display: "flex", flexDirection: "column", paddingTop: 100, paddingLeft: 28, paddingRight: 28, paddingBottom: 40, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
                    >
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} style={{ padding: 18, border: "1px solid #bfdbfe", borderRadius: 16, background: "#eff6ff", marginBottom: 18 }}>
                            <Link href={PARENT_PORTAL_HREF} onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, color: "#1e3a8a", textDecoration: "none", fontWeight: 900, fontSize: 20 }}>
                                <span>학부모 포털</span>
                                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_forward</span>
                            </Link>
                            <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>
                                학생 이름과 인증번호로 수업 피드백을 바로 확인합니다.
                            </p>
                        </motion.div>

                        {navLinks.map((link, i) => (
                            <motion.a
                                key={link.name}
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                style={{ display: "block", fontSize: "clamp(1.35rem, 4vw, 1.85rem)", fontWeight: 700, color: activeSection === link.href.replace("#", "") ? "var(--color-brand-1)" : "var(--color-black)", padding: "15px 0", borderBottom: "1px solid var(--color-grey-2)", textDecoration: "none" }}
                            >
                                {link.name}
                            </motion.a>
                        ))}

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ marginTop: 32 }}>
                            <a href="tel:010-7566-7229" style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", background: "var(--color-beige-dark)", borderRadius: 16, color: "var(--color-black)", fontWeight: 600, marginBottom: 12, textDecoration: "none" }}>
                                010-7566-7229
                            </a>
                            <PillButton href="#contact" onClick={(e) => handleNavClick(e, "#contact")}>
                                상담 예약
                            </PillButton>

                            {!authLoading && (
                                <div style={{ marginTop: 16 }}>
                                    {user ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600, padding: "0 4px" }}>
                                                {user.name ?? "사용자"} 로그인 중
                                            </span>
                                            {!isAdmin && (
                                                <Link href="/dashboard/learning/files" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "block", width: "100%", padding: "14px 24px", borderRadius: 12, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", fontSize: 14, fontWeight: 800, textDecoration: "none", textAlign: "center" }}>
                                                    내 파일함
                                                </Link>
                                            )}
                                            {isAdmin && (
                                                <Link href="/teacher/admin" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "block", width: "100%", padding: "14px 24px", borderRadius: 12, background: "#2563eb", color: "#fff", fontSize: 14, fontWeight: 800, textDecoration: "none", textAlign: "center" }}>
                                                    관리자
                                                </Link>
                                            )}
                                            <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} style={{ width: "100%", padding: "14px 24px", borderRadius: 12, border: "1px solid #e2e8f0", background: "var(--color-beige-dark)", color: "#475569", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                                                로그아웃
                                            </button>
                                        </div>
                                    ) : (
                                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "block", width: "100%", padding: "14px 24px", borderRadius: 12, border: "1px solid #e2e8f0", background: "var(--color-beige-dark)", color: "#475569", fontSize: 14, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
                                            로그인
                                        </Link>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .mobile-head-actions {
                    display: none;
                    align-items: center;
                    gap: 8px;
                }

                .s__toggle {
                    border: 0;
                    background: transparent;
                    cursor: pointer;
                    padding: 0;
                }

                @media (max-width: 768px) {
                    .nav-main {
                        display: none !important;
                    }

                    .mobile-head-actions {
                        display: flex;
                    }

                    .site-head__inner {
                        gap: 10px;
                    }
                }

                @media (max-width: 380px) {
                    .mobile-parent-portal-link {
                        padding-left: 10px !important;
                        padding-right: 10px !important;
                        font-size: 11px !important;
                    }
                }
            `}</style>
        </>
    );
}
