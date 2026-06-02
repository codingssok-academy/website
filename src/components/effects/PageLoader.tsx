"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/*
  PageLoader — 페이지 초기 로딩 애니메이션
  코딩쏙 로고 + 프로그레스 바 → 페이드아웃
*/
export default function PageLoader() {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShow(false), 1800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 99999,
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 24,
                    }}
                >
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Image
                                src="/images/promo/logo-codingssok.png"
                                alt="코딩쏙"
                                width={180}
                                height={60}
                                style={{ objectFit: "contain" }}
                                priority
                            />
                        </motion.div>
                        <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>
                            코딩이 쏙쏙 들어오는 곳
                        </p>
                    </motion.div>

                    {/* Progress bar */}
                    <div style={{ width: 200, height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            style={{
                                height: "100%",
                                background: "linear-gradient(90deg, #EC5212, #FF6B35)",
                                borderRadius: 999,
                            }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
