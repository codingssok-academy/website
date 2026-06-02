"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface XPToastProps {
    amount: number;
    onDone: () => void;
    /** 스택 인덱스 — 여러 토스트가 동시에 표시될 때 세로 오프셋용 */
    stackIndex?: number;
}

export function XPToast({ amount, onDone, stackIndex = 0 }: XPToastProps) {
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;

    useEffect(() => {
        const t = setTimeout(() => onDoneRef.current(), 2500);
        return () => clearTimeout(t);
    }, []); // 마운트 시 1회만

    return (
        <motion.div
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{
                position: "fixed",
                // 스택 인덱스에 따라 세로로 쌓기 (간격 56px)
                top: 80 + stackIndex * 56,
                right: 20,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                boxShadow: "0 8px 24px rgba(14,165,233,0.35), 0 0 0 1px rgba(255,255,255,0.15) inset",
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "-0.01em",
                pointerEvents: "none",
                userSelect: "none",
            }}
            aria-live="polite"
            aria-label={`${amount} XP 획득`}
        >
            <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
            >
                bolt
            </span>
            +{amount} XP
        </motion.div>
    );
}
