"use client";

/**
 * 쏙쌤 AI 질문 도우미 — 로그인한 학생의 현재 학습 맥락을 서버에 전달합니다.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TutorMessage from "./TutorMessage";

type TutorMode = "direct" | "socratic";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AITutorProps {
    /** 현재 학습 중인 단원명 */
    context?: string;
    /** 현재 에디터의 코드 (getter 함수, 호출 시점 최신값 반환) */
    getCurrentCode?: () => string;
    /** 현재 언어 */
    currentLanguage?: string;
    /** 최근 컴파일/실행 에러 (getter) */
    getCurrentError?: () => string;
}

export default function AITutor({
    context,
    getCurrentCode,
    currentLanguage,
    getCurrentError,
}: AITutorProps) {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>(undefined);
    const [mode, setMode] = useState<TutorMode>("socratic"); // 기본: 힌트 모드 (학습 효과)
    const [followups, setFollowups] = useState<string[]>([]);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

    const send = useCallback(async () => {
        const q = input.trim();
        if (!q || loading) return;
        const userMsg: Message = { role: "user", content: q };
        const next = [...msgs, userMsg];
        setMsgs(next);
        setInput("");
        setLoading(true);
        setFollowups([]); // 새 질문 시 이전 제안 초기화

        // assistant 메시지 플레이스홀더 추가 (스트리밍으로 채워짐)
        const placeholderIdx = next.length; // 새 메시지 인덱스
        setMsgs(prev => [...prev, { role: "assistant", content: "" }]);

        try {
            const res = await fetch("/api/tutor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: next,
                    mode,
                    context,
                    currentCode: getCurrentCode?.() || undefined,
                    currentLanguage,
                    currentError: getCurrentError?.() || undefined,
                    sessionId,
                }),
            });

            // 에러 응답은 JSON (스트림 아님)
            const contentType = res.headers.get("content-type") || "";
            if (!res.ok || !contentType.includes("event-stream") || !res.body) {
                const data = await res.json().catch(() => ({}));
                setMsgs(prev => {
                    const copy = [...prev];
                    copy[placeholderIdx] = {
                        role: "assistant",
                        content: data.error || "잠시 후 다시 시도해주세요.",
                    };
                    return copy;
                });
                setLoading(false);
                return;
            }

            // SSE 스트림 파싱
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() || "";

                for (const part of parts) {
                    const line = part.trim();
                    if (!line.startsWith("data:")) continue;
                    const payload = line.slice(5).trim();
                    if (!payload) continue;
                    try {
                        const evt = JSON.parse(payload);
                        if (evt.type === "meta" && evt.sessionId && !sessionId) {
                            setSessionId(evt.sessionId);
                        } else if (evt.type === "token" && typeof evt.content === "string") {
                            accumulated += evt.content;
                            // 즉시 UI 업데이트 (점진적 표시)
                            setMsgs(prev => {
                                const copy = [...prev];
                                copy[placeholderIdx] = { role: "assistant", content: accumulated };
                                return copy;
                            });
                        } else if (evt.type === "done") {
                            // 완료 신호 — 최종 텍스트 보장
                            if (evt.fullText) {
                                setMsgs(prev => {
                                    const copy = [...prev];
                                    copy[placeholderIdx] = { role: "assistant", content: evt.fullText };
                                    return copy;
                                });
                            }
                        }
                    } catch { /* incomplete JSON */ }
                }
            }

            // 빈 응답 방어
            if (!accumulated) {
                setMsgs(prev => {
                    const copy = [...prev];
                    copy[placeholderIdx] = {
                        role: "assistant",
                        content: "답변을 생성하지 못했어요. 다시 시도해주세요.",
                    };
                    return copy;
                });
            } else {
                // 후속 질문 제안 (비동기, 실패해도 무시)
                fetch("/api/tutor/followup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lastQuestion: q,
                        lastAnswer: accumulated,
                        context,
                    }),
                }).then(r => r.json()).then(data => {
                    if (Array.isArray(data.suggestions)) setFollowups(data.suggestions);
                }).catch(() => { /* ignore */ });
            }
        } catch {
            setMsgs(prev => {
                const copy = [...prev];
                copy[placeholderIdx] = {
                    role: "assistant",
                    content: "네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요.",
                };
                return copy;
            });
        }

        setLoading(false);
    }, [input, loading, msgs, mode, context, getCurrentCode, currentLanguage, getCurrentError, sessionId]);

    return (
        <>
            {/* 나비 버튼 */}
            <motion.button
                onClick={() => setOpen(p => !p)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                aria-label="쏙쌤 AI 질문 도우미"
                style={{
                    position: "fixed", bottom: 24, right: 24, zIndex: 10000,
                    width: 60, height: 60, borderRadius: "50%",
                    background: open ? "#1e293b" : "linear-gradient(135deg, #2563eb, #3b82f6)",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 6px 24px rgba(99,102,241,0.45)",
                    transition: "background 0.2s",
                }}
            >
                {open ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#fff" }}>close</span>
                ) : (
                    <svg viewBox="0 0 120 120" width="30" height="30" fill="white">
                        <path d="M58 52C48 28 18 18 14 38C10 54 28 62 58 58" opacity="0.9" />
                        <path d="M58 62C38 68 20 82 28 94C34 102 50 92 58 68" opacity="0.75" />
                        <path d="M62 52C72 28 102 18 106 38C110 54 92 62 62 58" opacity="0.9" />
                        <path d="M62 62C82 68 100 82 92 94C86 102 70 92 62 68" opacity="0.75" />
                        <ellipse cx="60" cy="60" rx="3" ry="14" fill="white" opacity="0.9" />
                    </svg>
                )}
            </motion.button>

            {/* 채팅 패널 */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        className="nava-panel"
                        style={{
                            position: "fixed", bottom: 96, right: 24,
                            width: 400, height: 560, zIndex: 10000,
                            borderRadius: 20, overflow: "hidden",
                            background: "#fff", border: "1px solid #e2e8f0",
                            boxShadow: "0 16px 48px rgba(15,23,42,0.15)",
                            display: "flex", flexDirection: "column",
                        }}
                    >
                        {/* 헤더 */}
                        <div style={{
                            height: 52, background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                            display: "flex", alignItems: "center", gap: 8, padding: "0 16px", flexShrink: 0,
                        }}>
                            <svg viewBox="0 0 120 120" width="20" height="20" fill="white">
                                <path d="M58 52C48 28 18 18 14 38C10 54 28 62 58 58" opacity="0.9" />
                                <path d="M62 52C72 28 102 18 106 38C110 54 92 62 62 58" opacity="0.9" />
                                <ellipse cx="60" cy="60" rx="3" ry="14" fill="white" opacity="0.9" />
                            </svg>
                            <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, flex: 1 }}>쏙쌤</span>
                            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>AI 코딩 선생님</span>
                        </div>

                        {/* 모드 토글 */}
                        <div style={{
                            display: "flex", gap: 4, padding: "8px 12px",
                            background: "#f8fafc", borderBottom: "1px solid #e2e8f0", flexShrink: 0,
                        }}>
                            <button
                                onClick={() => setMode("socratic")}
                                style={{
                                    flex: 1, padding: "6px 10px", borderRadius: 8, border: "none",
                                    background: mode === "socratic" ? "#1a1a1a" : "transparent",
                                    color: mode === "socratic" ? "#fff" : "#64748b",
                                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                                    fontFamily: "inherit", transition: "all 0.15s",
                                }}
                                title="스스로 생각하도록 질문으로 유도"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>psychology</span>
                                힌트로 배우기
                            </button>
                            <button
                                onClick={() => setMode("direct")}
                                style={{
                                    flex: 1, padding: "6px 10px", borderRadius: 8, border: "none",
                                    background: mode === "direct" ? "#1a1a1a" : "transparent",
                                    color: mode === "direct" ? "#fff" : "#64748b",
                                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                                    fontFamily: "inherit", transition: "all 0.15s",
                                }}
                                title="바로 답을 보여줌"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>lightbulb</span>
                                직답 보기
                            </button>
                        </div>

                        {/* 메시지 영역 */}
                        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                            {msgs.length === 0 && (
                                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 40 }}>
                                    <svg viewBox="0 0 120 120" width="48" height="48" fill="#cbd5e1" style={{ marginBottom: 12 }}>
                                        <path d="M58 52C48 28 18 18 14 38C10 54 28 62 58 58" opacity="0.5" />
                                        <path d="M58 62C38 68 20 82 28 94C34 102 50 92 58 68" opacity="0.3" />
                                        <path d="M62 52C72 28 102 18 106 38C110 54 92 62 62 58" opacity="0.5" />
                                        <path d="M62 62C82 68 100 82 92 94C86 102 70 92 62 68" opacity="0.3" />
                                        <ellipse cx="60" cy="60" rx="3" ry="14" fill="#cbd5e1" opacity="0.5" />
                                    </svg>
                                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                        {mode === "socratic" ? "같이 생각해볼까?" : "코딩 질문을 해보세요"}
                                    </div>
                                    <div style={{ fontSize: 11 }}>
                                        {mode === "socratic"
                                            ? "답 대신 힌트로 스스로 풀어보기"
                                            : "C, Python, 알고리즘 뭐든 물어봐!"}
                                    </div>
                                    <div style={{ fontSize: 10, marginTop: 12, color: "#ef4444" }}>
                                        비밀번호·인증번호·전화번호는 입력하지 마세요.
                                    </div>
                                </div>
                            )}
                            {msgs.map((m, i) => (
                                <div key={i} style={{
                                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: m.role === "user" ? "85%" : "92%",
                                    padding: m.role === "user" ? "10px 14px" : "12px 14px",
                                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                    background: m.role === "user"
                                        ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                                        : "#f1f5f9",
                                    color: m.role === "user" ? "#fff" : "#0f172a",
                                    fontSize: 13, lineHeight: 1.6,
                                    wordBreak: "break-word",
                                }}>
                                    {m.role === "user" ? (
                                        <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                                    ) : m.content ? (
                                        <TutorMessage content={m.content} />
                                    ) : (
                                        <span style={{ color: "#94a3b8", fontSize: 12 }}>생각 중...</span>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div style={{
                                    alignSelf: "flex-start", padding: "10px 14px",
                                    borderRadius: "16px 16px 16px 4px", background: "#f1f5f9",
                                    fontSize: 13, color: "#94a3b8",
                                }}>
                                    쏙쌤이 생각하는 중...
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        {/* 후속 질문 제안 */}
                        <AnimatePresence>
                            {followups.length > 0 && !loading && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{
                                        padding: "8px 12px",
                                        borderTop: "1px solid #f1f5f9",
                                        background: "#fafbfc",
                                        display: "flex", flexWrap: "wrap", gap: 6,
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{
                                        fontSize: 10, color: "#94a3b8", fontWeight: 700,
                                        width: "100%", marginBottom: 2,
                                    }}>
                                        💡 이런 것도 궁금해?
                                    </span>
                                    {followups.map((s, i) => (
                                        <motion.button
                                            key={s}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            onClick={() => {
                                                setInput(s);
                                                setFollowups([]);
                                            }}
                                            style={{
                                                padding: "5px 10px",
                                                borderRadius: 999,
                                                border: "1px solid #cbd5e1",
                                                background: "#fff",
                                                color: "#475569",
                                                fontSize: 11,
                                                fontWeight: 500,
                                                cursor: "pointer",
                                                fontFamily: "inherit",
                                            }}
                                        >
                                            {s}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 입력 */}
                        <div style={{
                            padding: "12px 14px", borderTop: "1px solid #f1f5f9",
                            display: "flex", gap: 8, flexShrink: 0, background: "#fafbfc",
                        }}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder="코딩 질문을 입력하세요..."
                                maxLength={2000}
                                disabled={loading}
                                style={{
                                    flex: 1, padding: "10px 14px", borderRadius: 12,
                                    border: "1px solid #e2e8f0", fontSize: 13,
                                    outline: "none", background: "#fff",
                                    fontFamily: "inherit",
                                }}
                            />
                            <button
                                onClick={send}
                                disabled={loading || !input.trim()}
                                style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: input.trim() ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "#e2e8f0",
                                    border: "none", cursor: input.trim() ? "pointer" : "default",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "background 0.2s",
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: input.trim() ? "#fff" : "#94a3b8" }}>send</span>
                            </button>
                        </div>

                        {/* 컨텍스트 */}
                        {context && (
                            <div style={{
                                padding: "6px 14px", borderTop: "1px solid #f1f5f9",
                                fontSize: 10, color: "#94a3b8", background: "#fafbfc",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                                학습 중: {context}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @media (max-width: 480px) {
                    .nava-panel {
                        bottom: 0 !important; right: 0 !important;
                        width: 100% !important; height: 100% !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </>
    );
}
