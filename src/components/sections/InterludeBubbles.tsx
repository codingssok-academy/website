"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/* ── 9 bubbles matching nodcoding's 3×3 grid ── */
const BUBBLE_COUNT = 9;

/* Per-bubble speed factors for mouse parallax */
const SPEEDS = [1.0, 1.05, 1.0, 1.05, 1.0, 1.05, 1.1, 1.05, 1.1];

export default function InterludeBubbles() {
    const outerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [outerW, setOuterW] = useState(1920);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!outerRef.current) return;
        const rect = outerRef.current.getBoundingClientRect();
        /* Mouse position relative to container center, normalized to [-1, 1] */
        const hw = rect.width / 2;
        const hh = rect.height / 2;
        setMousePos({
            x: (e.clientX - rect.left - hw) / hw,
            y: (e.clientY - rect.top - hh) / hh,
        });
    }, []);

    useEffect(() => {
        const el = outerRef.current;
        if (!el) return;
        el.addEventListener("mousemove", handleMouseMove);

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setOuterW(entry.contentRect.width);
            }
        });
        ro.observe(el);

        return () => {
            el.removeEventListener("mousemove", handleMouseMove);
            ro.disconnect();
        };
    }, [handleMouseMove]);

    /* ── SVG geometry — from nodcoding's computed path ──
     * SVG width = 100vw (set via CSS), viewBox matches container width
     * Line from edge to dot at center ± offset with Q curve
     * Dots are filled circles at the anchor points
     */
    const svgW = outerW;
    const centerX = svgW / 2;
    /* Dot offset is proportional: ~29.6% of container width (568.12/1920) */
    const dotOffset = svgW * 0.296;
    const dotLeft = centerX - dotOffset;
    const dotRight = centerX + dotOffset;
    /* Q control point: ~40% of the way from the edge to the dot */
    const qLeft = dotLeft * 0.4;
    const qRight = svgW - (svgW - dotRight) * 0.4;
    const r = 6;

    /* Nodcoding SVG path: two curves from edges to dots with circle markers */
    const pathD = [
        `M 0 3`,
        `Q ${qLeft.toFixed(2)} 3 ${dotLeft.toFixed(2)} 3`,
        `m 0 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`,
        `M ${svgW} 3`,
        `Q ${qRight.toFixed(2)} 3 ${dotRight.toFixed(2)} 3`,
        `m -${r * 2} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`,
    ].join(" ");

    /* Per-bubble mouse offset — subtle parallax like nodcoding */
    const bubbles = Array.from({ length: BUBBLE_COUNT }, (_, i) => {
        const factor = SPEEDS[i] * 0.000005;
        return {
            x: -(mousePos.x * factor * outerW),
            y: -(mousePos.y * factor * outerW),
        };
    });

    return (
        <div
            className="s-interlude s-interlude--bubbles"
            data-plr-component="s-interlude"
        >
            <div
                ref={outerRef}
                className="b-interlude-bubbles"
                data-plr-component="b-interlude-bubbles"
            >
                <div className="b__inner">
                    {/* Bubbles — mouse-reactive via CSS --x/--y vars */}
                    <div className="b__bubbles js-bubbles">
                        {bubbles.map((off, i) => (
                            <div
                                key={i}
                                className="b__bubble js-bubble"
                                style={
                                    {
                                        "--x": `${off.x}px`,
                                        "--y": `${off.y}px`,
                                    } as React.CSSProperties
                                }
                            >
                                <div className="b__circle" />
                            </div>
                        ))}
                    </div>

                    {/* SVG line with two dots — stroke, not fill */}
                    <svg
                        width="1920"
                        height="980"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="b__render js-render"
                        overflow="visible"
                        preserveAspectRatio="none"
                        style={{
                            width: `${svgW}px`,
                            height: "6px",
                        }}
                    >
                        <path
                            d={pathD}
                            className="js-render-path"
                        />
                    </svg>

                    <div className="b__ruler js-ruler" />
                </div>
            </div>
        </div>
    );
}
