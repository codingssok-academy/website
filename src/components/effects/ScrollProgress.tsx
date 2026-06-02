"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/*
  ScrollProgress — 상단 오렌지 진행 바
  페이지 스크롤에 따라 진행률 표시
*/
export default function ScrollProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const p = docHeight > 0 ? scrollTop / docHeight : 0;
            setProgress(p);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <motion.div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, #EC5212, #FF6B35, #FFD37D)",
                transformOrigin: "left",
                scaleX: progress,
                zIndex: 9999,
                pointerEvents: "none",
            }}
        />
    );
}
