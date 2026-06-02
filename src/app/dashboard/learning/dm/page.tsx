"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

interface DM {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

interface TeacherProfile {
    id: string;
    name: string | null;
    display_name: string | null;
}

const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(226,232,240,0.8)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
};

function formatDateLabel(ts: string): string {
    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDay.getTime() === today.getTime()) return "오늘";
    if (msgDay.getTime() === yesterday.getTime()) return "어제";
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(ts: string): string {
    const d = new Date(ts);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ampm = h < 12 ? "오전" : "오후";
    const hour12 = h % 12 || 12;
    return `${ampm} ${hour12}:${m}`;
}

export default function DMPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);
    const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
    const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DM[]>([]);
    const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
    const [newMsg, setNewMsg] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const userIds = useMemo(() => {
        if (!user) return [] as string[];
        return Array.from(new Set([user.id, user.studentId].filter(Boolean))) as string[];
    }, [user]);

    // 선생님 목록 + 읽지 않은 수 로드
    const fetchTeachers = useCallback(async () => {
        const { data } = await supabase
            .from("profiles")
            .select("id, name, display_name")
            .eq("role", "teacher");
        if (data && data.length > 0) {
            setTeachers(data);
            setActiveTeacherId(prev => prev ?? data[0].id);
        }
    }, [supabase]);

    const fetchUnreadCounts = useCallback(async () => {
        if (userIds.length === 0) return;
        const filter = userIds.map((id: string) => `receiver_id.eq.${id}`).join(",");
        const { data } = await supabase
            .from("direct_messages")
            .select("sender_id, is_read")
            .or(filter)
            .eq("is_read", false);

        if (!data) return;
        const counts: Record<string, number> = {};
        (data as Pick<DM, "sender_id">[]).forEach((m) => {
            counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
        });
        setUnreadMap(counts);
    }, [supabase, userIds]);

    // 특정 선생님과의 메시지 로드
    const fetchMessages = useCallback(async (teacherId: string) => {
        if (!user || userIds.length === 0) return;
        setLoading(true);
        try {
            const orParts = userIds.flatMap((uid: string) => [
                `and(sender_id.eq.${uid},receiver_id.eq.${teacherId})`,
                `and(sender_id.eq.${teacherId},receiver_id.eq.${uid})`,
            ]);
            const { data } = await supabase
                .from("direct_messages")
                .select("*")
                .or(orParts.join(","))
                .order("created_at", { ascending: true })
                .limit(200);

            const messageRows = (data || []) as DM[];
            setMessages(messageRows);

            // 읽음 처리
            const unread = messageRows.filter(
                (m) => userIds.includes(m.receiver_id) && !m.is_read
            );
            if (unread.length > 0) {
                await supabase
                    .from("direct_messages")
                    .update({ is_read: true })
                    .in("id", unread.map((m) => m.id));
                fetchUnreadCounts();
            }
        } catch (err) {
            if (process.env.NODE_ENV === "development") console.error(err);
        } finally {
            setLoading(false);
        }
    }, [supabase, user, userIds, fetchUnreadCounts]);

    useEffect(() => {
        fetchTeachers();
        fetchUnreadCounts();
    }, [fetchTeachers, fetchUnreadCounts]);

    useEffect(() => {
        if (activeTeacherId) fetchMessages(activeTeacherId);
    }, [activeTeacherId, fetchMessages]);

    // 스크롤 하단
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    // Realtime 구독
    useEffect(() => {
        if (!user || userIds.length === 0) return;
        const ch = supabase.channel(`dm-student-${user.id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, async (payload: { new: DM }) => {
                const msg = payload.new as DM;
                const isRelated =
                    userIds.includes(msg.sender_id) || userIds.includes(msg.receiver_id);
                if (!isRelated) return;

                if (activeTeacherId && (msg.sender_id === activeTeacherId || msg.receiver_id === activeTeacherId)) {
                    setMessages(prev => {
                        // optimistic 중복 방지
                        const tempIdx = prev.findIndex(
                            m => m.id.startsWith("temp-") && m.content === msg.content && userIds.includes(m.sender_id)
                        );
                        if (tempIdx >= 0) {
                            const updated = [...prev];
                            updated[tempIdx] = msg;
                            return updated;
                        }
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });

                    // 선생님 메시지면 읽음 처리
                    if (userIds.includes(msg.receiver_id)) {
                        await supabase.from("direct_messages").update({ is_read: true }).eq("id", msg.id);
                    }
                } else {
                    // 다른 선생님의 새 메시지 → unread 업데이트
                    fetchUnreadCounts();
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [supabase, user, userIds, activeTeacherId, fetchUnreadCounts]);

    const sendMessage = async () => {
        if (!user || !newMsg.trim() || !activeTeacherId) return;
        setSending(true);
        const content = newMsg.trim();
        setNewMsg("");

        // Optimistic UI
        const optimistic: DM = {
            id: `temp-${Date.now()}`,
            sender_id: user.id,
            receiver_id: activeTeacherId,
            sender_name: user.name || "학생",
            content,
            is_read: false,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        try {
            const { error } = await supabase.from("direct_messages").insert({
                sender_id: user.id,
                receiver_id: activeTeacherId,
                sender_name: user.name || "학생",
                content,
            });
            if (error) {
                setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                if (process.env.NODE_ENV === "development") console.error(error);
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            if (process.env.NODE_ENV === "development") console.error(err);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const selectTeacher = (tid: string) => {
        setActiveTeacherId(tid);
        setMobileView("chat");
    };

    // 날짜별 그룹
    const groupedMessages = useMemo(() => {
        const groups: { dateLabel: string; msgs: DM[] }[] = [];
        let last = "";
        for (const m of messages) {
            const label = formatDateLabel(m.created_at);
            if (label !== last) {
                groups.push({ dateLabel: label, msgs: [] });
                last = label;
            }
            groups[groups.length - 1].msgs.push(m);
        }
        return groups;
    }, [messages]);

    const activeTeacher = teachers.find(t => t.id === activeTeacherId);
    const activeTeacherName = activeTeacher?.display_name || activeTeacher?.name || "선생님";

    return (
        <div style={{ height: "calc(100vh - 160px)", minHeight: 500, display: "flex", gap: 0, borderRadius: 20, overflow: "hidden", ...glassCard }}>

            {/* 좌측: 선생님 목록 */}
            <div style={{
                width: 240, borderRight: "1px solid rgba(226,232,240,0.8)",
                display: "flex", flexDirection: "column",
            }} className={`dm-list-panel${mobileView === "chat" ? " dm-hidden-mobile" : ""}`}>
                <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f1f5f9" }}>
                    <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        선생님과 채팅
                    </h2>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
                        선생님을 선택하세요
                    </p>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {teachers.length === 0 ? (
                        <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 32, display: "block", marginBottom: 8 }}>person_off</span>
                            선생님 정보를 불러오는 중...
                        </div>
                    ) : teachers.map((t, i) => {
                        const isActive = t.id === activeTeacherId;
                        const unread = unreadMap[t.id] || 0;
                        const tName = t.display_name || t.name || "선생님";
                        return (
                            <motion.button
                                key={t.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => selectTeacher(t.id)}
                                whileHover={{ backgroundColor: isActive ? undefined : "rgba(241,245,249,0.8)" }}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                                    padding: "12px 16px", border: "none", cursor: "pointer", textAlign: "left",
                                    background: isActive ? "rgba(37,99,235,0.06)" : "transparent",
                                    borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
                                    transition: "all 0.15s",
                                }}
                            >
                                <div style={{
                                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontSize: 14, fontWeight: 800,
                                }}>
                                    {tName.charAt(0)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: isActive ? 700 : 600,
                                        color: isActive ? "#1e40af" : "#0f172a",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {tName}
                                    </div>
                                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>선생님</div>
                                </div>
                                {unread > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        style={{
                                            minWidth: 18, height: 18, borderRadius: 9,
                                            background: "#ef4444", color: "#fff",
                                            fontSize: 10, fontWeight: 800,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            padding: "0 4px",
                                        }}
                                    >{unread}</motion.span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* 우측: 채팅 영역 */}
            <div style={{
                flex: 1, display: "flex", flexDirection: "column", minWidth: 0,
            }} className={`dm-chat-panel${mobileView === "list" ? " dm-hidden-mobile" : ""}`}>

                {/* 헤더 */}
                <div style={{
                    padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", gap: 12,
                    background: "rgba(255,255,255,0.9)",
                }}>
                    {/* 모바일 뒤로가기 */}
                    <button
                        className="dm-back-btn"
                        onClick={() => setMobileView("list")}
                        style={{
                            display: "none", width: 32, height: 32, borderRadius: 8,
                            border: "1px solid #e2e8f0", background: "#f8fafc",
                            cursor: "pointer", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#64748b" }}>arrow_back</span>
                    </button>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 13, fontWeight: 800,
                    }}>
                        {activeTeacherName.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                            {activeTeacherName} 선생님
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                            <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>온라인</span>
                        </div>
                    </div>
                </div>

                {/* 메시지 영역 */}
                <div ref={scrollRef} style={{
                    flex: 1, overflowY: "auto", padding: "16px 20px",
                    background: "#f8fafc",
                    display: "flex", flexDirection: "column",
                }}>
                    {loading ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                            <motion.span
                                className="material-symbols-outlined"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                style={{ fontSize: 28, color: "#94a3b8" }}
                            >progress_activity</motion.span>
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>메시지 불러오는 중...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#94a3b8", textAlign: "center" }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 52, color: "#cbd5e1" }}>chat_bubble</span>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: "#475569", margin: "0 0 4px" }}>아직 대화가 없어요</p>
                                <p style={{ fontSize: 12, margin: 0 }}>선생님에게 메시지를 보내보세요!</p>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            {groupedMessages.map((group, gi) => (
                                <div key={gi}>
                                    {/* 날짜 구분선 */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 12px" }}>
                                        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                                        <span style={{
                                            fontSize: 11, color: "#94a3b8", fontWeight: 600,
                                            background: "#f1f5f9", padding: "3px 12px", borderRadius: 99,
                                            border: "1px solid #e2e8f0",
                                        }}>{group.dateLabel}</span>
                                        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                                    </div>

                                    <AnimatePresence initial={false}>
                                        {group.msgs.map(m => {
                                            const isMine = userIds.includes(m.sender_id);
                                            const isOptimistic = m.id.startsWith("temp-");
                                            return (
                                                <motion.div
                                                    key={m.id}
                                                    initial={{ opacity: 0, y: 12, x: isMine ? 20 : -20, scale: 0.95 }}
                                                    animate={{ opacity: isOptimistic ? 0.75 : 1, y: 0, x: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: isMine ? "flex-end" : "flex-start",
                                                        marginBottom: 6,
                                                        gap: 8,
                                                        alignItems: "flex-end",
                                                    }}
                                                >
                                                    {/* 상대방 아바타 */}
                                                    {!isMine && (
                                                        <div style={{
                                                            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                                                            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: "#fff", fontSize: 11, fontWeight: 800, marginBottom: 2,
                                                        }}>
                                                            {activeTeacherName.charAt(0)}
                                                        </div>
                                                    )}

                                                    <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                                                        {!isMine && (
                                                            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 3 }}>
                                                                {m.sender_name || activeTeacherName}
                                                            </span>
                                                        )}
                                                        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMine ? "row-reverse" : "row" }}>
                                                            <motion.div
                                                                whileHover={{ scale: 1.01 }}
                                                                style={{
                                                                    padding: "10px 14px",
                                                                    borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                                                    background: isMine ? "#2563eb" : "#fff",
                                                                    color: isMine ? "#fff" : "#0f172a",
                                                                    fontSize: 13, lineHeight: 1.6,
                                                                    boxShadow: isMine
                                                                        ? "0 4px 12px rgba(37,99,235,0.25)"
                                                                        : "0 2px 8px rgba(0,0,0,0.06)",
                                                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                                                }}
                                                            >
                                                                {m.content}
                                                            </motion.div>
                                                            <span style={{
                                                                fontSize: 10, color: "#94a3b8", flexShrink: 0,
                                                                marginBottom: 2,
                                                            }}>
                                                                {formatTime(m.created_at)}
                                                                {isMine && !isOptimistic && m.is_read && (
                                                                    <span className="material-symbols-outlined" style={{ fontSize: 11, marginLeft: 3, color: "#3b82f6", verticalAlign: "middle" }}>done_all</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* 입력 영역 */}
                <div style={{
                    padding: "12px 16px",
                    borderTop: "1px solid #f1f5f9",
                    background: "rgba(255,255,255,0.95)",
                    display: "flex", gap: 8, alignItems: "flex-end",
                }}>
                    <textarea
                        ref={inputRef}
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
                        rows={1}
                        disabled={!activeTeacherId}
                        style={{
                            flex: 1, padding: "11px 16px", borderRadius: 14,
                            border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none",
                            resize: "none", fontFamily: "inherit", lineHeight: 1.5,
                            maxHeight: 120, overflow: "auto",
                            background: "#f8fafc", color: "#0f172a",
                            transition: "border-color 0.15s",
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = "#2563eb"}
                        onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                    />
                    <motion.button
                        whileHover={{ scale: newMsg.trim() ? 1.06 : 1 }}
                        whileTap={{ scale: newMsg.trim() ? 0.94 : 1 }}
                        onClick={sendMessage}
                        disabled={sending || !newMsg.trim() || !activeTeacherId}
                        style={{
                            width: 42, height: 42, borderRadius: 12, border: "none",
                            background: newMsg.trim() && activeTeacherId
                                ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                                : "#e2e8f0",
                            color: newMsg.trim() && activeTeacherId ? "#fff" : "#94a3b8",
                            cursor: newMsg.trim() && activeTeacherId ? "pointer" : "default",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: newMsg.trim() && activeTeacherId ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                            transition: "all 0.2s",
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                    </motion.button>
                </div>
            </div>

            {/* 반응형 스타일 */}
            <style>{`
                @media (max-width: 640px) {
                    .dm-list-panel { width: 100% !important; }
                    .dm-hidden-mobile { display: none !important; }
                    .dm-back-btn { display: flex !important; }
                }
                @media (min-width: 641px) {
                    .dm-list-panel { display: flex !important; }
                    .dm-chat-panel { display: flex !important; }
                }
            `}</style>
        </div>
    );
}
