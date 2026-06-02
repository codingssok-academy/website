"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { COURSES, getAllUnits } from "@/data/courses";
import { CourseIcon } from "@/components/icons/CourseIcons";
import Link from "next/link";

/* ═══════════════════════════════════════
   무료 체험 — 로그인 없이 첫 유닛 체험
   /trial
   ═══════════════════════════════════════ */

export default function TrialPage() {
    const router = useRouter();

    // Find the first course with actual page content
    const trialTarget = useMemo(() => {
        for (const course of COURSES) {
            const units = getAllUnits(course.id);
            for (let i = 0; i < units.length; i++) {
                const u = units[i];
                const contentPage = u.pages?.find(p => p.content || p.quiz || p.problems);
                if (contentPage) {
                    return {
                        courseId: course.id,
                        courseTitle: course.title,
                        courseGradient: course.gradient,
                        unitIdx: i + 1,
                        unitTitle: u.title,
                        pageId: contentPage.id,
                        pageTitle: contentPage.title,
                    };
                }
            }
        }
        return null;
    }, []);

    // Set guest flag so learning page won't redirect to login
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("codingssok_trial_mode", "true");
        }
    }, []);

    if (!trialTarget) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, color: "#94a3b8" }}>inbox</span>
                <p style={{ color: "#64748b" }}>체험 가능한 콘텐츠가 없습니다.</p>
                <Link href="/" style={{ color: "#2563eb", fontWeight: 600 }}>← 홈으로</Link>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #EFF6FF 0%, #FDFAF5 50%, #FFFBEB 100%)",
            padding: 20,
        }}>
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    background: "#fff", borderRadius: 24, padding: "48px 40px",
                    maxWidth: 500, width: "100%", textAlign: "center",
                    boxShadow: "0 20px 60px rgba(79,70,229,0.08), 0 0 0 1px rgba(79,70,229,0.06)",
                }}
            >
                {/* Course icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    style={{
                        width: 80, height: 80, borderRadius: 24, margin: "0 auto 24px",
                        background: trialTarget.courseGradient,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <CourseIcon courseId={trialTarget.courseId} size={42} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <span style={{
                        display: "inline-block", padding: "4px 14px", borderRadius: 20,
                        background: "#FEF3C7", color: "#D97706", fontSize: 12, fontWeight: 700,
                        marginBottom: 16,
                    }}>
                        무료 체험
                    </span>

                    <h1 style={{ fontSize: 28, fontWeight: 800, color: "#172554", letterSpacing: "-0.03em", marginBottom: 8 }}>
                        {trialTarget.courseTitle}
                    </h1>

                    <p style={{ fontSize: 15, color: "#64748b", marginBottom: 8 }}>
                        <strong>{trialTarget.unitTitle}</strong>
                    </p>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 32 }}>
                        로그인 없이 바로 체험해보세요!<br />
                        맘에 드시면 가입하고, 전체 커리큘럼을 이용하세요.
                    </p>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push(`/dashboard/learning/courses/${trialTarget.courseId}/units/${trialTarget.unitIdx}/pages/${trialTarget.pageId}`)}
                    style={{
                        width: "100%", padding: "16px", border: "none", borderRadius: 16,
                        background: "linear-gradient(135deg, #2563eb, #6366F1)", color: "#fff",
                        fontSize: 16, fontWeight: 800, cursor: "pointer",
                        boxShadow: "0 8px 24px rgba(79,70,229,0.3)",
                    }}
                >
                    체험 수업 시작하기 →
                </motion.button>

                <Link href="/" style={{
                    display: "block", marginTop: 20, fontSize: 13, color: "#94a3b8",
                    textDecoration: "none", fontWeight: 500,
                }}>
                    ← 홈으로 돌아가기
                </Link>
            </motion.div>
        </div >
    );
}
