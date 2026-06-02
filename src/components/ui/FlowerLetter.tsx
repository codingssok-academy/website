"use client";

import { useRef, useEffect, useState } from "react";
import Lottie from "lottie-react";
import { useMousePosition } from "@/components/effects/MouseTracker";

/*
  코딩쏙 — Flower Letter (nodcoding-style)
  
  Each letter = Lottie animation flower on top of an SVG stem.
  Mouse movement causes flower to sway via translate3d + rotate.
  Stem draws upward on scroll reveal.
*/

interface FlowerLetterProps {
    letter?: string;
    lottieFile: string;       // path to lottie json in /public
    stemWidth?: number;
    stemHeight?: number;
    flowerWidth?: number;
    flowerHeight?: number;
    index?: number;
}

export default function FlowerLetter({
    lottieFile,
    stemWidth = 200,
    stemHeight = 500,
    flowerWidth = 280,
    flowerHeight = 280,
    index = 0,
}: FlowerLetterProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lottieData, setLottieData] = useState<object | null>(null);
    const mouse = useMousePosition();

    // Load lottie JSON
    useEffect(() => {
        fetch(lottieFile)
            .then(res => res.json())
            .then(data => setLottieData(data))
            .catch(err => { if (process.env.NODE_ENV === 'development') console.error("Lottie load error:", err); });
    }, [lottieFile]);

    // Mouse parallax for flower sway
    const dx = (mouse.progressX - 0.5) * 2;
    const dy = (mouse.progressY - 0.5) * 2;

    // Each letter sways differently based on index
    const swayMultiplier = 1 + (index % 3) * 0.3;
    const translateX = dx * 50 * swayMultiplier;
    const translateY = dy * 5;
    const rotation = dx * 2.5 * swayMultiplier;

    // Stem path — curved line from bottom to flower
    const stemMidX = stemWidth / 2;
    const stemCurve = translateX * 0.3; // stem follows flower slightly

    return (
        <div
            ref={containerRef}
            className="b__letter"
            style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
            }}
        >
            {/* ── Flower (Lottie) ── */}
            <div
                className="b__letter__flower"
                style={{
                    width: flowerWidth,
                    height: flowerHeight,
                    position: "relative",
                    zIndex: 2,
                    transform: `translate3d(${translateX}px, ${translateY}px, 0px) rotate(${rotation}deg)`,
                    transition: "transform 0.15s ease-out",
                }}
            >
                {lottieData && (
                    <Lottie
                        animationData={lottieData}
                        loop
                        autoplay
                        style={{ width: "100%", height: "100%" }}
                    />
                )}
            </div>

            {/* ── Stem (SVG) ── */}
            <svg
                className="b__letter__stem"
                width={stemWidth}
                height={stemHeight}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                overflow="visible"
                preserveAspectRatio="none"
                style={{
                    position: "relative",
                    zIndex: 1,
                    marginTop: -10,
                }}
            >
                <path
                    d={`M ${stemMidX + stemCurve} 0 Q ${stemMidX + stemCurve * 0.5} ${stemHeight * 0.4} ${stemMidX} ${stemHeight}`}
                    stroke="var(--color-black, #383030)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Stem tip circle */}
                <circle
                    cx={stemMidX + stemCurve}
                    cy={0}
                    r="5"
                    fill="var(--color-black, #383030)"
                />
            </svg>
        </div>
    );
}
