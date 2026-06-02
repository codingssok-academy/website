"use client";

import { ReactNode, useRef, useState, useCallback, useMemo } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
 *  ACTIVE_ANIMATIONS — translateX 무한반복 프리셋
 * ═══════════════════════════════════════════════════════════════ */
export const ACTIVE_ANIMATIONS = {
    /** 기본 마퀴 — 좌→우 25초 */
    marqueeDefault: {
        animate: { x: ["0%", "-50%"] },
        transition: { x: { duration: 25, repeat: Infinity, ease: "linear" } },
    },
    /** 빠른 마퀴 — 좌→우 12초 */
    marqueeFast: {
        animate: { x: ["0%", "-50%"] },
        transition: { x: { duration: 12, repeat: Infinity, ease: "linear" } },
    },
    /** 느린 마퀴 — 좌→우 40초 */
    marqueeSlow: {
        animate: { x: ["0%", "-50%"] },
        transition: { x: { duration: 40, repeat: Infinity, ease: "linear" } },
    },
    /** 역방향 마퀴 — 우→좌 */
    marqueeReverse: {
        animate: { x: ["-50%", "0%"] },
        transition: { x: { duration: 25, repeat: Infinity, ease: "linear" } },
    },
    /** 기술 스택 마퀴 — 아이콘/뱃지용 */
    marqueeTech: {
        animate: { x: ["0%", "-50%"] },
        transition: { x: { duration: 30, repeat: Infinity, ease: "linear" } },
    },
} as const;

export type MarqueePreset = keyof typeof ACTIVE_ANIMATIONS;

/* ═══════════════════════════════════════════════════════════════
 *  MarqueeScroll — translateX 무한 반복 스크롤 컴포넌트
 *  ACTIVE_ANIMATIONS 데이터 기반
 * ═══════════════════════════════════════════════════════════════ */
interface MarqueeScrollProps {
    /** 마퀴 안에 반복할 아이템들 */
    children: ReactNode;
    /** ACTIVE_ANIMATIONS 프리셋 선택 (기본: marqueeDefault) */
    preset?: MarqueePreset;
    /** 커스텀 속도 (초). preset보다 우선 적용 */
    duration?: number;
    /** 역방향 여부 */
    reverse?: boolean;
    /** 호버 시 일시정지 */
    pauseOnHover?: boolean;
    /** 복제 횟수 (기본 2, 긴 콘텐츠에는 3~4) */
    copies?: number;
    /** gap between items (px) */
    gap?: number;
    /** 래퍼 className */
    className?: string;
    /** 래퍼 스타일 */
    style?: React.CSSProperties;
    /** 방향: horizontal(기본) 또는 vertical */
    direction?: "horizontal" | "vertical";
}

export function MarqueeScroll({
    children,
    preset = "marqueeDefault",
    duration,
    reverse = false,
    pauseOnHover = true,
    copies = 2,
    gap = 32,
    className,
    style,
    direction = "horizontal",
}: MarqueeScrollProps) {
    const [isPaused, setIsPaused] = useState(false);

    const base = ACTIVE_ANIMATIONS[preset];
    const speed = duration ?? base.transition.x.duration;
    const isVertical = direction === "vertical";

    // 방향 및 역방향 계산
    const from = reverse ? "-50%" : "0%";
    const to = reverse ? "0%" : "-50%";

    const animateValue = isVertical ? { y: [from, to] } : { x: [from, to] };
    const transitionKey = isVertical ? "y" : "x";

    return (
        <div
            className={className}
            style={{
                overflow: "hidden",
                maskImage:
                    "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage:
                    "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                ...style,
            }}
            onMouseEnter={() => pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
            <motion.div
                animate={animateValue}
                transition={{
                    [transitionKey]: {
                        duration: speed,
                        repeat: Infinity,
                        ease: "linear",
                    },
                }}
                style={{
                    display: "flex",
                    flexDirection: isVertical ? "column" : "row",
                    gap,
                    width: isVertical ? "100%" : "max-content",
                    animationPlayState: isPaused ? "paused" : "running",
                }}
            >
                {Array.from({ length: copies }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            flexDirection: isVertical ? "column" : "row",
                            gap,
                            flexShrink: 0,
                        }}
                    >
                        {children}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
 *  Tilt3DCard — perspective + rotateX/Y 3D 틸트 카드
 *  마우스 위치에 반응하는 프리미엄 3D 틸트 효과
 * ═══════════════════════════════════════════════════════════════ */
interface Tilt3DCardProps {
    children: ReactNode;
    /** 최대 틸트 각도 (도) */
    maxRotation?: number;
    /** perspective 거리 (px) */
    perspective?: number;
    /** 글레어 효과 최대 불투명도 (0~1) */
    glareIntensity?: number;
    /** 호버 시 확대 비율 */
    hoverScale?: number;
    /** 호버 시 리프트 거리 (px) */
    liftOnHover?: number;
    /** 그림자 색상 */
    shadowColor?: string;
    /** 스프링 강성 */
    springStiffness?: number;
    /** 스프링 댐핑 */
    springDamping?: number;
    className?: string;
    style?: React.CSSProperties;
    /** 둥근 모서리 (px) */
    borderRadius?: number;
}

export function Tilt3DCard({
    children,
    maxRotation = 15,
    perspective = 1000,
    glareIntensity = 0.2,
    hoverScale = 1.03,
    liftOnHover = 8,
    shadowColor = "rgba(0, 0, 0, 0.25)",
    springStiffness = 260,
    springDamping = 20,
    className,
    style,
    borderRadius = 16,
}: Tilt3DCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Motion values for smooth tracking
    const rawRotateX = useMotionValue(0);
    const rawRotateY = useMotionValue(0);
    const rawGlareX = useMotionValue(50);
    const rawGlareY = useMotionValue(50);

    // Spring-smoothed values
    const rotateX = useSpring(rawRotateX, {
        stiffness: springStiffness,
        damping: springDamping,
    });
    const rotateY = useSpring(rawRotateY, {
        stiffness: springStiffness,
        damping: springDamping,
    });

    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            const el = ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width; // 0~1
            const y = (e.clientY - rect.top) / rect.height; // 0~1

            // rotateX: 위→양수, 아래→음수 | rotateY: 좌→음수, 우→양수
            rawRotateX.set((0.5 - y) * maxRotation * 2);
            rawRotateY.set((x - 0.5) * maxRotation * 2);

            // 글레어 중심점
            rawGlareX.set(x * 100);
            rawGlareY.set(y * 100);
        },
        [maxRotation, rawRotateX, rawRotateY, rawGlareX, rawGlareY]
    );

    const handleMouseLeave = useCallback(() => {
        rawRotateX.set(0);
        rawRotateY.set(0);
        setIsHovered(false);
    }, [rawRotateX, rawRotateY]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    // 동적 그림자 (틸트에 따라 그림자 방향 변화)
    const shadowX = useTransform(rotateY, [-maxRotation, maxRotation], [20, -20]);
    const shadowY = useTransform(
        rotateX,
        [-maxRotation, maxRotation],
        [-20, 20]
    );

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective,
                transformStyle: "preserve-3d",
                ...style,
            }}
            className={className}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    borderRadius,
                    position: "relative",
                    overflow: "hidden",
                    willChange: "transform",
                }}
                animate={{
                    scale: isHovered ? hoverScale : 1,
                    y: isHovered ? -liftOnHover : 0,
                }}
                transition={{
                    scale: { type: "spring", stiffness: 400, damping: 25 },
                    y: { type: "spring", stiffness: 400, damping: 25 },
                }}
            >
                {/* 콘텐츠 */}
                <div style={{ position: "relative", zIndex: 1 }}>{children}</div>

                {/* 글레어 오버레이 */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 2,
                        borderRadius: "inherit",
                        opacity: isHovered ? glareIntensity : 0,
                        background: useTransform(
                            [rawGlareX, rawGlareY],
                            ([gx, gy]) =>
                                `radial-gradient(ellipse at ${gx}% ${gy}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)`
                        ),
                        transition: "opacity 0.3s ease",
                    }}
                />

                {/* 동적 3D 그림자 */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: -10,
                        zIndex: -1,
                        borderRadius: borderRadius + 4,
                        filter: "blur(20px)",
                        opacity: isHovered ? 0.6 : 0,
                        background: shadowColor,
                        x: shadowX,
                        y: shadowY,
                        transition: "opacity 0.3s ease",
                    }}
                />
            </motion.div>
        </motion.div>
    );
}
