"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type StudentAccount = {
    id: string;
    source: "student" | "orphan";
    name: string;
    school: string | null;
    grade: string | null;
    className: string | null;
    status: string;
    canChangeStatus: boolean;
    pinIssued: boolean;
    loginPin: string | null;
    loginPinIssued?: boolean;
    createdAt: string | null;
    updatedAt: string | null;
    authUserId: string | null;
    accountLinked: boolean;
    email: string | null;
    role: string | null;
    displayName: string | null;
    authCreatedAt: string | null;
    lastSignInAt: string | null;
    canDeleteAccount: boolean;
    deleteRecommended?: boolean;
    recommendationReason?: string | null;
};

type Stats = {
    total: number;
    linked: number;
    unlinked: number;
    approved: number;
    deactivated: number;
    pending: number;
    orphan: number;
    deleteRecommended?: number;
};

type ApiResponse = {
    success: boolean;
    students?: StudentAccount[];
    stats?: Stats;
    error?: string;
    warning?: string;
};

type InfoDraft = {
    school: string;
    grade: string;
};

type LoginPinDraft = Record<string, string>;

const FILTERS = [
    { key: "all", label: "전체" },
    { key: "linked", label: "회원가입 완료" },
    { key: "unlinked", label: "미가입" },
    { key: "deleteRecommended", label: "삭제 권유" },
    { key: "deactivated", label: "비활성" },
] as const;

const STATUS_LABEL: Record<string, string> = {
    pending: "대기",
    approved: "활성",
    active: "활성",
    deactivated: "비활성",
    rejected: "거절",
    orphan: "미연결",
};

function formatDate(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function statusColor(status: string) {
    if (status === "approved" || status === "active") return { bg: "#ecfdf5", fg: "#047857", bd: "#bbf7d0" };
    if (status === "deactivated") return { bg: "#fef2f2", fg: "#b91c1c", bd: "#fecaca" };
    if (status === "pending") return { bg: "#fffbeb", fg: "#b45309", bd: "#fde68a" };
    return { bg: "#f8fafc", fg: "#475569", bd: "#cbd5e1" };
}

async function readApiJson(response: Response): Promise<ApiResponse> {
    const text = await response.text();
    if (!text.trim()) {
        return response.ok
            ? { success: true }
            : { success: false, error: `HTTP ${response.status}` };
    }
    try {
        return JSON.parse(text) as ApiResponse;
    } catch {
        return { success: false, error: text.slice(0, 240) || `HTTP ${response.status}` };
    }
}

export default function StudentAccountsPage() {
    const [students, setStudents] = useState<StudentAccount[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, linked: 0, unlinked: 0, approved: 0, deactivated: 0, pending: 0, orphan: 0, deleteRecommended: 0 });
    const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);
    const [infoDrafts, setInfoDrafts] = useState<Record<string, InfoDraft>>({});
    const [loginPinDrafts, setLoginPinDrafts] = useState<LoginPinDraft>({});
    const [message, setMessage] = useState<{ type: "ok" | "error" | "info"; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-accounts", { cache: "no-store" });
            const data = await readApiJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "학생 계정 목록을 불러오지 못했습니다.");
            setStudents(data.students || []);
            setStats(data.stats || { total: 0, linked: 0, unlinked: 0, approved: 0, deactivated: 0, pending: 0, orphan: 0, deleteRecommended: 0 });
            if (data.warning) setMessage({ type: "info", text: data.warning });
        } catch (error) {
            setStudents([]);
            setMessage({ type: "error", text: error instanceof Error ? error.message : "목록 조회 실패" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const filtered = useMemo(() => {
        const normalizedQuery = query.trim().replace(/\s+/g, "");
        return students.filter(student => {
            if (filter === "linked" && (!student.accountLinked || student.deleteRecommended)) return false;
            if (filter === "unlinked" && (student.accountLinked || student.deleteRecommended)) return false;
            if (filter === "deleteRecommended" && !student.deleteRecommended) return false;
            if (filter === "deactivated" && student.status !== "deactivated") return false;
            if (normalizedQuery) {
                const haystack = [
                    student.name,
                    student.school || "",
                    student.grade || "",
                    student.className || "",
                ].join("").replace(/\s+/g, "");
                if (!haystack.includes(normalizedQuery)) return false;
            }
            return true;
        });
    }, [filter, query, students]);

    const getInfoDraft = (student: StudentAccount): InfoDraft => {
        return infoDrafts[student.id] || {
            school: student.school || "",
            grade: student.grade || "",
        };
    };

    const setInfoDraft = (student: StudentAccount, key: keyof InfoDraft, value: string) => {
        const maxLength = key === "school" ? 40 : 20;
        setInfoDrafts(prev => ({
            ...prev,
            [student.id]: {
                school: prev[student.id]?.school ?? student.school ?? "",
                grade: prev[student.id]?.grade ?? student.grade ?? "",
                [key]: value.slice(0, maxLength),
            },
        }));
    };

    const isInfoDirty = (student: StudentAccount) => {
        const draft = getInfoDraft(student);
        return draft.school.trim() !== (student.school || "") || draft.grade.trim() !== (student.grade || "");
    };

    const updateStatus = async (student: StudentAccount, status: string) => {
        setActingId(student.id);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-accounts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: student.id, status }),
            });
            const data = await readApiJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "상태 변경 실패");
            setStudents(data.students || []);
            if (data.stats) setStats(data.stats);
            setMessage({ type: "ok", text: `${student.name} 상태를 ${STATUS_LABEL[status] || status}로 변경했습니다.` });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "상태 변경 실패" });
        } finally {
            setActingId(null);
        }
    };

    const saveStudentInfo = async (student: StudentAccount) => {
        if (student.source !== "student") return;
        const draft = getInfoDraft(student);
        setActingId(student.id);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-accounts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "studentInfo",
                    studentId: student.id,
                    school: draft.school.trim(),
                    grade: draft.grade.trim(),
                }),
            });
            const data = await readApiJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "학생 정보를 저장하지 못했습니다.");
            setStudents(data.students || []);
            if (data.stats) setStats(data.stats);
            setInfoDrafts(prev => {
                const next = { ...prev };
                delete next[student.id];
                return next;
            });
            setMessage({ type: "ok", text: `${student.name} 학교/학년 정보를 저장했습니다.` });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "학생 정보 저장 실패" });
        } finally {
            setActingId(null);
        }
    };

    const setLoginPinDraft = (student: StudentAccount, value: string) => {
        setLoginPinDrafts(prev => ({
            ...prev,
            [student.id]: value.replace(/\D/g, "").slice(0, 4),
        }));
    };

    const resetLoginPin = async (student: StudentAccount) => {
        if (!student.accountLinked || student.source !== "student") return;
        const loginPin = (loginPinDrafts[student.id] || "").replace(/\D/g, "").slice(0, 4);
        if (!/^\d{4}$/.test(loginPin)) {
            setMessage({ type: "error", text: "로그인 비밀번호는 숫자 4자리로 입력해야 합니다." });
            return;
        }

        setActingId(student.id);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-accounts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "studentLoginPin",
                    studentId: student.id,
                    loginPin,
                }),
            });
            const data = await readApiJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "로그인 비밀번호 저장 실패");
            setStudents(data.students || []);
            if (data.stats) setStats(data.stats);
            setLoginPinDrafts(prev => {
                const next = { ...prev };
                delete next[student.id];
                return next;
            });
            setMessage({ type: "ok", text: `${student.name} 로그인 비밀번호를 ${loginPin}로 설정했습니다.` });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "로그인 비밀번호 저장 실패" });
        } finally {
            setActingId(null);
        }
    };

    const deleteAccount = async (student: StudentAccount) => {
        if (!student.accountLinked) return;
        const ok = window.confirm(
            `${student.name} 로그인 계정을 해제할까요?\n\n학부모 인증번호와 학생 기록은 유지하고, 로그인 계정 연결만 제거합니다.`,
        );
        if (!ok) return;

        setActingId(student.id);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-accounts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(student.source === "orphan" ? { accountId: student.authUserId || student.id } : { studentId: student.id }),
            });
            const data = await readApiJson(res);
            if (!res.ok || !data.success) throw new Error(data.error || "계정 삭제 실패");
            setStudents(data.students || []);
            if (data.stats) setStats(data.stats);
            setMessage({ type: "ok", text: `${student.name} 로그인 계정을 해제했습니다.` });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "계정 삭제 실패" });
        } finally {
            setActingId(null);
        }
    };

    return (
        <div className="student-account-page">
            <header className="page-head">
                <div>
                    <div className="eyebrow">계정 운영</div>
                    <h1>학생 로그인 계정 관리</h1>
                    <p>운영 기준 38명 학생을 기준으로 회원가입 상태를 확인하고, 기준 밖 계정은 삭제 권유 목록으로 분리합니다.</p>
                </div>
                <button className="ghost-btn" onClick={() => void load()} disabled={loading}>새로고침</button>
            </header>

            <section className="stat-grid">
                <Stat label="운영 학생" value={stats.total} />
                <Stat label="회원가입 완료" value={stats.linked} />
                <Stat label="미가입" value={stats.unlinked} />
                <Stat label="삭제 권유" value={stats.deleteRecommended || 0} />
            </section>

            {message && <div className={`notice ${message.type}`}>{message.text}</div>}

            <section className="toolbar">
                <div className="filters">
                    {FILTERS.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setFilter(item.key)}
                            className={filter === item.key ? "active" : ""}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="학생 검색"
                />
            </section>

            <section className="table-wrap">
                <div className="table-head">
                    <span>학생</span>
                    <span>학교</span>
                    <span>학년</span>
                    <span>로그인 비밀번호</span>
                    <span>학생 상태</span>
                    <span>최근 로그인</span>
                    <span>관리</span>
                </div>
                {loading ? (
                    <div className="empty">학생 계정을 불러오는 중입니다.</div>
                ) : filtered.length === 0 ? (
                    <div className="empty">표시할 학생이 없습니다.</div>
                ) : (
                    filtered.map(student => {
                        const colors = statusColor(student.status);
                        const acting = actingId === student.id;
                        const draft = getInfoDraft(student);
                        const canEditInfo = student.source === "student" && student.canChangeStatus;
                        const dirtyInfo = isInfoDirty(student);
                        const infoLine = student.deleteRecommended
                            ? student.recommendationReason || "운영 명단 기준 밖 계정"
                            : [
                                student.className || "반 미지정",
                                student.school || null,
                                student.grade || null,
                                `인증번호 ${student.pinIssued ? "발급됨" : "없음"}`,
                            ].filter(Boolean).join(" · ");
                        return (
                            <div className={`table-row ${student.deleteRecommended ? "recommend-delete" : ""}`} key={student.id} style={{ opacity: acting ? 0.55 : 1 }}>
                                <div className="student-cell">
                                    <div className="avatar">{student.name.slice(0, 1)}</div>
                                    <div>
                                        <strong>{student.name}</strong>
                                        <small>{infoLine}</small>
                                    </div>
                                </div>
                                <div>
                                    {canEditInfo ? (
                                        <input
                                            className="inline-field"
                                            value={draft.school}
                                            onChange={event => setInfoDraft(student, "school", event.target.value)}
                                            placeholder="학교"
                                            disabled={acting}
                                        />
                                    ) : (
                                        <span className="info-empty">{student.school || "-"}</span>
                                    )}
                                </div>
                                <div>
                                    {canEditInfo ? (
                                        <input
                                            className="inline-field compact"
                                            value={draft.grade}
                                            onChange={event => setInfoDraft(student, "grade", event.target.value)}
                                            placeholder="학년"
                                            disabled={acting}
                                        />
                                    ) : (
                                        <span className="info-empty">{student.grade || "-"}</span>
                                    )}
                                </div>
                                <div>
                                    {student.accountLinked ? (
                                        <div className="login-pin-cell">
                                            <span className={student.loginPinIssued || student.loginPin ? "password-pill" : "password-pill missing"}>
                                                {student.loginPin
                                                    ? `비밀번호 ${student.loginPin}`
                                                    : student.loginPinIssued
                                                        ? "비밀번호 설정됨"
                                                        : "비밀번호 재설정 필요"}
                                            </span>
                                            {student.source === "student" && (
                                                <div className="pin-reset-row">
                                                    <input
                                                        className="pin-reset-input"
                                                        value={loginPinDrafts[student.id] || ""}
                                                        onChange={event => setLoginPinDraft(student, event.target.value)}
                                                        placeholder="4자리"
                                                        inputMode="numeric"
                                                        maxLength={4}
                                                        disabled={acting}
                                                    />
                                                    <button
                                                        className="pin-reset-button"
                                                        onClick={() => resetLoginPin(student)}
                                                        disabled={acting || !/^\d{4}$/.test(loginPinDrafts[student.id] || "")}
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="pill unlinked">미가입</span>
                                    )}
                                </div>
                                <div>
                                    <span className="status" style={{ background: colors.bg, color: colors.fg, borderColor: colors.bd }}>
                                        {STATUS_LABEL[student.status] || student.status}
                                    </span>
                                </div>
                                <div>
                                    <span>{formatDate(student.lastSignInAt)}</span>
                                    <small className="sub">가입 {formatDate(student.authCreatedAt || student.createdAt)}</small>
                                </div>
                                <div className="actions">
                                    {student.canChangeStatus && student.status === "deactivated" && (
                                        <button onClick={() => updateStatus(student, "approved")} disabled={acting}>활성화</button>
                                    )}
                                    {student.canChangeStatus && student.status !== "deactivated" && (
                                        <button onClick={() => updateStatus(student, "deactivated")} disabled={acting}>비활성화</button>
                                    )}
                                    <button
                                        className="danger"
                                        onClick={() => deleteAccount(student)}
                                        disabled={acting || !student.canDeleteAccount}
                                    >
                                        계정 해제
                                    </button>
                                    {canEditInfo && (
                                        <button
                                            className="save"
                                            onClick={() => saveStudentInfo(student)}
                                            disabled={acting || !dirtyInfo}
                                        >
                                            정보 저장
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </section>

            <style>{`
                .student-account-page {
                    min-height: 100vh;
                    background: #f4f6f9;
                    color: #111827;
                    font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
                }
                .page-head {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 24px;
                    margin-bottom: 20px;
                }
                .eyebrow {
                    color: #4b5563;
                    font-size: 12px;
                    font-weight: 900;
                    letter-spacing: 0;
                    margin-bottom: 8px;
                }
                h1 {
                    font-size: 30px;
                    line-height: 1.2;
                    letter-spacing: 0;
                    margin: 0 0 10px;
                    font-weight: 900;
                }
                p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.6;
                    font-weight: 600;
                }
                .ghost-btn, .actions button, .filters button {
                    border: 1px solid #d9e1ec;
                    background: #fff;
                    color: #1f2937;
                    border-radius: 7px;
                    min-height: 38px;
                    padding: 0 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-weight: 900;
                    cursor: pointer;
                    font-family: inherit;
                }
                button:disabled { cursor: not-allowed; opacity: 0.45; }
                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 10px;
                    margin-bottom: 14px;
                }
                .stat-card {
                    background: #fff;
                    border: 1px solid #d9e1ec;
                    border-radius: 8px;
                    padding: 15px 17px;
                }
                .stat-value { font-size: 28px; font-weight: 950; letter-spacing: 0; }
                .stat-label { font-size: 12px; color: #6b7280; font-weight: 850; margin-top: 5px; }
                .notice {
                    border-radius: 8px;
                    padding: 12px 14px;
                    margin: 0 0 14px;
                    font-weight: 850;
                    font-size: 13px;
                    border: 1px solid;
                }
                .notice.ok { background: #ecfdf5; border-color: #bbf7d0; color: #047857; }
                .notice.error { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
                .notice.info { background: #f8fafc; border-color: #d9e1ec; color: #475569; }
                .toolbar {
                    background: #fff;
                    border: 1px solid #d9e1ec;
                    border-radius: 8px;
                    padding: 12px;
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .filters { display: flex; gap: 8px; flex-wrap: wrap; }
                .filters button.active { background: #1f2937; border-color: #1f2937; color: #fff; }
                input {
                    width: min(320px, 100%);
                    min-height: 38px;
                    border: 1px solid #d9e1ec;
                    border-radius: 7px;
                    padding: 0 14px;
                    font-size: 14px;
                    font-weight: 800;
                    outline: none;
                    color: #0f172a;
                }
                .table-wrap {
                    background: #fff;
                    border: 1px solid #d9e1ec;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .table-head, .table-row {
                    display: grid;
                    grid-template-columns: minmax(180px, 1.3fr) minmax(130px, 0.8fr) minmax(82px, 0.55fr) minmax(132px, 0.9fr) minmax(100px, 0.65fr) minmax(120px, 0.8fr) minmax(210px, 1.2fr);
                    gap: 16px;
                    align-items: center;
                }
                .table-head {
                    padding: 14px 18px;
                    background: #f8fafc;
                    color: #4b5563;
                    font-size: 12px;
                    font-weight: 950;
                    border-bottom: 1px solid #e5edf6;
                }
                .table-row {
                    padding: 13px 18px;
                    border-bottom: 1px solid #edf1f6;
                }
                .table-row:last-child { border-bottom: none; }
                .table-row.recommend-delete { background: #fffafa; }
                .student-cell { display: flex; align-items: center; gap: 12px; min-width: 0; }
                .avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 7px;
                    background: #eef2f7;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: 900;
                    flex: 0 0 auto;
                }
                strong { display: block; font-size: 15px; font-weight: 950; margin-bottom: 3px; }
                small, .sub {
                    display: block;
                    color: #72819a;
                    font-size: 11px;
                    font-weight: 750;
                    margin-top: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .pill, .status {
                    display: inline-flex;
                    align-items: center;
                    min-height: 24px;
                    border-radius: 7px;
                    padding: 0 10px;
                    font-size: 12px;
                    font-weight: 950;
                    border: 1px solid;
                }
                .pill.linked { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
                .pill.unlinked { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }
                .login-pin-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    min-width: 0;
                }
                .password-pill {
                    width: fit-content;
                    display: inline-flex;
                    align-items: center;
                    min-height: 24px;
                    border-radius: 7px;
                    padding: 0 10px;
                    font-size: 12px;
                    font-weight: 950;
                    border: 1px solid #bfdbfe;
                    background: #eff6ff;
                    color: #1d4ed8;
                }
                .password-pill.missing {
                    border-color: #fed7aa;
                    background: #fff7ed;
                    color: #c2410c;
                }
                .pin-reset-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .pin-reset-input {
                    width: 70px;
                    min-height: 30px;
                    padding: 0 9px;
                    border: 1px solid #d9e1ec;
                    border-radius: 7px;
                    background: #fff;
                    font-size: 12px;
                    font-weight: 900;
                    letter-spacing: 0;
                }
                .pin-reset-button {
                    min-height: 30px;
                    border: 1px solid #d9e1ec;
                    border-radius: 7px;
                    background: #111827;
                    color: #fff;
                    padding: 0 9px;
                    font-size: 12px;
                    font-weight: 900;
                    cursor: pointer;
                    font-family: inherit;
                }
                .inline-field {
                    width: 100%;
                    min-width: 0;
                    min-height: 34px;
                    padding: 0 10px;
                    border: 1px solid #d9e1ec;
                    border-radius: 7px;
                    background: #fbfdff;
                    font-size: 12px;
                    font-weight: 850;
                }
                .inline-field.compact {
                    max-width: 98px;
                }
                .info-empty {
                    color: #94a3b8;
                    font-size: 12px;
                    font-weight: 850;
                }
                .actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
                .actions button { min-height: 34px; font-size: 12px; padding: 0 10px; }
                .actions .danger { color: #b91c1c; border-color: #fecaca; background: #fff7f7; }
                .actions .save { color: #065f46; border-color: #bbf7d0; background: #ecfdf5; }
                .empty { padding: 64px 20px; text-align: center; color: #7b8aa0; font-weight: 850; }
                @media (max-width: 1180px) {
                    .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .table-head { display: none; }
                    .table-row { grid-template-columns: 1fr; gap: 12px; }
                    .actions { justify-content: flex-start; }
                }
                @media (max-width: 767px) {
                    .page-head, .toolbar { flex-direction: column; }
                    .stat-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
