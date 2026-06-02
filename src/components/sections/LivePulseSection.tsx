"use client";

/**
 * LivePulseSection — 2026 Premium Motion
 *
 * 기술 적용:
 * 1. 마우스 3D 틸트 (useMotionValue + useSpring) — 블로그 카드
 * 2. 연속 플로팅 (animate y oscillation) — 카드 생동감
 * 3. 스프링 입장 안무 (rotateX + scale + stagger) — 극적 등장
 * 4. CountUp — 숫자 카운트
 * 5. 펄스 LIVE — 확산 링
 * 6. 스크롤 연동 — 섹션 전체 미세 스케일
 * 7. 홀로그래픽 쉬머 — 마우스 따라다니는 빛
 */

import { useEffect, useState, useRef, useCallback } from "react";
import {
    motion,
    AnimatePresence,
    useInView,
    useScroll,
    useTransform,
    useMotionValue,
    useSpring,
} from "framer-motion";
import CountUp from "react-countup";

interface BlogPost {
    id: string;
    title?: string;
    excerpt?: string;
    imageUrl?: string;
    link: string;
    publishedAt: string;
}

interface FeedItem {
    student_name: string;
    course_title: string;
    unit_title: string;
    started_at: string;
}

interface LiveStats {
    activeStudents: number;
    totalMinutes: number;
    sessionsToday: number;
    recentFeed?: FeedItem[];
}

function proxyImg(url?: string): string | undefined {
    if (!url) return undefined;
    if (url.includes("pstatic.net") || url.includes("phinf.naver.net"))
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    return url;
}

function timeAgo(iso: string): string {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return "오늘";
    if (d === 1) return "어제";
    if (d < 7) return `${d}일 전`;
    if (d < 30) return `${Math.floor(d / 7)}주 전`;
    return `${Math.floor(d / 30)}개월 전`;
}

/* ── 3D Tilt Blog Card ── */
function BlogCard({ p, i, inView }: { p: BlogPost; i: number; inView: boolean }) {
    const mx = useMotionValue(0.5);
    const my = useMotionValue(0.5);
    const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 250, damping: 22 });
    const ry = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 250, damping: 22 });
    const shineX = useTransform(mx, [0, 1], ["0%", "100%"]);
    const shineY = useTransform(my, [0, 1], ["0%", "100%"]);

    const onMove = useCallback((e: React.MouseEvent) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
    }, [mx, my]);
    const onLeave = useCallback(() => { mx.set(0.5); my.set(0.5); }, [mx, my]);

    const imgSrc = proxyImg(p.imageUrl);
    const resolvedLink = p.link?.startsWith("http")
        ? p.link
        : `https://blog.naver.com/codingssok${p.link ? `/${p.link}` : ""}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 15, scale: 0.9 }}
            animate={inView ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : {}}
            transition={{
                delay: 0.2 + i * 0.15,
                duration: 0.8,
                type: "spring",
                stiffness: 70,
                damping: 14,
            }}
            style={{ perspective: 1000 }}
        >
            <motion.a
                href={resolvedLink}
                target="_blank"
                rel="noopener noreferrer"
                onMouseMove={onMove}
                onMouseLeave={onLeave}
                /* 연속 플로팅 — 각 카드가 다른 주기로 살짝 위아래 */
                animate={{ y: [0, -6, 0] }}
                transition={{
                    y: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{
                    rotateX: rx,
                    rotateY: ry,
                    transformStyle: "preserve-3d",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 20,
                    overflow: "hidden",
                    background: "#fff",
                    border: "1px solid rgba(226,232,240,0.6)",
                    boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
                    textDecoration: "none",
                    color: "inherit",
                    cursor: "pointer",
                    position: "relative",
                }}
            >
                {/* 홀로그래픽 쉬머 */}
                <motion.div
                    style={{
                        position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
                        background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                        mixBlendMode: "overlay",
                    }}
                />

                {/* 이미지 */}
                {imgSrc ? (
                    <div style={{
                        aspectRatio: "16/9",
                        background: `url(${imgSrc}) center/cover no-repeat`,
                        position: "relative",
                    }}>
                        <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                            background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
                        }} />
                    </div>
                ) : (
                    <div style={{
                        aspectRatio: "16/9",
                        background: "linear-gradient(135deg, #dbeafe, #e0e7ff)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#94a3b8" }}>article</span>
                    </div>
                )}

                <div style={{ padding: "14px 18px" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>
                        {timeAgo(p.publishedAt)} · 블로그
                    </div>
                    <h3 style={{
                        fontSize: 15, fontWeight: 800, color: "#0f172a",
                        margin: 0, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    }}>
                        {p.title || "코딩쏙 학원 이야기"}
                    </h3>
                </div>
            </motion.a>
        </motion.div>
    );
}

/* ── Main Section ── */
export default function LivePulseSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const inView = useInView(sectionRef, { once: true, margin: "-80px" });
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [stats, setStats] = useState<LiveStats | null>(null);

    // 스크롤 연동 — 섹션 전체 미세 스케일
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    });
    const sectionScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.96, 1, 1, 0.96]);

    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [feedIndex, setFeedIndex] = useState(0);
    const prevStats = useRef<LiveStats | null>(null);

    // 블로그 (1회)
    useEffect(() => {
        fetch("/api/social/feed?platform=naver&limit=3")
            .then(r => r.json())
            .then(d => setPosts(d.posts || []))
            .catch(() => {});
    }, []);

    // 실시간 stats + feed (30초 polling)
    useEffect(() => {
        let cancelled = false;
        const fetchLive = () => {
            fetch("/api/learning/live")
                .then(r => r.json())
                .then(d => {
                    if (cancelled) return;
                    prevStats.current = stats;
                    setStats(d);
                    if (d.recentFeed?.length) setFeed(d.recentFeed);
                })
                .catch(() => {});
        };
        fetchLive();
        const interval = setInterval(fetchLive, 30000);
        return () => { cancelled = true; clearInterval(interval); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 피드 자동 순환 (5초마다 다음 항목)
    useEffect(() => {
        if (feed.length <= 1) return;
        const timer = setInterval(() => {
            setFeedIndex(prev => (prev + 1) % feed.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [feed.length]);

    return (
        <motion.section
            ref={sectionRef}
            style={{
                padding: "clamp(60px, 8vw, 100px) 20px",
                background: "#ffffff",
                overflow: "hidden",
                scale: sectionScale,
            }}
        >
            <style>{`
@keyframes livePulse {
    0% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
}
@keyframes statGlow {
    0%, 100% { box-shadow: 0 0 0 rgba(59,130,246,0); }
    50% { box-shadow: 0 0 20px rgba(59,130,246,0.08); }
}
@media (max-width: 640px) {
    .lp-grid { grid-template-columns: 1fr !important; }
    .lp-stats { flex-direction: column !important; gap: 12px !important; }
}
            `}</style>

            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                {/* ── 헤더 — 스프링 입장 ── */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
                    style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}
                >
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "6px 16px", borderRadius: 999,
                        background: "#f0fdf4", color: "#166534",
                        fontSize: 12, fontWeight: 800, letterSpacing: "0.05em",
                        position: "relative",
                    }}>
                        {/* LIVE dot + 펄스 링 */}
                        <span style={{ position: "relative", width: 8, height: 8 }}>
                            <span style={{
                                position: "absolute", inset: 0, borderRadius: "50%",
                                background: "#22c55e",
                                boxShadow: "0 0 8px #22c55e",
                            }} />
                            <span style={{
                                position: "absolute", inset: -4, borderRadius: "50%",
                                border: "2px solid #22c55e",
                                animation: "livePulse 2s ease-out infinite",
                            }} />
                        </span>
                        LIVE
                    </span>
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}
                    >
                        지금 코딩쏙은
                    </motion.span>
                </motion.div>

                {/* ── 블로그 카드 — 3D 틸트 + 플로팅 ── */}
                {posts.length > 0 && (
                    <div className="lp-grid" style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 20, marginBottom: 36,
                    }}>
                        {posts.map((p, i) => (
                            <BlogCard key={p.id} p={p} i={i} inView={inView} />
                        ))}
                    </div>
                )}

                {/* ── 실시간 스탯 바 — 애니메이션 숫자 + 글로우 ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ delay: 0.6, duration: 0.7, type: "spring", stiffness: 100 }}
                    className="lp-stats"
                    style={{
                        display: "flex", gap: 28, alignItems: "center",
                        justifyContent: "center", flexWrap: "wrap",
                        padding: "20px 28px", borderRadius: 16,
                        background: "#fafbfc",
                        border: "1px solid #e2e8f0",
                        animation: "statGlow 4s ease-in-out infinite",
                    }}
                >
                    {[
                        {
                            icon: "person", label: "지금 학습 중",
                            value: stats?.activeStudents ?? 0, suffix: "명",
                            color: "#22c55e", hasDot: true,
                        },
                        {
                            icon: "schedule", label: "오늘 학습 시간",
                            value: stats?.totalMinutes ?? 0, suffix: "분",
                            color: "#3b82f6", hasDot: false,
                        },
                        {
                            icon: "bolt", label: "24h 학습 세션",
                            value: stats?.sessionsToday ?? 0, suffix: "회",
                            color: "#3b82f6", hasDot: false,
                        },
                    ].map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={inView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ delay: 0.7 + i * 0.1, type: "spring", stiffness: 200 }}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                fontSize: 14, color: "#334155", fontWeight: 700,
                            }}
                        >
                            {s.hasDot && (
                                <span style={{ position: "relative", width: 8, height: 8 }}>
                                    <span style={{
                                        position: "absolute", inset: 0, borderRadius: "50%",
                                        background: s.color, boxShadow: `0 0 6px ${s.color}`,
                                    }} />
                                    <span style={{
                                        position: "absolute", inset: -3, borderRadius: "50%",
                                        border: `1.5px solid ${s.color}`,
                                        animation: "livePulse 2s ease-out infinite",
                                    }} />
                                </span>
                            )}
                            {!s.hasDot && (
                                <span className="material-symbols-outlined" style={{
                                    fontSize: 16, color: s.color, fontVariationSettings: "'FILL' 1",
                                }}>
                                    {s.icon}
                                </span>
                            )}
                            {s.label}:
                            <strong style={{ color: s.color, fontSize: 16 }}>
                                {inView ? <CountUp end={s.value} duration={2} /> : 0}{s.suffix}
                            </strong>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── 실시간 학습 피드 ── */}
                {feed.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.9, duration: 0.5 }}
                        style={{
                            marginTop: 16,
                            padding: "14px 20px",
                            borderRadius: 12,
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        {/* 라이브 인디케이터 */}
                        <span style={{
                            position: "relative", width: 6, height: 6, flexShrink: 0,
                        }}>
                            <span style={{
                                position: "absolute", inset: 0, borderRadius: "50%",
                                background: "#22c55e", boxShadow: "0 0 6px #22c55e",
                            }} />
                            <span style={{
                                position: "absolute", inset: -3, borderRadius: "50%",
                                border: "1.5px solid #22c55e",
                                animation: "livePulse 2s ease-out infinite",
                            }} />
                        </span>

                        {/* 피드 항목 (애니메이션 교체) */}
                        <div style={{ flex: 1, overflow: "hidden", minHeight: 20 }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={feedIndex}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        fontSize: 13, color: "#334155", fontWeight: 600,
                                        display: "flex", alignItems: "center", gap: 6,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <span style={{ color: "#2563eb", fontWeight: 800 }}>
                                        {feed[feedIndex]?.student_name}
                                    </span>
                                    <span style={{ color: "#94a3b8" }}>님이</span>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: 6,
                                        background: "#eff6ff", color: "#2563eb",
                                        fontSize: 11, fontWeight: 700,
                                    }}>
                                        {feed[feedIndex]?.course_title}
                                    </span>
                                    <span style={{ color: "#64748b", fontSize: 12 }}>
                                        {feed[feedIndex]?.unit_title}
                                    </span>
                                    <span style={{ color: "#94a3b8", fontSize: 11 }}>
                                        학습 중
                                    </span>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* 타임스탬프 */}
                        <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>
                            {feed[feedIndex]?.started_at
                                ? (() => {
                                    const min = Math.floor((Date.now() - new Date(feed[feedIndex].started_at).getTime()) / 60000);
                                    return min < 1 ? "방금" : min < 60 ? `${min}분 전` : `${Math.floor(min / 60)}시간 전`;
                                })()
                                : ""}
                        </span>
                    </motion.div>
                )}

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 1, duration: 0.5 }}
                    style={{ textAlign: "center", marginTop: 24 }}
                >
                    <a
                        href="https://blog.naver.com/codingssok"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: 13, fontWeight: 700, color: "#3b82f6",
                            textDecoration: "none", display: "inline-flex",
                            alignItems: "center", gap: 4,
                        }}
                    >
                        학원장 블로그 전체 보기
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                    </a>
                </motion.div>
            </div>
        </motion.section>
    );
}
