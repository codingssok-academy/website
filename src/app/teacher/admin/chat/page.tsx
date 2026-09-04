"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAdmin } from "../context";
import type { ChatMessage, ChatStudent, Student } from "../types";

type DirectMessage = ChatMessage & {
    student_id: string;
    sender_role: "student" | "teacher" | "admin";
    read_at: string | null;
};

const MESSAGE_FIELDS = [
    "id",
    "student_id",
    "sender_id",
    "receiver_id",
    "sender_name",
    "sender_role",
    "content",
    "is_read",
    "read_at",
    "created_at",
].join(",");

function formatMessageTime(value: string) {
    const date = new Date(value);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ChatPage() {
    const { students, studentNameByAnyId, getTeacherId } = useAdmin();
    const [viewerId, setViewerId] = useState<string | null>(null);
    const [chatStudents, setChatStudents] = useState<ChatStudent[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [search, setSearch] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [conversationLoading, setConversationLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [conversationError, setConversationError] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const eligibleStudents = useMemo(() => students.flatMap(student => {
        const status = (student as Student & { status?: string | null }).status;
        if (!student.auth_user_id || (status !== null && status !== undefined && status !== "active")) return [];
        return [{
            id: student.auth_user_id,
            name: student.name,
            grade: student.grade,
            class: student.class,
            avatar: student.avatar,
        }];
    }), [students]);

    const fetchChatStudents = useCallback(async () => {
        setListLoading(true);
        setListError(null);

        try {
            const staffId = await getTeacherId();
            if (!staffId) throw new Error("관리자 로그인을 확인할 수 없습니다.");
            setViewerId(staffId);

            const supabase = createClient();
            const { data, error } = await supabase
                .from("direct_messages")
                .select(MESSAGE_FIELDS)
                .or(`sender_id.eq.${staffId},receiver_id.eq.${staffId}`)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const studentMap = new Map<string, ChatStudent>();
            for (const message of (data || []) as DirectMessage[]) {
                const studentUserId = message.sender_id === staffId
                    ? message.receiver_id
                    : message.sender_id;
                const studentName = studentNameByAnyId.get(studentUserId)
                    || (message.sender_role === "student" ? message.sender_name : "학생");
                const existing = studentMap.get(studentUserId);

                if (!existing) {
                    studentMap.set(studentUserId, {
                        id: studentUserId,
                        name: studentName,
                        lastMsg: message.content.length > 30
                            ? `${message.content.slice(0, 30)}...`
                            : message.content,
                        unread: !message.is_read && message.receiver_id === staffId ? 1 : 0,
                        lastTime: formatMessageTime(message.created_at),
                    });
                } else if (!message.is_read && message.receiver_id === staffId) {
                    existing.unread += 1;
                }
            }

            setChatStudents(Array.from(studentMap.values()));
        } catch (error) {
            if (process.env.NODE_ENV === "development") console.error(error);
            setChatStudents([]);
            setListError("학생 질문을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setListLoading(false);
        }
    }, [getTeacherId, studentNameByAnyId]);

    const loadConversation = useCallback(async (studentUserId: string) => {
        setConversationLoading(true);
        setConversationError(null);

        try {
            const staffId = await getTeacherId();
            if (!staffId) throw new Error("관리자 로그인을 확인할 수 없습니다.");
            setViewerId(staffId);

            const supabase = createClient();
            const { data, error } = await supabase
                .from("direct_messages")
                .select(MESSAGE_FIELDS)
                .or(`and(sender_id.eq.${studentUserId},receiver_id.eq.${staffId}),and(sender_id.eq.${staffId},receiver_id.eq.${studentUserId})`)
                .order("created_at", { ascending: true });

            if (error) throw error;
            const conversation = (data || []) as DirectMessage[];
            setMessages(conversation);

            const unreadIds = conversation
                .filter(message => message.receiver_id === staffId && !message.is_read)
                .map(message => message.id);

            if (unreadIds.length > 0) {
                const { error: readError } = await supabase
                    .from("direct_messages")
                    .update({ is_read: true })
                    .in("id", unreadIds);
                if (readError) throw readError;
                await fetchChatStudents();
            }

            setTimeout(() => {
                scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: "smooth",
                });
            }, 100);
        } catch (error) {
            if (process.env.NODE_ENV === "development") console.error(error);
            setMessages([]);
            setConversationError("대화 내용을 불러오지 못했습니다. 다시 시도해주세요.");
        } finally {
            setConversationLoading(false);
        }
    }, [fetchChatStudents, getTeacherId]);

    const sendMessage = useCallback(async () => {
        const pendingContent = input.trim();
        if (!activeId || !pendingContent || sending) return;

        setSending(true);
        setSendError(null);
        try {
            const staffId = await getTeacherId();
            if (!staffId) throw new Error("관리자 로그인을 확인할 수 없습니다.");

            const supabase = createClient();
            const { error } = await supabase.from("direct_messages").insert({
                sender_id: staffId,
                receiver_id: activeId,
                sender_name: "선생님",
                content: pendingContent,
            });
            if (error) throw error;

            setInput("");
            await Promise.all([
                loadConversation(activeId),
                fetchChatStudents(),
            ]);
        } catch (error) {
            if (process.env.NODE_ENV === "development") console.error(error);
            setInput(pendingContent);
            setSendError("답장을 보내지 못했습니다. 내용을 그대로 보관했으니 다시 눌러주세요.");
        } finally {
            setSending(false);
        }
    }, [activeId, fetchChatStudents, getTeacherId, input, loadConversation, sending]);

    useEffect(() => {
        const timer = window.setTimeout(() => void fetchChatStudents(), 0);
        return () => window.clearTimeout(timer);
    }, [fetchChatStudents]);

    useEffect(() => {
        if (!activeId) return;
        const timer = window.setTimeout(() => void loadConversation(activeId), 0);
        return () => window.clearTimeout(timer);
    }, [activeId, loadConversation]);

    useEffect(() => {
        if (!viewerId) return;
        const supabase = createClient();
        const refresh = () => {
            void fetchChatStudents();
            if (activeId) void loadConversation(activeId);
        };
        const channel = supabase
            .channel(`admin-direct-messages-${viewerId}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "direct_messages",
                filter: `sender_id=eq.${viewerId}`,
            }, refresh)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "direct_messages",
                filter: `receiver_id=eq.${viewerId}`,
            }, refresh)
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [activeId, fetchChatStudents, loadConversation, viewerId]);

    const filteredChatStudents = chatStudents.filter(student =>
        student.name.toLowerCase().includes(search.trim().toLowerCase())
    );
    const activeStudentName = activeId
        ? studentNameByAnyId.get(activeId) || chatStudents.find(student => student.id === activeId)?.name || "학생"
        : "학생";

    return (
        <section aria-labelledby="admin-chat-title">
            <div style={{ marginBottom: 18 }}>
                <p style={{ margin: "0 0 5px", color: "#2563eb", fontSize: 11, fontWeight: 900, letterSpacing: "0.12em" }}>
                    STUDENT QUESTIONS
                </p>
                <h1 id="admin-chat-title" style={{ margin: 0, color: "#0f172a", fontSize: 30, fontWeight: 900 }}>
                    1:1 학생 질문
                </h1>
                <p style={{ margin: "7px 0 0", color: "#64748b", fontSize: 14 }}>
                    학생이 보낸 질문을 확인하고 안전하게 답장합니다.
                </p>
            </div>

            <div className="admin-chat-shell" style={{ display: "flex", minHeight: 560, height: "calc(100dvh - 190px)" }}>
                <aside className={`admin-chat-list ${activeId ? "admin-chat-list-hidden-mobile" : ""}`} aria-label="학생 질문 목록">
                    <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <strong style={{ color: "#172554", fontSize: 15 }}>학생별 대화</strong>
                            <button
                                type="button"
                                onClick={() => setShowNewChat(value => !value)}
                                aria-expanded={showNewChat}
                                style={{ ...smallButtonStyle, background: showNewChat ? "#e2e8f0" : "#2563eb", color: showNewChat ? "#475569" : "#fff" }}
                            >
                                {showNewChat ? "닫기" : "+ 새 대화"}
                            </button>
                        </div>
                        <input
                            aria-label="학생 질문 검색"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="학생 이름 검색"
                            style={inputStyle}
                        />
                    </div>

                    {showNewChat && (
                        <div style={{ padding: 8, borderBottom: "1px solid #e2e8f0", maxHeight: 210, overflowY: "auto" }}>
                            <div style={{ padding: "4px 8px", color: "#64748b", fontSize: 11, fontWeight: 700 }}>
                                로그인 연결이 완료된 학생
                            </div>
                            {eligibleStudents.length === 0 ? (
                                <p style={{ margin: 0, padding: 10, color: "#94a3b8", fontSize: 12 }}>대화를 시작할 수 있는 학생이 없습니다.</p>
                            ) : eligibleStudents.map(student => (
                                <button
                                    key={student.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveId(student.id);
                                        setShowNewChat(false);
                                    }}
                                    style={studentPickerStyle}
                                >
                                    <span aria-hidden="true" style={{ fontSize: 17 }}>{student.avatar || "🧒"}</span>
                                    <span>
                                        <strong style={{ display: "block", color: "#172554", fontSize: 13 }}>{student.name}</strong>
                                        <span style={{ color: "#94a3b8", fontSize: 11 }}>{student.class || student.grade || "반 정보 없음"}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {listLoading ? (
                            <EmptyList text="학생 질문을 불러오는 중입니다..." />
                        ) : listError ? (
                            <div role="alert" style={errorBoxStyle}>
                                <span>{listError}</span>
                                <button type="button" onClick={() => void fetchChatStudents()} style={retryButtonStyle}>다시 시도</button>
                            </div>
                        ) : filteredChatStudents.length === 0 ? (
                            <EmptyList text={search ? "검색 결과가 없습니다." : "아직 도착한 학생 질문이 없습니다."} />
                        ) : filteredChatStudents.map(student => (
                            <button
                                key={student.id}
                                type="button"
                                onClick={() => {
                                    setActiveId(student.id);
                                    setShowNewChat(false);
                                }}
                                aria-label={`${student.name} 학생과의 대화${student.unread ? `, 읽지 않은 질문 ${student.unread}개` : ""}`}
                                style={{ ...conversationButtonStyle, background: activeId === student.id ? "#eff6ff" : "transparent" }}
                            >
                                <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                    <strong style={{ color: "#172554", fontSize: 13 }}>{student.name}</strong>
                                    <span style={{ color: "#94a3b8", fontSize: 10 }}>{student.lastTime}</span>
                                </span>
                                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 3 }}>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b", fontSize: 12 }}>{student.lastMsg}</span>
                                    {student.unread > 0 && <span style={unreadBadgeStyle}>{student.unread}</span>}
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                <div className={`admin-chat-panel ${activeId ? "" : "admin-chat-panel-hidden-mobile"}`}>
                    {!activeId ? (
                        <div style={emptyConversationStyle}>
                            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 48 }}>forum</span>
                            <span>답장할 학생을 선택하세요.</span>
                        </div>
                    ) : (
                        <>
                            <header style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
                                <button className="admin-chat-back" type="button" onClick={() => setActiveId(null)} aria-label="학생 질문 목록으로 돌아가기" style={backButtonStyle}>
                                    <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20 }}>arrow_back</span>
                                </button>
                                <div>
                                    <strong style={{ display: "block", color: "#172554", fontSize: 14 }}>{activeStudentName}</strong>
                                    <span style={{ color: "#64748b", fontSize: 11 }}>관리자와 학생만 보는 1:1 대화</span>
                                </div>
                            </header>

                            <div ref={scrollRef} aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f8fafc" }}>
                                {conversationLoading ? (
                                    <div style={emptyConversationStyle}>대화 내용을 불러오는 중입니다...</div>
                                ) : conversationError ? (
                                    <div role="alert" style={{ ...errorBoxStyle, margin: "24px auto", maxWidth: 360 }}>
                                        <span>{conversationError}</span>
                                        <button type="button" onClick={() => void loadConversation(activeId)} style={retryButtonStyle}>다시 시도</button>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div style={emptyConversationStyle}>아직 대화가 없습니다. 먼저 안내를 보내도 됩니다.</div>
                                ) : messages.map(message => {
                                    const isMine = message.sender_id === viewerId;
                                    return (
                                        <div key={message.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 9 }}>
                                            <div style={{ ...messageBubbleStyle, background: isMine ? "#2563eb" : "#fff", color: isMine ? "#fff" : "#172554", borderBottomRightRadius: isMine ? 4 : 14, borderBottomLeftRadius: isMine ? 14 : 4 }}>
                                                {!isMine && <div style={{ marginBottom: 3, color: "#2563eb", fontSize: 11, fontWeight: 800 }}>{message.sender_name}</div>}
                                                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{message.content}</div>
                                                <div style={{ marginTop: 4, textAlign: "right", color: isMine ? "rgba(255,255,255,0.72)" : "#94a3b8", fontSize: 10 }}>
                                                    {new Date(message.created_at).toLocaleTimeString("ko", { hour: "2-digit", minute: "2-digit" })}
                                                    {isMine && message.is_read ? " · 읽음" : ""}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {sendError && <div role="alert" style={{ padding: "9px 16px", borderTop: "1px solid #fed7aa", background: "#fff7ed", color: "#c2410c", fontSize: 12, fontWeight: 700 }}>{sendError}</div>}
                            <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "flex-end", gap: 8 }}>
                                <textarea
                                    aria-label="학생에게 보낼 답장"
                                    value={input}
                                    onChange={event => setInput(event.target.value)}
                                    onKeyDown={event => {
                                        if (event.key === "Enter" && !event.shiftKey) {
                                            event.preventDefault();
                                            void sendMessage();
                                        }
                                    }}
                                    rows={1}
                                    maxLength={2000}
                                    disabled={sending}
                                    placeholder="답장을 입력하세요. (Enter 전송)"
                                    style={{ ...inputStyle, minHeight: 42, maxHeight: 120, resize: "vertical", fontFamily: "inherit" }}
                                />
                                <button type="button" onClick={() => void sendMessage()} disabled={sending || !input.trim()} style={{ ...sendButtonStyle, opacity: sending || !input.trim() ? 0.55 : 1 }}>
                                    {sending ? "전송 중" : "답장 보내기"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .admin-chat-list {
                    width: 310px;
                    flex-shrink: 0;
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-right: 0;
                    border-radius: 16px 0 0 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .admin-chat-panel {
                    flex: 1;
                    min-width: 0;
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 0 16px 16px 0;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .admin-chat-back { display: none !important; }
                @media (max-width: 700px) {
                    .admin-chat-shell { height: calc(100dvh - 185px) !important; min-height: 470px !important; }
                    .admin-chat-list { width: 100%; border-right: 1px solid #e2e8f0; border-radius: 16px; }
                    .admin-chat-panel { width: 100%; border-radius: 16px; }
                    .admin-chat-list-hidden-mobile, .admin-chat-panel-hidden-mobile { display: none !important; }
                    .admin-chat-back { display: inline-flex !important; }
                }
            `}</style>
        </section>
    );
}

function EmptyList({ text }: { text: string }) {
    return <p style={{ margin: 0, padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>{text}</p>;
}

const smallButtonStyle = { padding: "7px 11px", border: 0, borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 800 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, outline: "none", color: "#0f172a", background: "#fff", fontSize: 13 };
const studentPickerStyle = { width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", border: 0, borderRadius: 8, background: "transparent", textAlign: "left" as const, cursor: "pointer" };
const conversationButtonStyle = { width: "100%", padding: "13px 16px", border: 0, borderBottom: "1px solid #f1f5f9", textAlign: "left" as const, cursor: "pointer" };
const unreadBadgeStyle = { minWidth: 19, height: 19, padding: "0 5px", borderRadius: 10, background: "#ef4444", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 };
const errorBoxStyle = { margin: 12, padding: 14, border: "1px solid #fecaca", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 9, textAlign: "center" as const, fontSize: 12 };
const retryButtonStyle = { padding: "6px 10px", border: "1px solid #fca5a5", borderRadius: 8, background: "#fff", color: "#b91c1c", cursor: "pointer", fontSize: 11, fontWeight: 800 };
const emptyConversationStyle = { flex: 1, minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: 10, textAlign: "center" as const, color: "#94a3b8", fontSize: 13 };
const messageBubbleStyle = { maxWidth: "72%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 2px 7px rgba(15,23,42,0.06)", fontSize: 13, lineHeight: 1.55 };
const backButtonStyle = { width: 34, height: 34, border: "1px solid #e2e8f0", borderRadius: 9, background: "#fff", color: "#475569", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const sendButtonStyle = { minWidth: 96, minHeight: 42, padding: "0 14px", border: 0, borderRadius: 10, background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 800 };
