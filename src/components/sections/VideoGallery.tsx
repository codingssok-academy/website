"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/*
  Video Gallery — 코딩쏙 수업 영상 2개 (2.mp4, 3.mp4)
  Curriculum 섹션 아래, Pricing 위에 배치
*/

const videos = [
    {
        src: "/videos/codingssok-class-2.mp4",
        title: "실제 수업 현장",
        desc: "아이들이 직접 코드를 치며 배우는 모습",
    },
    {
        src: "/videos/codingssok-class-3.mp4",
        title: "프로젝트 발표",
        desc: "스스로 만든 작품을 발표하는 순간",
    },
];

function VideoCard({ video, index }: { video: typeof videos[0]; index: number }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handlePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
            <div
                onClick={handlePlay}
                style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    aspectRatio: "16/9",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
                    transition: "transform 0.4s, box-shadow 0.4s",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 20px 60px rgba(79,70,229,0.12), 0 0 0 1px rgba(79,70,229,0.08)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)";
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handlePlay(); }}
            >
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    loop
                    preload="metadata"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                >
                    <source src={video.src} type="video/mp4" />
                </video>

                {/* Play/Pause overlay */}
                {!isPlaying && (
                    <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)",
                    }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: "50%",
                            background: "rgba(255,255,255,0.95)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M8 5v14l11-7L8 5z" fill="#2563eb" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Caption */}
            <div style={{ marginTop: 16, padding: "0 4px" }}>
                <h4 style={{
                    fontSize: 18, fontWeight: 700, color: "#172554",
                    margin: 0, lineHeight: 1.3,
                }}>
                    {video.title}
                </h4>
                <p style={{
                    fontSize: 14, color: "#94a3b8", marginTop: 6, lineHeight: 1.5,
                }}>
                    {video.desc}
                </p>
            </div>
        </motion.div>
    );
}

export default function VideoGallery() {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section
            ref={ref}
            style={{
                padding: "var(--section-spacing) 0",
                background: "#111113",
            }}
        >
            <div className="container-nod">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginBottom: 48, textAlign: "center" }}
                >
                    <span style={{
                        display: "inline-block", padding: "6px 16px", borderRadius: 20,
                        background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
                        color: "#10B981", fontSize: 12, fontWeight: 700,
                        letterSpacing: "0.08em", textTransform: "uppercase",
                    }}>
                        수업 현장
                    </span>
                    <h2 style={{
                        fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800,
                        color: "#172554", letterSpacing: "-0.03em", lineHeight: 1.2,
                        margin: "16px 0 0",
                    }}>
                        코딩쏙 교실에서 벌어지는 일
                    </h2>
                    <p style={{
                        fontSize: 16, color: "#94a3b8", marginTop: 12,
                        maxWidth: 480, margin: "12px auto 0",
                    }}>
                        실제 수업 영상에서 아이들의 성장을 확인하세요.
                    </p>
                </motion.div>

                {/* Video Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(440px, 100%), 1fr))",
                    gap: 32,
                }}>
                    {videos.map((v, i) => (
                        <VideoCard key={i} video={v} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
