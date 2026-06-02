"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface Props {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const pulling = useRef(false);
    const pullDistance = useMotionValue(0);
    const indicatorOpacity = useTransform(pullDistance, [0, THRESHOLD * 0.5, THRESHOLD], [0, 0.5, 1]);
    const indicatorRotation = useTransform(pullDistance, [0, THRESHOLD], [0, 180]);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const el = containerRef.current;
        if (!el || el.scrollTop > 0 || refreshing) return;
        startY.current = e.touches[0].clientY;
        pulling.current = true;
    }, [refreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!pulling.current) return;
        const dy = Math.max(0, e.touches[0].clientY - startY.current);
        const dampened = Math.min(dy * 0.5, THRESHOLD * 1.5);
        pullDistance.set(dampened);
        if (dampened > 10) e.preventDefault();
    }, [pullDistance]);

    const handleTouchEnd = useCallback(async () => {
        if (!pulling.current) return;
        pulling.current = false;
        const dist = pullDistance.get();

        if (dist >= THRESHOLD && !refreshing) {
            setRefreshing(true);
            pullDistance.set(THRESHOLD * 0.6);
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
                pullDistance.set(0);
            }
        } else {
            pullDistance.set(0);
        }
    }, [pullDistance, refreshing, onRefresh]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("touchstart", handleTouchStart, { passive: true });
        el.addEventListener("touchmove", handleTouchMove, { passive: false });
        el.addEventListener("touchend", handleTouchEnd);
        return () => {
            el.removeEventListener("touchstart", handleTouchStart);
            el.removeEventListener("touchmove", handleTouchMove);
            el.removeEventListener("touchend", handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return (
        <div ref={containerRef} style={{ overscrollBehavior: "none", position: "relative" }}>
            {/* Pull indicator */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: 12,
                    opacity: indicatorOpacity,
                    zIndex: 10,
                }}
            >
                <motion.div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        rotate: indicatorRotation,
                    }}
                >
                    {refreshing ? (
                        <motion.span
                            className="material-symbols-outlined"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            style={{ fontSize: 20, color: "#2563eb" }}
                        >
                            refresh
                        </motion.span>
                    ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#2563eb" }}>
                            arrow_downward
                        </span>
                    )}
                </motion.div>
            </motion.div>

            {/* Content with pull offset */}
            <motion.div style={{ y: pullDistance }}>
                {children}
            </motion.div>
        </div>
    );
}
