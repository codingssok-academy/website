"use client";

/**
 * 실시간 랭킹 대시보드 — 홈페이지용
 * 메타버즈 스타일 대시보드 + 스크롤 가능 전체 랭킹
 */

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Player {
    rank: number;
    name: string;
    xp: number;
    level: number;
}

export default function LeaderboardSection() {
    const [players, setPlayers] = useState<Player[]>([]);
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });

    useEffect(() => {
        fetch("/api/leaderboard?limit=50")
            .then(r => r.json())
            .then(d => setPlayers(d.players || []))
            .catch(() => {});
    }, []);

    const top3 = players.slice(0, 3);
    const rest = players.slice(3);
    const maxXp = players[0]?.xp || 1;

    return (
        <section ref={ref} id="leaderboard" style={{
            padding: "clamp(50px, 6vw, 80px) 20px",
            background: "linear-gradient(180deg, #f8fafc, #fff)",
        }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                {/* 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    style={{ textAlign: "center", marginBottom: 40 }}
                >
                    <span style={{
                        fontSize: 11, fontWeight: 800, color: "#2563eb",
                        letterSpacing: "0.2em", textTransform: "uppercase",
                    }}>STUDENT RANKING</span>
                    <h2 style={{
                        fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900,
                        color: "#0f172a", margin: "8px 0 0",
                    }}>
                        코딩쏙 랭킹 대시보드
                    </h2>
                </motion.div>

                {players.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: 60, color: "#94a3b8",
                        fontSize: 15, background: "#fff", borderRadius: 20,
                        border: "1px solid #e2e8f0",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 12, color: "#cbd5e1" }}>leaderboard</span>
                        학습을 시작하면 랭킹이 여기에 표시됩니다
                    </div>
                ) : (
                    <>
                        {/* Top 3 카드 */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 16, marginBottom: 32,
                        }}>
                            {[1, 0, 2].map((idx) => {
                                const p = top3[idx];
                                if (!p) return <div key={idx} />;
                                const isFirst = p.rank === 1;
                                return (
                                    <motion.div
                                        key={p.rank}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={inView ? { opacity: 1, y: 0 } : {}}
                                        transition={{ delay: idx * 0.15 }}
                                        style={{
                                            background: isFirst
                                                ? "linear-gradient(135deg, #1e293b, #0f172a)"
                                                : "#fff",
                                            borderRadius: 20,
                                            padding: isFirst ? "32px 24px" : "24px 20px",
                                            textAlign: "center",
                                            border: isFirst ? "none" : "1px solid #e2e8f0",
                                            boxShadow: isFirst ? "0 20px 60px rgba(15,23,42,0.2)" : "0 4px 16px rgba(0,0,0,0.04)",
                                            transform: isFirst ? "scale(1.05)" : "none",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {/* 메달 */}
                                        <div style={{
                                            width: isFirst ? 56 : 44,
                                            height: isFirst ? 56 : 44,
                                            borderRadius: "50%",
                                            background: p.rank === 1 ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                                                : p.rank === 2 ? "linear-gradient(135deg, #d1d5db, #9ca3af)"
                                                : "linear-gradient(135deg, #f97316, #ea580c)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            margin: "0 auto 12px",
                                            boxShadow: `0 4px 12px ${p.rank === 1 ? "rgba(251,191,36,0.4)" : "rgba(0,0,0,0.1)"}`,
                                        }}>
                                            <span className="material-symbols-outlined" style={{
                                                fontSize: isFirst ? 28 : 22,
                                                color: p.rank === 2 ? "#374151" : "#fff",
                                                fontVariationSettings: "'FILL' 1",
                                            }}>emoji_events</span>
                                        </div>

                                        <div style={{
                                            fontSize: isFirst ? 20 : 16, fontWeight: 900,
                                            color: isFirst ? "#fff" : "#0f172a",
                                            marginBottom: 4,
                                        }}>{p.name}</div>

                                        <div style={{
                                            fontSize: 11, color: isFirst ? "#94a3b8" : "#64748b",
                                            fontWeight: 600, marginBottom: 12,
                                        }}>Lv.{p.level}</div>

                                        <div style={{
                                            fontSize: isFirst ? 28 : 22, fontWeight: 900,
                                            color: isFirst ? "#fbbf24" : "#2563eb",
                                        }}>
                                            {p.xp.toLocaleString()}
                                            <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4 }}>XP</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* 전체 랭킹 테이블 (스크롤) */}
                        {rest.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.5 }}
                                style={{
                                    background: "#fff",
                                    borderRadius: 20,
                                    border: "1px solid #e2e8f0",
                                    overflow: "hidden",
                                }}
                            >
                                {/* 테이블 헤더 */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "60px 1fr 120px 80px",
                                    padding: "14px 20px",
                                    borderBottom: "1px solid #f1f5f9",
                                    fontSize: 11, fontWeight: 700, color: "#94a3b8",
                                    textTransform: "uppercase", letterSpacing: "0.05em",
                                }}>
                                    <span>순위</span>
                                    <span>이름</span>
                                    <span style={{ textAlign: "right" }}>경험치</span>
                                    <span style={{ textAlign: "right" }}>레벨</span>
                                </div>

                                {/* 스크롤 가능한 목록 */}
                                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                                    {rest.map((p, i) => (
                                        <motion.div
                                            key={p.rank}
                                            initial={{ opacity: 0 }}
                                            animate={inView ? { opacity: 1 } : {}}
                                            transition={{ delay: 0.5 + i * 0.03 }}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "60px 1fr 120px 80px",
                                                padding: "12px 20px",
                                                alignItems: "center",
                                                borderBottom: "1px solid #f8fafc",
                                                transition: "background 0.2s",
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <span style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8" }}>
                                                #{p.rank}
                                            </span>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                                                {p.name}
                                            </span>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{
                                                    height: 6, background: "#f1f5f9", borderRadius: 3,
                                                    overflow: "hidden", marginBottom: 4,
                                                }}>
                                                    <div style={{
                                                        width: `${(p.xp / maxXp) * 100}%`,
                                                        height: "100%", borderRadius: 3,
                                                        background: "#2563eb",
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                                                    {p.xp.toLocaleString()}
                                                </span>
                                            </div>
                                            <span style={{
                                                textAlign: "right",
                                                fontSize: 12, fontWeight: 700,
                                                color: "#2563eb",
                                            }}>
                                                Lv.{p.level}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
