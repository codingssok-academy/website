"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useFriendChallenge, type FriendChallenge } from "@/hooks/useFriendChallenge";

function formatTime(ms: number | null) {
    if (ms === null) return "-";
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    return min > 0 ? `${min}분 ${sec % 60}초` : `${sec}초`;
}

export default function FriendChallenges() {
    const { user } = useAuth();
    const { active, completed, loading, createChallenge } = useFriendChallenge(user?.id);
    const supabase = useMemo(() => createClient(), []);
    const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedOpponent, setSelectedOpponent] = useState("");
    const [problemTitle, setProblemTitle] = useState("");

    // 학생 목록 로드
    useEffect(() => {
        if (!user) return;
        supabase.from("profiles").select("id, name").neq("id", user.id).limit(20)
            .then(({ data }: { data: { id: string; name: string }[] | null }) => { if (data) setStudents(data); });
    }, [user, supabase]);

    const handleCreate = async () => {
        if (!selectedOpponent || !problemTitle.trim()) return;
        const problemId = `custom_${Date.now()}`;
        await createChallenge(selectedOpponent, problemId, problemTitle.trim());
        setShowCreate(false);
        setProblemTitle("");
        setSelectedOpponent("");
    };

    if (loading) {
        return (
            <div style={{
                background: "#fff", borderRadius: 16, padding: 20,
                border: "1px solid #e2e8f0", textAlign: "center",
                color: "#94a3b8", fontSize: 13,
            }}>
                챌린지 로딩 중...
            </div>
        );
    }

    return (
        <div style={{
            background: "#fff", borderRadius: 16, padding: "16px 20px",
            border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#172554" }}>
                    친구 챌린지
                </span>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreate(!showCreate)}
                    style={{
                        padding: "4px 10px", borderRadius: 8, border: "none",
                        background: "#3b82f6", color: "#fff",
                        fontSize: 10, fontWeight: 700, cursor: "pointer",
                    }}
                >
                    + 도전
                </motion.button>
            </div>

            {/* 생성 폼 */}
            {showCreate && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    style={{
                        marginBottom: 12, padding: 12, borderRadius: 10,
                        background: "#f8fafc", border: "1px solid #e2e8f0",
                        display: "flex", flexDirection: "column", gap: 8,
                    }}
                >
                    <select
                        value={selectedOpponent}
                        onChange={(e) => setSelectedOpponent(e.target.value)}
                        style={{
                            padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
                            fontSize: 12, background: "#fff",
                        }}
                    >
                        <option value="">상대 선택...</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="문제 이름 (예: 별 찍기)"
                        value={problemTitle}
                        onChange={(e) => setProblemTitle(e.target.value)}
                        style={{
                            padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
                            fontSize: 12,
                        }}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!selectedOpponent || !problemTitle.trim()}
                        style={{
                            padding: "6px 12px", borderRadius: 8, border: "none",
                            background: selectedOpponent && problemTitle.trim() ? "#3b82f6" : "#e2e8f0",
                            color: selectedOpponent && problemTitle.trim() ? "#fff" : "#94a3b8",
                            fontSize: 11, fontWeight: 700, cursor: "pointer",
                        }}
                    >
                        챌린지 보내기
                    </button>
                </motion.div>
            )}

            {/* 진행 중 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {active.length === 0 && completed.length === 0 && (
                    <div style={{ textAlign: "center", padding: 16, color: "#94a3b8", fontSize: 12 }}>
                        아직 챌린지가 없습니다
                    </div>
                )}

                {active.map((c) => (
                    <ChallengeCard key={c.id} challenge={c} userId={user?.id || ""} />
                ))}

                {completed.slice(0, 3).map((c) => (
                    <ChallengeCard key={c.id} challenge={c} userId={user?.id || ""} />
                ))}
            </div>
        </div>
    );
}

function ChallengeCard({ challenge: c, userId }: { challenge: FriendChallenge; userId: string }) {
    const isChallenger = c.challenger_id === userId;
    const myName = isChallenger ? c.challenger_name : c.opponent_name;
    const theirName = isChallenger ? c.opponent_name : c.challenger_name;
    const isCompleted = c.status === "completed";
    const isWinner = c.winner_id === userId;
    const isDraw = isCompleted && !c.winner_id;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: "8px 10px", borderRadius: 10,
                background: isCompleted
                    ? isWinner ? "#f0fdf4" : isDraw ? "#fefce8" : "#fef2f2"
                    : "#f8fafc",
                border: `1px solid ${isCompleted
                    ? isWinner ? "#bbf7d0" : isDraw ? "#fde68a" : "#fecaca"
                    : "#e2e8f0"}`,
                display: "flex", alignItems: "center", gap: 8,
            }}
        >
            <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: isCompleted
                    ? isWinner ? "#dcfce7" : "#fee2e2"
                    : "#e0f2fe",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12,
            }}>
                {isCompleted ? (isWinner ? "W" : isDraw ? "D" : "L") : "VS"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 11, fontWeight: 700, color: "#172554",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {c.problem_title}
                </div>
                <div style={{ fontSize: 9, color: "#94a3b8" }}>
                    vs {theirName}
                    {isCompleted && (
                        <span style={{
                            marginLeft: 6, fontWeight: 700,
                            color: isWinner ? "#22c55e" : isDraw ? "#f59e0b" : "#ef4444",
                        }}>
                            {isWinner ? "승리!" : isDraw ? "무승부" : "패배"}
                        </span>
                    )}
                </div>
            </div>

            {isCompleted && (
                <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "right" }}>
                    <div>{formatTime(isChallenger ? c.challenger_time_ms : c.opponent_time_ms)}</div>
                    {isWinner && (
                        <div style={{ color: "#22c55e", fontWeight: 700 }}>+{c.xp_reward} XP</div>
                    )}
                </div>
            )}

            {!isCompleted && (
                <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 8px",
                    borderRadius: 6, background: "#dbeafe", color: "#2563eb",
                }}>
                    대기 중
                </span>
            )}
        </motion.div>
    );
}
