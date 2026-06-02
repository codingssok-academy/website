"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import { XP_REWARDS } from "@/lib/xp-engine";
import { awardXP } from "@/lib/xp-client";
import { trackMission } from "@/lib/mission-tracker";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion/motion";
import Link from "next/link";

/* ── Types ── */
interface TestCase {
    input: string;
    expected: string;
}

interface Challenge {
    id: number;
    status: "solved" | "active" | "hard" | "pending";
    number: number;
    title: string;
    desc: string;
    tags: { icon: string; label: string }[];
    difficulty: "Easy" | "Medium" | "Hard";
    xp: number;
    testCases: TestCase[];
    boilerplate: string;
}

/* ── Challenge Data ── */
const CHALLENGES: Challenge[] = [
    {
        id: 1, status: "active", number: 1, title: "Hello World 출력",
        desc: 'printf를 사용하여 "Hello World"를 출력하세요.',
        tags: [{ icon: "terminal", label: "출력" }, { icon: "emoji_objects", label: "Easy" }],
        difficulty: "Easy", xp: 80,
        testCases: [{ input: "", expected: "Hello World" }],
        boilerplate: '#include <stdio.h>\n\nint main() {\n    // 여기에 코드를 작성하세요\n    \n    return 0;\n}',
    },
    {
        id: 2, status: "active", number: 2, title: "두 수의 합",
        desc: "두 정수를 입력받아 합을 출력하세요.",
        tags: [{ icon: "calculate", label: "연산" }, { icon: "emoji_objects", label: "Easy" }],
        difficulty: "Easy", xp: 80,
        testCases: [
            { input: "3 5", expected: "8" },
            { input: "10 20", expected: "30" },
            { input: "-1 1", expected: "0" },
        ],
        boilerplate: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    // 합을 출력하세요\n    \n    return 0;\n}',
    },
    {
        id: 3, status: "active", number: 3, title: "구구단 출력",
        desc: "정수 N을 입력받아 N단 구구단을 출력하세요. (N x 1 = N 형식)",
        tags: [{ icon: "repeat", label: "반복문" }, { icon: "bolt", label: "Medium" }],
        difficulty: "Medium", xp: 120,
        testCases: [
            { input: "3", expected: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27" },
            { input: "2", expected: "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18" },
        ],
        boilerplate: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // N단 구구단을 출력하세요\n    \n    return 0;\n}',
    },
    {
        id: 4, status: "active", number: 4, title: "별 피라미드",
        desc: "정수 N을 입력받아 N줄의 별 피라미드를 출력하세요. (1줄에 1개, 2줄에 2개...)",
        tags: [{ icon: "star", label: "중첩 반복" }, { icon: "bolt", label: "Medium" }],
        difficulty: "Medium", xp: 120,
        testCases: [
            { input: "4", expected: "*\n**\n***\n****" },
            { input: "3", expected: "*\n**\n***" },
        ],
        boilerplate: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // 별 피라미드를 출력하세요\n    \n    return 0;\n}',
    },
    {
        id: 5, status: "pending", number: 5, title: "최대값 찾기",
        desc: "첫 줄에 정수 N, 둘째 줄에 N개의 정수가 주어질 때 최대값을 출력하세요.",
        tags: [{ icon: "grid_on", label: "배열" }, { icon: "bolt", label: "Medium" }],
        difficulty: "Medium", xp: 120,
        testCases: [
            { input: "5\n3 7 1 9 2", expected: "9" },
            { input: "3\n-1 -5 -2", expected: "-1" },
        ],
        boilerplate: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int arr[100];\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    // 최대값을 찾아 출력하세요\n    \n    return 0;\n}',
    },
    {
        id: 6, status: "pending", number: 6, title: "문자열 뒤집기",
        desc: "문자열을 입력받아 뒤집어서 출력하세요.",
        tags: [{ icon: "abc", label: "문자열" }, { icon: "bolt", label: "Medium" }],
        difficulty: "Medium", xp: 120,
        testCases: [
            { input: "hello", expected: "olleh" },
            { input: "abc", expected: "cba" },
        ],
        boilerplate: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char str[100];\n    scanf("%s", str);\n    // 문자열을 뒤집어서 출력하세요\n    \n    return 0;\n}',
    },
    {
        id: 7, status: "pending", number: 7, title: "소수 판별",
        desc: '정수 N을 입력받아 소수이면 "소수", 아니면 "소수 아님"을 출력하세요.',
        tags: [{ icon: "functions", label: "알고리즘" }, { icon: "psychology", label: "Hard" }],
        difficulty: "Hard", xp: 200,
        testCases: [
            { input: "7", expected: "소수" },
            { input: "4", expected: "소수 아님" },
            { input: "2", expected: "소수" },
            { input: "1", expected: "소수 아님" },
        ],
        boilerplate: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // 소수 판별 후 출력하세요\n    \n    return 0;\n}',
    },
];

const statusConfig: Record<string, { badge: string; badgeBg: string; badgeColor: string; borderColor: string }> = {
    solved: { badge: "Solved", badgeBg: "#dcfce7", badgeColor: "#15803d", borderColor: "transparent" },
    active: { badge: "Active", badgeBg: "rgba(17,82,212,0.1)", badgeColor: "#1152d4", borderColor: "rgba(17,82,212,0.4)" },
    hard: { badge: "Hard", badgeBg: "#dbeafe", badgeColor: "#1d4ed8", borderColor: "rgba(124,58,237,0.3)" },
    pending: { badge: "Pending", badgeBg: "#f1f5f9", badgeColor: "#64748b", borderColor: "transparent" },
};

const XP_BY_DIFFICULTY: Record<string, number> = {
    Easy: XP_REWARDS.challenge_easy,
    Medium: XP_REWARDS.challenge_medium,
    Hard: XP_REWARDS.challenge_hard,
};

export default function ChallengesPage() {
    const { user } = useAuth();
    const supabase = createClient();

    const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [code, setCode] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<{ passed: boolean; input: string; expected: string; actual: string }[] | null>(null);
    const [xpMsg, setXpMsg] = useState("");

    const challenges = useMemo(() =>
        CHALLENGES.map(ch => ({
            ...ch,
            status: solvedIds.has(ch.id) ? "solved" as const : ch.status,
        })),
        [solvedIds],
    );

    const solved = challenges.filter(c => c.status === "solved").length;
    const totalXP = challenges.reduce((s, c) => s + (c.status === "solved" ? c.xp : 0), 0);
    const maxXP = challenges.reduce((s, c) => s + c.xp, 0);

    const openChallenge = useCallback((ch: Challenge) => {
        if (solvedIds.has(ch.id)) return;
        setActiveChallenge(ch);
        setCode(ch.boilerplate);
        setResults(null);
    }, [solvedIds]);

    const closeChallenge = useCallback(() => {
        setActiveChallenge(null);
        setCode("");
        setResults(null);
    }, []);

    const submitCode = useCallback(async () => {
        if (!activeChallenge || isRunning) return;
        setIsRunning(true);
        setResults(null);

        const testResults: { passed: boolean; input: string; expected: string; actual: string }[] = [];

        try {
            for (const tc of activeChallenge.testCases) {
                const res = await fetch("/api/compile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, language: "c", input: tc.input }),
                });

                if (!res.ok) {
                    testResults.push({ passed: false, input: tc.input, expected: tc.expected, actual: `HTTP ${res.status}` });
                    continue;
                }

                const data = await res.json();
                const actual = (data.output ?? data.stdout ?? "").trim();
                const expected = tc.expected.trim();
                testResults.push({ passed: actual === expected, input: tc.input, expected, actual });
            }

            setResults(testResults);

            const allPassed = testResults.every(r => r.passed);
            if (allPassed && user && !solvedIds.has(activeChallenge.id)) {
                const xpAmount = XP_BY_DIFFICULTY[activeChallenge.difficulty] ?? XP_REWARDS.challenge_easy;
                const result = await awardXP("challenge_complete", `${activeChallenge.difficulty}:${activeChallenge.id}`);
                trackMission("code_run");

                setSolvedIds(prev => new Set([...prev, activeChallenge.id]));
                setXpMsg(`+${xpAmount} XP!`);
                setTimeout(() => setXpMsg(""), 3000);

                // Save to user_course_progress
                try {
                    const { data: existing } = await supabase
                        .from("user_course_progress")
                        .select("completed_lessons")
                        .eq("user_id", user.id)
                        .eq("course_id", "challenges")
                        .single();

                    const completedLessons: string[] = Array.isArray(existing?.completed_lessons) ? existing.completed_lessons : [];
                    const challengeKey = `challenge_${activeChallenge.id}`;
                    if (!completedLessons.includes(challengeKey)) {
                        completedLessons.push(challengeKey);
                        await supabase.from("user_course_progress").upsert({
                            user_id: user.id,
                            course_id: "challenges",
                            progress: Math.round((new Set([...solvedIds, activeChallenge.id]).size / CHALLENGES.length) * 100),
                            completed_lessons: completedLessons,
                        }, { onConflict: "user_id,course_id" });
                    }
                } catch {
                    // progress save failed silently
                }
            }
        } catch {
            setResults([{ passed: false, input: "", expected: "", actual: "서버 오류가 발생했습니다." }]);
        } finally {
            setIsRunning(false);
        }
    }, [activeChallenge, code, isRunning, user, solvedIds, supabase]);

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 80px)", position: "relative" }}>
            {/* Ambient Background */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                <div style={{
                    position: "absolute", top: "-10%", left: "-10%", width: "50vw", height: "50vw",
                    background: "rgba(17,82,212,0.04)", borderRadius: "50%", filter: "blur(120px)",
                    animation: "float 15s infinite ease-in-out",
                }} />
                <div style={{
                    position: "absolute", bottom: "-10%", right: "-10%", width: "40vw", height: "40vw",
                    background: "rgba(99,102,241,0.06)", borderRadius: "50%", filter: "blur(100px)",
                    animation: "float 15s infinite ease-in-out", animationDelay: "-5s",
                }} />
            </div>

            {/* XP Local Toast 제거 (피드백 L29/L51 중첩 해결 — Global XPToast 사용) */}

            {/* Challenge Modal */}
            <AnimatePresence>
                {activeChallenge && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={closeChallenge}
                        style={{
                            position: "fixed", inset: 0, zIndex: 100,
                            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: 24,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: "100%", maxWidth: 720, maxHeight: "85vh",
                                background: "#fff", borderRadius: 20, overflow: "hidden",
                                boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
                                display: "flex", flexDirection: "column",
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span style={{
                                            padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800,
                                            background: XP_BY_DIFFICULTY[activeChallenge.difficulty] === XP_REWARDS.challenge_hard ? "#fee2e2" : XP_BY_DIFFICULTY[activeChallenge.difficulty] === XP_REWARDS.challenge_medium ? "#fef3c7" : "#dcfce7",
                                            color: XP_BY_DIFFICULTY[activeChallenge.difficulty] === XP_REWARDS.challenge_hard ? "#dc2626" : XP_BY_DIFFICULTY[activeChallenge.difficulty] === XP_REWARDS.challenge_medium ? "#d97706" : "#16a34a",
                                        }}>{activeChallenge.difficulty}</span>
                                        <span style={{ fontSize: 12, color: "#94a3b8" }}>+{XP_BY_DIFFICULTY[activeChallenge.difficulty]} XP</span>
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{activeChallenge.title}</h3>
                                </div>
                                <button onClick={closeChallenge} style={{
                                    width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
                                    background: "#f1f5f9", color: "#64748b", fontSize: 18,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>{activeChallenge.desc}</p>

                                {/* Test Cases Preview */}
                                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        테스트 케이스
                                    </div>
                                    {activeChallenge.testCases.slice(0, 2).map((tc, i) => (
                                        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 8, fontSize: 13 }}>
                                            <div><span style={{ fontWeight: 700, color: "#475569" }}>입력:</span> <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>{tc.input || "(없음)"}</code></div>
                                            <div><span style={{ fontWeight: 700, color: "#475569" }}>출력:</span> <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>{tc.expected.split("\n")[0]}{tc.expected.includes("\n") ? "..." : ""}</code></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Code Editor */}
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        코드 작성
                                    </div>
                                    <textarea
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        spellCheck={false}
                                        style={{
                                            width: "100%", minHeight: 220, padding: 16, borderRadius: 12,
                                            border: "1px solid #e2e8f0", background: "#0f172a", color: "#e2e8f0",
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13,
                                            lineHeight: 1.6, resize: "vertical", outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>

                                {/* Results */}
                                {results && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            채점 결과
                                        </div>
                                        {results.map((r, i) => (
                                            <div key={i} style={{
                                                padding: 12, borderRadius: 10,
                                                background: r.passed ? "#f0fdf4" : "#fef2f2",
                                                border: `1px solid ${r.passed ? "#bbf7d0" : "#fecaca"}`,
                                                display: "flex", alignItems: "center", gap: 12,
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 20, color: r.passed ? "#16a34a" : "#dc2626" }}>
                                                    {r.passed ? "check_circle" : "cancel"}
                                                </span>
                                                <div style={{ flex: 1, fontSize: 13 }}>
                                                    <span style={{ fontWeight: 700 }}>테스트 {i + 1}</span>
                                                    {!r.passed && (
                                                        <div style={{ marginTop: 4, color: "#64748b" }}>
                                                            <div>입력: <code>{r.input || "(없음)"}</code></div>
                                                            <div>기대: <code>{r.expected}</code></div>
                                                            <div>실제: <code>{r.actual}</code></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {results.every(r => r.passed) && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                style={{
                                                    textAlign: "center", padding: 20, borderRadius: 12,
                                                    background: "linear-gradient(135deg, #dcfce7, #d1fae5)",
                                                    border: "1px solid #86efac",
                                                }}
                                            >
                                                <div style={{ fontSize: 32, marginBottom: 8 }}><span className="material-symbols-outlined" style={{ fontSize: 32 }}>celebration</span></div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: "#15803d" }}>정답입니다!</div>
                                                <div style={{ fontSize: 13, color: "#16a34a", marginTop: 4 }}>
                                                    +{XP_BY_DIFFICULTY[activeChallenge.difficulty]} XP 획득
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: "16px 24px", borderTop: "1px solid #e2e8f0",
                                display: "flex", justifyContent: "flex-end", gap: 12,
                            }}>
                                <button onClick={closeChallenge} style={{
                                    padding: "10px 20px", borderRadius: 12, border: "1px solid #e2e8f0",
                                    background: "#fff", color: "#64748b", fontWeight: 700, fontSize: 14,
                                    cursor: "pointer",
                                }}>닫기</button>
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={submitCode}
                                    disabled={isRunning}
                                    style={{
                                        padding: "10px 24px", borderRadius: 12, border: "none", cursor: isRunning ? "not-allowed" : "pointer",
                                        background: isRunning ? "#94a3b8" : "linear-gradient(135deg, #1152d4, #3b82f6)",
                                        color: "#fff", fontWeight: 800, fontSize: 14,
                                        display: "flex", alignItems: "center", gap: 8,
                                        boxShadow: isRunning ? "none" : "0 8px 20px rgba(17,82,212,0.3)",
                                    }}
                                >
                                    {isRunning ? (
                                        <>
                                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>progress_activity</span>
                                            </motion.span>
                                            채점 중...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                                            제출 & 채점
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: "auto", padding: "32px 0", paddingBottom: 140, position: "relative", zIndex: 10 }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    {/* Section Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                        <div>
                            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: 8 }}>
                                챌린지 스트림
                            </h2>
                            <p style={{ color: "#64748b", fontWeight: 500, fontSize: 15 }}>
                                문제를 풀고 다음 티어를 잠금 해제하세요. 정확도가 핵심입니다.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <span style={{
                                padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 800,
                                background: "rgba(17,82,212,0.1)", color: "#1152d4", border: "1px solid rgba(17,82,212,0.2)",
                                textTransform: "uppercase", letterSpacing: "0.05em",
                            }}>
                                {CHALLENGES.length}개 문제
                            </span>
                            <span style={{
                                padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 800,
                                background: "#e2e8f0", color: "#475569", textTransform: "uppercase",
                            }}>
                                {maxXP.toLocaleString()} XP 총점
                            </span>
                        </div>
                    </div>

                    {/* Challenge Cards */}
                    <StaggerList style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {challenges.map((ch) => {
                            const cfg = statusConfig[ch.status];
                            const isSolved = ch.status === "solved";
                            const isActive = ch.status === "active";
                            return (
                                <StaggerItem key={ch.id}>
                                    <motion.div
                                        onClick={() => openChallenge(ch)}
                                        whileHover={!isSolved ? { y: -4, boxShadow: "0 8px 40px rgba(17,82,212,0.15)" } : {}}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        style={{
                                            position: "relative", padding: 28, borderRadius: 16,
                                            background: isSolved ? "rgba(248,250,252,0.5)" : "rgba(255,255,255,0.7)",
                                            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                                            border: `1px solid ${isActive ? cfg.borderColor : "rgba(255,255,255,0.6)"}`,
                                            boxShadow: isActive ? "0 4px 30px rgba(17,82,212,0.1)" : "0 4px 30px rgba(0,0,0,0.05)",
                                            opacity: isSolved ? 0.75 : 1, cursor: isSolved ? "default" : "pointer",
                                        }}
                                    >
                                        {/* Active left bar */}
                                        {isActive && <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "#1152d4", borderRadius: "16px 0 0 16px" }} />}
                                        {ch.status === "hard" && <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "#1d4ed8", borderRadius: "16px 0 0 16px", opacity: 0 }} />}

                                        {/* Solved checkmark */}
                                        {isSolved && (
                                            <div style={{ position: "absolute", top: 16, right: 16, background: "#dcfce7", borderRadius: 99, padding: 4 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#16a34a" }}>check_circle</span>
                                            </div>
                                        )}

                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                                    <span style={{
                                                        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800,
                                                        background: cfg.badgeBg, color: cfg.badgeColor,
                                                        textTransform: "uppercase", letterSpacing: "0.06em",
                                                    }}>{cfg.badge}</span>
                                                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Problem #{ch.number}</span>
                                                </div>
                                                <h3 style={{ fontSize: 19, fontWeight: 800, color: isSolved ? "#475569" : "#0f172a", marginBottom: 8 }}>
                                                    {ch.title}
                                                </h3>
                                                <p style={{ fontSize: 14, color: isSolved ? "#94a3b8" : "#64748b", lineHeight: 1.6, marginBottom: 14 }}>
                                                    {ch.desc}
                                                </p>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                    {ch.tags.map((tag, i) => (
                                                        <span key={i} style={{
                                                            display: "inline-flex", alignItems: "center", gap: 4,
                                                            padding: "4px 10px", borderRadius: 6,
                                                            background: "#f1f5f9", color: isSolved ? "#94a3b8" : "#64748b",
                                                            fontSize: 12, fontWeight: 500, border: "1px solid #e2e8f0",
                                                        }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{tag.icon}</span>
                                                            {tag.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
                                                <div style={{ textAlign: "right", opacity: isSolved ? 0.5 : 1 }}>
                                                    <span style={{ display: "block", fontSize: isSolved ? 20 : 26, fontWeight: 900, color: isSolved ? "#64748b" : "#0f172a" }}>
                                                        {ch.xp}
                                                    </span>
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                        XP Points
                                                    </span>
                                                </div>
                                                {!isSolved && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: 10 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={e => { e.stopPropagation(); openChallenge(ch); }}
                                                        style={{
                                                            width: 40, height: 40, borderRadius: 99, border: "none", cursor: "pointer",
                                                            background: isActive ? "#1152d4" : "#f1f5f9",
                                                            color: isActive ? "#fff" : "#94a3b8",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            boxShadow: isActive ? "0 8px 20px rgba(17,82,212,0.3)" : "none",
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {isActive ? "code" : ch.status === "hard" ? "lock_open" : "lock"}
                                                        </span>
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </StaggerItem>
                            );
                        })}
                    </StaggerList>
                </div>
            </main>

            {/* Sticky Command Bar */}
            <div style={{
                position: "fixed", bottom: 24, left: 0, width: "100%", zIndex: 50,
                display: "flex", justifyContent: "center", padding: "0 16px",
            }}>
                <div style={{
                    width: "100%", maxWidth: 900,
                    background: "rgba(255,255,255,0.8)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 25px 50px rgba(0,0,0,0.12)",
                    borderRadius: 20, padding: "16px 24px",
                    display: "flex", alignItems: "center", gap: 32,
                }}>
                    {/* Progress */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            <span>진행률</span>
                            <span>{solved} / {CHALLENGES.length} 완료</span>
                        </div>
                        <div style={{ height: 8, width: "100%", background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(solved / CHALLENGES.length) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{
                                height: "100%", borderRadius: 99,
                                background: "linear-gradient(90deg, #1152d4, #3b82f6)",
                                boxShadow: "0 0 10px rgba(17,82,212,0.5)",
                            }} />
                        </div>
                    </div>

                    {/* Score */}
                    <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: 24 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em" }}>현재 점수</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                                {totalXP.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>/ {maxXP.toLocaleString()} XP</span>
                        </div>
                    </div>

                    {/* Action */}
                    <Link href="/dashboard/learning/problems" style={{ textDecoration: "none" }}>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 12px 30px rgba(17,82,212,0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                position: "relative", overflow: "hidden", borderRadius: 16, border: "none", cursor: "pointer",
                                padding: "14px 32px", fontWeight: 800, fontSize: 15, letterSpacing: "0.03em",
                                background: "linear-gradient(135deg, #1152d4, #3b82f6)",
                                color: "#fff", boxShadow: "0 8px 25px rgba(17,82,212,0.3)",
                                display: "flex", alignItems: "center", gap: 8,
                                flexShrink: 0,
                            }}
                        >
                            모든 문제 보기
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                        </motion.button>
                    </Link>
                </div>
            </div>

            {/* Animation keyframes */}
            <style>{`
                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-20px, 20px) scale(1.1); }
                    100% { transform: translate(0, 0) scale(1); }
                }
            `}</style>
        </div>
    );
}
