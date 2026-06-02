"use client";

/**
 * LiveStudySection — 홈페이지 실시간 학습 데이터 홍보 섹션
 * /api/learning/live 에서 24h 실제 학습 데이터 페치 (student_activity_log 기반)
 *
 * 피드백 #D: "단, 더미데이터가 아닌 실제 진짜 찐 데이터 연동해서 보여져야함"
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";

interface LiveData {
    activeStudents: number;
    totalMinutes: number;
    sessionsToday: number;
    topCourses: Array<{ course_title: string; count: number }>;
    recentFeed: Array<{
        student_name: string;
        course_title: string;
        unit_title: string;
        page_title: string;
        started_at: string;
    }>;
}

function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
}

export default function LiveStudySection() {
    const [data, setData] = useState<LiveData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                const res = await fetch("/api/learning/live", { cache: "no-store" });
                const json = await res.json();
                if (!cancelled) setData(json);
            } catch { /* silent */ }
            finally { if (!cancelled) setLoading(false); }
        };
        fetchData();
        // 60초마다 갱신
        const timer = setInterval(fetchData, 60_000);
        return () => { cancelled = true; clearInterval(timer); };
    }, []);

    return (
        <section style={{
            padding: "clamp(80px, 10vw, 140px) 20px",
            background: "#ffffff",
        }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 50 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "6px 16px", borderRadius: 999,
                        background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                        color: "#166534", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                        marginBottom: 16,
                    }}>
                        <span style={{
                            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                            background: "#10b981", animation: "pulse 1.5s ease-in-out infinite",
                        }} />
                        LIVE · 실시간 학습 현황
                    </div>
                    <h2 style={{
                        fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900,
                        color: "#0f172a", margin: "0 0 12px", letterSpacing: -1,
                    }}>
                        지금 이 순간 코딩쏙 학생들이 공부하는 중
                    </h2>
                    <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
                        최근 24시간 동안 학원 학습 플랫폼에서 일어난 <strong>실제 학습 기록</strong>입니다.
                    </p>
                </div>

                {/* 통계 */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16, marginBottom: 50,
                }}>
                    {[
                        { label: "활동 학생", value: data?.activeStudents ?? 0, suffix: "명", color: "#10b981" },
                        { label: "누적 학습 시간", value: data?.totalMinutes ?? 0, suffix: "분", color: "#3b82f6" },
                        { label: "학습 세션", value: data?.sessionsToday ?? 0, suffix: "회", color: "#3b82f6" },
                    ].map(s => (
                        <div key={s.label} style={{
                            padding: "28px 20px", textAlign: "center",
                            background: "#fff", border: `2px solid ${s.color}20`,
                            borderRadius: 16,
                        }}>
                            <div style={{ fontSize: 42, fontWeight: 900, color: s.color, letterSpacing: -1 }}>
                                {loading ? "—" : <CountUp end={s.value} duration={1.5} separator="," />}
                                <span style={{ fontSize: 18, marginLeft: 4 }}>{s.suffix}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginTop: 4 }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 최근 학습 피드 */}
                {data && data.recentFeed.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#334155", margin: "0 0 16px", letterSpacing: -0.3 }}>
                            실시간 학습 피드
                        </h3>
                        <div style={{
                            display: "flex", flexDirection: "column", gap: 8,
                            maxHeight: 400, overflowY: "auto",
                            padding: 12, borderRadius: 12,
                            background: "#f8fafc", border: "1px solid #e2e8f0",
                        }}>
                            {data.recentFeed.map((f, i) => (
                                <motion.div
                                    key={`${f.student_name}-${i}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "10px 14px", borderRadius: 8, background: "#fff",
                                        border: "1px solid #f1f5f9",
                                    }}
                                >
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: "linear-gradient(135deg, #3b82f6, #3b82f6)",
                                        color: "#fff", fontSize: 12, fontWeight: 800,
                                    }}>
                                        {f.student_name[0]}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                            <span>{f.student_name}</span>
                                            <span style={{ color: "#94a3b8", fontWeight: 500 }}> 님이 </span>
                                            <span style={{ color: "#3b82f6" }}>{f.course_title}</span>
                                            <span style={{ color: "#94a3b8", fontWeight: 500 }}>을(를) 학습 중</span>
                                        </div>
                                        {f.unit_title && (
                                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {f.unit_title}{f.page_title && ` · ${f.page_title}`}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                                        {timeAgo(f.started_at)}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && data && data.sessionsToday === 0 && (
                    <div style={{
                        textAlign: "center", padding: 40, borderRadius: 12,
                        background: "#f8fafc", border: "2px dashed #cbd5e1",
                        color: "#64748b", fontSize: 14,
                    }}>
                        최근 24시간 내 학습 기록이 아직 없습니다. 학생들이 학습을 시작하면 자동으로 표시됩니다.
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.6; }
                }
            `}</style>
        </section>
    );
}
