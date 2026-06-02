"use client";

import { ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * TiltCard — 마우스 추적 3D 기울기 효과
 * 마우스 위치에 따라 카드가 3D로 기울어지고 하이라이트 이동
 */
export function TiltCard({
    children,
    maxTilt = 8,
    glareOpacity = 0.15,
    style,
    className,
}: {
    children: ReactNode;
    maxTilt?: number;
    glareOpacity?: number;
    style?: React.CSSProperties;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
    const [glare, setGlare] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setTransform({
            rotateX: (0.5 - y) * maxTilt * 2,
            rotateY: (x - 0.5) * maxTilt * 2,
        });
        setGlare({ x: x * 100, y: y * 100 });
    };

    const handleMouseLeave = () => {
        setTransform({ rotateX: 0, rotateY: 0 });
        setIsHovered(false);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            animate={{
                rotateX: transform.rotateX,
                rotateY: transform.rotateY,
                scale: isHovered ? 1.02 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={className}
            style={{
                ...style,
                perspective: 1000,
                transformStyle: "preserve-3d",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {children}
            {/* Glare overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    opacity: isHovered ? glareOpacity : 0,
                    transition: "opacity 0.3s",
                    background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                    borderRadius: "inherit",
                }}
            />
        </motion.div>
    );
}
