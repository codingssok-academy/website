"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    strength?: number;
    as?: "button" | "a" | "div";
    href?: string;
    onClick?: () => void;
}

/**
 * 마우스가 가까이 가면 자석처럼 따라오는 버튼.
 * CTA에 사용하면 Premium 느낌.
 */
export default function MagneticButton({
    children,
    className = "",
    style,
    strength = 0.3,
    as: Tag = "button",
    href,
    onClick,
}: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * strength;
        const y = (e.clientY - rect.top - rect.height / 2) * strength;
        setPosition({ x, y });
    };

    const handleLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.5 }}
            className="inline-block"
        >
            {Tag === "a" ? (
                <a href={href} className={className} style={style} onClick={onClick}>
                    {children}
                </a>
            ) : (
                <button className={className} style={style} onClick={onClick}>
                    {children}
                </button>
            )}
        </motion.div>
    );
}
