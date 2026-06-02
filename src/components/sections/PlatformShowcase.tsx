"use client";

/**
 * PlatformShowcase 섹션
 * 학습 플랫폼 실제 통계 — COURSES 데이터에서 자동 집계
 * 학원 운영자가 코스를 추가/수정하면 자동으로 수치 갱신
 */

import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import Link from "next/link";
import { COURSES } from "@/data/courses";

export default function PlatformShowcase() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref, { once: true, margin: "-100px" });

    const stats = useMemo(() => {
        const active = COURSES.filter(c => !c.comingSoon);
        const totalUnits = active.reduce((s, c) => s + (c.totalUnits || 0), 0);
        const totalProblems = active.reduce((s, c) => s + (c.totalProblems || 0), 0);
        const totalHours = active.reduce((s, c) => s + (c.estimatedHours || 0), 0);
        return {
            courses: active.length,
            units: totalUnits,
            problems: totalProblems,
            hours: totalHours,
        };
    }, []);

    const featured = COURSES.filter(c => !c.comingSoon).slice(0, 6);

    return (
        <section ref={ref} style={{
            padding: "clamp(80px, 10vw, 140px) 20px",
            background: "#ffffff",
        }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {/* 헤더 */}
                <div style={{ textAlign: "center", marginBottom: 60 }}>
                    <div style={{
                        display: "inline-block", padding: "6px 16px", borderRadius: 999,
                        background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                        color: "#1d4ed8", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                        marginBottom: 16,
                    }}>
                        LEARNING PLATFORM · 자체 학습 시스템
                    </div>
                    <h2 style={{
                        fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900,
                        color: "#0f172a", margin: "0 0 12px", letterSpacing: -1,
                    }}>
                        수업 + 자습이 한 곳에서
                    </h2>
                    <p style={{ fontSize: 15, color: "#64748b", margin: 0, lineHeight: 1.7 }}>
                        코딩쏙 학생은 학원 수업 외에도 24/7 접속 가능한 학습 플랫폼에서<br />
                        교재, 문제집, 컴파일러, 진도 관리, 자격증 모의고사를 모두 사용합니다.
                    </p>
                </div>

                {/* 통계 — 실데이터 자동 집계 */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16, marginBottom: 60,
                }}>
                    {[
                        { value: stats.courses, suffix: "개", label: "운영 코스" },
                        { value: stats.units, suffix: "개", label: "학습 유닛" },
                        { value: stats.problems, suffix: "+", label: "코딩 문제" },
                        { value: stats.hours, suffix: "h", label: "총 학습 시간" },
                    ].map(s => (
                        <div key={s.label} style={{
                            padding: "28px 20px", textAlign: "center",
                            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                            borderRadius: 16, border: "1px solid #bfdbfe",
                        }}>
                            <div style={{ fontSize: 40, fontWeight: 900, color: "#1d4ed8", letterSpacing: -1 }}>
                                {inView && <CountUp end={s.value} duration={2} separator="," />}{s.suffix}
                            </div>
                            <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 700, marginTop: 4 }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 코스 카드 */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 20, marginBottom: 40,
                }}>
                    {featured.map((c, i) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                                borderRadius: 16, overflow: "hidden",
                                background: "#fff", border: "1px solid #e2e8f0",
                                boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
                            }}
                        >
                            <div style={{
                                aspectRatio: "16/10",
                                background: c.gradient,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {c.cardImage && (
                                    <img src={c.cardImage} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                )}
                            </div>
                            <div style={{ padding: 16 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>
                                    {c.title}
                                </h3>
                                <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 12px", lineHeight: 1.5,
                                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                }}>
                                    {c.description}
                                </p>
                                <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>
                                    {c.totalUnits > 0 && <span>{c.totalUnits}유닛</span>}
                                    {c.estimatedHours > 0 && <span>⏱ {c.estimatedHours}h</span>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <div style={{ textAlign: "center" }}>
                    <Link
                        href="/dashboard/learning"
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "16px 32px", borderRadius: 999,
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none",
                            boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
                        }}
                    >
                        학습 플랫폼 둘러보기 →
                    </Link>
                </div>
            </div>
        </section>
    );
}
