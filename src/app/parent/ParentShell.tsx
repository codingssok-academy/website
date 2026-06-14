"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import ParentBottomNav from "./ParentBottomNav";
import ParentNameGate from "./ParentNameGate";
import { installGlobalErrorHandler } from "@/lib/error-reporter";
import {
    clearParentClientAuth,
    PARENT_STUDENT_KEY,
    PARENT_VERIFIED_KEY,
    writeAllowedStudentNames,
} from "@/lib/parent-client-auth";

export default function ParentShell({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        installGlobalErrorHandler();
    }, []);

    const [studentName, setStudentName] = useState<string | null>(null);
    const [booting, setBooting] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        const stored = localStorage.getItem(PARENT_STUDENT_KEY) ?? "";
        const verified = localStorage.getItem(PARENT_VERIFIED_KEY) === "true";

        if (!stored || !verified) {
            clearParentClientAuth();
            setStudentName(null);
        } else {
            setStudentName(stored);
        }

        setBooting(false);
    }, []);

    useEffect(() => {
        const handleStudentChange = (event: Event) => {
            const nextName = (event as CustomEvent<{ name?: string }>).detail?.name || localStorage.getItem(PARENT_STUDENT_KEY) || "";
            if (nextName) setStudentName(nextName);
        };
        window.addEventListener("codingssok-parent-student-change", handleStudentChange);
        return () => window.removeEventListener("codingssok-parent-student-change", handleStudentChange);
    }, []);

    const handleNameSet = (name: string) => {
        localStorage.setItem(PARENT_STUDENT_KEY, name);
        localStorage.setItem(PARENT_VERIFIED_KEY, "true");
        setStudentName(name);
    };

    const validateSession = useCallback(async (name: string | null) => {
        if (!name) return;
        try {
            const res = await fetch(`/api/parent/session?name=${encodeURIComponent(name)}`, { cache: "no-store" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                clearParentClientAuth();
                setStudentName(null);
                return;
            }

            const allowedStudents = Array.isArray(data.allowedStudents)
                ? data.allowedStudents.map((item: unknown) => String(item || "").trim()).filter(Boolean)
                : [];
            if (allowedStudents.length > 0) {
                writeAllowedStudentNames(allowedStudents);
                if (!allowedStudents.includes(name)) {
                    const nextName = allowedStudents[0];
                    localStorage.setItem(PARENT_STUDENT_KEY, nextName);
                    setStudentName(nextName);
                }
            }
        } catch {
            // Keep the current UI during transient network failures; protected API calls still enforce access.
        }
    }, []);

    useEffect(() => {
        if (!studentName) return;

        void validateSession(studentName);
        const interval = window.setInterval(() => {
            void validateSession(localStorage.getItem(PARENT_STUDENT_KEY) || studentName);
        }, 30_000);
        const handleFocus = () => void validateSession(localStorage.getItem(PARENT_STUDENT_KEY) || studentName);
        const handleVisibility = () => {
            if (document.visibilityState === "visible") handleFocus();
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [studentName, validateSession]);

    if (booting) {
        return (
            <div suppressHydrationWarning className="min-h-dvh bg-white flex items-center justify-center">
                <Image src="/images/logo-codingssok.png" alt="코딩쏙" width={120} height={38} priority />
            </div>
        );
    }

    if (!studentName) {
        return <ParentNameGate onNameSet={handleNameSet} />;
    }

    return (
        <div className="min-h-dvh bg-slate-50 font-[Pretendard,'Noto_Sans_KR',sans-serif] flex flex-col">
            <header
                className="sticky top-0 z-[100] backdrop-blur-[20px] border-b border-slate-200/70 px-5 flex items-end"
                style={{
                    background: "rgba(255,255,255,0.95)",
                    paddingTop: "env(safe-area-inset-top, 0px)",
                    height: "calc(52px + env(safe-area-inset-top, 0px))",
                    paddingBottom: 10,
                }}
            >
                <div className="flex items-center justify-between w-full">
                    <Image
                        src="/images/logo-codingssok.png"
                        alt="코딩쏙"
                        width={90}
                        height={28}
                        style={{ objectFit: "contain" }}
                        priority
                    />
                    <div className="flex items-center gap-1.5 bg-gray-100 rounded-full py-1.5 px-3">
                        <span className="text-[13px] font-semibold text-gray-700">{studentName}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            <ParentBottomNav />
        </div>
    );
}
