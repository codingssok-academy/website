"use client";

import { ReactNode, useRef, useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════
 *  MagneticButton — 자석 효과 버튼
 *  커서가 가까워지면 버튼이 커서 방향으로 끌려감
 * ═══════════════════════════════════════════ */
export function MagneticButton({
    children,
    strength = 0.3,
    radius = 200,
    className,
    style,
    onClick,
}: {
    children: ReactNode;
    strength?: number;
    radius?: number;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}) {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (dist < radius) {
            x.set(deltaX * strength);
            y.set(deltaY * strength);
        }
    }, [x, y, strength, radius]);

    const handleMouseLeave = useCallback(() => {
        x.set(0);
        y.set(0);
    }, [x, y]);

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ ...style, x: springX, y: springY, cursor: "pointer" }}
            className={className}
            whileTap={{ scale: 0.95 }}
        >
            {children}
        </motion.button>
    );
}

/* ═══════════════════════════════════════════
 *  TextReveal — 단어별 등장 애니메이션
 *  뷰포트 진입 시 단어가 하나씩 올라오며 등장
 * ═══════════════════════════════════════════ */
export function TextReveal({
    text,
    className,
    style,
    delay = 0,
    staggerDelay = 0.04,
}: {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    delay?: number;
    staggerDelay?: number;
}) {
    const words = text.split(" ");

    return (
        <motion.div
            className={className}
            style={{ ...style, display: "flex", flexWrap: "wrap", gap: "0.3em" }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
        >
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    variants={{
                        hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                    }}
                    transition={{
                        duration: 0.5,
                        delay: delay + i * staggerDelay,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    style={{ display: "inline-block" }}
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
}

/* ═══════════════════════════════════════════
 *  FloatingCard — 3D 패럴랙스 카드
 *  마우스 추적으로 내부 레이어가 서로 다른 깊이로 이동
 * ═══════════════════════════════════════════ */
export function FloatingCard({
    children,
    depth = 20,
    className,
    style,
}: {
    children: ReactNode;
    depth?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
    const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });
    const bgX = useTransform(springRotateY, [-15, 15], [depth, -depth]);
    const bgY = useTransform(springRotateX, [-15, 15], [-depth, depth]);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        rotateY.set(x * 15);
        rotateX.set(-y * 15);
    };

    const handleMouseLeave = () => {
        rotateX.set(0);
        rotateY.set(0);
        setIsHovered(false);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformStyle: "preserve-3d",
                perspective: 800,
                position: "relative",
            }}
            className={className}
        >
            {/* Floating background highlight */}
            <motion.div
                style={{
                    position: "absolute", inset: -20, borderRadius: "inherit",
                    background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)",
                    x: bgX, y: bgY, pointerEvents: "none", zIndex: 0,
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.3s",
                }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
                {children}
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════
 *  MorphingGradient — 오로라 메쉬 그라디언트
 *  배경에 부드럽게 변화하는 오로라 효과
 * ═══════════════════════════════════════════ */
export function MorphingGradient({
    colors = ["#0ea5e9", "#3b82f6", "#ec4899", "#14b8a6"],
    speed = 8,
    style,
    className,
}: {
    colors?: string[];
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
}) {
    const [c] = useState(colors);

    return (
        <>
            <style>{`
                @keyframes mg-morph-move {
                    0% { transform: translate(0%, 0%) rotate(0deg) scale(1); }
                    25% { transform: translate(30%, -20%) rotate(90deg) scale(1.1); }
                    50% { transform: translate(-10%, 30%) rotate(180deg) scale(0.95); }
                    75% { transform: translate(-30%, -10%) rotate(270deg) scale(1.05); }
                    100% { transform: translate(0%, 0%) rotate(360deg) scale(1); }
                }
            `}</style>
            <div
                className={className}
                style={{
                    ...style,
                    position: "absolute", inset: 0, overflow: "hidden",
                    borderRadius: "inherit", pointerEvents: "none",
                }}
            >
                {c.map((color, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: "60%", height: "60%",
                            left: `${20 + (i % 2) * 30}%`,
                            top: `${10 + Math.floor(i / 2) * 40}%`,
                            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                            borderRadius: "50%",
                            filter: "blur(60px)",
                            animation: `mg-morph-move ${speed + i * 2}s ease-in-out infinite`,
                            animationDelay: `${-i * (speed / c.length)}s`,
                        }}
                    />
                ))}
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════
 *  RippleEffect — 머터리얼 클릭 리플
 *  클릭 시 클릭 위치에서 원형 파동 확산
 * ═══════════════════════════════════════════ */
export function RippleEffect({
    children,
    color = "rgba(255,255,255,0.35)",
    duration = 600,
    className,
    style,
}: {
    children: ReactNode;
    color?: string;
    duration?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples(prev => [...prev, { x, y, id }]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, duration);
    };

    return (
        <div
            onClick={handleClick}
            className={className}
            style={{ ...style, position: "relative", overflow: "hidden", cursor: "pointer" }}
        >
            {children}
            <AnimatePresence>
                {ripples.map(r => (
                    <motion.span
                        key={r.id}
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: duration / 1000, ease: "easeOut" }}
                        style={{
                            position: "absolute",
                            left: r.x, top: r.y,
                            width: 40, height: 40,
                            marginLeft: -20, marginTop: -20,
                            borderRadius: "50%",
                            background: color,
                            pointerEvents: "none",
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

/* ═══════════════════════════════════════════
 *  Spotlight — 커서 추적 스포트라이트 효과
 *  마우스 위치에 빛이 따라다니는 카드 효과
 * ═══════════════════════════════════════════ */
export function Spotlight({
    children,
    size = 300,
    color = "rgba(14,165,233,0.06)",
    className,
    style,
}: {
    children: ReactNode;
    size?: number;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ x: -1000, y: -1000 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setPos({ x: -1000, y: -1000 })}
            className={className}
            style={{ ...style, position: "relative", overflow: "hidden" }}
        >
            <div
                style={{
                    position: "absolute",
                    width: size, height: size,
                    left: pos.x - size / 2,
                    top: pos.y - size / 2,
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                    borderRadius: "50%",
                    pointerEvents: "none",
                    transition: "opacity 0.2s",
                    opacity: pos.x > -500 ? 1 : 0,
                    zIndex: 0,
                }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
 *  TypeWriter — 타이핑 텍스트 효과
 *  한 글자씩 나타나는 타이핑 애니메이션
 * ═══════════════════════════════════════════ */
export function TypeWriter({
    text,
    speed = 50,
    delay = 0,
    cursor = true,
    className,
    style,
}: {
    text: string;
    speed?: number;
    delay?: number;
    cursor?: boolean;
    className?: string;
    style?: React.CSSProperties;
}) {
    const [displayed, setDisplayed] = useState("");
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true); },
            { threshold: 0.3 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        const timer = setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayed(text.slice(0, i + 1));
                i++;
                if (i >= text.length) clearInterval(interval);
            }, speed);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(timer);
    }, [started, text, speed, delay]);

    return (
        <span ref={ref} className={className} style={style}>
            {displayed}
            {cursor && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    style={{ display: "inline-block", width: 2, height: "1em", background: "currentColor", marginLeft: 2, verticalAlign: "text-bottom" }}
                />
            )}
        </span>
    );
}
