"use client";

/**
 * BookSlideViewer — 풀스크린 PNG 카드 책 페이지 뷰어 (cpp iframe pattern)
 *
 * 담당자 명시 (2026-04-29):
 * - C++ 코스 iframe과 동일한 layout 영역 차지 (sidebar 옆 main 가득)
 * - 컨테이너 100% width × 85vh height
 * - PNG는 objectFit: contain — 9:16 카드는 좌우 letterbox, 자체 크기는 큼
 * - 페이지 넘김 = 3D rotateY 책 효과 유지
 * - 자동재생 X, swipe + keyboard
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface BookSlideViewerProps {
    imageSrc: string;
    pageIndex: number;
    totalPages: number;
    onNext: () => void;
    onPrev: () => void;
    alt?: string;
    /** @deprecated — cpp iframe pattern으로 변경되어 무시됨. PNG 원본 비율 contain 사용. */
    aspectRatio?: string;
    theme?: 'beige' | 'white';
}

const FLIP_MS = 700;
const SWIPE_THRESHOLD = 40;

const THEME_STYLES = {
    beige: {
        background: "linear-gradient(135deg, #fef3c7, #fde68a)",
        chevronColor: "#0ea5e9",
        chevronBg: "rgba(255,255,255,0.92)",
        spineGradient: "linear-gradient(to right, rgba(0,0,0,0.18), transparent)",
        dotActive: "#0ea5e9",
        dotPanelBg: "rgba(0,0,0,0.18)",
    },
    white: {
        background: "linear-gradient(180deg, #f8fafc, #e2e8f0)",
        chevronColor: "#1e40af",
        chevronBg: "rgba(255,255,255,0.96)",
        spineGradient: "linear-gradient(to right, rgba(0,0,0,0.10), transparent)",
        dotActive: "#1e40af",
        dotPanelBg: "rgba(15,23,42,0.20)",
    },
} as const;

export default function BookSlideViewer({
    imageSrc,
    pageIndex,
    totalPages,
    onNext,
    onPrev,
    alt = "슬라이드",
    theme = "beige",
}: BookSlideViewerProps) {
    const [flipDirection, setFlipDirection] = useState<"none" | "next" | "prev">("none");
    const [displaySrc, setDisplaySrc] = useState(imageSrc);
    const lockedRef = useRef(false);
    const touchStartXRef = useRef<number | null>(null);

    const T = THEME_STYLES[theme];

    useEffect(() => {
        if (flipDirection === "none") setDisplaySrc(imageSrc);
    }, [imageSrc, flipDirection]);

    const handleNext = useCallback(() => {
        if (lockedRef.current || pageIndex >= totalPages - 1) return;
        lockedRef.current = true;
        setFlipDirection("next");
        setTimeout(() => {
            onNext();
            setFlipDirection("none");
            setTimeout(() => { lockedRef.current = false; }, 50);
        }, FLIP_MS);
    }, [onNext, pageIndex, totalPages]);

    const handlePrev = useCallback(() => {
        if (lockedRef.current || pageIndex <= 0) return;
        lockedRef.current = true;
        setFlipDirection("prev");
        setTimeout(() => {
            onPrev();
            setFlipDirection("none");
            setTimeout(() => { lockedRef.current = false; }, 50);
        }, FLIP_MS);
    }, [onPrev, pageIndex]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                handlePrev();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleNext, handlePrev]);

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartXRef.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        const start = touchStartXRef.current;
        touchStartXRef.current = null;
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (dx < 0) handleNext();
        else handlePrev();
    };

    const transformStyle: React.CSSProperties =
        flipDirection === "next"
            ? { transform: "rotateY(-180deg)", transformOrigin: "left center" }
            : flipDirection === "prev"
            ? { transform: "rotateY(180deg)", transformOrigin: "right center" }
            : { transform: "rotateY(0deg)" };

    const isAnimating = flipDirection !== "none";

    return (
        <div
            style={{
                /* cpp iframe pattern — main 영역 100% width × 85vh height */
                position: "relative",
                width: "100%",
                minHeight: "85vh",
                background: T.background,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                perspective: "1500px",
                userSelect: "none",
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    transition: isAnimating
                        ? `transform ${FLIP_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...transformStyle,
                }}
            >
                <img
                    src={displaySrc}
                    alt={alt}
                    loading="eager"
                    draggable={false}
                    style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        width: "auto",
                        height: "auto",
                        objectFit: "contain",
                        display: "block",
                        backfaceVisibility: "hidden",
                    }}
                />
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: 0, bottom: 0, left: 0, width: 24,
                        background: T.spineGradient,
                        pointerEvents: "none",
                    }}
                />
            </div>

            {pageIndex > 0 && (
                <button
                    onClick={handlePrev}
                    disabled={isAnimating}
                    aria-label="이전 페이지"
                    style={{
                        position: "absolute",
                        left: 16, top: "50%", transform: "translateY(-50%)",
                        width: 64, height: 64, borderRadius: "50%",
                        background: T.chevronBg, border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: isAnimating ? "wait" : "pointer",
                        fontSize: 36, fontWeight: 900, color: T.chevronColor, lineHeight: 1,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                        zIndex: 10,
                        opacity: isAnimating ? 0.5 : 1,
                        transition: "opacity 0.2s, transform 0.2s",
                    }}
                    onMouseEnter={e => { if (!isAnimating) e.currentTarget.style.transform = "translateY(-50%) scale(1.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
                >
                    ‹
                </button>
            )}

            {pageIndex < totalPages - 1 && (
                <button
                    onClick={handleNext}
                    disabled={isAnimating}
                    aria-label="다음 페이지"
                    style={{
                        position: "absolute",
                        right: 16, top: "50%", transform: "translateY(-50%)",
                        width: 64, height: 64, borderRadius: "50%",
                        background: T.chevronBg, border: "none",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: isAnimating ? "wait" : "pointer",
                        fontSize: 36, fontWeight: 900, color: T.chevronColor, lineHeight: 1,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                        zIndex: 10,
                        opacity: isAnimating ? 0.5 : 1,
                        transition: "opacity 0.2s, transform 0.2s",
                    }}
                    onMouseEnter={e => { if (!isAnimating) e.currentTarget.style.transform = "translateY(-50%) scale(1.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
                >
                    ›
                </button>
            )}

            <div
                style={{
                    position: "absolute",
                    bottom: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 6,
                    zIndex: 10,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: T.dotPanelBg,
                    backdropFilter: "blur(4px)",
                    maxWidth: "80%",
                    overflowX: "auto",
                }}
            >
                {Array.from({ length: totalPages }, (_, i) => (
                    <div
                        key={i}
                        style={{
                            width: i === pageIndex ? 18 : 8,
                            height: 8,
                            borderRadius: 999,
                            background: i === pageIndex ? T.dotActive : "rgba(255,255,255,0.7)",
                            transition: "width 0.3s, background 0.3s",
                            flexShrink: 0,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
