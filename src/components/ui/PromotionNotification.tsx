"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getTierInfo } from "@/lib/xp-engine";
import TierIcon from "@/components/icons/TierIcon";

/* ═══════════════════════════════════════
   승급전 자격 알림 토스트
   promotion-eligible CustomEvent 수신 시 표시
   ═══════════════════════════════════════ */

export default function PromotionNotification() {
    const [nextTier, setNextTier] = useState<string | null>(null);

    useEffect(() => {
        function handlePromotion(e: Event) {
            const detail = (e as CustomEvent<{ nextTier: string }>).detail;
            if (detail?.nextTier) setNextTier(detail.nextTier);
        }
        window.addEventListener("promotion-eligible", handlePromotion);
        return () => window.removeEventListener("promotion-eligible", handlePromotion);
    }, []);

    /* auto-dismiss after 10s */
    useEffect(() => {
        if (!nextTier) return;
        const timer = setTimeout(() => setNextTier(null), 10_000);
        return () => clearTimeout(timer);
    }, [nextTier]);

    const tierInfo = nextTier ? getTierInfo(nextTier) : null;

    return (
        <AnimatePresence>
            {nextTier && tierInfo && (
                <motion.div
                    initial={{ opacity: 0, x: 80, y: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: 80, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={() => setNextTier(null)}
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 10000,
                        background: "#fff",
                        borderRadius: 20,
                        padding: "18px 22px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        boxShadow: `0 12px 40px rgba(0,0,0,0.12), 0 0 0 2px ${tierInfo.color}33`,
                        cursor: "pointer",
                        minWidth: 280,
                        maxWidth: 380,
                    }}
                >
                    {/* Tier icon */}
                    <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        style={{ flexShrink: 0 }}
                    >
                        <TierIcon tier={nextTier} size={48} animated />
                    </motion.div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: tierInfo.color,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: 2,
                        }}>
                            승급전 자격 달성!
                        </div>
                        <div style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#172554",
                            marginBottom: 4,
                        }}>
                            {tierInfo.nameKo} 승급전에 도전하세요
                        </div>
                        <Link
                            href="/dashboard/learning/promotion"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 14px",
                                borderRadius: 10,
                                background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: "none",
                                boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
                                transition: "transform 0.15s",
                            }}
                        >
                            도전하기
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
