"use client";

/**
 * HeroContinuation — Hero 섹션 바로 아래 "자연스러운 연결" 섹션
 *
 * 피드백 L1-3: 기존 비디오 섹션(VideoHighlight) 제거 요청 + hero 배경과 자연 연결.
 *
 * 디자인 컨셉:
 * - Hero의 화이트 + 블루/퍼플 그라데이션 오브 연속
 * - 비디오 파일 의존성 0
 * - 학습 플랫폼의 핵심 3가지 가치를 카드 3개로 제시
 * - framer-motion scroll-linked 진입 애니메이션
 */

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

const FEATURES = [
    {
        icon: "school",
        title: "맞춤형 커리큘럼",
        desc: "컴퓨터기초부터 알고리즘 대회, 자격증까지 10개 코스 291+ 유닛",
        gradient: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
        iconColor: "#1d4ed8",
    },
    {
        icon: "terminal",
        title: "브라우저 컴파일러",
        desc: "C · Python 즉시 실행. 설치 없이 한글 입력까지 지원",
        gradient: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
        iconColor: "#15803d",
    },
    {
        icon: "trending_up",
        title: "진도 자동 추적",
        desc: "노트·소스코드·답안·학습 기록이 모두 DB에 영구 저장",
        gradient: "linear-gradient(135deg, #fef3c7, #fde68a)",
        iconColor: "#b45309",
    },
];

export default function HeroContinuation() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    const sectionOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.5]);

    return (
        <motion.section
            ref={ref}
            aria-label="학습 플랫폼 소개"
            style={{
                position: "relative",
                background: "#ffffff",
                padding: "clamp(80px, 12vw, 160px) 24px",
                overflow: "hidden",
                opacity: sectionOpacity,
            }}
        >
            {/* 배경: 순수 화이트 — 오브/그리드 전부 제거 (피드백: "모든 섹션 헤로 전부 화이트") */}

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    maxWidth: 1200,
                    margin: "0 auto",
                }}
            >
                {/* 섹션 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: "center", marginBottom: 64 }}
                >
                    <div
                        style={{
                            display: "inline-block",
                            padding: "6px 16px",
                            borderRadius: 999,
                            background: "rgba(59,130,246,0.08)",
                            color: "#1d4ed8",
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            marginBottom: 16,
                        }}
                    >
                        LEARNING PLATFORM
                    </div>
                    <h2
                        style={{
                            fontSize: "clamp(30px, 5vw, 48px)",
                            fontWeight: 900,
                            color: "#0f172a",
                            margin: "0 0 16px",
                            letterSpacing: -1.2,
                            lineHeight: 1.2,
                        }}
                    >
                        수업 시간 밖에서도<br />계속 자라는 학습
                    </h2>
                    <p
                        style={{
                            fontSize: "clamp(14px, 1.6vw, 17px)",
                            color: "#64748b",
                            margin: 0,
                            lineHeight: 1.7,
                            maxWidth: 580,
                            marginLeft: "auto",
                            marginRight: "auto",
                        }}
                    >
                        코딩쏙 학생은 학원 수업 외에도 24시간 접속 가능한<br />
                        자체 학습 플랫폼에서 직접 문제를 풀고, 코드를 실행하고, 진도를 관리합니다.
                    </p>
                </motion.div>

                {/* 3 카드 그리드 */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 24,
                        marginBottom: 56,
                    }}
                >
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.6, delay: i * 0.12 }}
                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                            style={{
                                position: "relative",
                                padding: "32px 28px",
                                borderRadius: 24,
                                background: "rgba(255,255,255,0.7)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                border: "1px solid rgba(226,232,240,0.6)",
                                boxShadow: "0 4px 24px rgba(15,23,42,0.04)",
                            }}
                        >
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 16,
                                    background: f.gradient,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 20,
                                }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{
                                        fontSize: 28,
                                        color: f.iconColor,
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                >
                                    {f.icon}
                                </span>
                            </div>
                            <h3
                                style={{
                                    fontSize: 20,
                                    fontWeight: 900,
                                    color: "#0f172a",
                                    margin: "0 0 10px",
                                    letterSpacing: -0.3,
                                }}
                            >
                                {f.title}
                            </h3>
                            <p
                                style={{
                                    fontSize: 14,
                                    color: "#64748b",
                                    margin: 0,
                                    lineHeight: 1.7,
                                }}
                            >
                                {f.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    style={{ textAlign: "center" }}
                >
                    <Link
                        href="/dashboard/learning"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "16px 36px",
                            borderRadius: 999,
                            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: 800,
                            textDecoration: "none",
                            boxShadow: "0 12px 32px rgba(37,99,235,0.25)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <span>학습 플랫폼 체험하기</span>
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 20 }}
                        >
                            arrow_forward
                        </span>
                    </Link>
                </motion.div>
            </div>
        </motion.section>
    );
}
