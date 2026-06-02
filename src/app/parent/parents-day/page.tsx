"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getParentsDayCard, type ParentsDayCard } from "@/data/parents-day-cards";

const STUDENT_KEY = "codingssok_parent_student";

/**
 * 어버이날 카드 페이지 — 학부모 포털
 * 학부모가 진입 시 입력한 자녀 이름으로 카드 매칭.
 * 카드 데이터: src/data/parents-day-cards.ts
 */
export default function ParentsDayPage() {
    const [studentName, setStudentName] = useState<string | null>(null);
    const [card, setCard] = useState<ParentsDayCard | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const name = localStorage.getItem(STUDENT_KEY);
        setStudentName(name);
        setCard(getParentsDayCard(name));
        setLoaded(true);
    }, []);

    return (
        <div
            style={{
                minHeight: "100dvh",
                background: card?.background ?? "linear-gradient(180deg, #fdf5ed 0%, #f9e8d8 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 24,
                paddingBottom: 40,
                transition: "background 0.6s ease",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: "100%",
                    maxWidth: 480,
                    padding: "0 16px",
                }}
            >
                {/* 헤더 */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 99,
                            background: "rgba(231, 122, 138, 0.12)",
                            border: "1px solid rgba(231, 122, 138, 0.25)",
                            color: card?.accentColor ?? "#b87a85",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                            favorite
                        </span>
                        2026 어버이날
                    </div>
                    <h1
                        style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: "#0f172a",
                            margin: "12px 0 6px",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        사랑하는 부모님께
                    </h1>
                    <p
                        style={{
                            fontSize: 13,
                            color: "#78716c",
                            margin: 0,
                            lineHeight: 1.7,
                        }}
                    >
                        {studentName
                            ? `${studentName} 학생이 코딩쏙학원에서 만든 감사 카드입니다.`
                            : "자녀가 코딩쏙학원에서 만든 감사 카드입니다."}
                    </p>
                </div>

                {/* 카드 콘텐츠 */}
                <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    style={{
                        background: "#fff",
                        borderRadius: 18,
                        padding: 14,
                        boxShadow: "0 12px 40px rgba(231, 122, 138, 0.18), 0 2px 8px rgba(0,0,0,0.04)",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            minHeight: card?.imageUrl ? undefined : 460,
                            borderRadius: 12,
                            overflow: "hidden",
                            background: card?.background ?? "linear-gradient(135deg, #fdf5ed, #f9e8d8)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: card?.imageUrl ? 0 : "32px 24px",
                            textAlign: "center",
                        }}
                    >
                        {!loaded ? (
                            // 로딩
                            <div style={{ color: "#c89aa3", fontSize: 13, padding: 32 }}>불러오는 중...</div>
                        ) : card ? (
                            // 카드 있음 — 학생이 만든 콘텐츠
                            card.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={card.imageUrl}
                                    alt={`${card.studentName} 어버이날 카드`}
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        display: "block",
                                    }}
                                />
                            ) : card.html ? (
                                <div
                                    style={{ width: "100%", color: "#0f172a" }}
                                    dangerouslySetInnerHTML={{ __html: card.html }}
                                />
                            ) : (
                                <>
                                    <h2
                                        style={{
                                            fontSize: 26,
                                            fontWeight: 900,
                                            color: card.accentColor ?? "#b87a85",
                                            margin: "0 0 24px",
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {card.title}
                                    </h2>
                                    <p
                                        style={{
                                            fontSize: 16,
                                            color: "#374151",
                                            margin: 0,
                                            lineHeight: 1.9,
                                            whiteSpace: "pre-line",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {card.message}
                                    </p>
                                    {card.signature && (
                                        <p
                                            style={{
                                                marginTop: 32,
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: card.accentColor ?? "#b87a85",
                                            }}
                                        >
                                            {card.signature}
                                        </p>
                                    )}
                                </>
                            )
                        ) : (
                            // 카드 없음 — placeholder
                            <>
                                <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.4, color: "#c89aa3" }}>
                                    card_giftcard
                                </span>
                                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "#c89aa3" }}>
                                    {studentName
                                        ? `${studentName} 학생의 카드는 아직 준비 중이에요`
                                        : "곧 공개됩니다"}
                                </div>
                                <div style={{ marginTop: 6, fontSize: 12, color: "#d6b3ba" }}>
                                    5월 8일 어버이날
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                <p
                    style={{
                        marginTop: 16,
                        textAlign: "center",
                        color: "#b87a85",
                        fontSize: 12,
                        opacity: 0.8,
                        lineHeight: 1.6,
                    }}
                >
                    코딩쏙학원 · 어버이날 감사 카드 2026
                </p>
            </motion.div>
        </div>
    );
}
