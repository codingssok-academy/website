"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
    value: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    style?: React.CSSProperties;
}

function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function AnimatedCounter({ value, duration = 1200, suffix = "", prefix = "", style }: Props) {
    const [display, setDisplay] = useState(0);
    const prevRef = useRef(0);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const from = prevRef.current;
        const to = value;
        const diff = to - from;
        if (diff === 0) return;

        const start = performance.now();

        function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            const current = Math.round(from + diff * eased);
            setDisplay(current);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                prevRef.current = to;
            }
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [value, duration]);

    return <span style={style}>{prefix}{display.toLocaleString()}{suffix}</span>;
}
