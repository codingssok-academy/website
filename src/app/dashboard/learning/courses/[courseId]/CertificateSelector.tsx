"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { CERTIFICATE_SUB_COURSES, type CertificateSubCourse } from "@/data/courses";

/* ── 3D 책 상수 ── */
const T = 44;   // thickness (px)
const R = 6;    // corner radius (px)

/* ── 자격증별 책 커버 설정 ── */
const CERT_BOOK_META: Record<string, {
    spineLabel: string;
    coverLines: string[];
    badgeText: string;
    badgeColor: string;
}> = {
    "cert-wordprocessor": {
        spineLabel: "워드프로세서",
        coverLines: ["워드프로세서", "필기"],
        badgeText: "84회분",
        badgeColor: "rgba(37,99,235,0.9)",
    },
    "cert-computer-2": {
        spineLabel: "컴활2급",
        coverLines: ["컴퓨터활용능력", "2급"],
        badgeText: "125회분",
        badgeColor: "rgba(5,150,105,0.9)",
    },
    "cert-programming": {
        spineLabel: "프로그래밍기능사",
        coverLines: ["프로그래밍", "기능사"],
        badgeText: "84회분",
        badgeColor: "rgba(220,38,38,0.9)",
    },
};

function CertBookCard({
    sub,
    index,
    onClick,
}: {
    sub: CertificateSubCourse;
    index: number;
    onClick: () => void;
}) {
    const [flipped, setFlipped] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<HTMLDivElement>(null);
    const isTouchRef = useRef(false);

    const colors = sub.gradient.match(/#[0-9a-fA-F]{6}/g) || ["#3b82f6"];
    const spineColor = colors[0];
    const spineColor2 = colors[1] ?? colors[0];
    const spineColorDark = `color-mix(in srgb, ${spineColor} 65%, #000)`;
    const meta = CERT_BOOK_META[sub.id] ?? {
        spineLabel: sub.title,
        coverLines: [sub.title],
        badgeText: `${sub.totalRounds}회분`,
        badgeColor: "rgba(59,130,246,0.9)",
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current || !bookRef.current || flipped) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotY = -35 + (x - 0.5) * 20;
        const rotX = 10 - (y - 0.5) * 12;
        bookRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    }, [flipped]);

    const handleMouseLeave = useCallback(() => {
        if (!bookRef.current || isTouchRef.current) return;
        bookRef.current.style.transform = flipped
            ? `rotateY(160deg) rotateX(0deg)`
            : `rotateY(-35deg) rotateX(10deg)`;
        setFlipped(false);
    }, [flipped]);

    const handleClick = useCallback(() => {
        if (!flipped) {
            setFlipped(true);
            if (bookRef.current) {
                bookRef.current.style.transform = `rotateY(160deg) rotateX(0deg)`;
            }
        } else {
            onClick();
        }
    }, [flipped, onClick]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        isTouchRef.current = true;
        handleClick();
    }, [handleClick]);

    return (
        <div
            ref={containerRef}
            className={`cert-scene cert-s${index}`}
            style={{
                "--spine": spineColor,
                "--spine2": spineColor2,
                "--spine-dark": spineColorDark,
                "--shadow-c": `${spineColor}55`,
            } as React.CSSProperties}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            onTouchEnd={handleTouchEnd}
        >
            <div ref={bookRef} className="cert-bk">

                {/* ── 앞표지 ── */}
                <div className="cert-face cert-front">
                    {/* 배경 그라데이션 */}
                    <div style={{ position: "absolute", inset: 0, background: sub.gradient }} />

                    {/* 광택 효과 */}
                    <div className="cert-shine" />

                    {/* 엣지 음영 */}
                    <div style={{
                        position: "absolute", inset: 0, zIndex: 1,
                        background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%)",
                    }} />

                    {/* 아이콘 */}
                    <div style={{
                        position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)",
                        zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: "rgba(255,255,255,0.18)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#fff" }}>{sub.icon}</span>
                        </div>
                    </div>

                    {/* 제목 (책 아랫부분) */}
                    <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3,
                        padding: "12px 10px 14px",
                    }}>
                        {meta.coverLines.map((line, i) => (
                            <div key={i} style={{
                                fontSize: i === 0 ? "clamp(11px,1vw,14px)" : "clamp(13px,1.2vw,17px)",
                                fontWeight: i === 0 ? 600 : 800,
                                color: i === 0 ? "rgba(255,255,255,0.8)" : "#fff",
                                textShadow: "0 1px 6px rgba(0,0,0,0.6)",
                                lineHeight: 1.25,
                                letterSpacing: "-0.01em",
                            }}>{line}</div>
                        ))}
                    </div>

                    {/* 회분 배지 */}
                    <div style={{
                        position: "absolute", top: 12, right: 10, zIndex: 4,
                        background: meta.badgeColor,
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 6,
                        padding: "3px 7px",
                        fontSize: 9, fontWeight: 800, color: "#fff",
                        letterSpacing: 0.5,
                    }}>
                        {meta.badgeText}
                    </div>
                </div>

                {/* ── 책등 (spine) ── */}
                <div className="cert-face cert-spine">
                    <div style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        transform: "rotate(180deg)",
                        fontSize: "clamp(8px,0.7vw,10px)",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.85)",
                        letterSpacing: 1,
                        textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        maxHeight: "90%",
                    }}>
                        {meta.spineLabel}
                    </div>
                </div>

                {/* ── 페이지 엣지 ── */}
                <div className="cert-face cert-pages" />

                {/* ── 상단 엣지 ── */}
                <div className="cert-face cert-top" />

                {/* ── 하단 엣지 ── */}
                <div className="cert-face cert-bottom" />

                {/* ── 뒤표지 ── */}
                <div className="cert-face cert-back">
                    <div style={{ position: "absolute", inset: 0, background: sub.gradient }} />
                    <div style={{
                        position: "absolute", inset: 0, zIndex: 1,
                        background: "rgba(10,15,30,0.80)",
                        backdropFilter: "blur(16px)",
                    }} />
                    <div style={{
                        position: "relative", zIndex: 2,
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: 8,
                        padding: "clamp(10px,1.2vw,16px)", height: "100%", textAlign: "center",
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: sub.gradient,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: `0 4px 12px ${spineColor}50`,
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#fff" }}>{sub.icon}</span>
                        </div>
                        <div style={{ fontSize: "clamp(12px,1.1vw,16px)", fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>
                            {sub.title}
                        </div>
                        <div style={{ fontSize: "clamp(9px,0.7vw,11px)", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                            {sub.description}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>quiz</span>
                            <span style={{ fontSize: "clamp(9px,0.75vw,11px)", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                                {sub.totalRounds}회분 모의고사
                            </span>
                        </div>
                        <button
                            className="cert-back-btn"
                            style={{ marginTop: 4, background: sub.gradient }}
                            onClick={e => { e.stopPropagation(); onClick(); }}
                        >
                            시험 시작 →
                        </button>
                    </div>
                </div>
            </div>

            {/* 바닥 그림자 */}
            <div className="cert-shadow" />
        </div>
    );
}

export default function CertificateSelector() {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    // 마운트 후 entrance 애니메이션 트리거
    const containerRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            requestAnimationFrame(() => setReady(true));
        }
    }, []);

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(145deg,#f0f4ff,#e8efff 40%,#eff6ff 70%,#f0f4ff)",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            position: "relative",
            overflow: "hidden",
        }}>
            {/* 배경 장식 */}
            <div style={{
                position: "absolute", width: 400, height: 400,
                top: "-10%", right: "-5%",
                background: "radial-gradient(circle,rgba(147,197,253,0.12),transparent 70%)",
                borderRadius: "50%", pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", width: 400, height: 400,
                bottom: "-10%", left: "-5%",
                background: "radial-gradient(circle,rgba(196,181,253,0.09),transparent 70%)",
                borderRadius: "50%", pointerEvents: "none",
            }} />

            <style>{`
                /* ── 씬 컨테이너 ── */
                .cert-scene {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    perspective: 1600px;
                    cursor: pointer;
                    position: relative;
                    padding-bottom: 24px;
                    /* 등장 애니메이션 */
                    opacity: 0;
                    transform: translateY(32px);
                    transition: opacity .55s ease, transform .55s ease;
                }
                .cert-ready .cert-scene { opacity: 1; transform: translateY(0); }
                .cert-ready .cert-s0 { transition-delay: .05s; }
                .cert-ready .cert-s1 { transition-delay: .15s; }
                .cert-ready .cert-s2 { transition-delay: .25s; }

                /* 유유히 떠다니는 애니메이션 */
                @keyframes cert-float {
                    0%,100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .cert-ready .cert-scene {
                    animation: cert-float 4.2s ease-in-out infinite;
                }
                .cert-ready .cert-s1 { animation-delay: .7s; }
                .cert-ready .cert-s2 { animation-delay: 1.4s; }
                .cert-scene:hover { animation-play-state: paused !important; }

                /* ── 책 ── */
                .cert-bk {
                    width: clamp(145px, 14vw, 195px);
                    height: clamp(200px, 19vw, 265px);
                    position: relative;
                    transform-style: preserve-3d;
                    transform: rotateY(-35deg) rotateX(10deg);
                    transition: transform .5s cubic-bezier(.23,1,.32,1);
                }

                /* ── 공통 face ── */
                .cert-face { position: absolute; display: block; }

                /* ── 앞표지 ── */
                .cert-front {
                    width: 100%; height: 100%;
                    transform: translateZ(${T / 2}px);
                    border-radius: 2px ${R}px ${R}px 2px;
                    overflow: hidden;
                    box-shadow: inset -5px 0 15px rgba(0,0,0,0.28);
                    z-index: 2;
                }
                /* 엣지 하이라이트 */
                .cert-front::before {
                    content: '';
                    position: absolute; inset: 0; z-index: 5; pointer-events: none;
                    background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.18) 100%);
                }

                /* 메탈릭 광택 스윕 */
                @keyframes cert-shine {
                    0%   { background-position: -200% -200%; }
                    100% { background-position: 200% 200%; }
                }
                .cert-shine {
                    position: absolute; inset: 0; z-index: 2; pointer-events: none;
                    background: linear-gradient(
                        135deg,
                        rgba(255,255,255,0) 0%,
                        rgba(255,255,255,0.07) 42%,
                        rgba(255,255,255,0.32) 50%,
                        rgba(255,255,255,0.07) 58%,
                        rgba(255,255,255,0) 100%
                    );
                    background-size: 200% 200%;
                    animation: cert-shine 5s linear infinite;
                    opacity: 0.75;
                }

                /* ── 책등 ── */
                .cert-spine {
                    width: ${T}px; height: 100%;
                    left: -${T / 2}px; top: 0;
                    transform: rotateY(-90deg);
                    background: linear-gradient(180deg, var(--spine), var(--spine-dark));
                    border-radius: ${R}px 0 0 ${R}px;
                    box-shadow: inset 0 0 20px rgba(0,0,0,0.45);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* ── 페이지 엣지 ── */
                .cert-pages {
                    width: ${T}px; height: 100%;
                    right: -${T / 2}px; top: 0;
                    transform: rotateY(90deg);
                    background:
                        linear-gradient(to right, rgba(0,0,0,0.08), transparent),
                        repeating-linear-gradient(to right, #e5e5e5 0px, #fff 1.5px, #ddd 3px);
                    background-size: 100% 100%, 4px 100%;
                    box-shadow: inset 5px 0 15px rgba(0,0,0,0.12);
                }

                /* ── 상단 엣지 ── */
                .cert-top {
                    width: 100%; height: ${T}px;
                    top: -${T / 2}px; left: 0;
                    transform: rotateX(90deg);
                    background: #e8e8e8;
                    background-image: repeating-linear-gradient(to bottom, #ccc 0px, #eee 1px, #fff 2px);
                }

                /* ── 하단 엣지 ── */
                .cert-bottom {
                    width: 100%; height: ${T}px;
                    bottom: -${T / 2}px; left: 0;
                    transform: rotateX(-90deg);
                    background: #e0e0e0;
                    background-image: repeating-linear-gradient(to top, #ccc 0px, #eee 1px, #fff 2px);
                }

                /* ── 뒤표지 ── */
                .cert-back {
                    width: 100%; height: 100%;
                    transform: translateZ(-${T / 2}px) rotateY(180deg);
                    border-radius: ${R}px 2px 2px ${R}px;
                    overflow: hidden;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }

                /* ── 입장 버튼 ── */
                .cert-back-btn {
                    padding: 7px 18px;
                    border-radius: 8px;
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    font-size: clamp(9px, 0.75vw, 12px);
                    font-weight: 800;
                    letter-spacing: 0.02em;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                    transition: transform .15s ease, box-shadow .15s ease;
                }
                .cert-back-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 18px rgba(0,0,0,0.3);
                }

                /* ── 바닥 그림자 ── */
                .cert-shadow {
                    position: absolute;
                    bottom: 4px; left: 12%;
                    width: 76%; height: 16px;
                    background: var(--shadow-c, rgba(0,0,0,0.14));
                    filter: blur(12px);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: -1;
                }

                /* ── 라벨 (책 아래) ── */
                .cert-label {
                    margin-top: 14px;
                    display: flex; flex-direction: column; align-items: center; gap: 3px;
                    text-align: center;
                }
                .cert-label-title {
                    font-size: clamp(12px,1.1vw,15px);
                    font-weight: 800; color: #1e293b;
                    letter-spacing: -0.01em;
                }
                .cert-label-sub {
                    font-size: clamp(9px,0.7vw,11px);
                    color: #94a3b8; font-weight: 500;
                }

                /* ── 힌트 바 ── */
                .cert-hint {
                    font-size: 10px; color: #94a3b8;
                    display: flex; align-items: center; gap: 4px;
                }
            `}</style>

            {/* 헤더 */}
            <div style={{ padding: "40px 24px 0", maxWidth: 860, margin: "0 auto" }}>
                <Link
                    href="/dashboard/learning"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 14, color: "#64748b", textDecoration: "none",
                        marginBottom: 24,
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(226,232,240,0.6)",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                    학습 목록
                </Link>

                <div style={{
                    padding: "20px 24px",
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.7)",
                    borderRadius: 20,
                    boxShadow: "0 4px 24px rgba(59,130,246,0.07)",
                    marginBottom: 8,
                }}>
                    <h1 style={{ margin: 0, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 800, color: "#0f172a" }}>
                        자격증 모의고사
                    </h1>
                    <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                        워드프로세서 · 컴퓨터활용능력 2급 · 프로그래밍기능사 — 총 293회분
                    </p>
                </div>
            </div>

            {/* 3D 책 그리드 */}
            <div
                ref={containerRef}
                className={ready ? "cert-ready" : ""}
                style={{
                    padding: "48px 24px 20px",
                    maxWidth: 860,
                    margin: "0 auto",
                    display: "flex",
                    justifyContent: "space-evenly",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    gap: "16px 0",
                }}
            >
                {CERTIFICATE_SUB_COURSES.map((sub, i) => (
                    <div key={sub.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <CertBookCard
                            sub={sub}
                            index={i}
                            onClick={() => router.push(`/dashboard/learning/courses/7?cert=${sub.id}`)}
                        />
                        {/* 책 아래 라벨 */}
                        <div className="cert-label">
                            <span className="cert-label-title">{sub.title}</span>
                            <span className="cert-label-sub">{sub.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 힌트 */}
            <div style={{
                display: "flex", justifyContent: "center", gap: 20,
                padding: "4px 0 40px", opacity: 0.45,
            }}>
                <span className="cert-hint">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>swipe</span>
                    호버 — 3D 회전 / 클릭 — 뒤집기
                </span>
                <span className="cert-hint">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>touch_app</span>
                    재클릭 — 진입
                </span>
            </div>
        </div>
    );
}
