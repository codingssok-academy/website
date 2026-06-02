"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAdmin } from "../context";
import { createClient } from "@/lib/supabase";
import type { ChatStudent, ChatMessage } from "../types";

/* ═══════════════════════════════════════
   학생 채팅 — 학생 선택 → 1:1 DM
   /teacher/admin/chat
   ═══════════════════════════════════════ */

export default function ChatPage() {
    const { students, studentNameByAnyId, studentOptions, getTeacherId } = useAdmin();

    const [chatStudents, setChatStudents] = useState<ChatStudent[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchChatStudents = useCallback(async () => {
        const sb = createClient();
        const { data: msgs } = await sb.from("direct_messages").select("*").order("created_at", { ascending: false });
        if (!msgs) return;

        const teacherId = await getTeacherId();
        if (!teacherId) return;

        const studentMap = new Map<string, ChatStudent>();
        msgs.forEach((m: { sender_id: string; receiver_id: string; sender_name: string; content: string; is_read: boolean; created_at: string }) => {
            const studentId = m.sender_id === teacherId ? m.receiver_id : m.sender_id;
            const studentName = studentNameByAnyId.get(studentId) || (m.sender_id === teacherId ? "학생" : (m.sender_name || "학생"));
            if (!studentMap.has(studentId)) {
                const date = new Date(m.created_at);
                studentMap.set(studentId, {
                    id: studentId, name: studentName,
                    lastMsg: m.content.length > 30 ? m.content.slice(0, 30) + "..." : m.content,
                    unread: (!m.is_read && m.receiver_id === teacherId) ? 1 : 0,
                    lastTime: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`,
                });
            } else {
                const entry = studentMap.get(studentId)!;
                if (!m.is_read && m.receiver_id === teacherId) entry.unread++;
            }
        });

        setChatStudents(Array.from(studentMap.values()));
    }, [getTeacherId, studentNameByAnyId]);

    const loadConversation = useCallback(async (studentId: string) => {
        const sb = createClient();
        const teacherId = await getTeacherId();
        if (!teacherId) return;

        const { data } = await sb.from("direct_messages").select("*")
            .or(`and(sender_id.eq.${studentId},receiver_id.eq.${teacherId}),and(sender_id.eq.${teacherId},receiver_id.eq.${studentId})`)
            .order("created_at", { ascending: true });

        setMessages(data || []);

        // Mark as read
        const unread = (data || []).filter((m: { receiver_id: string; is_read: boolean }) => m.receiver_id === teacherId && !m.is_read);
        if (unread.length > 0) {
            await sb.from("direct_messages").update({ is_read: true }).in("id", unread.map((m: { id: string }) => m.id));
            fetchChatStudents();
        }

        setTimeout(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, 100);
    }, [fetchChatStudents, getTeacherId]);

    const sendMessage = useCallback(async () => {
        if (!activeId || !input.trim()) return;
        setSending(true);
        try {
            const sb = createClient();
            const teacherId = await getTeacherId();
            if (!teacherId) throw new Error("인증 세션 없음");
            await sb.from("direct_messages").insert({
                sender_id: teacherId, receiver_id: activeId,
                sender_name: "선생님", content: input.trim(),
            });
            setInput("");
            loadConversation(activeId);
        } catch (err) {
            if (process.env.NODE_ENV === "development") console.error(err);
        } finally { setSending(false); }
    }, [activeId, input, getTeacherId, loadConversation]);

    const startNewChat = (studentId: string) => {
        setActiveId(studentId);
        setShowNewChat(false);
        loadConversation(studentId);
    };

    useEffect(() => { fetchChatStudents(); }, [fetchChatStudents]);

    useEffect(() => {
        if (activeId) loadConversation(activeId);
    }, [activeId, loadConversation]);

    // Realtime
    useEffect(() => {
        const sb = createClient();
        const channel = sb.channel("teacher-dm")
            .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () => {
                fetchChatStudents();
                if (activeId) loadConversation(activeId);
            })
            .subscribe();
        return () => { sb.removeChannel(channel); };
    }, [activeId, fetchChatStudents, loadConversation]);

    const filteredChatStudents = chatStudents.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const uncontactedStudents = studentOptions.filter(s =>
        !chatStudents.some(cs => cs.id === s.id)
    );

    return (
        <div style={{ display: "flex", height: "calc(100vh - 80px)", gap: 0 }}>
            {/* Student List */}
            <div style={{
                width: 300, background: "#fff", borderRadius: "16px 0 0 16px",
                border: "1px solid #e2e8f0", borderRight: "none",
                display: "flex", flexDirection: "column",
            }}>
                <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: 0 }}>채팅</h3>
                        <button onClick={() => setShowNewChat(!showNewChat)} style={{
                            padding: "6px 12px", borderRadius: 8, border: "none",
                            background: showNewChat ? "#f1f5f9" : "#2563eb", color: showNewChat ? "#475569" : "#fff",
                            fontSize: 11, fontWeight: 700, cursor: "pointer",
                        }}>
                            {showNewChat ? "닫기" : "+ 새 채팅"}
                        </button>
                    </div>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="학생 검색..." style={{
                            width: "100%", padding: "8px 12px", borderRadius: 8,
                            border: "1px solid #e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box",
                        }} />
                </div>

                {/* New chat: student picker */}
                {showNewChat && (
                    <div style={{ padding: "8px", borderBottom: "1px solid #f1f5f9", maxHeight: 200, overflowY: "auto" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", padding: "4px 8px" }}>학생 선택</div>
                        {studentOptions.map(s => (
                            <button key={s.id} onClick={() => startNewChat(s.id)} style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 10px", borderRadius: 8, border: "none",
                                background: "transparent", cursor: "pointer", textAlign: "left",
                            }}>
                                <span style={{ fontSize: 16 }}>{s.avatar || "🧒"}</span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#172554" }}>{s.name}</div>
                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.grade || "-"}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {filteredChatStudents.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 30, color: "#94a3b8", fontSize: 12 }}>
                            {search ? "검색 결과 없음" : "채팅 내역이 없습니다. '새 채팅'으로 시작하세요."}
                        </div>
                    ) : (
                        filteredChatStudents.map(s => (
                            <div key={s.id} onClick={() => { setActiveId(s.id); setShowNewChat(false); }} style={{
                                padding: "12px 16px", cursor: "pointer",
                                background: activeId === s.id ? "#eff6ff" : "transparent",
                                borderBottom: "1px solid #f8fafc",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 13, fontWeight: activeId === s.id ? 800 : 600, color: "#172554" }}>{s.name}</span>
                                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{s.lastTime}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                                    <span style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                                        {s.lastMsg}
                                    </span>
                                    {s.unread > 0 && (
                                        <span style={{
                                            minWidth: 18, height: 18, borderRadius: 9, background: "#ef4444",
                                            color: "#fff", fontSize: 10, fontWeight: 800,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>{s.unread}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div style={{
                flex: 1, background: "#fff", borderRadius: "0 16px 16px 0",
                border: "1px solid #e2e8f0", display: "flex", flexDirection: "column",
            }}>
                {!activeId ? (
                    <div style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        flexDirection: "column", gap: 12, color: "#94a3b8",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>forum</span>
                        <div style={{ fontSize: 14 }}>학생을 선택하세요</div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{
                            padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
                            display: "flex", alignItems: "center", gap: 10,
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#172554" }}>
                                {studentNameByAnyId.get(activeId) || chatStudents.find(s => s.id === activeId)?.name || "학생"}
                            </span>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                            {messages.map(m => {
                                const isTeacher = m.sender_name === "선생님";
                                return (
                                    <div key={m.id} style={{
                                        display: "flex", justifyContent: isTeacher ? "flex-end" : "flex-start",
                                        marginBottom: 8,
                                    }}>
                                        <div style={{
                                            maxWidth: "70%", padding: "10px 14px", borderRadius: 14,
                                            background: isTeacher ? "#2563eb" : "#f1f5f9",
                                            color: isTeacher ? "#fff" : "#172554",
                                            fontSize: 13,
                                            borderBottomRightRadius: isTeacher ? 4 : 14,
                                            borderBottomLeftRadius: isTeacher ? 14 : 4,
                                        }}>
                                            {!isTeacher && (
                                                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: "#2563eb" }}>
                                                    {m.sender_name}
                                                </div>
                                            )}
                                            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                                            <div style={{
                                                fontSize: 10, marginTop: 4,
                                                color: isTeacher ? "rgba(255,255,255,0.6)" : "#94a3b8",
                                                textAlign: "right",
                                            }}>
                                                {new Date(m.created_at).toLocaleTimeString("ko", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <div style={{
                            padding: "12px 20px", borderTop: "1px solid #f1f5f9",
                            display: "flex", gap: 8,
                        }}>
                            <input value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                placeholder="메시지 입력..."
                                style={{
                                    flex: 1, padding: "10px 14px", borderRadius: 12,
                                    border: "1px solid #e2e8f0", fontSize: 13, outline: "none",
                                }} />
                            <button onClick={sendMessage} disabled={sending || !input.trim()} style={{
                                padding: "10px 20px", borderRadius: 12, border: "none",
                                background: sending || !input.trim() ? "#94a3b8" : "#2563eb",
                                color: "#fff", fontSize: 13, fontWeight: 700,
                                cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                            }}>
                                전송
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
