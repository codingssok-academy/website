"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface Tab {
    href: string;
    label: string;
    icon: string;
}

const TABS: Tab[] = [
    { href: "/parent/dashboard", label: "현황", icon: "dashboard" },
    { href: "/parent/feedback", label: "피드백", icon: "rate_review" },
    { href: "/parent/settings", label: "설정", icon: "settings" },
];

export default function ParentBottomNav() {
    const pathname = usePathname();

    return (
        <nav
            aria-label="하단 메뉴"
            className="fixed bottom-0 left-0 right-0 z-[500] flex items-stretch border-t border-slate-200/70 backdrop-blur-[24px] md:bottom-4 md:left-1/2 md:right-auto md:w-[360px] md:-translate-x-1/2 md:overflow-hidden md:rounded-2xl md:border md:border-slate-200/80 md:shadow-[0_12px_34px_rgba(15,23,42,0.16)]"
            style={{
                height: "calc(60px + env(safe-area-inset-bottom, 0px))",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                background: "rgba(255,255,255,0.97)",
            }}
        >
            {TABS.map(tab => {
                const active = pathname.startsWith(tab.href);

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-label={tab.label}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 no-underline transition-colors duration-150 md:flex-row md:gap-1.5 md:py-2 ${active ? "text-blue-600" : "text-slate-400"}`}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                        {active && (
                            <motion.div
                                layoutId="parent-nav-indicator"
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-b bg-blue-600"
                                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                            />
                        )}

                        <motion.span
                            className="material-symbols-outlined text-[22px] leading-none"
                            animate={{
                                scale: active ? 1.1 : 1,
                                fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 22 }}
                            style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                        >
                            {tab.icon}
                        </motion.span>

                        <span className={`text-[10px] leading-none font-[Pretendard,sans-serif] md:text-xs ${active ? "font-bold" : "font-medium"}`}>
                            {tab.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
