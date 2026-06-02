"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getTierInfo, LEADERBOARD_REWARDS, type LeaderboardEntry } from "@/lib/xp-engine";
import { StatIcon } from "@/components/icons/BadgeIcon";
import TierIcon from "@/components/icons/TierIcon";
import styles from "./Leaderboard.module.css";

const RANK_STYLES = [
    { bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#fff", label: "1st" },
    { bg: "linear-gradient(135deg, #d1d5db, #9ca3af)", color: "#fff", label: "2nd" },
    { bg: "linear-gradient(135deg, #d97706, #b45309)", color: "#fff", label: "3rd" },
];

export default function Leaderboard() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from("user_progress")
                .select("user_id, xp, level, tier")
                .order("xp", { ascending: false })
                .limit(10);

            if (!data) { setLoading(false); return; }

            // 이름 조회
            const userIds = data.map((d: { user_id: string }) => d.user_id);
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, name")
                .in("id", userIds);

            const nameMap = new Map<string, string>();
            profiles?.forEach((p: { id: string; name: string }) => nameMap.set(p.id, p.name));

            const list: LeaderboardEntry[] = data.map((d: { user_id: string; xp: number; level: number; tier: string }, i: number) => ({
                rank: i + 1,
                userId: d.user_id,
                name: nameMap.get(d.user_id) || "학생",
                xp: d.xp || 0,
                level: d.level || 1,
                tier: d.tier || "Iron",
                isCurrentUser: d.user_id === user?.id,
            }));

            setEntries(list);
            setLoading(false);
        }
        fetch();
    }, [supabase, user?.id]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                리더보드 로딩 중...
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <StatIcon type="xp" size={16} color="#f59e0b" />
                <span className={styles.headerTitle}>주간 랭킹</span>
                <Link
                    href="/dashboard/learning/leaderboard"
                    style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#0ea5e9",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    전체 보기
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>chevron_right</span>
                </Link>
            </div>

            <div className={styles.entryList}>
                {entries.map((entry, i) => {
                    const isTop3 = i < 3;
                    const style = isTop3 ? RANK_STYLES[i] : null;
                    const tierInfo = getTierInfo(entry.tier);
                    const reward = LEADERBOARD_REWARDS.find(r => r.rank === entry.rank);

                    return (
                        <motion.div
                            key={entry.userId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={styles.entryRow}
                            style={{
                                background: entry.isCurrentUser ? `${tierInfo.color}08` : isTop3 ? "#fafafa" : "transparent",
                                border: entry.isCurrentUser ? `1px solid ${tierInfo.color}25` : "1px solid transparent",
                            }}
                        >
                            {/* Rank */}
                            <div
                                className={`${styles.rankBadge} ${!style ? styles.rankDefault : ''}`}
                                style={style ? { background: style.bg, color: style.color } : undefined}
                            >
                                {entry.rank}
                            </div>

                            {/* Tier Icon */}
                            <TierIcon tier={entry.tier} size={24} />

                            {/* Name & Level */}
                            <div className={styles.nameSection}>
                                <div
                                    className={styles.nameText}
                                    style={{
                                        fontWeight: entry.isCurrentUser ? 800 : 600,
                                        color: entry.isCurrentUser ? tierInfo.color : "#334155",
                                    }}
                                >
                                    {entry.name} {entry.isCurrentUser && "(나)"}
                                </div>
                                <div className={styles.levelText}>
                                    Lv.{entry.level} · {tierInfo.nameKo}
                                </div>
                            </div>

                            {/* XP */}
                            <div className={styles.xpSection}>
                                <div className={styles.xpValue}>
                                    {entry.xp.toLocaleString()}
                                </div>
                                {reward && (
                                    <div className={styles.xpBonus}>
                                        +{reward.xpBonus} XP
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {entries.length === 0 && (
                    <div className={styles.emptyMessage}>
                        아직 랭킹 데이터가 없습니다
                    </div>
                )}
            </div>
        </div>
    );
}
