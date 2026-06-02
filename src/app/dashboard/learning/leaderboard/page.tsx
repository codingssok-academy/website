"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getTierInfo, LEADERBOARD_REWARDS, type LeaderboardEntry } from "@/lib/xp-engine";

// ─── SVG 순위 아이콘 ────────────────────────────────────────────

function TrophyGold() {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="1위 트로피">
            <path d="M14 20c-4.4 0-8-3.6-8-8V5h16v7c0 4.4-3.6 8-8 8z" fill="#FBBF24" />
            <path d="M14 20c-4.4 0-8-3.6-8-8V5h16v7c0 4.4-3.6 8-8 8z" fill="url(#trophy-gold-grad)" />
            <path d="M6 5H3a2 2 0 000 4h3.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M22 5h3a2 2 0 010 4h-3.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <rect x="11" y="20" width="6" height="3" rx="1" fill="#F59E0B" />
            <rect x="9" y="23" width="10" height="2" rx="1" fill="#D97706" />
            <path d="M11 12l1.5-3 1.5 3h3.5l-2.8 2 1 3.5L14 16l-2.7 1.5 1-3.5L9.5 12H11z" fill="#fff" opacity="0.9" />
            <defs>
                <linearGradient id="trophy-gold-grad" x1="6" y1="5" x2="22" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FDE68A" />
                    <stop offset="1" stopColor="#D97706" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function MedalSilver() {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="2위 메달">
            <circle cx="14" cy="17" r="8" fill="url(#medal-silver-grad)" />
            <circle cx="14" cy="17" r="6" fill="#E5E7EB" />
            <path d="M10 7l2-4h4l2 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M11 7h6" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
            <text x="14" y="21" textAnchor="middle" fontSize="9" fontWeight="800" fill="#6B7280">2</text>
            <defs>
                <linearGradient id="medal-silver-grad" x1="6" y1="9" x2="22" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F3F4F6" />
                    <stop offset="1" stopColor="#9CA3AF" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function MedalBronze() {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="3위 메달">
            <circle cx="14" cy="17" r="8" fill="url(#medal-bronze-grad)" />
            <circle cx="14" cy="17" r="6" fill="#FDE8C8" />
            <path d="M10 7l2-4h4l2 4" stroke="#B45309" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M11 7h6" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
            <text x="14" y="21" textAnchor="middle" fontSize="9" fontWeight="800" fill="#92400E">3</text>
            <defs>
                <linearGradient id="medal-bronze-grad" x1="6" y1="9" x2="22" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FDE68A" />
                    <stop offset="1" stopColor="#B45309" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <TrophyGold />;
    if (rank === 2) return <MedalSilver />;
    if (rank === 3) return <MedalBronze />;
    return (
        <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "#f1f5f9", color: "#64748b",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800,
        }}>
            {rank}
        </div>
    );
}

// ─── 티어 뱃지 ────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
    const tierMap: Record<string, { icon: string; color: string; label: string }> = {
        Iron:     { icon: "shield",             color: "#6b7280", label: "아이언" },
        Bronze:   { icon: "looks_3",            color: "#b45309", label: "브론즈" },
        Silver:   { icon: "looks_two",          color: "#9ca3af", label: "실버" },
        Gold:     { icon: "looks_one",          color: "#ca8a04", label: "골드" },
        Platinum: { icon: "diamond",            color: "#0891b2", label: "플래티넘" },
        Diamond:  { icon: "workspace_premium",  color: "#2563eb", label: "다이아" },
    };
    const info = tierMap[tier] || tierMap.Iron;
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 999,
            background: `${info.color}15`,
            border: `1px solid ${info.color}30`,
        }}>
            <span
                className="material-symbols-outlined"
                style={{ fontSize: 13, color: info.color }}
            >
                {info.icon}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: info.color }}>{info.label}</span>
        </div>
    );
}

// ─── 상위 3등 카드 ────────────────────────────────────────────

const TOP3_STYLES = [
    { gradient: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "#fbbf24", shadow: "0 8px 24px rgba(251,191,36,0.3)", order: 0 },
    { gradient: "linear-gradient(135deg, #f3f4f6, #e5e7eb)", border: "#d1d5db", shadow: "0 8px 24px rgba(156,163,175,0.25)", order: -1 },
    { gradient: "linear-gradient(135deg, #fef3c7, #fde8c8)", border: "#d97706", shadow: "0 8px 24px rgba(217,119,6,0.25)", order: 1 },
];

// Layout order: 2nd (left), 1st (center/tall), 3rd (right)
const TOP3_DISPLAY_ORDER = [1, 0, 2]; // indices into top3 entries

function Top3Podium({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) {
    if (entries.length === 0) return null;

    const podium = TOP3_DISPLAY_ORDER.map(i => entries[i]).filter(Boolean);

    return (
        <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            gap: 12, padding: "24px 0 8px",
        }}>
            {podium.map((entry) => {
                const styleIdx = entry.rank - 1;
                const s = TOP3_STYLES[styleIdx];
                const isFirst = entry.rank === 1;
                const tierInfo = getTierInfo(entry.tier);
                const isMe = entry.userId === currentUserId;

                return (
                    <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: styleIdx * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                            flex: isFirst ? "0 0 140px" : "0 0 118px",
                        }}
                    >
                        {/* 순위 아이콘 */}
                        <RankIcon rank={entry.rank} />

                        {/* 아바타 */}
                        <div style={{
                            width: isFirst ? 68 : 52, height: isFirst ? 68 : 52,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${tierInfo.color}cc, ${tierInfo.color}66)`,
                            border: `3px solid ${s.border}`,
                            boxShadow: s.shadow,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: isFirst ? 26 : 20, fontWeight: 800, color: "#fff",
                            position: "relative",
                        }}>
                            {entry.name.charAt(0).toUpperCase()}
                            {isMe && (
                                <div style={{
                                    position: "absolute", bottom: -2, right: -2,
                                    width: 16, height: 16, borderRadius: "50%",
                                    background: "#22c55e", border: "2px solid #fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 10, color: "#fff" }}>check</span>
                                </div>
                            )}
                        </div>

                        {/* 카드 */}
                        <div style={{
                            width: "100%", borderRadius: 16,
                            background: s.gradient,
                            border: `1px solid ${s.border}40`,
                            boxShadow: s.shadow,
                            padding: isFirst ? "14px 12px" : "12px 10px",
                            textAlign: "center",
                            minHeight: isFirst ? 110 : 90,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                        }}>
                            <div style={{
                                fontSize: isFirst ? 14 : 12, fontWeight: 800,
                                color: "#0f172a",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                maxWidth: "100%",
                            }}>
                                {entry.name}{isMe ? " (나)" : ""}
                            </div>
                            <div style={{ fontSize: 10, color: "#475569" }}>Lv.{entry.level}</div>
                            <TierBadge tier={entry.tier} />
                            <div style={{
                                fontSize: isFirst ? 15 : 13, fontWeight: 900, color: "#d97706",
                            }}>
                                {entry.xp.toLocaleString()} XP
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

// ─── 4위~ 리스트 카드 ─────────────────────────────────────────

function RankCard({ entry, index }: { entry: LeaderboardEntry; index: number }) {
    const tierInfo = getTierInfo(entry.tier);
    const reward = LEADERBOARD_REWARDS.find(r => r.rank === entry.rank);

    return (
        <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: 14,
                background: entry.isCurrentUser ? `${tierInfo.color}08` : "#fff",
                border: entry.isCurrentUser ? `1.5px solid ${tierInfo.color}30` : "1px solid #f1f5f9",
                boxShadow: entry.isCurrentUser ? `0 4px 16px ${tierInfo.color}15` : "0 1px 4px rgba(0,0,0,0.04)",
                transition: "all 0.2s",
            }}
        >
            {/* 순위 */}
            <div style={{ flexShrink: 0 }}>
                <RankIcon rank={entry.rank} />
            </div>

            {/* 아바타 */}
            <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `linear-gradient(135deg, ${tierInfo.color}cc, ${tierInfo.color}55)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
                {entry.name.charAt(0).toUpperCase()}
            </div>

            {/* 이름 + 레벨 */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 14, fontWeight: entry.isCurrentUser ? 800 : 600,
                    color: entry.isCurrentUser ? tierInfo.color : "#1e293b",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {entry.name}{entry.isCurrentUser ? " (나)" : ""}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Lv.{entry.level}</div>
            </div>

            {/* 티어 뱃지 */}
            <TierBadge tier={entry.tier} />

            {/* XP */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>
                    {entry.xp.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>XP</div>
                {reward && (
                    <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>
                        +{reward.xpBonus} 보너스
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── 탭 타입 ──────────────────────────────────────────────────

type TabKey = "weekly" | "monthly" | "alltime";

const TABS: { key: TabKey; label: string }[] = [
    { key: "weekly",  label: "주간" },
    { key: "monthly", label: "월간" },
    { key: "alltime", label: "전체" },
];

// ─── 페이지 ──────────────────────────────────────────────────

export default function LeaderboardPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);
    const [tab, setTab] = useState<TabKey>("weekly");
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        async function loadEntries() {
            const { data } = await supabase
                .from("user_progress")
                .select("user_id, xp, level, tier")
                .order("xp", { ascending: false })
                .limit(50);

            if (!data) { setLoading(false); return; }

            const userIds = data.map((d: { user_id: string }) => d.user_id);
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, name")
                .in("id", userIds);

            const nameMap = new Map<string, string>();
            profiles?.forEach((p: { id: string; name: string }) => nameMap.set(p.id, p.name));

            const list: LeaderboardEntry[] = data.map(
                (d: { user_id: string; xp: number; level: number; tier: string }, i: number) => ({
                    rank: i + 1,
                    userId: d.user_id,
                    name: nameMap.get(d.user_id) || "학생",
                    xp: d.xp || 0,
                    level: d.level || 1,
                    tier: d.tier || "Iron",
                    isCurrentUser: d.user_id === user?.id,
                })
            );

            setEntries(list);
            setLoading(false);
        }
        loadEntries();
    }, [supabase, user?.id, tab]);

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 60px" }}>
            {/* 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
                        랭킹
                    </h1>
                    <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                        상위 랭커에게 XP 보너스가 지급됩니다
                    </p>
                </div>
                <Link
                    href="/dashboard/learning"
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 13, color: "#64748b", textDecoration: "none",
                        padding: "8px 14px", borderRadius: 10, background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                    돌아가기
                </Link>
            </div>

            {/* 탭 */}
            <div style={{
                display: "flex", gap: 4,
                background: "#f1f5f9", padding: 4, borderRadius: 12,
                marginBottom: 32,
            }}>
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                            cursor: "pointer", fontSize: 13, fontWeight: 700,
                            transition: "all 0.2s",
                            background: tab === t.key ? "#fff" : "transparent",
                            color: tab === t.key ? "#0ea5e9" : "#64748b",
                            boxShadow: tab === t.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 로딩 */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.4 }}>
                            leaderboard
                        </span>
                        랭킹 불러오는 중...
                    </motion.div>
                ) : entries.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}
                    >
                        아직 랭킹 데이터가 없습니다
                    </motion.div>
                ) : (
                    <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* 상위 3등 포디엄 */}
                        <div style={{
                            background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                            borderRadius: 20, padding: "8px 16px 20px",
                            border: "1px solid #e2e8f0",
                            marginBottom: 24,
                        }}>
                            <Top3Podium entries={top3} currentUserId={user?.id} />
                        </div>

                        {/* 4등~ 리스트 */}
                        {rest.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {rest.map((entry, i) => (
                                    <RankCard key={entry.userId} entry={entry} index={i} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
