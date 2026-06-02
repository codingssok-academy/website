"use client";
import { motion } from "framer-motion";
import { useBadges, BADGE_CATALOG, RARITY_COLORS } from "@/hooks/useBadges";
import BadgeIcon from "@/components/icons/BadgeIcon";
import Link from "next/link";

/* ═══════════════════════════════════════
   배지 진열장 — 업적 & 배지 컬렉션
   /dashboard/learning/badges
   ═══════════════════════════════════════ */

const rarityLabels: Record<string, string> = {
    common: "일반",
    rare: "희귀",
    epic: "영웅",
    legendary: "전설",
};

// 학습 배지 서브 그룹 (id prefix 기반)
const BADGE_GROUPS: { label: string; ids: string[] }[] = [
    {
        label: "출석 스트릭",
        ids: ["streak-3", "streak-7", "streak-30"],
    },
    {
        label: "문제 풀이",
        ids: ["solve-10", "solve-50", "solve-100", "sharpshooter"],
    },
    {
        label: "경험치",
        ids: ["xp-500", "xp-1000"],
    },
    {
        label: "코스 완료",
        ids: ["first-course", "seedling", "bookworm", "genius", "master", "speedster"],
    },
    {
        label: "코드 실행",
        ids: ["first-run", "run-100", "coder"],
    },
];

function BadgeCard({ b, unlocked, delay }: { b: (typeof BADGE_CATALOG)[0]; unlocked: boolean; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            style={{
                background: unlocked ? "#fff" : "#f8fafc",
                borderRadius: 16, padding: "20px 16px", textAlign: "center",
                border: `1px solid ${unlocked ? RARITY_COLORS[b.rarity] + "33" : "#e2e8f0"}`,
                opacity: unlocked ? 1 : 0.5,
                position: "relative", overflow: "hidden",
            }}
        >
            {unlocked && (
                <div style={{
                    position: "absolute", top: 8, right: 8,
                    padding: "2px 6px", borderRadius: 6,
                    background: RARITY_COLORS[b.rarity] + "20",
                    fontSize: 9, fontWeight: 700, color: RARITY_COLORS[b.rarity],
                }}>
                    {rarityLabels[b.rarity]}
                </div>
            )}
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                <BadgeIcon badgeId={b.id} rarity={b.rarity} size={52} unlocked={unlocked} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#172554", marginBottom: 4 }}>
                {b.name}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                {unlocked ? b.description : b.condition}
            </div>
            {!unlocked && (
                <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 8 }}>미획득</div>
            )}
        </motion.div>
    );
}

export default function BadgesPage() {
    const { allBadges, unlockedIds, unlockedCount, totalCount } = useBadges();

    const specialBadges = allBadges.filter(b => b.category === "special");

    // 그룹에 포함된 id set
    const groupedIds = new Set(BADGE_GROUPS.flatMap(g => g.ids));
    // 그룹에 없는 learning 뱃지 (혹시 있다면 기타)
    const otherLearning = allBadges.filter(b => b.category === "learning" && !groupedIds.has(b.id));

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <Link href="/dashboard/learning" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>
                    ← 대시보드
                </Link>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#172554", marginTop: 8, letterSpacing: "-0.03em" }}>
                    배지 진열장
                </h1>
                <p style={{ fontSize: 14, color: "#64748b" }}>
                    {unlockedCount}개 획득 / 총 {totalCount}개
                </p>
                <div style={{ height: 8, borderRadius: 4, background: "#f1f5f9", marginTop: 12, overflow: "hidden" }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 4, background: "linear-gradient(135deg, #F59E0B, #EF4444)" }}
                    />
                </div>
            </div>

            {/* 그룹별 뱃지 */}
            {BADGE_GROUPS.map((group, gi) => {
                const badges = group.ids
                    .map(id => allBadges.find(b => b.id === id))
                    .filter(Boolean) as typeof allBadges;
                if (badges.length === 0) return null;
                return (
                    <section key={group.label} style={{ marginBottom: 36 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#172554", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                                width: 4, height: 16, borderRadius: 2,
                                background: "linear-gradient(to bottom, #F59E0B, #EF4444)",
                                display: "inline-block",
                            }} />
                            {group.label}
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                            {badges.map((b, i) => (
                                <BadgeCard
                                    key={b.id}
                                    b={b}
                                    unlocked={unlockedIds.includes(b.id)}
                                    delay={gi * 0.05 + i * 0.04}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}

            {/* 기타 학습 뱃지 (그룹 미분류) */}
            {otherLearning.length > 0 && (
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#172554", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 4, height: 16, borderRadius: 2, background: "linear-gradient(to bottom, #3b82f6, #6366f1)", display: "inline-block" }} />
                        기타 학습
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                        {otherLearning.map((b, i) => (
                            <BadgeCard key={b.id} b={b} unlocked={unlockedIds.includes(b.id)} delay={i * 0.04} />
                        ))}
                    </div>
                </section>
            )}

            {/* Special Badges */}
            <section>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#172554", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 4, height: 16, borderRadius: 2, background: "linear-gradient(to bottom, #f59e0b, #facc15)", display: "inline-block" }} />
                    특별 배지
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                    {specialBadges.map((b, i) => {
                        const unlocked = unlockedIds.includes(b.id);
                        return (
                            <motion.div
                                key={b.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 + 0.3 }}
                                style={{
                                    background: unlocked ? "linear-gradient(135deg, #FFFBEB, #FEF3C7)" : "#f8fafc",
                                    borderRadius: 16, padding: "20px 16px", textAlign: "center",
                                    border: `1px solid ${unlocked ? "#FDE68A" : "#e2e8f0"}`,
                                    opacity: unlocked ? 1 : 0.5,
                                    position: "relative",
                                }}
                            >
                                {unlocked && (
                                    <div style={{
                                        position: "absolute", top: 8, right: 8,
                                        padding: "2px 6px", borderRadius: 6,
                                        background: RARITY_COLORS[b.rarity] + "20",
                                        fontSize: 9, fontWeight: 700, color: RARITY_COLORS[b.rarity],
                                    }}>
                                        {rarityLabels[b.rarity]}
                                    </div>
                                )}
                                <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                                    <BadgeIcon badgeId={b.id} rarity={b.rarity} size={52} unlocked={unlocked} />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#172554", marginBottom: 4 }}>{b.name}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>
                                    {unlocked ? b.description : b.condition}
                                </div>
                                {!unlocked && (
                                    <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 8 }}>미획득</div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
