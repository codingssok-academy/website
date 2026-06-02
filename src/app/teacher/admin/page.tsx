"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAdmin } from "./context";
import { createClient } from "@/lib/supabase";
import type { Student, ParentLink } from "./types";
import StudentAvatar from "./components/StudentAvatar";

/* ═══════════════════════════════════════
   관리자 메인 대시보드
   /teacher/admin
   ═══════════════════════════════════════ */

const formatBirthday = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
};

const formatParentRelation = (relation?: string | null) => {
    switch ((relation || "").toLowerCase()) {
        case "mother": return "어머니";
        case "father": return "아버지";
        case "guardian": return "보호자";
        case "parent": return "학부모";
        default: return relation || "학부모";
    }
};

interface ActivityLog {
    id: string;
    student_name: string;
    action: string;
    detail: string | null;
    created_at: string;
}

interface OverviewStats {
    totalStudents: number;
    todayOnline: number;
    ungradedHomework: number;
    unreadChat: number;
}

function QuickActionCards({ loading }: { loading: boolean }) {
    const router = useRouter();

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
            marginBottom: 24,
        }}>
            {/* 숙제 채점 */}
            <motion.button
                onClick={() => router.push("/teacher/admin/homework")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    border: "none", borderRadius: 16, padding: "18px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                    cursor: "pointer", textAlign: "left",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.25)",
                }}
            >
                <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: 26, color: "#fff", fontVariationSettings: "'FILL' 1",
                    }}>grading</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
                        숙제 채점
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
                        과제 확인 · 완료 처리
                    </div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "rgba(255,255,255,0.7)" }}>
                    chevron_right
                </span>
            </motion.button>
        </div>
    );
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "방금 전";
    if (mins < 60) return `${mins}분 전`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}시간 전`;
    return `${Math.floor(hrs / 24)}일 전`;
}

export default function StudentsPage() {
    const { students, loading, fetchStudents } = useAdmin();

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<"name" | "grade" | "date">("date");
    const [detail, setDetail] = useState<Student | null>(null);
    const [parentLinks, setParentLinks] = useState<ParentLink[]>([]);
    const [parentLinksLoading, setParentLinksLoading] = useState(false);

    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newYear, setNewYear] = useState("");
    const [newMonth, setNewMonth] = useState("");
    const [newDay, setNewDay] = useState("");
    const [newGrade, setNewGrade] = useState("");
    const [newClass, setNewClass] = useState("");
    const [newAvatar, setNewAvatar] = useState("face");
    const [addLoading, setAddLoading] = useState(false);
    const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // 출결번호 관련 state
    const [pinMap, setPinMap] = useState<Record<string, string>>({}); // auth_user_id -> pin
    const [pinEdit, setPinEdit] = useState<string>("");
    const [pinSaving, setPinSaving] = useState(false);
    const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const [overview, setOverview] = useState<OverviewStats>({
        totalStudents: 0,
        todayOnline: 0,
        ungradedHomework: 0,
        unreadChat: 0,
    });
    const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setStatsLoading(true);
            try {
                const sb = createClient();

                // 총 학생 수
                const { count: totalCount } = await sb
                    .from("students")
                    .select("*", { count: "exact", head: true });

                // 오늘 접속 (presence 테이블 기준)
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const { data: onlineData } = await sb
                    .from("student_presence")
                    .select("user_id")
                    .gte("last_heartbeat", todayStart.toISOString());
                const todayOnline = new Set((onlineData as { user_id: string | null }[] | null)?.map((r) => r.user_id) ?? []).size;

                // 미채점 숙제
                const { data: ungradedData } = await sb
                    .from("homework_submissions")
                    .select("id")
                    .is("score", null);
                const ungradedHomework = ungradedData?.length ?? 0;

                // 미읽은 채팅
                const { data: { user } } = await sb.auth.getUser();
                let unreadChat = 0;
                if (user) {
                    const { data: chatData } = await sb
                        .from("chat_messages")
                        .select("id")
                        .eq("receiver_id", user.id)
                        .eq("is_read", false);
                    unreadChat = chatData?.length ?? 0;
                }

                setOverview({
                    totalStudents: totalCount ?? 0,
                    todayOnline,
                    ungradedHomework,
                    unreadChat,
                });

                // 최근 활동 피드 (activity_log 테이블 또는 학생 최근 활동으로 폴백)
                const { data: logData } = await sb
                    .from("activity_log")
                    .select("id, student_name, action, detail, created_at")
                    .order("created_at", { ascending: false })
                    .limit(10);
                setActivityLog((logData ?? []) as ActivityLog[]);
            } catch {
                // 통계 로드 실패는 조용히 처리
            } finally {
                setStatsLoading(false);
            }
        };
        loadStats();
    }, []);

    const filteredStudents = useMemo(() => {
        let list = students.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.grade || "").includes(search) ||
            (s.class || "").includes(search)
        );
        if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
        else if (sort === "grade") list.sort((a, b) => (a.grade || "").localeCompare(b.grade || ""));
        else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return list;
    }, [students, search, sort]);

    const loadParentLinks = async (student: Student) => {
        setDetail(student);
        setPinMsg(null);
        if (!student.auth_user_id) {
            setParentLinks([]);
            setPinEdit("");
            return;
        }
        setParentLinksLoading(true);
        try {
            const sb = createClient();
            const [{ data: links }, { data: pinData }] = await Promise.all([
                sb.from("parent_student_links").select("*")
                    .eq("student_id", student.auth_user_id).order("created_at", { ascending: false }),
                sb.from("study_progress").select("completed_units")
                    .eq("user_id", student.auth_user_id)
                    .eq("course_id", "__parent_pin__")
                    .maybeSingle(),
            ]);
            setParentLinks((links || []) as ParentLink[]);
            const currentPin = pinData?.completed_units?.[0] ?? "";
            setPinMap(prev => ({ ...prev, [student.auth_user_id!]: currentPin }));
            setPinEdit(currentPin);
        } catch {
            setParentLinks([]);
            setPinEdit("");
        } finally {
            setParentLinksLoading(false);
        }
    };

    const handleSavePin = async () => {
        if (!detail?.auth_user_id) return;
        const trimmed = pinEdit.trim();
        if (!trimmed) {
            setPinMsg({ ok: false, text: "출결번호를 입력해주세요" });
            return;
        }
        if (!/^\d{4,10}$/.test(trimmed)) {
            setPinMsg({ ok: false, text: "숫자 4~10자리로 입력해주세요" });
            return;
        }
        setPinSaving(true);
        setPinMsg(null);
        try {
            const sb = createClient();
            const { error } = await sb.from("study_progress").upsert({
                user_id: detail.auth_user_id,
                course_id: "__parent_pin__",
                completed_units: [trimmed],
            }, { onConflict: "user_id,course_id" });
            if (error) throw error;
            setPinMap(prev => ({ ...prev, [detail.auth_user_id!]: trimmed }));
            setPinMsg({ ok: true, text: "출결번호가 저장되었습니다" });
        } catch (err: unknown) {
            setPinMsg({ ok: false, text: `저장 실패: ${err instanceof Error ? err.message : String(err)}` });
        } finally {
            setPinSaving(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newName.trim();
        if (!trimmed) { setAddMsg({ ok: false, text: "이름을 입력해주세요" }); return; }
        if (!newYear || !newMonth || !newDay) { setAddMsg({ ok: false, text: "생년월일을 모두 선택해주세요" }); return; }
        const birthday = `${newYear}-${newMonth.padStart(2, "0")}-${newDay.padStart(2, "0")}`;
        setAddLoading(true); setAddMsg(null);
        try {
            const sb = createClient();
            const { error } = await sb.from("students").insert({
                name: trimmed, birthday, grade: newGrade || null, class: newClass || null, avatar: newAvatar || "face",
            });
            if (error) throw error;
            setAddMsg({ ok: true, text: `"${trimmed}" 학생이 추가되었습니다!` });
            setNewName(""); setNewYear(""); setNewMonth(""); setNewDay("");
            setNewGrade(""); setNewClass(""); setNewAvatar("face");
            fetchStudents();
        } catch (err: unknown) {
            setAddMsg({ ok: false, text: `오류: ${err instanceof Error ? err.message : String(err)}` });
        } finally { setAddLoading(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            const sb = createClient();
            await sb.from("students").delete().eq("id", id);
            setDeleteId(null);
            if (detail?.id === id) setDetail(null);
            fetchStudents();
        } catch (err) {
            if (process.env.NODE_ENV === "development") console.error("삭제 실패:", err);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => String(currentYear - i));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

    const selectStyle: React.CSSProperties = {
        padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
        fontSize: 13, background: "#fff", outline: "none", flex: 1,
    };
    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box",
    };

    return (
        <div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

            {/* ── 헤더 ── */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#172554", margin: 0 }}>대시보드</h2>
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>오늘 현황</span>
                    </div>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                        border: "1px solid #bfdbfe",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#2563eb", fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                    </div>
                </div>
            </div>

            {/* ── 총 학생 수 요약 ── */}
            {!statsLoading && (
                <div style={{
                    background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                    borderRadius: 16, padding: "16px 20px", marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 14,
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: "rgba(255,255,255,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 26, color: "#fff", fontVariationSettings: "'FILL' 1" }}>group</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                            {overview.totalStudents}
                            <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 4 }}>명</span>
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>총 등록 학생</div>
                    </div>
                </div>
            )}

            {/* ── 숙제 채점 바로가기 ── */}
            <QuickActionCards loading={statsLoading} />


            {/* ── 최근 활동 피드 ── */}
            {!statsLoading && activityLog.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 12px" }}>최근 활동</h3>
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        {activityLog.map((log, idx) => (
                            <div key={log.id} style={{
                                display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
                                borderBottom: idx < activityLog.length - 1 ? "1px solid #f1f5f9" : "none",
                            }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: "50%", background: "#3b82f6",
                                    flexShrink: 0,
                                }} />
                                <div style={{ flex: 1, fontSize: 13, color: "#334155" }}>
                                    <span style={{ fontWeight: 700 }}>{log.student_name}</span>
                                    {log.detail ? ` ${log.action} — ${log.detail}` : ` ${log.action}`}
                                </div>
                                <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                                    {timeAgo(log.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── 학생 관리 ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#172554", margin: 0 }}>학생 관리</h3>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "3px 0 0" }}>총 {students.length}명 등록</p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} style={{
                    padding: "10px 20px", borderRadius: 12, border: "none",
                    background: showAdd ? "#f1f5f9" : "linear-gradient(135deg, #2563eb, #6366f1)",
                    color: showAdd ? "#475569" : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showAdd ? "close" : "person_add"}</span>
                    {showAdd ? "닫기" : "학생 추가"}
                </button>
            </div>

            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden", marginBottom: 24 }}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 16px" }}>새 학생 추가</h3>
                            <form onSubmit={handleAdd}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>이름 *</label>
                                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="학생 이름" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>아바타</label>
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {(["face", "person", "child_care", "school", "sentiment_satisfied", "star_face", "mood", "tag_faces", "emoji_people"] as const).map(icon => (
                                                <button key={icon} type="button" onClick={() => setNewAvatar(icon)} title={icon} style={{
                                                    width: 32, height: 32, borderRadius: 8,
                                                    border: newAvatar === icon ? "2px solid #2563eb" : "1px solid #e2e8f0",
                                                    background: newAvatar === icon ? "#eff6ff" : "#fff", cursor: "pointer",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: newAvatar === icon ? "#2563eb" : "#64748b" }}>{icon}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>생년월일 *</label>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <select value={newYear} onChange={e => setNewYear(e.target.value)} style={selectStyle}>
                                            <option value="">년</option>{years.map(y => <option key={y} value={y}>{y}년</option>)}
                                        </select>
                                        <select value={newMonth} onChange={e => setNewMonth(e.target.value)} style={selectStyle}>
                                            <option value="">월</option>{months.map(m => <option key={m} value={m}>{m}월</option>)}
                                        </select>
                                        <select value={newDay} onChange={e => setNewDay(e.target.value)} style={selectStyle}>
                                            <option value="">일</option>{days.map(d => <option key={d} value={d}>{d}일</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>학년</label>
                                        <select value={newGrade} onChange={e => setNewGrade(e.target.value)} style={{ ...selectStyle, width: "100%" }}>
                                            <option value="">선택</option>
                                            {["초1","초2","초3","초4","초5","초6","중1","중2","중3","고1","고2","고3"].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>반</label>
                                        <input value={newClass} onChange={e => setNewClass(e.target.value)} placeholder="예: A반" style={inputStyle} />
                                    </div>
                                </div>
                                {addMsg && (
                                    <div style={{
                                        padding: "10px 14px", borderRadius: 10, marginBottom: 12,
                                        background: addMsg.ok ? "#F0FDF4" : "#FEF2F2",
                                        border: `1px solid ${addMsg.ok ? "#BBF7D0" : "#FECACA"}`,
                                        fontSize: 13, color: addMsg.ok ? "#16a34a" : "#DC2626", fontWeight: 500,
                                    }}>{addMsg.text}</div>
                                )}
                                <button type="submit" disabled={addLoading} style={{
                                    padding: "12px 24px", borderRadius: 12, border: "none",
                                    background: addLoading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #6366f1)",
                                    color: "#fff", fontSize: 14, fontWeight: 700, cursor: addLoading ? "not-allowed" : "pointer",
                                }}>{addLoading ? "추가 중..." : "학생 추가"}</button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <span className="material-symbols-outlined" style={{
                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#94a3b8",
                    }}>search</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 학년, 반 검색..." style={{ ...inputStyle, paddingLeft: 38 }} />
                </div>
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={selectStyle}>
                    <option value="date">최근 등록순</option><option value="name">이름순</option><option value="grade">학년순</option>
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>불러오는 중...</div>
            ) : filteredStudents.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>{search ? "검색 결과가 없습니다" : "등록된 학생이 없습니다"}</div>
            ) : (
                <div style={{ display: "grid", gap: 8 }}>
                    {filteredStudents.map(s => (
                        <div key={s.id} onClick={() => loadParentLinks(s)} style={{
                            background: "#fff", borderRadius: 12, padding: "14px 18px",
                            border: detail?.id === s.id ? "2px solid #2563eb" : "1px solid #e2e8f0",
                            display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "border-color 0.15s",
                        }}>
                            <StudentAvatar name={s.name} size={40} borderRadius={12} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#172554" }}>{s.name}</div>
                                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                                    {s.grade || "학년 미설정"} · {formatBirthday(s.birthday)}
                                    {s.auth_user_id && <span style={{ marginLeft: 6, color: "#16a34a" }}>● 연동됨</span>}
                                    {s.auth_user_id && pinMap[s.auth_user_id] && (
                                        <span style={{ marginLeft: 6, color: "#2563eb" }}>
                                            PIN {pinMap[s.auth_user_id]}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                {deleteId === s.id ? (
                                    <>
                                        <button onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                                            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>삭제 확인</button>
                                        <button onClick={e => { e.stopPropagation(); setDeleteId(null); }}
                                            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 11, cursor: "pointer" }}>취소</button>
                                    </>
                                ) : (
                                    <button onClick={e => { e.stopPropagation(); setDeleteId(s.id); }}
                                        style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "transparent", color: "#cbd5e1", fontSize: 16, cursor: "pointer" }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {detail && (
                    <>
                        {/* Backdrop (mobile) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDetail(null)}
                            className="student-detail-backdrop"
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 39 }}
                        />
                        {/* Panel: desktop = right side panel, mobile = bottom sheet */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="student-detail-panel"
                            style={{
                                position: "fixed", background: "#fff",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0",
                                overflowY: "auto", zIndex: 40,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <StudentAvatar name={detail.name} size={48} borderRadius={14} />
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: "#172554" }}>{detail.name}</div>
                                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{detail.grade || "-"} · {detail.class || "-"}</div>
                                    </div>
                                </div>
                                <button onClick={() => setDetail(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
                                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>생년월일</div>
                                    <div style={{ fontWeight: 600, color: "#172554" }}>{formatBirthday(detail.birthday)}</div>
                                </div>
                                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
                                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>등록일</div>
                                    <div style={{ fontWeight: 600, color: "#172554" }}>{new Date(detail.created_at).toLocaleDateString("ko")}</div>
                                </div>
                                <div style={{ background: detail.auth_user_id ? "#f0fdf4" : "#fef2f2", borderRadius: 8, padding: "8px 12px", gridColumn: "span 2" }}>
                                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>계정 연동</div>
                                    <div style={{ fontWeight: 600, color: detail.auth_user_id ? "#16a34a" : "#ef4444" }}>
                                        {detail.auth_user_id ? "연동됨" : "미연동"}
                                    </div>
                                </div>
                                {detail.pin && (
                                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px", gridColumn: "span 2" }}>
                                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>PIN</div>
                                        <div style={{ fontWeight: 600, color: "#172554" }}>{detail.pin}</div>
                                    </div>
                                )}
                            </div>
                            {/* ── 출결번호 ── */}
                            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginBottom: 16 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#172554", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pin</span>
                                    출결번호
                                </h4>
                                {!detail.auth_user_id ? (
                                    <div style={{ fontSize: 12, color: "#f59e0b" }}>학생 계정이 연동된 후 출결번호를 설정할 수 있습니다.</div>
                                ) : (
                                    <div>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <input
                                                value={pinEdit}
                                                onChange={e => { setPinEdit(e.target.value); setPinMsg(null); }}
                                                placeholder="숫자 4~10자리"
                                                maxLength={10}
                                                inputMode="numeric"
                                                style={{
                                                    flex: 1, padding: "9px 12px", borderRadius: 9,
                                                    border: "1px solid #e2e8f0", fontSize: 14,
                                                    outline: "none", fontWeight: 700, letterSpacing: 2,
                                                    boxSizing: "border-box",
                                                }}
                                                onKeyDown={e => { if (e.key === "Enter") handleSavePin(); }}
                                            />
                                            <button
                                                onClick={handleSavePin}
                                                disabled={pinSaving}
                                                style={{
                                                    padding: "9px 16px", borderRadius: 9, border: "none",
                                                    background: pinSaving ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #6366f1)",
                                                    color: "#fff", fontSize: 13, fontWeight: 700,
                                                    cursor: pinSaving ? "not-allowed" : "pointer", flexShrink: 0,
                                                }}
                                            >
                                                {pinSaving ? "저장 중..." : "저장"}
                                            </button>
                                        </div>
                                        {pinMsg && (
                                            <div style={{
                                                marginTop: 8, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                                                background: pinMsg.ok ? "#f0fdf4" : "#fef2f2",
                                                border: `1px solid ${pinMsg.ok ? "#bbf7d0" : "#fecaca"}`,
                                                color: pinMsg.ok ? "#16a34a" : "#dc2626",
                                            }}>
                                                {pinMsg.text}
                                            </div>
                                        )}
                                        <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                                            학부모가 이 번호로 학부모 포털에 로그인합니다.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: "#172554", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>family_restroom</span>
                                    학부모 연동
                                </h4>
                                {parentLinksLoading ? (
                                    <div style={{ fontSize: 12, color: "#94a3b8" }}>불러오는 중...</div>
                                ) : !detail.auth_user_id ? (
                                    <div style={{ fontSize: 12, color: "#f59e0b" }}>학생 계정이 연동된 후 학부모 정보를 관리할 수 있습니다.</div>
                                ) : parentLinks.length === 0 ? (
                                    <div style={{ fontSize: 12, color: "#94a3b8" }}>등록된 학부모가 없습니다.</div>
                                ) : (
                                    parentLinks.map(link => (
                                        <div key={link.id} style={{ padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9", marginBottom: 8, fontSize: 12 }}>
                                            <div style={{ fontWeight: 700, color: "#172554" }}>{link.parent_name} ({formatParentRelation(link.relation)})</div>
                                            {link.parent_phone && <div style={{ color: "#64748b", marginTop: 2 }}>{link.parent_phone}</div>}
                                            <div style={{ color: "#94a3b8", marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                <span>알림: {link.notifications_enabled ? "ON" : "OFF"}</span>
                                                <span>피드백: {link.receive_feedback_updates ? "ON" : "OFF"}</span>
                                                <span>실시간: {link.receive_live_updates ? "ON" : "OFF"}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                @media (min-width: 768px) {
                    .student-detail-backdrop { display: none !important; }
                    .student-detail-panel {
                        right: 32px;
                        top: 80px;
                        width: 360px;
                        border-radius: 16px;
                        padding: 24px;
                        max-height: calc(100vh - 120px);
                    }
                }
                @media (max-width: 767px) {
                    .student-detail-panel {
                        left: 0;
                        right: 0;
                        bottom: 0;
                        border-radius: 20px 20px 0 0;
                        padding: 20px 16px;
                        max-height: 80vh;
                        padding-bottom: calc(20px + env(safe-area-inset-bottom));
                    }
                }
            `}</style>
        </div>
    );
}
