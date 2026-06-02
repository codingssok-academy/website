"use client";
import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { xpForNextLevel, getLevelTitle, getTierInfo, getNextTier, PROMOTION_REQUIREMENTS } from "@/lib/xp-engine";
import { StatIcon } from "@/components/icons/BadgeIcon";
import TierIcon from "@/components/icons/TierIcon";
import type { UserProgress } from "@/hooks/useUserProgress";
import styles from "./GamificationBar.module.css";

interface Props {
    progress: UserProgress;
    compact?: boolean;
}

export function GamificationBar({ progress, compact = false }: Props) {
    const levelInfo = useMemo(() => getLevelTitle(progress.level), [progress.level]);
    const xpInfo = useMemo(() => xpForNextLevel(progress.xp), [progress.xp]);

    const tierInfo = useMemo(() => getTierInfo(progress.tier), [progress.tier]);
    const nextTier = useMemo(() => getNextTier(progress.tier), [progress.tier]);
    const nextReq = useMemo(() => nextTier ? PROMOTION_REQUIREMENTS[nextTier] : null, [nextTier]);
    const canPromote = nextReq ? progress.level >= nextReq.minLevel : false;

    if (compact) {
        return (
            <div className={styles.compactWrapper}>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={styles.compactCard}
                >
                    <TierIcon tier={progress.tier} size={28} animated />
                    <div className={styles.compactInfo}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: tierInfo.color }}>
                            {tierInfo.nameKo} · Lv.{progress.level}
                        </div>
                        <div className={styles.compactProgressTrack}>
                            <motion.div
                                animate={{ width: `${xpInfo.progress}%` }}
                                className={styles.compactProgressFill}
                                style={{ background: levelInfo.color }}
                            />
                        </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>{progress.xp.toLocaleString()}</span>
                </motion.div>
                {canPromote && nextTier && (
                    <Link href="/dashboard/learning/promotion" className={styles.promotionLink}>
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={styles.promotionCard}
                            style={{
                                background: `linear-gradient(135deg, ${tierInfo.color}15, ${tierInfo.color}08)`,
                                border: `1px solid ${tierInfo.color}30`,
                            }}
                        >
                            <TierIcon tier={nextTier} size={20} />
                            <div className={styles.promotionLabel} style={{ color: tierInfo.color }}>
                                {getTierInfo(nextTier).nameKo} 승급전 도전!
                            </div>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: tierInfo.color }}>arrow_forward</span>
                        </motion.div>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.fullContainer}
        >
            {/* Level & XP */}
            <div className={styles.levelRow}>
                <TierIcon tier={progress.tier} size={56} animated />
                <div className={styles.levelInfo}>
                    <div className={styles.levelTitle}>
                        Lv.{progress.level} {levelInfo.title}
                    </div>
                    <div className={styles.xpBarRow}>
                        <div className={styles.xpBarTrack}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpInfo.progress}%` }}
                                transition={{ duration: 1, type: "spring" }}
                                className={styles.xpBarFill}
                                style={{
                                    background: `linear-gradient(90deg, ${levelInfo.color}, ${levelInfo.color}cc)`,
                                }}
                            />
                        </div>
                        <span className={styles.xpLabel}>
                            {xpInfo.current}/{xpInfo.needed} XP
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className={styles.statsRow}>
                {([
                    { type: "xp" as const, label: "총 XP", value: progress.xp.toLocaleString(), color: "#f59e0b" },
                    { type: "streak" as const, label: "연속일", value: progress.streak, color: "#ef4444" },
                    { type: "problems" as const, label: "풀이수", value: progress.totalProblems, color: "#2563eb" },
                    { type: "badges" as const, label: "뱃지", value: progress.badges.length, color: "#8b5cf6" },
                ]).map(s => (
                    <div
                        key={s.label}
                        className={styles.statCard}
                        style={{
                            background: `${s.color}08`,
                            border: `1px solid ${s.color}20`,
                        }}
                    >
                        <div className={styles.statIconWrap}>
                            <StatIcon type={s.type} size={20} color={s.color} />
                        </div>
                        <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
                        <div className={styles.statLabel}>{s.label}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
