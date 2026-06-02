"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sanitizeHTML } from "@/lib/sanitize";

interface BookViewerProps {
    src: string;
    unitTitle: string;
    onClose: () => void;
    onComplete?: () => void;
    onNext?: () => void;
    isCompleted?: boolean;
    nextUnitTitle?: string;
}

const HEADER_H = 36;
const FOOTER_H = 40;

export default function BookViewer({ src, unitTitle, onClose, onComplete, onNext, isCompleted, nextUnitTitle }: BookViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pages, setPages] = useState<string[]>([]);
    const [styles, setStyles] = useState("");
    const [spread, setSpread] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!src.startsWith("/")) return;
        let cancelled = false;

        fetch(src)
            .then(r => r.text())
            .then(html => {
                if (cancelled) return;
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");

                const styleEls = doc.querySelectorAll("style");
                const linkEls = doc.querySelectorAll('link[rel="stylesheet"]');
                let css = "";
                styleEls.forEach(s => { css += s.textContent + "\n"; });
                linkEls.forEach(l => { css += `@import url("${l.getAttribute("href")}");\n`; });
                setStyles(css);

                const pageDivs = doc.querySelectorAll(".page");
                if (pageDivs.length > 0) {
                    setPages(Array.from(pageDivs).map(p => sanitizeHTML(p.outerHTML)));
                } else {
                    setPages([sanitizeHTML(doc.body.innerHTML)]);
                }
                setSpread(0);
                setLoaded(true);
            })
            .catch(() => {
                setPages(["<div style='padding:40px;color:#ef4444;'>교재를 불러올 수 없습니다.</div>"]);
                setLoaded(true);
            });

        return () => { cancelled = true; };
    }, [src]);

    const totalPages = pages.length;
    const totalSpreads = Math.ceil(totalPages / 2);
    const leftIdx = spread * 2;
    const rightIdx = spread * 2 + 1;

    // Auto fullscreen on mount
    useEffect(() => {
        const el = document.documentElement;
        if (!document.fullscreenElement && el.requestFullscreen) {
            el.requestFullscreen().catch(() => {});
        }
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, []);

    const goTo = useCallback((s: number) => {
        setSpread(Math.max(0, Math.min(totalSpreads - 1, s)));
    }, [totalSpreads]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); goTo(spread + 1); }
            else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goTo(spread - 1); }
            else if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [spread, goTo, onClose]);

    const touchX = useRef<number | null>(null);
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) { dx < 0 ? goTo(spread + 1) : goTo(spread - 1); }
        touchX.current = null;
    };

    return (
        <div
            ref={containerRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{
                position: "fixed", inset: 0, zIndex: 99999,
                display: "flex", flexDirection: "column",
                background: "#1e293b",
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
        >
            {/* Header */}
            <div style={{
                height: HEADER_H,
                display: "flex", alignItems: "center", gap: 6,
                padding: "0 8px",
                background: "rgba(15,23,42,0.9)",
                backdropFilter: "blur(8px)",
                flexShrink: 0, zIndex: 2,
            }}>
                <button onClick={onClose} style={navBtnStyle}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                </button>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {unitTitle}
                </span>
                {totalSpreads > 1 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
                        {leftIdx + 1}~{Math.min(rightIdx + 1, totalPages)} / {totalPages}p
                    </span>
                )}

                {/* 학습 완료 — 항상 표시 */}
                {onComplete && !isCompleted && (
                    <button
                        onClick={onComplete}
                        style={{
                            padding: "5px 14px", borderRadius: 8, border: "none",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff", fontSize: 11, fontWeight: 800,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                            boxShadow: "0 2px 8px rgba(16,185,129,0.4)",
                            animation: "pulse-complete 2s ease-in-out infinite",
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                        학습 완료
                    </button>
                )}
                {isCompleted && (
                    <span style={{
                        padding: "5px 10px", borderRadius: 8,
                        background: "rgba(16,185,129,0.2)", color: "#34d399",
                        fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3,
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>done</span>
                        완료
                    </span>
                )}
                {onNext && isCompleted && (
                    <button
                        onClick={onNext}
                        style={{
                            padding: "5px 14px", borderRadius: 8, border: "none",
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "#fff", fontSize: 11, fontWeight: 800,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                            boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
                        }}
                    >
                        다음
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                    </button>
                )}

                <button onClick={onClose} style={{ ...navBtnStyle, background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                {!loaded ? (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28, animation: "spin 1s linear infinite" }}>autorenew</span>
                    </div>
                ) : (
                    <SpreadView pages={pages} leftIdx={leftIdx} rightIdx={rightIdx} css={styles} />
                )}
            </div>

            {/* Footer — compact */}
            <div style={{
                minHeight: FOOTER_H,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "4px 8px",
                background: "rgba(15,23,42,0.85)",
                backdropFilter: "blur(8px)",
                flexShrink: 0,
                flexWrap: "wrap",
            }}>
                {/* Nav row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => goTo(spread - 1)} disabled={spread === 0}
                        style={{ ...arrowBtnStyle, opacity: spread === 0 ? 0.25 : 1 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
                    </button>
                    {totalSpreads <= 20 ? (
                        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                            {Array.from({ length: totalSpreads }, (_, i) => (
                                <button key={i} onClick={() => goTo(i)} style={{
                                    width: i === spread ? 18 : 7, height: 7,
                                    borderRadius: i === spread ? 3.5 : "50%",
                                    border: "none", cursor: "pointer", padding: 0,
                                    background: i === spread ? "#60a5fa" : "rgba(255,255,255,0.2)",
                                    transition: "all 0.2s",
                                }} />
                            ))}
                        </div>
                    ) : (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{spread + 1} / {totalSpreads}</span>
                    )}
                    <button onClick={() => goTo(spread + 1)} disabled={spread >= totalSpreads - 1}
                        style={{ ...arrowBtnStyle, opacity: spread >= totalSpreads - 1 ? 0.25 : 1 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                    </button>
                </div>

                {/* Last spread: big complete + next buttons */}
                {spread >= totalSpreads - 1 && (onComplete || onNext) && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 8 }}>
                        {onComplete && !isCompleted && (
                            <button
                                onClick={onComplete}
                                style={{
                                    padding: "10px 24px", borderRadius: 12, border: "none",
                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                    color: "#fff", fontSize: 14, fontWeight: 900,
                                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                    boxShadow: "0 4px 16px rgba(16,185,129,0.5)",
                                    animation: "pulse-complete 1.5s ease-in-out infinite",
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                                학습 완료!
                            </button>
                        )}
                        {isCompleted && !onNext && (
                            <span style={{
                                padding: "10px 20px", borderRadius: 12,
                                background: "rgba(16,185,129,0.2)", color: "#34d399",
                                fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 4,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>done</span>
                                완료됨
                            </span>
                        )}
                        {onNext && (
                            <button
                                onClick={onNext}
                                style={{
                                    padding: "10px 24px", borderRadius: 12, border: "none",
                                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                    color: "#fff", fontSize: 14, fontWeight: 900,
                                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                                    boxShadow: "0 4px 16px rgba(59,130,246,0.5)",
                                }}
                            >
                                {nextUnitTitle ? nextUnitTitle : '다음 유닛'}
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse-complete { 0%,100% { box-shadow: 0 2px 8px rgba(16,185,129,0.4); } 50% { box-shadow: 0 2px 16px rgba(16,185,129,0.7); } }
            `}</style>
        </div>
    );
}

/* ── SpreadView: two A4 pages side by side, fill available space ── */
function SpreadView({ pages, leftIdx, rightIdx, css }: {
    pages: string[]; leftIdx: number; rightIdx: number; css: string;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.6);

    const A4_W = 793;
    const A4_H = 1122;

    useEffect(() => {
        if (!wrapRef.current) return;
        const calc = () => {
            if (!wrapRef.current) return;
            const rect = wrapRef.current.getBoundingClientRect();
            const availW = rect.width;  // zero padding — fill everything
            const availH = rect.height;
            const scaleW = availW / (A4_W * 2 + 2);
            const scaleH = availH / A4_H;
            setScale(Math.min(scaleW, scaleH));
        };
        calc();
        const ro = new ResizeObserver(calc);
        ro.observe(wrapRef.current);
        return () => ro.disconnect();
    }, []);

    const hasLeft = leftIdx < pages.length;
    const hasRight = rightIdx < pages.length;
    const sw = A4_W * scale;
    const sh = A4_H * scale;

    return (
        <div
            ref={wrapRef}
            style={{
                height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 1,
                padding: 0,
            }}
        >
            {hasLeft && <PageSlot html={pages[leftIdx]} css={css} scale={scale} w={A4_W} h={A4_H} sw={sw} sh={sh} side="left" />}
            {hasRight && <PageSlot html={pages[rightIdx]} css={css} scale={scale} w={A4_W} h={A4_H} sw={sw} sh={sh} side="right" />}
            {!hasLeft && !hasRight && (
                <div style={{ color: "#64748b", fontSize: 14 }}>페이지가 없습니다</div>
            )}
        </div>
    );
}

/* ── PageSlot: single A4 page rendered in isolated iframe ── */
function PageSlot({ html, css, scale, w, h, sw, sh, side }: {
    html: string; css: string; scale: number;
    w: number; h: number; sw: number; sh: number;
    side: "left" | "right";
}) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument;
        if (!doc) return;

        doc.open();
        doc.write(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8">
<style>
${css}
body { margin:0; padding:0; overflow:hidden; background:#fff; }
.page { margin:0!important; box-shadow:none!important; width:210mm; min-height:295mm; }
</style></head>
<body>${html}</body></html>`);
        doc.close();
    }, [html, css]);

    return (
        <div style={{
            width: sw, height: sh, overflow: "hidden",
            boxShadow: side === "left"
                ? "inset -1px 0 2px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.15)"
                : "inset 1px 0 2px rgba(0,0,0,0.08), 0 1px 8px rgba(0,0,0,0.15)",
        }}>
            <iframe
                ref={iframeRef}
                title={`page-${side}`}
                sandbox="allow-same-origin allow-scripts"
                style={{
                    border: "none",
                    width: w, height: h,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                }}
            />
        </div>
    );
}

const navBtnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
};

const arrowBtnStyle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
};
