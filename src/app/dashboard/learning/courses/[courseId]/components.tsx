"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { Unit, Quiz, Page, CodeProblem } from "@/data/courses";
import { sanitizeHTML } from "@/lib/sanitize";

/* ── MI helper ── */
export function MI({ icon, style, className }: { icon: string; style?: React.CSSProperties; className?: string }) {
    return <span className={`material-symbols-outlined ${className || ""}`} style={style}>{icon}</span>;
}

/* ── Style Tokens ── */
export const glassPanel: React.CSSProperties = {
    background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), inset 0 0 20px rgba(255,255,255,0.5)",
};
export const marbleCard: React.CSSProperties = {
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05), 0 0 2px rgba(0,0,0,0.05)",
};
export const cardFloating: React.CSSProperties = {
    boxShadow: "0 30px 60px -12px rgba(50,50,93,0.12), 0 18px 36px -18px rgba(0,0,0,0.08)",
};

export const TYPE_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
    "이론": { icon: "", color: "#3b82f6", bg: "#EFF6FF" },
    "실습": { icon: "", color: "#10b981", bg: "#dcfce7" },
    "퀴즈": { icon: "?", color: "#f59e0b", bg: "#fef3c7" },
    "시험": { icon: "", color: "#ef4444", bg: "#fee2e2" },
    "종합": { icon: "", color: "#2563eb", bg: "#eff6ff" },
};

export const DIFF_LABELS = ["", "★", "★★", "★★★"];

/* ── Quiz Panel Component ── */
export function QuizPanel({ quiz, unit, selectedAnswer, setSelectedAnswer, quizResult, shaking, wrongCount, showHint, onCheck }: {
    quiz: Quiz; unit: Unit; selectedAnswer: number | null; setSelectedAnswer: (v: number | null) => void;
    quizResult: "correct" | "wrong" | null; shaking: boolean; wrongCount: number; showHint: boolean;
    onCheck: () => void;
}) {
    return (
        <motion.div animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}} transition={{ duration: 0.5 }}
            style={{ padding: 24, borderRadius: 24, ...glassPanel, border: "1px solid rgba(14,165,233,0.15)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #0ea5e9, #3b82f6)" }} />

            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 10, background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", color: "#fff", fontSize: 13 }}></span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#0ea5e9", letterSpacing: 1.5, textTransform: "uppercase" as const }}>확인 퀴즈</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.6 }}>{quiz.question}</p>
                </div>
                {wrongCount > 0 && (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{
                        padding: "6px 14px", borderRadius: 12, flexShrink: 0, fontSize: 11, fontWeight: 800,
                        background: wrongCount >= 3 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        border: wrongCount >= 3 ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(245,158,11,0.2)",
                        color: wrongCount >= 3 ? "#dc2626" : "#d97706",
                    }}>{wrongCount}회 오답</motion.div>
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {quiz.options.map((opt: string, oi: number) => {
                    const isSelected = selectedAnswer === oi;
                    const isCorrectAnswer = quizResult === "correct" && oi === quiz.answer;
                    const isWrongSelection = quizResult === "wrong" && isSelected;
                    return (
                        <motion.button key={oi} onClick={() => { if (!quizResult) setSelectedAnswer(oi); }} disabled={!!quizResult}
                            whileHover={!quizResult ? { scale: 1.01, x: 4 } : {}} whileTap={!quizResult ? { scale: 0.98 } : {}}
                            style={{
                                padding: "14px 18px", borderRadius: 16, textAlign: "left" as const,
                                border: isCorrectAnswer ? "2px solid #10b981" : isWrongSelection ? "2px solid #ef4444" : isSelected ? "2px solid #0ea5e9" : "1px solid rgba(226,232,240,0.8)",
                                background: isCorrectAnswer ? "linear-gradient(135deg, #dcfce7, #d1fae5)" : isWrongSelection ? "linear-gradient(135deg, #fee2e2, #fecaca)" : isSelected ? "linear-gradient(135deg, #e0f2fe, #dbeafe)" : "rgba(255,255,255,0.7)",
                                cursor: quizResult ? "default" : "pointer", fontSize: 13, fontWeight: isSelected ? 700 : 500, color: "#0f172a",
                                backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 12,
                            }}>
                            <span style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 10, flexShrink: 0,
                                background: isCorrectAnswer ? "#10b981" : isWrongSelection ? "#ef4444" : isSelected ? "#0ea5e9" : "#f1f5f9",
                                color: (isSelected || isCorrectAnswer || isWrongSelection) ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: 800,
                            }}>{String.fromCharCode(65 + oi)}</span>
                            <span style={{ flex: 1 }}>{opt}</span>
                            {isCorrectAnswer && <span></span>}
                            {isWrongSelection && <span>✗</span>}
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence>
                {quizResult === "correct" && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                        style={{ padding: "18px 22px", borderRadius: 20, background: "linear-gradient(135deg, rgba(220,252,231,0.8), rgba(209,250,229,0.8))", border: "1px solid #86efac", marginBottom: 16, backdropFilter: "blur(8px)" }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#15803d", margin: 0 }}> 정답!</p>
                        <p style={{ fontSize: 13, color: "#166534", margin: "8px 0 0", lineHeight: 1.6 }}>{quiz.explanation}</p>
                    </motion.div>
                )}
                {quizResult === "wrong" && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: "18px 22px", borderRadius: 20, background: "linear-gradient(135deg, rgba(254,226,226,0.8), rgba(254,202,202,0.8))", border: "1px solid #fca5a5", marginBottom: 16 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#dc2626", margin: 0 }}>✗ 틀렸습니다!</p>
                        <p style={{ fontSize: 12, color: "#991b1b", margin: "6px 0 0" }}>다시 도전해보세요!</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {showHint && quiz.explanation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    style={{ padding: "14px 18px", borderRadius: 16, background: "linear-gradient(135deg, rgba(254,243,199,0.8), rgba(253,230,138,0.5))", border: "1px solid rgba(253,230,138,0.6)", marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#d97706", margin: 0 }}> 힌트</p>
                    <p style={{ fontSize: 12, color: "#92400e", margin: "6px 0 0", lineHeight: 1.5 }}>{quiz.explanation}</p>
                </motion.div>
            )}

            {!quizResult && selectedAnswer !== null && (
                <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} onClick={onCheck}
                    style={{ padding: "14px 32px", borderRadius: 16, border: "none", fontSize: 14, fontWeight: 800, background: "linear-gradient(135deg, #0ea5e9, #3b82f6)", color: "#fff", cursor: "pointer", boxShadow: "0 8px 24px rgba(14,165,233,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>◎</span> <span>정답 확인</span>
                </motion.button>
            )}
            {!quizResult && selectedAnswer === null && (
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontWeight: 500 }}> 보기를 선택한 후 &quot;정답 확인&quot; 버튼을 눌러주세요</p>
            )}
        </motion.div>
    );
}

/* ── Code Problem Component ── */
export function CodeProblemCard({ prob, editorCode, setEditorCode, runResult, runLoading, executeCode, showProblemAnswer, setShowProblemAnswer }: {
    prob: CodeProblem; editorCode: Record<number, string>; setEditorCode: React.Dispatch<React.SetStateAction<Record<number, string>>>;
    runResult: Record<number, { stdout: string; stderr: string; exitCode: number } | null>; runLoading: Record<number, boolean>;
    executeCode: (id: number, code: string) => void;
    showProblemAnswer: Record<number, boolean>; setShowProblemAnswer: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 25 }}
            style={{ borderRadius: 24, overflow: "hidden", background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #3b82f6, #0ea5e9, #10b981)" }} />

            <div style={{ padding: "22px 24px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(241,245,249,0.8)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}>
                        <span style={{ fontSize: 16, color: "#fff" }}></span>
                    </div>
                    <h5 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>{prob.title}</h5>
                </div>
                <span style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" as const,
                    background: prob.difficulty === 1 ? "rgba(16,185,129,0.1)" : prob.difficulty === 2 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                    color: prob.difficulty === 1 ? "#059669" : prob.difficulty === 2 ? "#d97706" : "#dc2626",
                    border: prob.difficulty === 1 ? "1px solid rgba(16,185,129,0.2)" : prob.difficulty === 2 ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(239,68,68,0.2)",
                }}>{prob.difficulty === 1 ? "Easy" : prob.difficulty === 2 ? "Medium" : "Hard"}</span>
            </div>

            <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(prob.question) }} style={{ padding: "20px 24px", fontSize: 14, lineHeight: 1.9, color: "#334155" }} />

            {prob.codeTemplate && (
                <div style={{ margin: "0 16px 16px", borderRadius: 16, overflow: "hidden", border: "1px solid #334155" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "#1e293b", borderBottom: "1px solid #334155" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex", gap: 5 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" as const, marginLeft: 8 }}>코드 에디터</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setEditorCode(prev => ({ ...prev, [prob.id]: prob.codeTemplate || '' }))}
                                style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #475569", background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>↺ 초기화</motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => executeCode(prob.id, editorCode[prob.id] ?? prob.codeTemplate ?? '')}
                                disabled={runLoading[prob.id]}
                                style={{ padding: "5px 16px", borderRadius: 8, border: "none", background: runLoading[prob.id] ? "#475569" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontSize: 11, fontWeight: 800, cursor: runLoading[prob.id] ? "wait" : "pointer" }}>
                                {runLoading[prob.id] ? "⏳ 실행 중..." : "▶ 실행하기"}
                            </motion.button>
                        </div>
                    </div>
                    <textarea value={editorCode[prob.id] ?? prob.codeTemplate} onChange={(e) => setEditorCode(prev => ({ ...prev, [prob.id]: e.target.value }))} spellCheck={false}
                        style={{ width: "100%", minHeight: 200, padding: "18px 20px", border: "none", background: "#0f172a", color: "#e2e8f0", fontSize: 13, fontFamily: "'Fira Code', monospace", lineHeight: 1.9, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                </div>
            )}

            {(runResult[prob.id] || runLoading[prob.id]) && (
                <div style={{ margin: "0 16px 16px", borderRadius: 16, overflow: "hidden", border: "1px solid " + (runResult[prob.id]?.exitCode === 0 ? "rgba(16,185,129,0.3)" : runResult[prob.id] ? "rgba(239,68,68,0.3)" : "#e2e8f0") }}>
                    <div style={{
                        padding: "10px 16px", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase" as const,
                        background: runResult[prob.id]?.exitCode === 0 ? "rgba(220,252,231,0.8)" : runResult[prob.id] ? "rgba(254,226,226,0.8)" : "rgba(241,245,249,0.8)",
                        color: runResult[prob.id]?.exitCode === 0 ? "#15803d" : runResult[prob.id] ? "#dc2626" : "#64748b"
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: runResult[prob.id]?.exitCode === 0 ? "#10b981" : runResult[prob.id] ? "#ef4444" : "#94a3b8" }} />
                        {runLoading[prob.id] ? "컴파일 및 실행 중..." : runResult[prob.id]?.exitCode === 0 ? "실행 성공" : "실행 실패"}
                    </div>
                    <pre style={{ margin: 0, padding: "16px 20px", background: "#0f172a", color: "#e2e8f0", fontSize: 13, fontFamily: "'Fira Code', monospace", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-all", minHeight: 40 }}>
                        {runLoading[prob.id] ? "실행 중입니다..." : (runResult[prob.id]?.stderr ? `[오류]\n${runResult[prob.id]!.stderr}` : runResult[prob.id]?.stdout || "(출력 없음)")}
                    </pre>
                </div>
            )}

            <div style={{ padding: "0 24px 20px", display: "flex", gap: 8 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowProblemAnswer(prev => ({ ...prev, [prob.id]: !prev[prob.id] }))}
                    style={{
                        padding: "11px 22px", borderRadius: 14, border: showProblemAnswer[prob.id] ? "1px solid rgba(14,165,233,0.3)" : "1px solid rgba(203,213,225,0.6)",
                        background: showProblemAnswer[prob.id] ? "rgba(224,242,254,0.6)" : "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, color: "#0369a1", cursor: "pointer"
                    }}>
                    {showProblemAnswer[prob.id] ? " 정답 숨기기" : " 정답 보기"}
                </motion.button>
            </div>

            <AnimatePresence>
                {showProblemAnswer[prob.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(prob.answer) }} style={{
                            margin: "0 16px 16px", padding: "20px 24px", borderRadius: 16,
                            background: "linear-gradient(135deg, rgba(240,253,244,0.8), rgba(220,252,231,0.6))",
                            border: "1px solid rgba(134,239,172,0.4)", fontSize: 13.5, lineHeight: 1.8, color: "#166534",
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
