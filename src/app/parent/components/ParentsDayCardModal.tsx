"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { slugifyStudentName, isParentsDay, getCardImageUrl } from "@/lib/parents-day-card";

const SEEN_KEY_PREFIX = "parents_day_card_seen_";

interface Props {
    studentName: string | null | undefined;
}

/**
 * 학부모 대시보드 진입 시 5월 8일이면 학생별 어버이날 카드 모달 자동 표시.
 * - 학생 이름 → sha256 8자 slug → /parents-day-card/<slug>.png fetch
 * - PNG 없으면 모달 안 보임 (담당자이 PNG 채우기 전엔 silent)
 * - 첫 1회만 자동 표시 (학부모별/학생별 localStorage)
 */
export default function ParentsDayCardModal({ studentName }: Props) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!studentName) return;
        if (!isParentsDay()) return;
        if (localStorage.getItem(SEEN_KEY_PREFIX + studentName) === "1") return;

        let cancelled = false;
        slugifyStudentName(studentName).then(async (slug) => {
            const url = getCardImageUrl(slug);
            try {
                const res = await fetch(url, { method: "HEAD" });
                if (cancelled) return;
                if (res.ok) {
                    setImageUrl(url);
                    setOpen(true);
                }
            } catch {
                // PNG 없거나 네트워크 에러 — 모달 띄우지 않음
            }
        });

        return () => { cancelled = true; };
    }, [studentName]);

    const close = () => {
        setOpen(false);
        if (studentName) {
            localStorage.setItem(SEEN_KEY_PREFIX + studentName, "1");
        }
    };

    if (!imageUrl || !studentName) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={close}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.78)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        cursor: "pointer",
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 12 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: 480,
                            width: "100%",
                            background: "#fdf5ed",
                            borderRadius: 20,
                            padding: 18,
                            position: "relative",
                            boxShadow: "0 18px 60px rgba(231, 122, 138, 0.35), 0 4px 14px rgba(0,0,0,0.08)",
                            cursor: "default",
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt={`${studentName} — 어버이날 감사 카드`}
                            style={{
                                width: "100%",
                                borderRadius: 14,
                                display: "block",
                                boxShadow: "0 6px 18px rgba(231, 122, 138, 0.18)",
                            }}
                        />
                        <div
                            style={{
                                marginTop: 14,
                                textAlign: "center",
                                color: "#b87a85",
                                fontSize: 13,
                                letterSpacing: "0.04em",
                                fontWeight: 700,
                            }}
                        >
                            {studentName} · 코딩쏙학원 어버이날 감사 카드
                        </div>
                        <div
                            style={{
                                marginTop: 4,
                                textAlign: "center",
                                color: "#c89aa3",
                                fontSize: 11,
                                opacity: 0.7,
                            }}
                        >
                            길게 눌러 사진 저장 가능
                        </div>
                        <button
                            type="button"
                            onClick={close}
                            aria-label="닫기"
                            style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.92)",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 22,
                                lineHeight: 1,
                                color: "#888",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            ×
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
