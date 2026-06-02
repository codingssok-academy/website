"use client";

/**
 * SlideViewer — NotebookLM 생성 슬라이드 PDF 뷰어
 * /slides/c-lang/{filename}.pdf 를 iframe으로 표시
 * 풀스크린 지원 + 다운로드 링크
 */

import { useState, useRef, useEffect } from "react";

interface SlideViewerProps {
    courseId: string;
    htmlFile: string; // e.g. "L1-pj01-school-intro-v2.html"
}

const SLIDE_DIRS: Record<string, string> = {
    "4": "/slides/c-lang",
    "10": "/slides/ai",
};

export default function SlideViewer({ courseId, htmlFile }: SlideViewerProps) {
    const dir = SLIDE_DIRS[courseId];
    if (!dir) return null;

    const pdfFile = htmlFile.replace(".html", ".pdf");
    const pdfUrl = `${dir}/${pdfFile}`;

    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // 풀스크린 상태 동기화
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const toggleFullscreen = async () => {
        const el = wrapperRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            await el.requestFullscreen().catch(() => {});
        } else {
            await document.exitFullscreen().catch(() => {});
        }
    };

    if (loadError) return null;

    return (
        <>
            {/* 수업자료 보기 버튼 */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 20px", borderRadius: 12,
                        background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                        color: "#fff", fontSize: 14, fontWeight: 700,
                        border: "none", cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.4)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.3)";
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>slideshow</span>
                    수업자료 보기
                </button>
            )}

            {/* 슬라이드 뷰어 */}
            {isOpen && (
                <div
                    ref={wrapperRef}
                    style={{
                        borderRadius: isFullscreen ? 0 : 16,
                        overflow: "hidden",
                        border: isFullscreen ? "none" : "1px solid #e2e8f0",
                        background: "#fff",
                        height: isFullscreen ? "100vh" : "auto",
                        display: "flex", flexDirection: "column",
                    }}
                >
                    {/* 헤더 */}
                    <div style={{
                        padding: "10px 16px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
                    }}>
                        <div style={{
                            fontSize: 13, fontWeight: 700, color: "#334155",
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#2563eb" }}>
                                slideshow
                            </span>
                            수업자료 슬라이드
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={toggleFullscreen}
                                style={{
                                    padding: "6px 12px", borderRadius: 8,
                                    background: isFullscreen ? "#ef4444" : "#10b981",
                                    color: "#fff", fontSize: 12, fontWeight: 700,
                                    border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 4,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                    {isFullscreen ? "fullscreen_exit" : "fullscreen"}
                                </span>
                                {isFullscreen ? "종료" : "풀스크린"}
                            </button>
                            <a
                                href={pdfUrl}
                                download
                                style={{
                                    padding: "6px 12px", borderRadius: 8, background: "#3b82f6",
                                    color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
                                    display: "flex", alignItems: "center", gap: 4,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
                                다운로드
                            </a>
                            <button
                                onClick={() => { setIsOpen(false); if (document.fullscreenElement) document.exitFullscreen(); }}
                                style={{
                                    padding: "6px 12px", borderRadius: 8, background: "#64748b",
                                    color: "#fff", fontSize: 12, fontWeight: 700,
                                    border: "none", cursor: "pointer",
                                }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>

                    {/* PDF iframe */}
                    <iframe
                        src={pdfUrl}
                        title="수업자료 슬라이드"
                        onError={() => setLoadError(true)}
                        style={{
                            width: "100%",
                            height: isFullscreen ? "calc(100vh - 45px)" : "75vh",
                            border: "none", display: "block",
                            flex: isFullscreen ? 1 : "initial",
                        }}
                    />
                </div>
            )}
        </>
    );
}
