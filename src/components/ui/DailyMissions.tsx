"use client";
import { motion } from "framer-motion";
import { useDailyMissions } from "@/hooks/useDailyMissions";
import BadgeIcon from "@/components/icons/BadgeIcon";
import styles from "./DailyMissions.module.css";

interface Props {
    onClaimXP?: (amount: number, missionId: string) => void;
}

export default function DailyMissions({ onClaimXP }: Props) {
    const { todayMissions, progress, claimReward, completedCount } = useDailyMissions();

    const handleClaim = (missionId: string) => {
        const xp = claimReward(missionId);
        if (xp > 0 && onClaimXP) onClaimXP(xp, missionId);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>
                    오늘의 미션
                </div>
                <div
                    className={styles.countBadge}
                    style={{
                        background: completedCount === todayMissions.length ? "#dcfce7" : "#f1f5f9",
                        color: completedCount === todayMissions.length ? "#15803d" : "#64748b",
                    }}
                >
                    {completedCount}/{todayMissions.length}
                </div>
            </div>

            <div className={styles.missionList}>
                {todayMissions.map((mission, i) => {
                    const mp = progress.find(p => p.id === mission.id);
                    const pct = mp ? Math.min(100, (mp.current / mission.target) * 100) : 0;
                    const done = mp?.completed || false;
                    const claimed = mp?.claimed || false;

                    return (
                        <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={styles.missionCard}
                            style={{
                                background: claimed ? "#f0fdf4" : done ? "#fffbeb" : "#f8fafc",
                                border: `1px solid ${claimed ? "#bbf7d0" : done ? "#fde68a" : "#e2e8f0"}`,
                            }}
                        >
                            <BadgeIcon badgeId={mission.icon} rarity={done ? "rare" : "common"} size={28} unlocked={done} />

                            <div className={styles.missionContent}>
                                <div
                                    className={styles.missionName}
                                    style={{
                                        textDecoration: claimed ? "line-through" : "none",
                                        opacity: claimed ? 0.5 : 1,
                                    }}
                                >
                                    {mission.name}
                                </div>
                                <div className={styles.progressTrack}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        className={styles.progressFill}
                                        style={{
                                            background: done ? "#22c55e" : "#3b82f6",
                                        }}
                                    />
                                </div>
                                <div className={styles.progressText}>
                                    {mp?.current || 0}/{mission.target} · +{mission.xpReward} XP
                                </div>
                            </div>

                            {done && !claimed && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleClaim(mission.id)}
                                    className={styles.claimButton}
                                >
                                    수령
                                </motion.button>
                            )}
                            {claimed && (
                                <span className={styles.claimedLabel}>완료</span>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
