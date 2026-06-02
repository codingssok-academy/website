"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

/* ═══════════════════════════════════════
   코드 골프 대회 — 최소 코드 챌린지
   /dashboard/learning/codegolf

   주어진 문제를 가장 짧은 코드로 풀기
   ═══════════════════════════════════════ */

interface GolfProblem {
    id: string;
    title: string;
    description: string;
    example: { input: string; output: string };
    difficulty: "easy" | "medium" | "hard";
    timeLimit: string;
}

interface LeaderboardEntry {
    problem_id: string;
    user_id: string;
    display_name: string;
    char_count: number;
    submitted_at: string;
}

interface RankingEntry {
    user_id: string;
    display_name: string;
    solved_count: number;
    avg_chars: number;
}

interface SubmitState {
    status: "idle" | "submitting" | "accepted" | "wrong" | "error";
    message: string;
}

const PROBLEMS: GolfProblem[] = [
    {
        id: "g1", title: "숫자 뒤집기", difficulty: "easy",
        description: "정수 N을 입력받아 숫자를 뒤집어 출력하세요.",
        example: { input: "12345", output: "54321" },
        timeLimit: "3일 남음",
    },
    {
        id: "g2", title: "피보나치 n번째", difficulty: "medium",
        description: "n번째 피보나치 수를 출력하세요.",
        example: { input: "10", output: "55" },
        timeLimit: "5일 남음",
    },
    {
        id: "g3", title: "팰린드롬 체크", difficulty: "medium",
        description: "입력 문자열이 팰린드롬이면 YES, 아니면 NO를 출력하세요.",
        example: { input: "racecar", output: "YES" },
        timeLimit: "7일 남음",
    },
    {
        id: "g4", title: "소수 판별기", difficulty: "hard",
        description: "정수 N이 소수이면 1, 아니면 0을 출력하세요.",
        example: { input: "17", output: "1" },
        timeLimit: "10일 남음",
    },
    {
        id: "g5", title: "두 수의 최대공약수", difficulty: "easy",
        description: "두 정수 A B를 입력받아 최대공약수(GCD)를 출력하세요.",
        example: { input: "12 8", output: "4" },
        timeLimit: "2일 남음",
    },
    {
        id: "g6", title: "별 삼각형", difficulty: "medium",
        description: "N을 입력받아 N줄 별 삼각형을 출력하세요.",
        example: { input: "3", output: "*\n**\n***" },
        timeLimit: "4일 남음",
    },
    {
        id: "g7", title: "짝수만 합산", difficulty: "medium",
        description: "N개의 정수를 입력받아 짝수만 더해 출력하세요.",
        example: { input: "5\n1 2 3 4 5", output: "6" },
        timeLimit: "6일 남음",
    },
    {
        id: "g8", title: "문자열 뒤집기", difficulty: "easy",
        description: "문자열을 입력받아 뒤집어 출력하세요.",
        example: { input: "hello", output: "olleh" },
        timeLimit: "8일 남음",
    },
];

const DIFF_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    easy: { bg: "#ECFDF5", color: "#059669", label: "쉬움" },
    medium: { bg: "#FEF3C7", color: "#D97706", label: "보통" },
    hard: { bg: "#FEE2E2", color: "#DC2626", label: "어려움" },
};

export default function CodeGolfPage() {
    const { user } = useAuth();
    const [selectedProblem, setSelectedProblem] = useState<GolfProblem | null>(null);
    const [code, setCode] = useState("");
    const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle", message: "" });

    // 문제별 최고기록 (problem_id → { score, player })
    const [bestScores, setBestScores] = useState<Map<string, { score: number; player: string }>>(new Map());
    // 전체 골프 랭킹
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [rankingLoading, setRankingLoading] = useState(true);

    // 마운트 시 리더보드 + 랭킹 로드
    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const sb = createClient();

            // 문제별 최고기록
            const { data: lb } = await sb
                .from("golf_leaderboard")
                .select("problem_id, display_name, char_count");

            if (lb) {
                const map = new Map<string, { score: number; player: string }>();
                for (const row of lb as LeaderboardEntry[]) {
                    const existing = map.get(row.problem_id);
                    if (!existing || row.char_count < existing.score) {
                        map.set(row.problem_id, { score: row.char_count, player: row.display_name });
                    }
                }
                setBestScores(map);
            }

            // 전체 랭킹
            const { data: rank } = await sb
                .from("golf_ranking")
                .select("user_id, display_name, solved_count, avg_chars")
                .limit(10);

            if (rank) setRanking(rank as RankingEntry[]);
        } catch (e) {
            console.error("[Golf] leaderboard load failed:", e);
        } finally {
            setRankingLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!code.trim() || !selectedProblem || !user) return;

        setSubmitState({ status: "submitting", message: "컴파일 중..." });

        try {
            // 1. /api/compile 호출
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    language: "c",
                    stdin: selectedProblem.example.input,
                }),
            });

            const result = await res.json();

            if (!res.ok || !result.success) {
                const errMsg = result.stderr || result.error || "컴파일 오류";
                setSubmitState({ status: "error", message: errMsg });

                // Supabase에 wrong 기록 저장
                await saveSubmission("wrong", result.stdout ?? "", errMsg);
                return;
            }

            // 2. 출력 비교
            const expected = selectedProblem.example.output.trim();
            const actual = (result.stdout ?? "").trim();
            const isCorrect = actual === expected;
            const status = isCorrect ? "accepted" : "wrong";

            // 3. Supabase에 제출 기록 저장
            await saveSubmission(status, result.stdout ?? "", result.stderr ?? "");

            if (!isCorrect) {
                setSubmitState({
                    status: "wrong",
                    message: `오답! 예상: "${expected}", 출력: "${actual}"`,
                });
                return;
            }

            // 4. accepted → XP 지급
            const charCount = code.length;
            const currentBest = bestScores.get(selectedProblem.id);
            let xpGained = 0;

            try {
                const sb = createClient();

                // 이전에 이 문제를 맞춘 적 있는지 확인
                const { data: prevAccepted } = await sb
                    .from("golf_submissions")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("problem_id", selectedProblem.id)
                    .eq("status", "accepted")
                    .limit(1);

                const isFirstSolve = !prevAccepted || prevAccepted.length === 0;
                const isNewRecord = currentBest ? charCount < currentBest.score : true;

                if (isFirstSolve) xpGained += 100;
                if (isNewRecord) xpGained += 50;

                if (xpGained > 0) {
                    const newXp = (user.xp ?? 0) + xpGained;
                    await sb
                        .from("user_progress")
                        .update({ xp: newXp })
                        .eq("user_id", user.id);
                }
            } catch (e) {
                console.error("[Golf] XP update failed:", e);
            }

            // 5. 리더보드 갱신
            await loadLeaderboard();

            setSubmitState({
                status: "accepted",
                message: `정답! ${charCount}자 ${xpGained > 0 ? `(+${xpGained} XP)` : ""}`,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "알 수 없는 오류";
            setSubmitState({ status: "error", message: msg });
        }
    };

    const saveSubmission = async (
        status: "accepted" | "wrong" | "error",
        stdout: string,
        stderr: string,
    ) => {
        if (!user || !selectedProblem) return;
        try {
            const sb = createClient();
            await sb.from("golf_submissions").insert({
                user_id: user.id,
                problem_id: selectedProblem.id,
                code,
                char_count: code.length,
                status,
                stdout,
                stderr,
            });
        } catch (e) {
            console.error("[Golf] saveSubmission failed:", e);
        }
    };

    const handleSelectProblem = (problem: GolfProblem) => {
        setSelectedProblem(problem);
        setCode("");
        setSubmitState({ status: "idle", message: "" });
    };

    const submitBtnBg = () => {
        if (submitState.status === "submitting") return "#6366f1";
        if (submitState.status === "accepted") return "#059669";
        if (submitState.status === "wrong" || submitState.status === "error") return "#DC2626";
        return code.trim() ? "#2563eb" : "#334155";
    };

    const submitBtnLabel = () => {
        if (submitState.status === "submitting") return "실행 중...";
        if (submitState.status === "accepted") return "✓ 정답!";
        if (submitState.status === "wrong") return "✗ 오답";
        if (submitState.status === "error") return "✗ 오류";
        return "▶ 제출";
    };

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Link href="/dashboard/learning" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>← 대시보드</Link>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#172554", marginTop: 8 }}>
                    코드 골프 대회
                </h1>
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    가장 짧은 코드로 문제를 풀어보세요! 글자 수가 적을수록 높은 점수!
                </p>
                {!user && (
                    <div style={{
                        marginTop: 10, padding: "10px 14px", borderRadius: 10,
                        background: "#FEF3C7", color: "#92400E", fontSize: 13, fontWeight: 600,
                    }}>
                        로그인이 필요합니다. 제출 기록과 XP는 로그인 후 저장됩니다.
                    </div>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
                {/* Left: Problems */}
                <div>
                    {/* Problem cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {PROBLEMS.map((problem, i) => {
                            const diff = DIFF_STYLES[problem.difficulty];
                            const isSelected = selectedProblem?.id === problem.id;
                            const best = bestScores.get(problem.id);
                            return (
                                <motion.div
                                    key={problem.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    onClick={() => handleSelectProblem(problem)}
                                    style={{
                                        background: "#fff", borderRadius: 14, padding: "18px 20px",
                                        border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                                        cursor: "pointer", transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{
                                                padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                                                background: diff.bg, color: diff.color,
                                            }}>{diff.label}</span>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: "#172554" }}>{problem.title}</span>
                                        </div>
                                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{problem.timeLimit}</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8, lineHeight: 1.5 }}>{problem.description}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
                                        {best ? (
                                            <>
                                                <span style={{ color: "#059669", fontWeight: 700 }}>최소 {best.score}자</span>
                                                <span style={{ color: "#94a3b8" }}>by {best.player}</span>
                                            </>
                                        ) : (
                                            <span style={{ color: "#94a3b8" }}>아직 기록 없음</span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Code editor (shown when problem selected) */}
                    <AnimatePresence>
                        {selectedProblem && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginTop: 16 }}
                            >
                                <div style={{
                                    background: "#0F172A", borderRadius: 14, overflow: "hidden",
                                }}>
                                    <div style={{
                                        padding: "10px 16px", borderBottom: "1px solid #1e293b",
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                    }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
                                            코드 작성 — {selectedProblem.title}
                                        </span>
                                        <span style={{
                                            fontSize: 12, fontWeight: 700,
                                            color: (() => {
                                                const best = bestScores.get(selectedProblem.id);
                                                if (!best) return "#94a3b8";
                                                return code.length <= best.score ? "#34D399" : "#F59E0B";
                                            })(),
                                        }}>
                                            {code.length}자 {(() => {
                                                const best = bestScores.get(selectedProblem.id);
                                                return best && code.length > 0 && code.length <= best.score ? "신기록!" : "";
                                            })()}
                                        </span>
                                    </div>
                                    <div style={{ padding: "4px" }}>
                                        <textarea
                                            value={code}
                                            onChange={e => {
                                                setCode(e.target.value);
                                                if (submitState.status !== "idle") {
                                                    setSubmitState({ status: "idle", message: "" });
                                                }
                                            }}
                                            placeholder={`// ${selectedProblem.title} - C 코드를 입력하세요\n#include <stdio.h>\nint main() {\n  \n}`}
                                            spellCheck={false}
                                            style={{
                                                width: "100%", minHeight: 160, padding: "12px",
                                                background: "transparent", border: "none", outline: "none",
                                                color: "#E2E8F0", fontSize: 13, fontFamily: "JetBrains Mono, monospace",
                                                resize: "vertical", lineHeight: 1.6, boxSizing: "border-box",
                                            }}
                                        />
                                    </div>

                                    {/* 결과 메시지 */}
                                    {submitState.status !== "idle" && submitState.status !== "submitting" && (
                                        <div style={{
                                            margin: "0 12px 8px",
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            background: submitState.status === "accepted" ? "#064E3B" : "#450A0A",
                                            color: submitState.status === "accepted" ? "#6EE7B7" : "#FCA5A5",
                                            fontSize: 12,
                                            fontFamily: "JetBrains Mono, monospace",
                                        }}>
                                            {submitState.message}
                                        </div>
                                    )}

                                    <div style={{ padding: "8px 12px", display: "flex", gap: 8 }}>
                                        {/* Example */}
                                        <div style={{
                                            flex: 1, padding: "8px 12px", borderRadius: 8, background: "#1E293B",
                                            fontSize: 11, color: "#94a3b8", fontFamily: "JetBrains Mono, monospace",
                                        }}>
                                            <div>입력: <span style={{ color: "#93C5FD" }}>{selectedProblem.example.input}</span></div>
                                            <div>출력: <span style={{ color: "#34D399" }}>{selectedProblem.example.output}</span></div>
                                        </div>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!code.trim() || submitState.status === "submitting" || !user}
                                            style={{
                                                padding: "10px 20px", borderRadius: 10, border: "none",
                                                background: submitBtnBg(),
                                                color: "#fff", fontWeight: 700, fontSize: 12,
                                                cursor: code.trim() && submitState.status !== "submitting" && user ? "pointer" : "default",
                                                transition: "background 0.2s",
                                                minWidth: 88,
                                            }}
                                        >
                                            {submitBtnLabel()}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Leaderboard */}
                <div style={{
                    background: "#fff", borderRadius: 16, padding: "20px",
                    border: "1px solid #e2e8f0", position: "sticky", top: 20,
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", marginBottom: 16 }}>
                        리더보드
                    </h3>

                    {rankingLoading ? (
                        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "20px 0" }}>
                            불러오는 중...
                        </div>
                    ) : ranking.length === 0 ? (
                        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "20px 0" }}>
                            아직 제출 기록이 없어요!<br />첫 번째 골퍼가 되어보세요
                        </div>
                    ) : (
                        ranking.map((player, i) => (
                            <div key={player.user_id} style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "10px 8px",
                                borderRadius: 10, marginBottom: 4,
                                background: i === 0 ? "#FFFBEB" : i === 1 ? "#F8FAFC" : "transparent",
                            }}>
                                <span style={{
                                    width: 28, height: 28, borderRadius: 8, display: "flex",
                                    alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800,
                                    background: i < 3 ? ["#FEF3C7", "#F1F5F9", "#FEF3C7"][i] : "#f8fafc",
                                    color: i < 3 ? ["#D97706", "#475569", "#B45309"][i] : "#94a3b8",
                                }}>
                                    {i < 3 ? ["1st", "2nd", "3rd"][i] : i + 1}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#172554" }}>{player.display_name}</div>
                                    <div style={{ fontSize: 10, color: "#94a3b8" }}>
                                        {player.solved_count}문제 · 평균 {player.avg_chars}자
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}>
                                    {player.solved_count}풀이
                                </span>
                            </div>
                        ))
                    )}

                    {/* XP Reward */}
                    <div style={{
                        marginTop: 16, padding: "12px", borderRadius: 10,
                        background: "linear-gradient(135deg, #EFF6FF, #eff6ff)",
                        fontSize: 11, color: "#2563eb", textAlign: "center", lineHeight: 1.6,
                    }}>
                        <strong>보상</strong><br />
                        첫 정답 +100 XP · 신기록 +50 XP 추가
                    </div>
                </div>
            </div>
        </div>
    );
}
