"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/*
  BackToTop — 스크롤이 일정 이상 내려가면 나타나는 최상단 이동 버튼
*/
export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 600);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    style={{
                        position: "fixed",
                        bottom: 32,
                        right: 32,
                        width: 48,
                        height: 48,
                        borderRadius: 999,
                        border: "none",
                        background: "linear-gradient(135deg, #EC5212, #FF6B35)",
                        color: "#fff",
                        fontSize: 20,
                        cursor: "pointer",
                        zIndex: 9990,
                        boxShadow: "0 4px 20px rgba(236,82,18,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    aria-label="맨 위로"
                >
                    ↑
                </motion.button>
            )}
        </AnimatePresence>
    );
}
