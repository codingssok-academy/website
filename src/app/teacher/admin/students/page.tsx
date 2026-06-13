"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldCheck, Trash2, UserCheck, UserMinus, Users } from "lucide-react";

type StudentAccount = {
    id: string;
    name: string;
    grade: string | null;
    className: string | null;
    status: string;
    pinIssued: boolean;
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
};

type Stats = {
    total: number;
    linked: number;
    unlinked: number;
    approved: number;
    deactivated: number;
    pending: number;
};

type ApiResponse = {
    success: boolean;
    students?: StudentAccount[];
    stats?: Stats;
    error?: string;
};

const FILTERS = [
    { key: "all", label: "전체" },
    { key: "linked", label: "회원가입 완료" },
    { key: "unlinked", label: "미가입" },
    { key: "approved", label: "활성" },
    { key: "deactivated", label: "비활성" },
] as const;

const STATUS_LABEL: Record<string, string> = {
    pending: "대기",
    approved: "활성",
    deactivated: "비활성",
    rejected: "거절",
};

function formatDate(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function statusColor(status: string) {
    if (status === "approved") return { bg: "#ecfdf5", fg: "#047857", bd: "#bbf7d0" };
    if (status === "deactivated") return { bg: "#fef2f2", fg: "#b91c1c", bd: "#fecaca" };
    if (status === "pending") return { bg: "#fffbeb", fg: "#b45309", bd: "#fde68a" };
    return { bg: "#f8fafc", fg: "#475569", bd: "#e2e8f0" };
}

export default function StudentAccountsPage() {
    const [students, setStudents] = useState<StudentAccount[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, linked: 0, unlinked: 0, approved: 0, deactivated: 0, pending: 0 });
    const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-accounts", { cache: "no-store" });
            const data = (await res.json()) as ApiResponse;
            if (!res.ok || !data.success) throw new Error(data.error || "학생 계정 목록을 불러오지 못했습니다.");
            setStudents(data.students || []);
            setStats(data.stats || { total: 0, linked: 0, unlinked: 0, approved: 0, deactivated: 0, pending: 0 });
        } catch (error) {
            setStudents([]);
            setMessage({ type: "error", text: error instanceof Error ? error.message : "목록 조회 실패" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const filtered = useMemo(() => {
        const normalizedQuery = query.trim().replace(/\s+/g, "");
        return students.filter(student => {
            if (filter === "linked" && !student.accountLinked) return false;
            if (filter === "unlinked" && student.accountLinked) return false;
            if (filter === "approved" && student.status !== "approved") return false;
            if (filter === "deactivated" && student.status !== "deactivated") return false;
            if (normalizedQuery && !student.name.includes(normalizedQuery)) return false;
            return true;
        });
    }, [filter, query, students]);

    const updateStatus = async (student: StudentAccount, status: string) => {
        setActingId(student.id);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-accounts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: student.id, status }),
            });
            const data = (await res.json()) as ApiResponse;
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

    const deleteAccount = async (student: StudentAccount) => {
        if (!student.accountLinked) return;
        const ok = window.confirm(
            `${student.name} 학생의 회원가입 계정을 삭제합니다.\n\n학생 목록과 학부모 인증번호는 유지되고, 이 학생은 다시 회원가입해야 로그인할 수 있습니다.`,
        );
        if (!ok) return;

        setActingId(student.id);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/student-accounts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: student.id }),
            });
            const data = (await res.json()) as ApiResponse;
            if (!res.ok || !data.success) throw new Error(data.error || "계정 삭제 실패");
            setStudents(data.students || []);
            if (data.stats) setStats(data.stats);
            setMessage({ type: "ok", text: `${student.name} 회원가입 계정을 삭제했습니다. 학부모 인증번호로 다시 가입할 수 있습니다.` });
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
                    <div className="eyebrow">Student Account Control</div>
                    <h1>학생 회원가입 계정 관리</h1>
                    <p>학부모 인증번호는 유지하면서 학생 로그인 계정만 해제하거나, 학생 상태를 관리합니다.</p>
                </div>
                <button className="ghost-btn" onClick={() => void load()} disabled={loading}>
                    <RefreshCw size={16} strokeWidth={2.4} />
                    새로고침
                </button>
            </header>

            <section className="stat-grid">
                <Stat icon={<Users size={24} />} label="학생 목록" value={stats.total} />
                <Stat icon={<UserCheck size={24} />} label="회원가입 완료" value={stats.linked} />
                <Stat icon={<UserMinus size={24} />} label="미가입" value={stats.unlinked} />
                <Stat icon={<ShieldCheck size={24} />} label="활성 학생" value={stats.approved} />
            </section>

            {message && (
                <div className={`notice ${message.type}`}>
                    {message.text}
                </div>
            )}

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
                    placeholder="학생 이름 검색"
                />
            </section>

            <section className="table-wrap">
                <div className="table-head">
                    <span>학생</span>
                    <span>가입 상태</span>
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
                        return (
                            <div className="table-row" key={student.id} style={{ opacity: acting ? 0.55 : 1 }}>
                                <div className="student-cell">
                                    <div className="avatar">{student.name.slice(0, 1)}</div>
                                    <div>
                                        <strong>{student.name}</strong>
                                        <small>{student.className || "반 미지정"} · 인증번호 {student.pinIssued ? "발급됨" : "없음"}</small>
                                    </div>
                                </div>
                                <div>
                                    <span className={student.accountLinked ? "pill linked" : "pill unlinked"}>
                                        {student.accountLinked ? "회원가입 완료" : "미가입"}
                                    </span>
                                    {student.email && <small className="sub">{student.email}</small>}
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
                                    {student.status === "deactivated" ? (
                                        <button onClick={() => updateStatus(student, "approved")} disabled={acting}>
                                            활성화
                                        </button>
                                    ) : (
                                        <button onClick={() => updateStatus(student, "deactivated")} disabled={acting}>
                                            비활성화
                                        </button>
                                    )}
                                    <button
                                        className="danger"
                                        onClick={() => deleteAccount(student)}
                                        disabled={acting || !student.canDeleteAccount}
                                        title={student.canDeleteAccount ? "회원가입/Auth 계정 삭제" : "삭제할 가입 계정이 없거나 보호 계정입니다."}
                                    >
                                        <Trash2 size={15} />
                                        계정 삭제
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </section>

            <style>{`
                .student-account-page {
                    padding: 48px 52px;
                    min-height: 100vh;
                    background: #f6f9fe;
                    color: #0f172a;
                }
                .page-head {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 24px;
                    margin-bottom: 24px;
                }
                .eyebrow {
                    color: #2563eb;
                    font-size: 13px;
                    font-weight: 900;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                h1 {
                    font-size: clamp(34px, 4vw, 54px);
                    line-height: 1.04;
                    letter-spacing: -0.04em;
                    margin: 0 0 14px;
                    font-weight: 950;
                }
                p {
                    margin: 0;
                    color: #52627a;
                    font-size: 16px;
                    line-height: 1.65;
                    font-weight: 650;
                }
                .ghost-btn, .actions button, .filters button {
                    border: 1px solid #d7e2f2;
                    background: #fff;
                    color: #223047;
                    border-radius: 12px;
                    min-height: 42px;
                    padding: 0 14px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-weight: 900;
                    cursor: pointer;
                    font-family: inherit;
                }
                button:disabled {
                    cursor: not-allowed;
                    opacity: 0.45;
                }
                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 14px;
                    margin-bottom: 20px;
                }
                .stat-card {
                    background: #fff;
                    border: 1px solid #d7e2f2;
                    border-radius: 14px;
                    padding: 22px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .stat-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    background: #eef5ff;
                    color: #2563eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-value {
                    font-size: 32px;
                    font-weight: 950;
                    letter-spacing: -0.04em;
                }
                .stat-label {
                    font-size: 13px;
                    color: #52627a;
                    font-weight: 850;
                    margin-top: 3px;
                }
                .notice {
                    border-radius: 12px;
                    padding: 14px 16px;
                    margin: 0 0 18px;
                    font-weight: 850;
                    border: 1px solid;
                }
                .notice.ok {
                    background: #ecfdf5;
                    border-color: #bbf7d0;
                    color: #047857;
                }
                .notice.error {
                    background: #fef2f2;
                    border-color: #fecaca;
                    color: #b91c1c;
                }
                .toolbar {
                    background: #fff;
                    border: 1px solid #d7e2f2;
                    border-radius: 14px;
                    padding: 14px;
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .filters {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .filters button.active {
                    background: #2563eb;
                    border-color: #2563eb;
                    color: #fff;
                }
                input {
                    width: min(320px, 100%);
                    min-height: 42px;
                    border: 1px solid #d7e2f2;
                    border-radius: 12px;
                    padding: 0 14px;
                    font-size: 14px;
                    font-weight: 800;
                    outline: none;
                    color: #0f172a;
                }
                .table-wrap {
                    background: #fff;
                    border: 1px solid #d7e2f2;
                    border-radius: 16px;
                    overflow: hidden;
                }
                .table-head, .table-row {
                    display: grid;
                    grid-template-columns: 1.4fr 1.1fr 0.8fr 0.9fr 1.1fr;
                    gap: 16px;
                    align-items: center;
                }
                .table-head {
                    padding: 14px 20px;
                    background: #f8fbff;
                    color: #52627a;
                    font-size: 12px;
                    font-weight: 950;
                    border-bottom: 1px solid #e4edf8;
                }
                .table-row {
                    padding: 16px 20px;
                    border-bottom: 1px solid #eef3f9;
                }
                .table-row:last-child {
                    border-bottom: none;
                }
                .student-cell {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }
                .avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #2563eb, #0ea5e9);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: 950;
                    flex: 0 0 auto;
                }
                strong {
                    display: block;
                    font-size: 15px;
                    font-weight: 950;
                    margin-bottom: 3px;
                }
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
                    min-height: 26px;
                    border-radius: 999px;
                    padding: 0 10px;
                    font-size: 12px;
                    font-weight: 950;
                    border: 1px solid;
                }
                .pill.linked {
                    background: #eff6ff;
                    color: #1d4ed8;
                    border-color: #bfdbfe;
                }
                .pill.unlinked {
                    background: #f8fafc;
                    color: #64748b;
                    border-color: #e2e8f0;
                }
                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .actions button {
                    min-height: 36px;
                    border-radius: 10px;
                    font-size: 12px;
                    padding: 0 12px;
                }
                .actions .danger {
                    color: #b91c1c;
                    border-color: #fecaca;
                    background: #fff7f7;
                }
                .empty {
                    padding: 64px 20px;
                    text-align: center;
                    color: #7b8aa0;
                    font-weight: 850;
                }
                @media (max-width: 1180px) {
                    .student-account-page {
                        padding: 36px 24px;
                    }
                    .stat-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    .table-head {
                        display: none;
                    }
                    .table-row {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    .actions {
                        justify-content: flex-start;
                    }
                }
                @media (max-width: 767px) {
                    .student-account-page {
                        padding: 76px 16px 24px;
                    }
                    .page-head, .toolbar {
                        flex-direction: column;
                    }
                    .stat-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="stat-card">
            <div className="stat-icon">{icon}</div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}
