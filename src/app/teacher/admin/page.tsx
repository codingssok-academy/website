"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle, Database, Network, Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useAdmin } from "./context";

type ParentCodeRow = {
    id: string;
    studentId: string | null;
    authUserId: string | null;
    name: string;
    code: string;
    feedbackRows: number;
    issuedAt: string | null;
    grade: string;
    className: string;
    linked: boolean;
    source: "database" | "reference" | "inactive";
};

type FormState = {
    name: string;
    pin: string;
    className: string;
};

const EMPTY_FORM: FormState = { name: "", pin: "", className: "" };

export default function ParentCodeAdminPage() {
    const { students, loading: studentsLoading } = useAdmin();
    const [rows, setRows] = useState<ParentCodeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState("");
    const [search, setSearch] = useState("");
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [groupNames, setGroupNames] = useState("한보리\n한보윤");
    const [groupPin, setGroupPin] = useState("47864");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [canMutate, setCanMutate] = useState(true);

    const loadRows = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/teacher/parent-codes", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "목록을 불러오지 못했습니다.");
            setRows(data.rows || []);
            setCanMutate(data.canMutate !== false);
            if (data.warning) setNotice(data.warning);
        } catch (err) {
            setError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadRows();
    }, []);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(row =>
            row.name.toLowerCase().includes(q) ||
            row.code.includes(q) ||
            row.className.toLowerCase().includes(q),
        );
    }, [rows, search]);

    const stats = useMemo(() => {
        const active = rows.filter(row => row.code && row.source === "database").length;
        const reference = rows.filter(row => row.source === "reference").length;
        const inactive = rows.filter(row => row.source === "inactive").length;
        const siblings = rows.reduce<Record<string, number>>((acc, row) => {
            if (row.code) acc[row.code] = (acc[row.code] || 0) + 1;
            return acc;
        }, {});
        return {
            students: students.length || rows.length,
            active,
            reference,
            inactive,
            siblingGroups: Object.values(siblings).filter(count => count > 1).length,
        };
    }, [rows, students.length]);
    const hasReferenceOnlyCodes = stats.reference > 0;

    const requestJson = async (
        method: "POST" | "PATCH" | "DELETE",
        body: Record<string, unknown>,
        successText: string,
        actionKey: string,
    ) => {
        if (!canMutate) {
            setError("현재 로컬 기준표 모드라서 발급/재발급/삭제를 실행할 수 없습니다. SUPABASE_SERVICE_ROLE_KEY가 있는 환경에서 실행해주세요.");
            return false;
        }
        setSaving(actionKey);
        setError("");
        setNotice("");
        try {
            const res = await fetch("/api/teacher/parent-codes", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "처리하지 못했습니다.");
            setRows(data.rows || []);
            setCanMutate(data.canMutate !== false);
            setNotice(successText);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "처리하지 못했습니다.");
            return false;
        } finally {
            setSaving("");
        }
    };

    const issueCode = async () => {
        const name = form.name.trim().replace(/\s+/g, "");
        if (name.length < 2) {
            setError("학생 이름을 입력해주세요.");
            return;
        }
        const ok = await requestJson(
            "POST",
            { name, pin: form.pin, className: form.className },
            `${name} 학부모 인증번호를 발급했습니다.`,
            "issue",
        );
        if (ok) setForm(EMPTY_FORM);
    };

    const reissueCode = (row: ParentCodeRow) =>
        requestJson("PATCH", { name: row.name }, `${row.name} 인증번호를 새로 발급했습니다.`, `reissue-${row.name}`);

    const deleteCode = async (row: ParentCodeRow) => {
        if (!window.confirm(`${row.name} 학부모 인증번호를 삭제할까요? 삭제하면 앱 로그인도 막힙니다.`)) return;
        await requestJson("DELETE", { name: row.name }, `${row.name} 인증번호를 삭제했습니다.`, `delete-${row.name}`);
    };

    const seedBaseline = async () => {
        if (!window.confirm("기준표에 있는 학생 38명의 인증번호를 DB에 활성화할까요?")) return;
        await requestJson("POST", { action: "seedBaseline" }, "기준표 인증번호를 DB에 활성화했습니다.", "seed");
    };

    const saveSiblingGroup = async () => {
        const names = groupNames
            .split(/[,\n]/)
            .map(name => name.trim().replace(/\s+/g, ""))
            .filter(Boolean);
        if (names.length < 2) {
            setError("형제/자매로 묶을 학생 이름을 2명 이상 입력해주세요.");
            return;
        }
        await requestJson(
            "PATCH",
            { action: "group", names, pin: groupPin },
            `${names.join(", ")} 학생을 같은 학부모 인증번호로 묶었습니다.`,
            "group",
        );
    };

    const copyGuide = async (row: ParentCodeRow) => {
        const text = [
            "[코딩쏙 학부모 포털 안내]",
            "",
            `학생 이름: ${row.name}`,
            `학부모 인증번호: ${row.code || "관리자에게 문의"}`,
            "접속 주소: https://www.codingssok.com/parent/feedback",
            "",
            "앱 또는 홈페이지에서 학생 이름과 인증번호를 입력하면 수업 피드백과 학습 현황을 확인할 수 있습니다.",
        ].join("\n");

        try {
            await navigator.clipboard.writeText(text);
            setNotice(`${row.name} 안내문을 복사했습니다.`);
        } catch {
            setError("클립보드 복사에 실패했습니다.");
        }
    };

    return (
        <div className="code-admin">
            <div className="page-head">
                <div>
                    <div className="eyebrow">Parent Access Console</div>
                    <h1>학부모 코드 관리</h1>
                    <p>학생별 인증번호를 발급하고, 형제/자매는 같은 번호로 묶어서 학부모 포털 접근을 관리합니다.</p>
                </div>
                <button className="ghost-btn" onClick={loadRows} disabled={loading}>
                    <RefreshCw size={16} strokeWidth={2.4} />
                    새로고침
                </button>
            </div>

            <section className="stat-grid">
                <StatCard icon={Users} label="학생 목록" value={studentsLoading && rows.length === 0 ? "-" : String(stats.students)} />
                <StatCard icon={ShieldCheck} label="활성 인증번호" value={String(stats.active)} />
                <StatCard icon={Database} label="기준표/미발급" value={String(stats.reference + stats.inactive)} />
                <StatCard icon={Network} label="형제/자매 묶음" value={String(stats.siblingGroups)} />
            </section>

            {(error || notice) && (
                <div className={error ? "alert error" : "alert ok"}>
                    {error ? <AlertCircle size={17} strokeWidth={2.5} /> : <CheckCircle size={17} strokeWidth={2.5} />}
                    {error || notice}
                </div>
            )}

            {hasReferenceOnlyCodes && canMutate && (
                <div className="alert warn">
                    <AlertCircle size={17} strokeWidth={2.5} />
                    기준표 상태의 코드는 아직 앱 인증에 적용된 코드가 아닙니다. 학부모에게 안내하기 전에 기준표 전체 활성화 또는 개별 재발급을 먼저 실행해주세요.
                </div>
            )}

            <section className="work-grid">
                <div className="panel">
                    <div className="panel-title">
                        <Plus size={19} strokeWidth={2.6} />
                        새 학생 코드 발급
                    </div>
                    <div className="form-row">
                        <input
                            value={form.name}
                            onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                            placeholder="학생 이름"
                        />
                        <input
                            value={form.pin}
                            onChange={event => setForm(prev => ({ ...prev, pin: event.target.value.replace(/\D/g, "").slice(0, 5) }))}
                            placeholder="5자리 번호 비우면 자동"
                            inputMode="numeric"
                            maxLength={5}
                        />
                        <input
                            value={form.className}
                            onChange={event => setForm(prev => ({ ...prev, className: event.target.value }))}
                            placeholder="반/메모"
                        />
                        <button className="primary-btn" onClick={issueCode} disabled={!canMutate || saving === "issue"}>
                            <Plus size={16} strokeWidth={2.6} />
                            {saving === "issue" ? "발급 중" : "코드 발급"}
                        </button>
                    </div>
                    <p className="hint">
                        {canMutate
                            ? "이미 있는 학생 이름을 입력하면 같은 학생에게 새 인증번호로 재발급됩니다."
                            : "현재는 로컬 기준표 모드입니다. 실제 코드 발급은 서비스 키가 있는 환경에서 가능합니다."}
                    </p>
                </div>

                <div className="panel">
                    <div className="panel-title">
                        <Network size={19} strokeWidth={2.6} />
                        형제/자매 묶기
                    </div>
                    <div className="group-form">
                        <textarea
                            value={groupNames}
                            onChange={event => setGroupNames(event.target.value)}
                            placeholder="학생 이름을 줄바꿈 또는 쉼표로 입력"
                        />
                        <div className="group-side">
                            <input
                                value={groupPin}
                                onChange={event => setGroupPin(event.target.value.replace(/\D/g, "").slice(0, 5))}
                                placeholder="공통 번호"
                                inputMode="numeric"
                                maxLength={5}
                            />
                            <button className="dark-btn" onClick={saveSiblingGroup} disabled={!canMutate || saving === "group"}>
                                같은 번호로 묶기
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="table-panel">
                <div className="table-toolbar">
                    <div>
                        <h2>학부모 인증번호 목록</h2>
                        <p>피드백 row 수 합계 {rows.reduce((sum, row) => sum + (row.feedbackRows || 0), 0)}</p>
                    </div>
                    <div className="toolbar-actions">
                        <button className="outline-btn" onClick={seedBaseline} disabled={!canMutate || saving === "seed"}>
                            <Database size={16} strokeWidth={2.4} />
                            기준표 전체 활성화
                        </button>
                        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="학생 검색" />
                    </div>
                </div>

                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>번호</th>
                                <th>학생 이름</th>
                                <th>학부모 인증번호</th>
                                <th>피드백 row 수</th>
                                <th>상태</th>
                                <th>발급일</th>
                                <th>안내문</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="empty">목록을 불러오는 중입니다.</td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="empty">표시할 학생이 없습니다.</td>
                                </tr>
                            ) : (
                                filteredRows.map((row, index) => (
                                    <tr key={row.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="student-cell">
                                                <strong>{row.name}</strong>
                                                <span>{row.className || (row.linked ? "계정 연동" : "계정 미연동")}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="pin">{row.code || "미발급"}</span>
                                        </td>
                                        <td>{row.feedbackRows}</td>
                                        <td>
                                            <span className={`badge ${row.source === "database" ? "active" : row.source === "reference" ? "ref" : "inactive"}`}>
                                                {row.source === "database" ? "활성" : row.source === "reference" ? "기준표 · 활성화 필요" : "미발급"}
                                            </span>
                                        </td>
                                        <td>{formatDate(row.issuedAt)}</td>
                                        <td>
                                            <button className="mini-btn" onClick={() => copyGuide(row)} disabled={!row.code || row.source !== "database"}>
                                                복사
                                            </button>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <button className="mini-btn" onClick={() => reissueCode(row)} disabled={!canMutate || saving === `reissue-${row.name}`}>
                                                    재발급
                                                </button>
                                                <button className="danger-btn" onClick={() => deleteCode(row)} disabled={!canMutate || saving === `delete-${row.name}`}>
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <style>{styles}</style>
        </div>
    );
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="stat-card">
            <span className="stat-icon">
                <Icon size={21} strokeWidth={2.4} />
            </span>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}

function formatDate(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" });
}

const styles = `
.code-admin {
    min-height: 100vh;
    color: #0f172a;
    background: #f5f8fc;
    font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
}
.page-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 22px;
}
.eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.16em;
    color: #2563eb;
    text-transform: uppercase;
    margin-bottom: 8px;
}
h1 {
    margin: 0;
    font-size: 34px;
    line-height: 1.15;
    font-weight: 950;
    letter-spacing: 0;
}
.page-head p {
    margin: 10px 0 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.7;
}
.stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}
.stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 86px;
    padding: 16px;
    border: 1px solid #dce6f2;
    background: #ffffff;
    border-radius: 8px;
}
.stat-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: #2563eb;
    background: #eff6ff;
}
.stat-value {
    font-size: 25px;
    line-height: 1;
    font-weight: 950;
}
.stat-label {
    margin-top: 6px;
    font-size: 12px;
    font-weight: 800;
    color: #64748b;
}
.alert {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 16px;
}
.alert.error {
    border: 1px solid #fecaca;
    background: #fff1f2;
    color: #dc2626;
}
.alert.ok {
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    color: #15803d;
}
.alert.warn {
    border: 1px solid #fed7aa;
    background: #fff7ed;
    color: #c2410c;
}
.work-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
    gap: 14px;
    margin-bottom: 16px;
}
.panel, .table-panel {
    border: 1px solid #dce6f2;
    background: #ffffff;
    border-radius: 8px;
    padding: 16px;
}
.panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #0f172a;
    font-size: 15px;
    font-weight: 950;
    margin-bottom: 14px;
}
.panel-title svg {
    color: #2563eb;
    flex-shrink: 0;
}
.form-row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr auto;
    gap: 8px;
}
input, textarea {
    width: 100%;
    border: 1px solid #d6e0ec;
    background: #fbfdff;
    color: #0f172a;
    border-radius: 8px;
    min-height: 42px;
    padding: 0 12px;
    outline: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    box-sizing: border-box;
}
textarea {
    min-height: 92px;
    padding: 11px 12px;
    resize: vertical;
    line-height: 1.55;
}
input:focus, textarea:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.hint {
    margin: 10px 0 0;
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.6;
}
button {
    font-family: inherit;
}
.primary-btn, .dark-btn, .ghost-btn, .outline-btn, .mini-btn, .danger-btn {
    border: none;
    border-radius: 8px;
    font-weight: 900;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
}
.primary-btn {
    min-height: 42px;
    padding: 0 16px;
    color: #ffffff;
    background: #2563eb;
}
.dark-btn {
    min-height: 42px;
    padding: 0 14px;
    color: #ffffff;
    background: #111827;
    font-size: 12px;
}
.ghost-btn, .outline-btn {
    min-height: 40px;
    padding: 0 13px;
    color: #1e3a8a;
    background: #ffffff;
    border: 1px solid #cfe0f5;
}
.mini-btn {
    min-height: 32px;
    padding: 0 10px;
    color: #1d4ed8;
    background: #eff6ff;
}
.danger-btn {
    min-height: 32px;
    padding: 0 10px;
    color: #dc2626;
    background: #fff1f2;
}
button:disabled {
    opacity: 0.55;
    cursor: default;
}
.group-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 158px;
    gap: 8px;
}
.group-side {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.table-toolbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
}
.table-toolbar h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 950;
}
.table-toolbar p {
    margin: 6px 0 0;
    font-size: 12px;
    color: #64748b;
    font-weight: 700;
}
.toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}
.toolbar-actions input {
    width: 210px;
}
.table-wrap {
    overflow: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
table {
    width: 100%;
    min-width: 920px;
    border-collapse: collapse;
    background: #ffffff;
}
th {
    background: #f8fafc;
    color: #475569;
    font-size: 12px;
    font-weight: 950;
    text-align: left;
    padding: 11px 12px;
    border-bottom: 1px solid #e2e8f0;
}
td {
    padding: 11px 12px;
    border-bottom: 1px solid #eef2f7;
    font-size: 13px;
    font-weight: 700;
    color: #1f2937;
}
tr:last-child td {
    border-bottom: none;
}
.student-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.student-cell strong {
    font-size: 14px;
    color: #0f172a;
}
.student-cell span {
    font-size: 11px;
    color: #94a3b8;
}
.pin {
    font-family: 'JetBrains Mono', Consolas, monospace;
    letter-spacing: 0.08em;
    font-size: 15px;
    font-weight: 950;
    color: #0f172a;
}
.badge {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 950;
}
.badge.active {
    background: #dcfce7;
    color: #15803d;
}
.badge.ref {
    background: #f1f5f9;
    color: #64748b;
}
.badge.inactive {
    background: #fff7ed;
    color: #c2410c;
}
.row-actions {
    display: flex;
    gap: 6px;
}
.empty {
    height: 110px;
    text-align: center;
    color: #94a3b8;
}
@media (max-width: 1100px) {
    .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .work-grid { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
    .code-admin { padding-top: 2px; }
    .page-head { flex-direction: column; }
    h1 { font-size: 28px; }
    .stat-grid { grid-template-columns: 1fr; }
    .form-row { grid-template-columns: 1fr; }
    .group-form { grid-template-columns: 1fr; }
    .table-toolbar { align-items: stretch; flex-direction: column; }
    .toolbar-actions { flex-direction: column; align-items: stretch; }
    .toolbar-actions input { width: 100%; }
}
`;
