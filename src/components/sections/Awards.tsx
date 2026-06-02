"use client";

/**
 * Awards Section — 3D 회전 슬라이드 갤러리
 * 무한 자동 슬라이드 + 마우스 3D 틸트 + 스프링 물리
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";

const AWARDS = [
    { src: "/images/awards/award-koi-silver.jpg", title: "한국정보올림피아드", desc: "전국부문 은상", year: "2022" },
    { src: "/images/awards/award-algo-gold-2024.jpg", title: "전국 중학생 알고리즘 경진대회", desc: "금상 (2위)", year: "2024" },
    { src: "/images/awards/award-algo-grand-2021.jpg", title: "전국 중학생 알고리즘 경진대회", desc: "대상 (1위)", year: "2021" },
    { src: "/images/awards/award-algo-gold-2021.jpg", title: "전국 중학생 알고리즘 경진대회", desc: "금상 (2위)", year: "2021" },
    { src: "/images/awards/award-3.jpg", title: "프로그래밍 경진대회", desc: "수상", year: "2024" },
    { src: "/images/awards/award-5.jpg", title: "코딩 경진대회", desc: "수상", year: "2021" },
    { src: "/images/awards/award-6.jpg", title: "소프트웨어 대회", desc: "수상", year: "2021" },
    { src: "/images/awards/award-7.jpg", title: "IT 경진대회", desc: "수상", year: "2021" },
    { src: "/images/awards/award-9.jpg", title: "알고리즘 대회", desc: "수상", year: "2021" },
    { src: "/images/awards/award-10.jpg", title: "프로그래밍 대회", desc: "수상", year: "2021" },
    { src: "/images/awards/award-11.jpg", title: "코딩 대회", desc: "수상", year: "2021" },
    { src: "/images/awards/award-12.jpg", title: "SW 경진대회", desc: "수상", year: "2021" },
];

function AwardCard({ award, isCenter }: { award: typeof AWARDS[0]; isCenter: boolean }) {
    const mx = useMotionValue(0.5);
    const my = useMotionValue(0.5);
    const rotateX = useSpring(useTransform(my, [0, 1], [12, -12]), { stiffness: 300, damping: 25 });
    const rotateY = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 300, damping: 25 });
    const shineX = useTransform(mx, [0, 1], [-50, 150]);

    const onMove = useCallback((e: React.MouseEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
    }, [mx, my]);

    return (
        <motion.div
            onMouseMove={onMove}
            onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
            style={{
                rotateX, rotateY,
                transformStyle: "preserve-3d",
                perspective: 800,
                width: 280,
                flexShrink: 0,
                cursor: "pointer",
            }}
            whileHover={{ scale: 1.05, z: 30 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div style={{
                borderRadius: 16,
                overflow: "hidden",
                background: "#fff",
                boxShadow: isCenter
                    ? "0 20px 60px rgba(37,99,235,0.2), 0 0 0 2px rgba(37,99,235,0.1)"
                    : "0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.4s",
                position: "relative",
            }}>
                {/* 홀로그래픽 쉬머 */}
                <motion.div style={{
                    position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                    background: useTransform(shineX, v =>
                        `linear-gradient(120deg, transparent ${v - 30}%, rgba(255,255,255,0.4) ${v}%, transparent ${v + 30}%)`
                    ),
                    borderRadius: 16,
                }} />

                {/* 이미지 */}
                <div style={{ position: "relative", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={award.src}
                        alt={award.title}
                        style={{
                            width: "100%",
                            height: 360,
                            objectFit: "cover",
                            objectPosition: "top",
                            display: "block",
                        }}
                    />
                    {/* 하단 그라데이션 */}
                    <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
                        background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    }} />
                    {/* 연도 배지 제거됨 */}
                    {/* 텍스트 */}
                    <div style={{
                        position: "absolute", bottom: 12, left: 14, right: 14,
                        color: "#fff",
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 2 }}>
                            {award.title}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.02em" }}>
                            {award.desc}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function Awards() {
    const trackRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);
    const [paused, setPaused] = useState(false);
    const speed = 0.5; // px per frame

    // 무한 스크롤 애니메이션
    useEffect(() => {
        let raf: number;
        const totalWidth = AWARDS.length * 300; // 카드 280 + gap 20

        const animate = () => {
            if (!paused) {
                setOffset(prev => {
                    const next = prev - speed;
                    return next <= -totalWidth ? 0 : next;
                });
            }
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [paused]);

    // 카드 2배로 복제 (무한 루프)
    const doubled = [...AWARDS, ...AWARDS];

    return (
        <section id="awards" style={{
            padding: "clamp(50px, 6vw, 80px) 0",
            background: "#fff",
            overflow: "hidden",
            position: "relative",
        }}>
            {/* 헤더 */}
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: 24, color: "#f59e0b",
                        fontVariationSettings: "'FILL' 1",
                    }}>emoji_events</span>
                    <span style={{
                        fontSize: 11, fontWeight: 800, color: "#2563eb",
                        letterSpacing: "0.15em", textTransform: "uppercase",
                    }}>
                        STUDENT ACHIEVEMENTS
                    </span>
                </div>
                <h2 style={{
                    fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900,
                    color: "#0f172a", margin: 0, lineHeight: 1.2,
                }}>
                    코딩쏙 학생들의 수상 실적
                </h2>
                <p style={{ fontSize: 15, color: "#64748b", marginTop: 8, maxWidth: 500 }}>
                    정보올림피아드, 전국 알고리즘 대회 등에서 꾸준히 성과를 내고 있습니다.
                </p>
            </div>

            {/* 3D 슬라이드 트랙 */}
            <div
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                style={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                    padding: "20px 0 30px",
                }}
            >
                {/* 좌우 페이드 */}
                <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 80,
                    background: "linear-gradient(to right, #fff, transparent)",
                    zIndex: 10, pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", right: 0, top: 0, bottom: 0, width: 80,
                    background: "linear-gradient(to left, #fff, transparent)",
                    zIndex: 10, pointerEvents: "none",
                }} />

                <div
                    ref={trackRef}
                    style={{
                        display: "flex",
                        gap: 20,
                        transform: `translateX(${offset}px)`,
                        willChange: "transform",
                    }}
                >
                    {doubled.map((award, i) => (
                        <AwardCard
                            key={`${award.src}-${i}`}
                            award={award}
                            isCenter={Math.abs(offset + i * 300 + 150) < 200}
                        />
                    ))}
                </div>
            </div>

            {/* 통계 바 */}
            <div style={{
                maxWidth: 1200, margin: "0 auto", padding: "0 20px",
                display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap",
                marginTop: 20,
            }}>
                {[
                    { icon: "emoji_events", label: "수상 실적", value: "12건+", color: "#f59e0b" },
                    { icon: "military_tech", label: "대상/금상", value: "4회", color: "#2563eb" },
                    { icon: "school", label: "참여 학생", value: "8명+", color: "#10b981" },
                ].map(s => (
                    <div key={s.label} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: 13, fontWeight: 700, color: "#334155",
                    }}>
                        <span className="material-symbols-outlined" style={{
                            fontSize: 18, color: s.color,
                            fontVariationSettings: "'FILL' 1",
                        }}>{s.icon}</span>
                        {s.label}
                        <strong style={{ color: s.color, fontSize: 15 }}>{s.value}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}
