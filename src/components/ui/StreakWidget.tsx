"use client";
import { motion } from "framer-motion";
import { useStreak, getLastNDays } from "@/hooks/useStreak";
import { StatIcon } from "@/components/icons/BadgeIcon";
import styles from "./StreakWidget.module.css";

/* ═══════════════════════════════════════
   스트릭 위젯 — 대시보드 상단 배치
   연속일수 + 주간 히트맵 + 아이스
   ═══════════════════════════════════════ */

const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export default function StreakWidget() {
    const { streak, checkIn, useIce, badge, isAtRisk } = useStreak();
    const last7 = getLastNDays(7);

    return (
        <div className={styles.container}>
            {/* Top row: fire + streak count + badge */}
            <div className={styles.topRow}>
                <motion.span
                    animate={streak.currentStreak > 0 ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className={styles.fireIcon}
                >
                    {streak.currentStreak > 0 ? "" : ""}
                </motion.span>
                <div className={styles.streakInfo}>
                    <div className={styles.streakCount}>
                        {streak.currentStreak}일 연속
                    </div>
                    <div className={styles.streakMeta}>
                        최장 {streak.longestStreak}일 · 총 {streak.totalDays}일
                    </div>
                </div>
                {badge && (
                    <div
                        className={styles.badgeLabel}
                        style={{
                            background: badge.color + "20",
                            color: badge.color,
                        }}
                    >
                        <StatIcon type="streak" size={14} color={badge.color} />
                        {badge.label}
                    </div>
                )}
            </div>

            {/* Weekly heatmap */}
            <div className={styles.heatmapGrid}>
                {last7.map(date => {
                    const isActive = streak.activeDates.includes(date);
                    const isFrozen = streak.frozenDates.includes(date);
                    const dayIdx = new Date(date).getDay();
                    return (
                        <div key={date} className={styles.heatmapDay}>
                            <div className={styles.dayLabel}>
                                {DAYS_KO[dayIdx]}
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={styles.heatmapCell}
                                style={{
                                    background: isActive ? "linear-gradient(135deg, #2563eb, #6366F1)"
                                        : isFrozen ? "linear-gradient(135deg, #67E8F9, #22D3EE)"
                                            : "#f1f5f9",
                                }}
                            >
                                {isActive ? "✓" : isFrozen ? "" : ""}
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* At risk warning + ice */}
            {isAtRisk && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.warningBanner}
                >
                    <span className={styles.warningIcon}>!</span>
                    <div className={styles.warningContent}>
                        <div className={styles.warningTitle}>스트릭 위험!</div>
                        <div className={styles.warningText}>오늘 학습하지 않으면 스트릭이 초기화됩니다.</div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
