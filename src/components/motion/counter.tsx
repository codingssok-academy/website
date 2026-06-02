"use client";

import { useEffect, useRef, useState } from "react";

/**
 * AnimatedCounter — 숫자 카운트업 애니메이션
 * 뷰포트에 진입하면 0에서 목표값까지 부드럽게 증가
 */
export function AnimatedCounter({
    end,
    duration = 1.5,
    prefix = "",
    suffix = "",
    separator = ",",
    decimals = 0,
    style,
    className,
}: {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    separator?: string;
    decimals?: number;
    style?: React.CSSProperties;
    className?: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.3 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;
        const startTime = Date.now();
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(eased * end);
            if (progress >= 1) clearInterval(timer);
        }, 16);
        return () => clearInterval(timer);
    }, [hasStarted, end, duration]);

    const formatted = count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator);

    return (
        <span ref={ref} className={className} style={style}>
            {prefix}{formatted}{suffix}
        </span>
    );
}
