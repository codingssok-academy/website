"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useBadges, RARITY_COLORS } from "@/hooks/useBadges";
import BadgeIcon from "@/components/icons/BadgeIcon";

/* ═══════════════════════════════════════
   배지 획득 알림 토스트
   layout이나 RootLayout에 삽입
   ═══════════════════════════════════════ */

export default function BadgeNotification() {
    const { newBadge, setNewBadge } = useBadges();

    return (
        <AnimatePresence>
            {newBadge && (
                <motion.div
                    initial={{ opacity: 0, y: -60, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -60, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    style={{
                        position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
                        zIndex: 10000,
                        background: "#fff", borderRadius: 20, padding: "16px 24px",
                        display: "flex", alignItems: "center", gap: 14,
                        boxShadow: `0 12px 40px rgba(0,0,0,0.15), 0 0 0 2px ${RARITY_COLORS[newBadge.rarity]}33`,
                        cursor: "pointer", minWidth: 260,
                    }}
                    onClick={() => setNewBadge(null)}
                >
                    <motion.div
                        animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.8 }}
                    >
                        <BadgeIcon badgeId={newBadge.id} rarity={newBadge.rarity} size={44} />
                    </motion.div>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: RARITY_COLORS[newBadge.rarity], textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            배지 획득!
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#172554" }}>
                            {newBadge.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {newBadge.description}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
