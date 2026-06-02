"use client";

/**
 * 숙제 알림 배너 — 학생 대시보드 상단
 *
 * 미완료 숙제가 있으면 배너 표시.
 * 클릭 시 숙제 목록으로 이동.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Props {
    userName?: string;
}

export default function HomeworkBanner({ userName }: Props) {
    const [count, setCount] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!userName) return;
        fetch(`/api/homework?student_name=${encodeURIComponent(userName)}&pending=true`)
            .then(r => r.json())
            .then(d => setCount(d.pendingCount || 0))
            .catch(() => {});
    }, [userName]);

    if (count === 0 || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={{
                    margin: "0 24px 16px",
                    padding: "14px 20px",
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    position: "relative",
                    zIndex: 10,
                    boxShadow: "0 4px 16px rgba(245,158,11,0.25)",
                }}
            >
                <span className="material-symbols-outlined" style={{
                    fontSize: 22, color: "#78350f",
                    fontVariationSettings: "'FILL' 1",
                }}>
                    assignment_late
                </span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#78350f" }}>
                        숙제 {count}개가 있어요
                    </div>
                    <div style={{ fontSize: 11, color: "#92400e" }}>
                        마감 전에 완료해주세요
                    </div>
                </div>
                <Link
                    href="/dashboard/learning/homework"
                    style={{
                        padding: "8px 16px", borderRadius: 10,
                        background: "rgba(120,53,15,0.15)",
                        color: "#78350f", fontSize: 12, fontWeight: 800,
                        textDecoration: "none",
                    }}
                >
                    확인하기
                </Link>
                <button
                    onClick={() => setDismissed(true)}
                    style={{
                        background: "transparent", border: "none",
                        color: "#92400e", cursor: "pointer", padding: 4,
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
