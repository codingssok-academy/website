"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

interface RealReview {
    id: string;
    platform: "naver" | "google" | "kakao";
    rating: number;
    author: string;
    content: string;
    reply: string | null;
    review_date: string;
}

const REAL_PLATFORM_META: Record<string, { name: string; color: string }> = {
    naver: { name: "네이버", color: "#03C75A" },
    google: { name: "구글", color: "#4285F4" },
    kakao: { name: "카카오", color: "#FEE500" },
};

/* ═══════════════════════════════════════════
   Reviews — Ultra-Nexus Prismatic Review Lab V3.0
   Isometric logos · Liquid-fill bars · Tech-mono
   ═══════════════════════════════════════════ */

const REVIEWS = [
    {
        name: "Naver SmartPlace",
        nameKo: "네이버 스마트플레이스",
        logo: "N",
        logoStyle: "rv-logo-naver",
        nodeId: "네이버 인증",
        nodeStyle: { background: "rgba(3,199,90,0.1)", color: "#03C75A", border: "1px solid rgba(3,199,90,0.2)" },
        subtext: "학원 검색 1위",
        score: 4.9,
        fill: 98,
        barGrad: "linear-gradient(to right, #03C75A, #4ade80)",
        glowBg: "rgba(34,197,94,0.1)",
        dotBg: "#22c55e",
        integrity: "152건",
        latency: "최신",
        status: "인증완료",
        metaLabel1: "리뷰 수",
        metaLabel2: "업데이트",
    },
    {
        name: "Google Reviews",
        nameKo: "구글 리뷰",
        logo: "G",
        logoStyle: "rv-logo-google",
        nodeId: "글로벌 인증",
        nodeStyle: { background: "rgba(59,130,246,0.1)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.2)" },
        subtext: "전국 코딩학원 상위",
        score: 4.8,
        fill: 96,
        barGrad: "linear-gradient(to right, #3b82f6, #3b82f6)",
        glowBg: "rgba(59,130,246,0.1)",
        dotBg: "#3b82f6",
        integrity: "89건",
        latency: "2.4천",
        status: "인증완료",
        metaLabel1: "리뷰 수",
        metaLabel2: "조회수",
    },
    {
        name: "Kakao Map",
        nameKo: "카카오맵",
        logo: "K",
        logoStyle: "rv-logo-daum",
        nodeId: "지역 인증",
        nodeStyle: { background: "rgba(6,182,212,0.1)", color: "#0891b2", border: "1px solid rgba(6,182,212,0.2)" },
        subtext: "대전 코딩학원 1위",
        score: 5.0,
        fill: 100,
        barGrad: "linear-gradient(to right, #06b6d4, #3b82f6)",
        glowBg: "rgba(6,182,212,0.1)",
        dotBg: "#06b6d4",
        integrity: "만점",
        latency: "최근",
        status: "인증완료",
        metaLabel1: "평점",
        metaLabel2: "업데이트",
    },
];

export default function Reviews() {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    const [realReviews, setRealReviews] = useState<RealReview[]>([]);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/reviews")
            .then(r => r.json())
            .then(d => { if (!cancelled) setRealReviews(d.reviews || []); })
            .catch(() => { /* silent */ });
        return () => { cancelled = true; };
    }, []);

    return (
        <section ref={ref} id="reviews" className="rv-section">

            {/* BG */}
            <div className="rv-bg" aria-hidden>
                <div className="rv-grid" />
                <div className="rv-orb rv-orb1" />
                <div className="rv-orb rv-orb2" />
                <div className="rv-hue-layer" />
            </div>

            <div className="rv-container">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="rv-header"
                >
                    <div className="rv-sys-badge">
                        <span className="rv-ping-wrap">
                            <span className="rv-ping" /><span className="rv-ping-dot" />
                        </span>
                        <span className="rv-sys-text">실시간 리뷰 현황</span>
                    </div>
                    <h2 className="rv-title">플랫폼 리뷰</h2>
                    <p className="rv-subtitle">네이버 · 구글 · 다음 공식 인증 리뷰</p>
                </motion.header>

                {/* Cards */}
                <div className="rv-cards">
                    {/* Vertical timeline line */}
                    <div className="rv-timeline-line" />

                    {REVIEWS.map((r, i) => (
                        <motion.div
                            key={r.name}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ delay: 0.15 * i, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                            className="rv-card"
                        >
                            {/* Colored glow */}
                            <div className="rv-card-glow" style={{ background: r.glowBg }} />

                            <div className="rv-card-inner">
                                {/* Logo */}
                                <div className="rv-logo-area group">
                                    <div className={`rv-logo-box ${r.logoStyle}`}>
                                        {r.logoStyle === 'rv-logo-naver' && (
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36" style={{ position: 'relative', zIndex: 2 }}>
                                                <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                                            </svg>
                                        )}
                                        {r.logoStyle === 'rv-logo-google' && (
                                            <svg viewBox="0 0 24 24" width="36" height="36" style={{ position: 'relative', zIndex: 2 }}>
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                        )}
                                        {r.logoStyle === 'rv-logo-daum' && (
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36" style={{ position: 'relative', zIndex: 2 }}>
                                                <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6-.15.56-.55 2.03-.63 2.35-.1.4.15.39.31.28.13-.08 2.04-1.38 2.87-1.94.59.09 1.2.13 1.8.13 5.52 0 10-3.58 10-7.9S17.52 3 12 3z" />
                                            </svg>
                                        )}
                                        <div className="rv-logo-shine" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="rv-content">
                                    {/* Title row */}
                                    <div className="rv-title-row">
                                        <div>
                                            <h3 className="rv-card-title">
                                                {r.name}
                                                <span className="rv-node-id" style={r.nodeStyle}>{r.nodeId}</span>
                                            </h3>
                                            <div className="rv-subtext-row">
                                                {r.subtext.split("").map((ch, ci) => (
                                                    <span key={ci} className="rv-char" style={{ animationDelay: `${ci * 0.05 + 0.1}s` }}>{ch}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="rv-score">
                                            <span className="rv-score-num">{r.score}</span>
                                            <span className="rv-score-max">/5</span>
                                        </div>
                                    </div>

                                    {/* Liquid bar */}
                                    <div className="rv-bar-track">
                                        <motion.div
                                            className="rv-bar-fill"
                                            style={{ background: r.barGrad }}
                                            initial={{ width: 0 }}
                                            animate={isInView ? { width: `${r.fill}%` } : {}}
                                            transition={{ delay: 0.3 + i * 0.2, duration: 1.2, ease: "easeOut" }}
                                        />
                                        <div className="rv-bar-shine" />
                                    </div>

                                    {/* Meta row */}
                                    <div className="rv-meta">
                                        <div className="rv-meta-left">
                                            <span className="rv-meta-item">
                                                <span className="rv-meta-dot" style={{ background: r.dotBg }} />
                                                {r.metaLabel1}: {r.integrity}
                                            </span>
                                            <span className="rv-meta-item">
                                                {r.metaLabel2}: {r.latency}
                                            </span>
                                        </div>
                                        <span className="rv-meta-status">{r.status}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Floating decorations */}
                    <div className="rv-deco rv-deco1"><span className="material-symbols-outlined">star</span></div>
                    <div className="rv-deco rv-deco2"><span className="material-symbols-outlined">auto_awesome</span></div>
                    <div className="rv-deco rv-deco3"><span className="material-symbols-outlined">pentagon</span></div>
                </div>

                {/* Footer status */}
                <div className="rv-footer">
                    <div className="rv-footer-left">
                        <span className="rv-footer-item"><span className="rv-footer-dot" />실시간 리뷰 현황</span>
                        <span className="rv-footer-item">플랫폼 인증 리뷰</span>
                    </div>
                    <div className="rv-footer-right">
                        <span>최종 업데이트</span>
                        <span>인증 완료</span>
                    </div>
                </div>

                {/* 실제 리뷰 리스트 — academy_reviews 테이블에서 관리자가 입력한 실데이터 */}
                {realReviews.length > 0 && (
                    <div style={{ marginTop: 60 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", textAlign: "center", margin: "0 0 24px", letterSpacing: -0.5 }}>
                            학부모·학생이 직접 남긴 진짜 리뷰
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                            {realReviews.map((r, i) => {
                                const meta = REAL_PLATFORM_META[r.platform] || { name: r.platform, color: "#cbd5e1" };
                                return (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                                        transition={{ delay: 0.05 * i }}
                                        style={{
                                            padding: 18, borderRadius: 14, background: "#fff",
                                            border: "1px solid #e2e8f0",
                                            boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                            <span style={{
                                                padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                                                background: meta.color + "22", color: meta.color,
                                            }}>{meta.name}</span>
                                            <span style={{ fontSize: 12, color: "#f59e0b" }}>{"★".repeat(r.rating)}</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, margin: "0 0 10px" }}>
                                            {r.content}
                                        </p>
                                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                                            — {r.author} · {r.review_date}
                                        </div>
                                        {r.reply && (
                                            <div style={{ marginTop: 10, padding: "10px 12px", background: "#fef3c7", borderRadius: 8, fontSize: 12, color: "#78350f" }}>
                                                <strong>학원 답글:</strong> {r.reply}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
/* ═══ Section ═══ */
.rv-section { position: relative; overflow: hidden; padding: clamp(80px,10vw,140px) 0 clamp(60px,8vw,100px); background: #fff; font-family: 'Space Grotesk', sans-serif; color: #1e293b; }
.rv-container { max-width: 900px; margin: 0 auto; padding: 0 clamp(16px,4vw,40px); position: relative; z-index: 10; }

/* BG */
.rv-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.rv-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(90,139,187,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(90,139,187,0.04) 1px, transparent 1px); background-size: 60px 60px; }
.rv-hue-layer { position: absolute; inset: 0; opacity: 0.3; background: linear-gradient(135deg, rgba(191,219,254,0.3), transparent, rgba(165,243,252,0.3)); animation: rvHue 15s infinite linear; }
.rv-orb { display: none; }
.rv-orb1 { display: none; }
.rv-orb2 { display: none; }

/* Header */
.rv-header { text-align: center; margin-bottom: clamp(40px,6vw,64px); }
.rv-sys-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 999px; background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.6); margin-bottom: 24px; animation: rvFloat 8s ease-in-out infinite; }
.rv-ping-wrap { position: relative; display: flex; width: 8px; height: 8px; }
.rv-ping { position: absolute; inset: 0; border-radius: 50%; background: #2563eb; opacity: 0.75; animation: ping 1s cubic-bezier(0,0,0.2,1) infinite; }
.rv-ping-dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: #2563eb; }
.rv-sys-text { font-size: 10px; font-family: 'JetBrains Mono', monospace; font-weight: 700; letter-spacing: 0.15em; color: #2563eb; }
.rv-title { font-size: clamp(3rem, 7vw, 5.5rem); font-weight: 700; letter-spacing: -0.04em; color: #0f172a; margin-bottom: 8px; }
.rv-subtitle { font-family: 'JetBrains Mono', monospace; font-size: clamp(10px, 1.5vw, 14px); text-transform: uppercase; letter-spacing: 0.3em; color: #64748b; font-weight: 500; }

/* Cards */
.rv-cards { display: flex; flex-direction: column; gap: 36px; position: relative; padding: 0 12px; }
@media (min-width: 768px) { .rv-cards { padding: 0 40px; } }
.rv-timeline-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); background: linear-gradient(to bottom, transparent, #cbd5e1, transparent); }

.rv-card {
    position: relative; overflow: hidden;
    background: rgba(255,255,255,0.6); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.8);
    border-radius: 24px; padding: 32px;
    box-shadow: 0 30px 80px rgba(90,139,187,0.15), inset 0 0 0 1px rgba(255,255,255,0.4);
    transform-style: preserve-3d;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.rv-card:hover { transform: rotateX(2deg) rotateY(-2deg) scale(1.02); box-shadow: 0 40px 90px rgba(90,139,187,0.25), inset 0 0 0 1px rgba(255,255,255,0.8); }
.rv-card-glow { position: absolute; top: 0; right: 0; width: 128px; height: 128px; border-radius: 50%; filter: blur(40px); pointer-events: none; }
.rv-card-inner { display: flex; flex-direction: column; gap: 24px; position: relative; z-index: 10; }
@media (min-width: 640px) { .rv-card-inner { flex-direction: row; align-items: center; } }

/* Logo */
.rv-logo-area { flex-shrink: 0; perspective: 500px; }
.rv-logo-box { width: 80px; height: 80px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 28px; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 8px 24px rgba(0,0,0,0.1), -5px 5px 10px rgba(0,0,0,0.08), inset 2px -2px 5px rgba(255,255,255,0.7); transform: rotateX(10deg) rotateY(-10deg); transition: transform 0.5s; position: relative; overflow: hidden; }
.rv-logo-box:hover { transform: rotateX(0) rotateY(0); }
.rv-logo-shine { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(0,0,0,0.05) 100%); pointer-events: none; }
.rv-logo-naver { background: linear-gradient(135deg, #03C75A, #02b04e); color: #fff; }
.rv-logo-google { background: #fff; color: #4285F4; font-size: 32px; }
.rv-logo-daum { background: #FEE500; color: #3C1E1E; font-size: 18px; }
.rv-logo-text { position: relative; z-index: 2; font-family: 'Space Grotesk', sans-serif; }

/* Content */
.rv-content { flex-grow: 1; width: 100%; }
.rv-title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
.rv-card-title { font-size: 20px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rv-node-id { font-size: 9px; padding: 2px 8px; border-radius: 6px; border: 1px solid; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
.rv-subtext-row { display: flex; gap: 2px; font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 4px; }
.rv-char { opacity: 0; animation: rvFadeIn 0.1s ease-out forwards; }
.rv-score { text-align: right; }
.rv-score-num { font-size: 36px; font-weight: 700; color: #1e293b; }
.rv-score-max { font-size: 18px; color: #94a3b8; font-weight: 400; }

/* Liquid Bar */
.rv-bar-track { height: 14px; border-radius: 999px; background: rgba(220,230,240,0.5); box-shadow: inset 0 2px 5px rgba(0,0,0,0.08); position: relative; overflow: hidden; border: 1px solid rgba(226,232,240,0.5); margin-bottom: 10px; }
.rv-bar-fill { height: 100%; border-radius: 999px; position: relative; overflow: hidden; box-shadow: 0 0 15px rgba(6,182,212,0.3); }
.rv-bar-fill::after { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); transform: skewX(-20deg) translateX(-150%); animation: rvShimmer 2s infinite; }
.rv-bar-shine { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent); pointer-events: none; border-radius: 999px; }

/* Meta */
.rv-meta { display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid rgba(226,232,240,0.5); }
.rv-meta-left { display: flex; gap: 16px; }
.rv-meta-item { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; gap: 4px; }
.rv-meta-dot { width: 4px; height: 4px; border-radius: 50%; animation: rvPulse 1s ease-in-out infinite; }
.rv-meta-status { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #94a3b8; }

/* Decorations */
.rv-deco { position: absolute; display: none; color: rgba(96,165,250,0.2); filter: blur(1px); }
@media (min-width: 1024px) { .rv-deco { display: block; } }
.rv-deco1 { right: -32px; top: 80px; animation: rvFloat 4s ease-in-out infinite; font-size: 32px; transform: rotate(12deg); }
.rv-deco2 { left: -8px; bottom: 160px; animation: rvFloat 7s ease-in-out infinite 1s; font-size: 28px; color: rgba(34,211,238,0.2); transform: rotate(-12deg); }
.rv-deco3 { right: 48px; bottom: 40px; animation: rvFloat 5s ease-in-out infinite 2s; font-size: 24px; color: rgba(168,85,247,0.2); transform: rotate(45deg); }

/* Footer */
.rv-footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid rgba(226,232,240,0.6); display: flex; flex-direction: column; gap: 12px; justify-content: space-between; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; }
@media (min-width: 640px) { .rv-footer { flex-direction: row; } }
.rv-footer-left { display: flex; gap: 24px; }
.rv-footer-item { display: flex; align-items: center; gap: 6px; letter-spacing: 0.1em; }
.rv-footer-dot { width: 4px; height: 4px; border-radius: 50%; background: #22c55e; animation: rvPulse 1s ease-in-out infinite; }
.rv-footer-right { display: flex; gap: 16px; opacity: 0.5; }

/* Mobile */
@media (max-width: 480px) {
  .rv-card { padding: 20px 16px !important; }
  .rv-title-row { flex-wrap: wrap !important; gap: 8px !important; }
  .rv-score-num { font-size: 28px !important; }
  .rv-meta-left { flex-wrap: wrap !important; gap: 8px !important; }
  .rv-meta-item { font-size: 9px !important; }
  .rv-logo-box { width: 60px !important; height: 60px !important; }
  .rv-card-title { font-size: 17px !important; }
}

/* Keyframes */
@keyframes rvHue { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
@keyframes rvFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@keyframes rvShimmer { 100% { transform: skewX(-20deg) translateX(150%); } }
@keyframes rvPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes rvFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
            `}</style>
        </section>
    );
}
