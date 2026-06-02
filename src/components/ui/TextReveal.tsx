"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
    children: string;
    className?: string;
    style?: React.CSSProperties;
    as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
    delay?: number;
}

/**
 * GSAP ScrollTrigger 기반 텍스트 리빌 컴포넌트.
 * 스크롤 시 단어 단위로 순차적으로 나타남.
 */
export default function TextReveal({ children, className = "", style, as: Tag = "h2", delay = 0 }: TextRevealProps) {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const words = el.querySelectorAll(".word");

        gsap.set(words, { opacity: 0.15, y: 20 });

        gsap.to(words, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.08,
            delay,
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                end: "bottom 60%",
                toggleActions: "play none none reverse",
            },
        });

        return () => {
            ScrollTrigger.getAll().forEach((t) => {
                if (t.trigger === el) t.kill();
            });
        };
    }, [delay]);

    const words = children.split(" ");

    return (
        <Tag ref={containerRef as React.RefObject<any>} className={className} style={style}>
            {words.map((word, i) => (
                <span key={i} className="word inline-block mr-[0.3em]">
                    {word}
                </span>
            ))}
        </Tag>
    );
}
