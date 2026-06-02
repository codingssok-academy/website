"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CourseIcon } from "@/components/icons/CourseIcons";

interface Props {
    courseId: string; courseName: string; courseColor: string;
    htmlPath: string;
    onBack: () => void;
    onOpenNotes: () => void;
    onXpEarned?: (xp: number) => void;
}

export function CourseView({ courseId, courseName, courseColor, htmlPath, onBack, onOpenNotes, onXpEarned }: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sidePanel, setSidePanel] = useState<"none" | "notes" | "timer">("none");
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    // Study timer
    useEffect(() => {
        if (!timerActive) return;
        const interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, [timerActive]);

    useEffect(() => {
        // Auto-start timer when entering course
        setTimerActive(true);
        return () => setTimerActive(false);
    }, []);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}` : `${m}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <div style={{ display: "flex", height: "100vh", background: "#f8fafc" }}>
            {/* Main content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Course header bar */}
                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    style={{
                        height: 56, padding: "0 20px", display: "flex", alignItems: "center", gap: 12,
                        background: "#fff", borderBottom: "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                >
                    <button onClick={onBack} style={{
                        padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#2563eb",
                    }}>← 돌아가기</button>
                    <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />
                    <CourseIcon courseId={courseId} size={24} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{courseName}</span>
                    <div style={{ flex: 1 }} />

                    {/* Study timer */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                        background: timerActive ? "#eff6ff" : "#f8fafc", borderRadius: 10,
                        border: "1px solid #e2e8f0",
                    }}>
                        <span style={{ fontSize: 12 }}>⏱</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: timerActive ? "#2563eb" : "#94a3b8", fontFamily: "monospace" }}>
                            {formatTime(timerSeconds)}
                        </span>
                        <button onClick={() => setTimerActive(!timerActive)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12 }}>
                            {timerActive ? "⏸" : "▶"}
                        </button>
                    </div>

                    {/* Tools */}
                    <button onClick={onOpenNotes} style={{
                        padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}> 메모</button>
                    <button onClick={() => {
                        if (iframeRef.current) {
                            const el = iframeRef.current;
                            if (el.requestFullscreen) el.requestFullscreen();
                        }
                    }} style={{
                        padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}> 전체화면</button>
                </motion.div>

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{
                            position: "absolute", top: 56, left: 0, right: 0,
                            height: 3, background: "#e2e8f0", zIndex: 10, overflow: "hidden",
                        }}
                    >
                        <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            style={{ width: "50%", height: "100%", background: courseColor }}
                        />
                    </motion.div>
                )}

                {/* iframe */}
                <iframe
                    ref={iframeRef}
                    src={htmlPath}
                    onLoad={async () => {
                        setIsLoading(false);
                        // Forward auth token to iframe via postMessage
                        try {
                            const stored = localStorage.getItem('codingssok_user');
                            if (stored && iframeRef.current?.contentWindow) {
                                iframeRef.current.contentWindow.postMessage({
                                    type: 'codingssok-auth',
                                    user: JSON.parse(stored),
                                }, '*');
                            }
                        } catch (e) { console.error('[CourseView] auth forwarding failed:', e); }
                    }}
                    style={{
                        flex: 1, width: "100%", border: "none", background: "#fff",
                    }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    title={courseName}
                />

                {/* Bottom progress bar */}
                <div style={{
                    height: 44, padding: "0 20px", display: "flex", alignItems: "center", gap: 12,
                    background: "#fff", borderTop: "1px solid #e2e8f0",
                }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                         {courseName} 학습 중
                    </span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        학습 시간: {formatTime(timerSeconds)}
                    </span>
                    {timerSeconds >= 300 && (
                        <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}
                        >
                             5분 이상 학습 중!
                        </motion.span>
                    )}
                </div>
            </div>
        </div>
    );
}
