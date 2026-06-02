"use client";

/**
 * SocialFeed 섹션
 * /api/social/feed 에서 인스타그램 + 네이버 블로그 최신 콘텐츠 동시 페치
 * 학원 둘러보기 + 실시간 활동 표시
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Post {
    id: string;
    platform: "instagram" | "naver-blog";
    title?: string;
    excerpt?: string;
    imageUrl?: string;
    link: string;
    publishedAt: string;
}

const PLATFORM_META = {
    instagram: { name: "Instagram", color: "#E1306C", icon: "photo_camera" },
    "naver-blog": { name: "네이버 블로그", color: "#03C75A", icon: "edit_note" },
};

export default function SocialFeed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/social/feed?platform=all&limit=8");
                const data = await res.json();
                if (!cancelled) setPosts(data.posts || []);
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "load failed");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    return (
        <section style={{
            padding: "clamp(80px, 10vw, 140px) 20px",
            background: "#ffffff",
        }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 50 }}>
                    <div style={{
                        display: "inline-block", padding: "6px 16px", borderRadius: 999,
                        background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                        color: "#9d174d", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                        marginBottom: 16,
                    }}>
                        LIVE FEED · 학원 둘러보기
                    </div>
                    <h2 style={{
                        fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900,
                        color: "#0f172a", margin: "0 0 12px", letterSpacing: -1,
                    }}>
                        지금 코딩쏙은 이렇게 살아있어요
                    </h2>
                    <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
                        인스타그램과 네이버 블로그에서 최신 소식을 실시간으로 가져옵니다.
                    </p>
                </div>

                {loading && (
                    <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
                        불러오는 중...
                    </div>
                )}

                {!loading && posts.length === 0 && (
                    <div style={{
                        textAlign: "center", padding: 60, borderRadius: 20,
                        background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                        border: "2px dashed #cbd5e1",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 12, color: "#94a3b8" }}>mail</span>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#475569" }}>
                            아직 연결된 콘텐츠가 없어요
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
                            인스타그램 username과 네이버 블로그 ID 설정 후 자동 노출됩니다.
                        </div>
                    </div>
                )}

                {!loading && posts.length > 0 && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: 20,
                    }}>
                        {posts.map((p, i) => {
                            const meta = PLATFORM_META[p.platform];
                            return (
                                <motion.a
                                    key={p.id}
                                    href={p.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -4 }}
                                    style={{
                                        display: "block",
                                        borderRadius: 16,
                                        overflow: "hidden",
                                        background: "#fff",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
                                        textDecoration: "none",
                                        color: "inherit",
                                    }}
                                >
                                    {p.imageUrl ? (
                                        <div style={{
                                            aspectRatio: "16/10",
                                            background: `url(${
                                                (p.imageUrl.includes("pstatic.net") || p.imageUrl.includes("phinf.naver.net"))
                                                    ? `/api/proxy-image?url=${encodeURIComponent(p.imageUrl)}`
                                                    : p.imageUrl
                                            }) center/cover`,
                                        }} />
                                    ) : (
                                        <div style={{
                                            aspectRatio: "16/10",
                                            background: `linear-gradient(135deg, ${meta.color}, #0f172a)`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#fff" }}>{meta.icon}</span>
                                        </div>
                                    )}
                                    <div style={{ padding: 16 }}>
                                        <div style={{
                                            display: "inline-block", padding: "3px 10px", borderRadius: 999,
                                            background: meta.color + "20", color: meta.color,
                                            fontSize: 10, fontWeight: 800, marginBottom: 8,
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{meta.icon}</span> {meta.name}
                                        </div>
                                        {p.title && (
                                            <h3 style={{
                                                fontSize: 14, fontWeight: 800, color: "#0f172a",
                                                margin: "0 0 6px", lineHeight: 1.4,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}>
                                                {p.title}
                                            </h3>
                                        )}
                                        {p.excerpt && (
                                            <p style={{
                                                fontSize: 12, color: "#64748b", lineHeight: 1.5,
                                                margin: 0,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}>
                                                {p.excerpt}
                                            </p>
                                        )}
                                        <div style={{ marginTop: 10, fontSize: 10, color: "#94a3b8" }}>
                                            {new Date(p.publishedAt).toLocaleDateString("ko-KR")}
                                        </div>
                                    </div>
                                </motion.a>
                            );
                        })}
                    </div>
                )}

                {error && (
                    <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#dc2626" }}>
                        오류: {error}
                    </div>
                )}
            </div>
        </section>
    );
}
