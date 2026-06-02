"use client";

/**
 * Achievements 섹션
 * 대회·공모전 참가/수상 성과 — data/achievements.ts 에서 데이터 로드
 * verified=false 항목은 "Coming Soon" 워터마크 표시
 */

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import {
    ACHIEVEMENTS_UPCOMING,
    ACHIEVEMENTS_PAST,
    ACHIEVEMENT_STATS,
    type Achievement,
} from "@/data/achievements";

const AWARD_COLORS: Record<string, string> = {
    grand: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    gold: "linear-gradient(135deg, #fbbf24, #d97706)",
    silver: "linear-gradient(135deg, #cbd5e1, #94a3b8)",
    bronze: "linear-gradient(135deg, #fed7aa, #c2410c)",
    special: "linear-gradient(135deg, #c4b5fd, #1d4ed8)",
    merit: "linear-gradient(135deg, #bae6fd, #0284c7)",
};

function AchievementCard({ a, idx }: { a: Achievement; idx: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            style={{
                position: "relative",
                background: "#ffffff",
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
            }}
        >
            {/* 미검증 데이터 워터마크 */}
            {!a.verified && (
                <div style={{
                    position: "absolute", top: 12, right: 12, zIndex: 5,
                    padding: "4px 10px", borderRadius: 999,
                    background: "rgba(148,163,184,0.15)",
                    color: "#64748b", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.05em",
                }}>
                    예정/준비중
                </div>
            )}

            {/* 수상 등급 배지 */}
            {a.awardLevel && (
                <div style={{
                    position: "absolute", top: 16, left: 16, zIndex: 5,
                    padding: "6px 14px", borderRadius: 999,
                    background: AWARD_COLORS[a.awardLevel] || "#cbd5e1",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}>
                    {a.badge}
                </div>
            )}

            {/* 본문 */}
            <div style={{ padding: "60px 24px 24px" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>
                    {a.organizer}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: "0 0 8px", letterSpacing: -0.3 }}>
                    {a.title}
                </h3>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
                    {a.desc}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: "#64748b" }}>
                    <span><span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: "middle" }}>calendar_today</span> {a.date}</span>
                    <span><span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: "middle" }}>location_on</span> {a.location}</span>
                    <span><span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: "middle" }}>group</span> {a.participants}</span>
                </div>
                {a.studentInitials && a.studentInitials.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #e2e8f0", fontSize: 11, color: "#64748b" }}>
                        참가 학생: {a.studentInitials.join(", ")}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function Achievements() {
    const sectionRef = useRef<HTMLElement>(null);
    const inView = useInView(sectionRef, { once: true, margin: "-100px" });
    const all = [...ACHIEVEMENTS_PAST, ...ACHIEVEMENTS_UPCOMING];

    return (
        <section ref={sectionRef} style={{
            padding: "clamp(80px, 10vw, 140px) 20px",
            background: "#ffffff",
        }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {/* 헤더 */}
                <div style={{ textAlign: "center", marginBottom: 60 }}>
                    <div style={{
                        display: "inline-block", padding: "6px 16px", borderRadius: 999,
                        background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                        color: "#92400e", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                        marginBottom: 16,
                    }}>
                        ACHIEVEMENTS · 학원 성과
                    </div>
                    <h2 style={{
                        fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900,
                        color: "#0f172a", margin: "0 0 12px", letterSpacing: -1,
                    }}>
                        대회·공모전에서 증명한 실력
                    </h2>
                    <p style={{ fontSize: 15, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                        코딩쏙 학생들이 참가하고 수상한 대회 기록입니다.
                    </p>
                </div>

                {/* 통계 */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16, marginBottom: 60,
                }}>
                    {[
                        { label: "참가 대회", value: ACHIEVEMENT_STATS.totalCompetitions, suffix: "+" },
                        { label: "수상 실적", value: ACHIEVEMENT_STATS.totalAwards, suffix: "회" },
                        { label: "참가 학생", value: ACHIEVEMENT_STATS.totalStudents, suffix: "명" },
                        { label: "수상률", value: ACHIEVEMENT_STATS.awardRate, suffix: "%" },
                    ].map((s, i) => (
                        <div key={s.label} style={{
                            padding: "24px 20px", textAlign: "center",
                            background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                            borderRadius: 16, border: "1px solid #e2e8f0",
                        }}>
                            <div style={{ fontSize: 36, fontWeight: 900, color: "#0f172a", letterSpacing: -1 }}>
                                {inView && <CountUp end={s.value} duration={2} />}{s.suffix}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginTop: 4 }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 카드 그리드 */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 24,
                }}>
                    {all.map((a, i) => (
                        <AchievementCard key={a.id} a={a} idx={i} />
                    ))}
                </div>

                {/* 안내 */}
                <p style={{
                    textAlign: "center", marginTop: 40,
                    fontSize: 12, color: "#94a3b8", fontStyle: "italic",
                }}>
                    ※ 실제 대회 참가/수상 데이터로 지속 업데이트됩니다.
                </p>
            </div>
        </section>
    );
}
