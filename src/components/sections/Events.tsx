"use client";

import { useRef, useCallback } from "react";
import {
    motion,
    useInView,
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
} from "framer-motion";
import CountUp from "react-countup";

/* ═══════════════════════════════════════════
   Events — 2026 Premium Motion Design
   scroll-driven parallax · mouse 3D tilt
   spring choreography · animated borders
   ═══════════════════════════════════════════ */

const P = (u: string) => `/api/proxy-image?url=${encodeURIComponent(u)}`;

const featured = {
    image: P("https://blogthumb.pstatic.net/MjAyNjA0MDhfMjEz/MDAxNzc1NjM1MjM1NjEz.0msIcp91ID97i_-DLisQbUlEYBFnOkrUMYSZ20VH-Tkg.1F2ZU6k39hJFJI-BJXpmfTBb15d72fF5FoUfcsOc_Zsg.PNG/image.png?type=s3"),
    title: "제4회 IT코딩 발명 아이디어 경진대회",
    badge: "은상 수상", sub: "한국사회복지협의회 회장상",
    desc: "이OO(두리중) 은상 수상. 자폐성 장애인 의사소통 웹 'IELM'. 정OO 에세이 부문 동시 참가.",
    date: "2026년 4월", students: "이OO, 정OO",
};

const events = [
    { image: P("https://blogthumb.pstatic.net/MjAyNjAxMjFfNTQg/MDAxNzY4OTgyODc0MTMz.MbSoyBVrt5SN-hABEsSaHjnWqsE_rQrRb40QBs1fC8cg.iu4EroOly30HAdQdITA63-P1V56tDZxA5f03aYBYo8Ag.PNG/1.png?type=s3"), title: "카카오 AI 루키 캠프", badge: "최종 선정", desc: "하OO, 김OO 최종 선정", date: "2026.01", status: "archived" as const },
    { image: P("https://blogthumb.pstatic.net/MjAyNjAzMzFfMjUy/MDAxNzc0OTM5Mjc3MzI1.K1e4cpMip-F4gHKDbmlsWDs6QSRKiNCTStN5hid8A-Mg.jD86OELP4RlBqGjkm9Xq_pGriAiWAVa49H3yr6o9O0Ig.PNG/%C1%AA%BD%BA%BA%BB%BC%B1%C1%F8%C3%E21.png?type=s3"), title: "젬S 메이커스 코딩 페스티벌", badge: "본선 진출", desc: "출발드림팀 5명, 전국 26팀", date: "2026", status: "live" as const },
    { image: P("https://blogthumb.pstatic.net/MjAyNjAxMjdfMTEz/MDAxNzY5NTA5OTcyNzQ1.ZFf_l8m2N4DRUkzsFo5qF67f-8RTsuOLhpCRm_lPjPkg.zdOzzgkO61EGsNYxmwRffj2yOLaf-aK7FLaUt2DNleMg.JPEG/KakaoTalk_20260127_140134763_04.jpg?type=s3"), title: "코딩쏙 AI 디지털 아트 대회", badge: "교내 대회", desc: "'AI와 나' 70분 프로젝트", date: "2026.01", status: "archived" as const },
    { image: P("https://blogthumb.pstatic.net/MjAyNjAyMTFfOCAg/MDAxNzcwNzk3ODMzODAy.5IK-apA7LnEc4GvqpIPG2yG3tLwqslLpOhnRqYKvIMcg._wyDUhEjzbvlBx4iLu6twNQzLkxVrY8sC-XXTr-958og.PNG/KakaoTalk_20260211_144531264.png?type=s3"), title: "ETRI 진로체험 견학", badge: "체험학습", desc: "자율주행, 드론, VR 현장 체험", date: "2026.02", status: "archived" as const },
    { image: P("https://blogthumb.pstatic.net/MjAyNjAyMDVfMTcw/MDAxNzcwMjY3MTUyODY0.JY5KdgGdTU0vH5lWaPDNQ6R4VhgUv2sk9jwEpQmecRAg.A7f1u2cbz6NdKO0pOJ_x4yEy0rJFpgvvo8tl87anx2sg.PNG/2026_%C1%A66%C8%B8_%C3%BB%BC%D2%B3%E2_IT%B0%E6%BD%C3%B4%EB%C8%B8_%C6%F7%BD%BA%C5%CD_%28260204%29_1.png?type=s3"), title: "제6회 청소년 IT경시대회", badge: "접수 완료", desc: "대회 관심반 체계적 준비", date: "2026.03", status: "upcoming" as const },
    { image: P("https://blogthumb.pstatic.net/MjAyNjAxMDlfMzcg/MDAxNzY3OTM5MzQ4ODAx.yEL2g88KH5XzNyeI3N46PyQk8niISYsEhn6ZPS1oUSgg.xaIIRlaNIgryTp2eD0S2qlyErWGbixjr5Uz4vB-LHJQg.PNG/image.png?type=s3"), title: "전국학생과학발명품경진대회", badge: "준비 중", desc: "코딩으로 증명하는 발명", date: "2026", status: "upcoming" as const },
    { image: P("https://blogthumb.pstatic.net/MjAyNjAyMDdfNzAg/MDAxNzcwNDI5NTA5MTky.oWyaCxyIqF41g_ZbrVFdDdbflWiwDD_KQU9p5s6VSkEg.zLz8uNjNSSKTSLc38oebjver2szc2ERUKsHBBZzBEb8g.PNG/%BC%BC%B0%E8ai%BF%B5%C8%AD%C1%A6.png?type=s3"), title: "WAIFF Seoul 2026", badge: "참가 안내", desc: "세계 AI 영화제", date: "2026.03", status: "upcoming" as const },
    { image: P("https://blogthumb.pstatic.net/MjAyNjAzMjNfNzEg/MDAxNzc0MjM5NjQyNjY4.UbNBUHlqvp3LnDLYK5ufdJTmskAi5vGK7Fqb9FF3uZUg.8YzVL40_l-mV9YWylrug-tTeL8GBroYXb3J3A3qc-qIg.JPEG/%C1%A68%C8%B8_%B1%B3%C0%B0_%B0%F8%B0%F8%B5%A5%C0%CC%C5%CD_AI_%C8%B0%BF%EB%B4%EB%C8%B8_%C6%F7%BD%BA%C5%CD_%C3%D6%C1%BE%BA%BB.jpg?type=s3"), title: "교육 공공데이터 AI 활용대회", badge: "준비 중", desc: "교육부+시도교육청 공동 주최", date: "2026", status: "upcoming" as const },
];

const stats = [
    { label: "참가 대회", value: 9, suffix: "건", icon: "emoji_events" },
    { label: "수상/선정", value: 4, suffix: "건", icon: "military_tech" },
    { label: "참가 학생", value: 11, suffix: "명+", icon: "groups" },
    { label: "본선 진출", value: 1, suffix: "팀", icon: "flag" },
];

const STATUS_DOT: Record<string, string> = { live: "#10b981", upcoming: "#f59e0b", archived: "#94a3b8" };

/* ── 3D Tilt Card with mouse tracking ── */
function TiltCard({ ev, i, isLarge }: { ev: (typeof events)[0]; i: number; isLarge: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px" });
    const isAward = ev.badge.includes("수상") || ev.badge.includes("선정") || ev.badge.includes("진출");
    const dotColor = STATUS_DOT[ev.status] || "#94a3b8";

    const mx = useMotionValue(0.5);
    const my = useMotionValue(0.5);
    const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 300, damping: 25 });
    const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 300, damping: 25 });
    const shineX = useTransform(mx, [0, 1], ["0%", "100%"]);
    const shineY = useTransform(my, [0, 1], ["0%", "100%"]);

    const onMove = useCallback((e: React.MouseEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
    }, [mx, my]);
    const onLeave = useCallback(() => { mx.set(0.5); my.set(0.5); }, [mx, my]);

    return (
        <motion.div
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            initial={{ opacity: 0, y: 60, rotateX: 15, scale: 0.92 }}
            animate={inView ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : {}}
            transition={{ delay: i * 0.1, duration: 0.8, type: "spring", stiffness: 70, damping: 14 }}
            style={{
                perspective: 1000,
                gridRow: isLarge ? "span 2" : "span 1",
            }}
        >
            <motion.div
                style={{
                    rotateX: rx, rotateY: ry,
                    transformStyle: "preserve-3d",
                    borderRadius: 22, overflow: "hidden",
                    position: "relative", height: "100%",
                    border: isAward ? "2px solid rgba(245,158,11,0.4)" : "1px solid rgba(226,232,240,0.5)",
                    boxShadow: isAward
                        ? "0 20px 50px rgba(245,158,11,0.12), 0 8px 20px rgba(0,0,0,0.06)"
                        : "0 12px 40px rgba(15,23,42,0.08)",
                    cursor: "default",
                }}
            >
                {/* Holographic shine */}
                <motion.div style={{
                    position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
                    background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                    mixBlendMode: "overlay",
                }} />

                {/* Image background */}
                <img src={ev.image} alt={ev.title} loading="lazy" style={{
                    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                }} />

                {/* Gradient overlay */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: isAward
                        ? "linear-gradient(160deg, transparent 30%, rgba(120,53,15,0.4) 60%, rgba(15,23,42,0.85) 100%)"
                        : "linear-gradient(160deg, transparent 20%, rgba(15,23,42,0.3) 50%, rgba(15,23,42,0.85) 100%)",
                }} />

                {/* Top badges */}
                <div style={{ position: "absolute", top: 16, left: 16, zIndex: 5, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 14px", borderRadius: 999,
                        background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        fontSize: 10, fontWeight: 800, color: "#fff",
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                        {ev.date}
                    </div>
                    {isAward && (
                        <motion.div
                            initial={{ scale: 0, rotate: -15 }}
                            animate={inView ? { scale: 1, rotate: 0 } : {}}
                            transition={{ delay: i * 0.1 + 0.5, type: "spring", stiffness: 280, damping: 12 }}
                            className="ev-award-glow"
                            style={{
                                padding: "5px 14px", borderRadius: 10,
                                background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                                color: "#451a03", fontSize: 10, fontWeight: 900,
                                display: "flex", alignItems: "center", gap: 4,
                                boxShadow: "0 6px 20px rgba(245,158,11,0.45)",
                                transform: "translateZ(20px)",
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                            {ev.badge}
                        </motion.div>
                    )}
                </div>

                {/* Bottom text with glass effect */}
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5,
                    padding: isLarge ? "24px 24px" : "16px 18px",
                }}>
                    <h4 style={{
                        fontSize: isLarge ? 22 : 16, fontWeight: 900, color: "#fff",
                        margin: "0 0 6px", lineHeight: 1.25, letterSpacing: -0.3,
                        textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                    }}>
                        {ev.title}
                    </h4>
                    <p style={{
                        fontSize: isLarge ? 14 : 12, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5,
                        textShadow: "0 1px 6px rgba(0,0,0,0.4)",
                    }}>
                        {ev.desc}
                    </p>
                    {!isAward && (
                        <span style={{
                            display: "inline-block", marginTop: 10,
                            padding: "4px 12px", borderRadius: 8,
                            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            fontSize: 10, fontWeight: 700, color: "#fff",
                        }}>
                            {ev.badge}
                        </span>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ── Main ── */
export default function Events() {
    const sectionRef = useRef<HTMLElement>(null);
    const inView = useInView(sectionRef, { once: true, margin: "-80px" });
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
    const featuredY = useTransform(scrollYProgress, [0, 1], [-40, 40]);
    const sectionScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.97, 1, 1, 0.97]);

    return (
        <motion.section ref={sectionRef} id="events" style={{ background: "#ffffff", overflow: "hidden", scale: sectionScale }}>
            <style>{`
.ev-award-glow { animation: awardPulse 2.5s ease-in-out infinite; }
@keyframes awardPulse {
    0%, 100% { box-shadow: 0 6px 20px rgba(245,158,11,0.45); }
    50% { box-shadow: 0 6px 30px rgba(245,158,11,0.7), 0 0 20px rgba(251,191,36,0.3); }
}
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes borderGlow {
    0%, 100% { border-color: rgba(245,158,11,0.4); }
    50% { border-color: rgba(245,158,11,0.9); }
}
.ev-featured-border { animation: borderGlow 3s ease-in-out infinite; }
@media (max-width: 768px) {
    .ev-bento { grid-template-columns: 1fr !important; grid-auto-rows: 300px !important; }
    .ev-bento > div { grid-row: span 1 !important; }
    .ev-featured-inner { flex-direction: column !important; }
    .ev-featured-img { min-height: 260px !important; }
    .ev-stats-row { grid-template-columns: repeat(2, 1fr) !important; }
}
@media (min-width: 769px) and (max-width: 1024px) {
    .ev-bento { grid-template-columns: repeat(2, 1fr) !important; }
}
            `}</style>

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(80px, 10vw, 140px) 20px" }}>
                {/* ── Header with stagger ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    style={{ textAlign: "center", marginBottom: 48 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                        transition={{ duration: 0.6 }}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "7px 18px", borderRadius: 999,
                            background: "#eff6ff", color: "#1d4ed8",
                            fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 18,
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                        COMPETITIONS
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.15, duration: 0.7 }}
                        style={{ fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 900, color: "#0f172a", margin: "0 0 14px", letterSpacing: -1.5, lineHeight: 1.1 }}
                    >
                        대회에서 증명하는 실력
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        style={{ fontSize: 15, color: "#64748b", margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}
                    >
                        코딩쏙 학생들이 참가하고, 수상하고, 성장한 기록입니다.
                    </motion.p>
                </motion.div>

                {/* ── Stats with spring ── */}
                <div className="ev-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 56 }}>
                    {stats.map((s, i) => (
                        <motion.div key={s.label}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 120, damping: 14 }}
                            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                            style={{ padding: "24px 16px", textAlign: "center", borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "default" }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#3b82f6", display: "block", marginBottom: 6, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                            <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", letterSpacing: -1, lineHeight: 1 }}>
                                {inView && <CountUp end={s.value} duration={2.5} />}{s.suffix}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginTop: 6 }}>{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* ═══ Featured Hero — 은상 ═══ */}
                <motion.div
                    className="ev-featured-border"
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ delay: 0.6, duration: 0.9, type: "spring", stiffness: 60 }}
                    style={{ borderRadius: 28, overflow: "hidden", border: "2px solid rgba(245,158,11,0.5)", background: "#0f172a", marginBottom: 48, position: "relative" }}
                >
                    {/* Shimmer */}
                    <div style={{
                        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                        backgroundSize: "200% 100%", animation: "shimmer 5s linear infinite",
                    }} />
                    <div className="ev-featured-inner" style={{ display: "flex", minHeight: 400 }}>
                        <motion.div className="ev-featured-img" style={{ flex: "0 0 55%", position: "relative", overflow: "hidden", minHeight: 400, y: featuredY }}>
                            <img src={featured.image} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 20, position: "absolute", inset: 0 }} />
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, #0f172a, transparent)" }} />
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={inView ? { scale: 1, rotate: 0 } : {}}
                                transition={{ delay: 1, type: "spring", stiffness: 280, damping: 12 }}
                                className="ev-award-glow"
                                style={{ position: "absolute", bottom: 24, left: 24, zIndex: 4, padding: "12px 24px", borderRadius: 16, background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#451a03", fontSize: 16, fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                                {featured.badge}
                            </motion.div>
                        </motion.div>
                        <div style={{ flex: 1, padding: "40px 40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <motion.span initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.8 }}
                                style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.15em", marginBottom: 14 }}>
                                AWARD WINNER
                            </motion.span>
                            <motion.h3 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.9 }}
                                style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 8px", letterSpacing: -0.8, lineHeight: 1.2 }}>
                                {featured.title}
                            </motion.h3>
                            <motion.span initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1 }}
                                style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 18 }}>
                                {featured.sub}
                            </motion.span>
                            <motion.p initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.1 }}
                                style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 24px" }}>
                                {featured.desc}
                            </motion.p>
                            <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.2 }}
                                style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>{featured.date}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>group</span>{featured.students}
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══ Bento Grid with 3D tilt ═══ */}
                <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}
                >
                    전체 활동 기록
                </motion.h3>
                <div className="ev-bento" style={{
                    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                    gridAutoRows: "280px", gap: 18,
                }}>
                    {events.map((ev, i) => (
                        <TiltCard key={ev.title} ev={ev} i={i} isLarge={i < 2} />
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
