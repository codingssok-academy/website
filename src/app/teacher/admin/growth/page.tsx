"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    AlertTriangle,
    ClipboardCopy,
    Download,
    Eye,
    FileText,
    MessageSquareText,
    Pencil,
    RefreshCw,
    Save,
    Search,
    Target,
    ThumbsUp,
    Trash2,
    Users,
} from "lucide-react";

type StudentOption = {
    id: string;
    name: string;
    grade: string | null;
    class: string | null;
    status: string | null;
};

type GrowthRecord = {
    id: string;
    student_id: string;
    student_name: string;
    current_class: string | null;
    temperament: string | null;
    skill_level: string | null;
    strengths: string | null;
    weaknesses: string | null;
    current_goal: string | null;
    next_class_potential: string | null;
    class_progress: string | null;
    parent_feedback_draft: string | null;
    teacher_memo: string | null;
    updated_at: string | null;
};

type GrowthEntry = GrowthRecord & {
    entry_note: string | null;
    created_at: string | null;
};

type ApiResponse = {
    success: boolean;
    migrationRequired?: boolean;
    students?: StudentOption[];
    records?: GrowthRecord[];
    entries?: GrowthEntry[];
    record?: GrowthRecord;
    entry?: GrowthEntry;
    error?: string;
};

type FormState = {
    studentId: string;
    studentName: string;
    currentClass: string;
    temperament: string;
    skillLevel: string;
    strengths: string;
    weaknesses: string;
    currentGoal: string;
    nextClassPotential: string;
    classProgress: string;
    parentFeedbackDraft: string;
    teacherMemo: string;
    entryNote: string;
};

const EMPTY_FORM: FormState = {
    studentId: "",
    studentName: "",
    currentClass: "",
    temperament: "",
    skillLevel: "",
    strengths: "",
    weaknesses: "",
    currentGoal: "",
    nextClassPotential: "",
    classProgress: "",
    parentFeedbackDraft: "",
    teacherMemo: "",
    entryNote: "",
};

const TRACKS = ["전체 반", "공통기초반", "흥미반", "만들기반", "프로젝트반", "대회반"];
const STATUS_FILTERS = ["전체", "미작성", "초안", "피드백 준비", "주의 필요", "반 이동 후보"];
const LEVELS = ["입문", "1단계", "2단계", "3단계", "4단계", "5단계"];
const MOVE_OPTIONS = ["-", "관찰 필요", "이동 가능", "보강 후 이동", "상담 필요"];
const TABS = ["전체 매트릭스", "상태 보드", "학생 타임라인"] as const;

function toForm(record: GrowthRecord, fallback?: StudentOption): FormState {
    return {
        studentId: record.student_id,
        studentName: record.student_name || fallback?.name || "",
        currentClass: record.current_class || fallback?.class || "",
        temperament: record.temperament || "",
        skillLevel: record.skill_level || "",
        strengths: record.strengths || "",
        weaknesses: record.weaknesses || "",
        currentGoal: record.current_goal || "",
        nextClassPotential: record.next_class_potential || "",
        classProgress: record.class_progress || "",
        parentFeedbackDraft: record.parent_feedback_draft || "",
        teacherMemo: record.teacher_memo || "",
        entryNote: "",
    };
}

function newForm(student: StudentOption): FormState {
    return {
        ...EMPTY_FORM,
        studentId: student.id,
        studentName: student.name,
        currentClass: student.class || "",
    };
}

function formatDate(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function compactText(value: string | null | undefined, limit = 52) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit)}...` : text || "-";
}

function filledCount(record: GrowthRecord | FormState | undefined) {
    if (!record) return 0;
    const values = [
        "studentName" in record ? record.studentName : record.student_name,
        "currentClass" in record ? record.currentClass : record.current_class,
        record.temperament,
        "skillLevel" in record ? record.skillLevel : record.skill_level,
        record.strengths,
        record.weaknesses,
        "currentGoal" in record ? record.currentGoal : record.current_goal,
        "nextClassPotential" in record ? record.nextClassPotential : record.next_class_potential,
        "parentFeedbackDraft" in record ? record.parentFeedbackDraft : record.parent_feedback_draft,
    ];
    return values.filter(value => String(value || "").trim()).length;
}

function statusOf(record?: GrowthRecord) {
    if (!record) return "미작성";
    const merged = `${record.temperament || ""} ${record.weaknesses || ""} ${record.next_class_potential || ""}`;
    if (record.next_class_potential?.includes("이동 가능")) return "반 이동 후보";
    if (/주의|ADHD|흥미저하|번아웃|상담/.test(merged)) return "주의 필요";
    if (record.parent_feedback_draft) return "피드백 준비";
    if (filledCount(record) >= 5) return "초안";
    return "미작성";
}

function badgeColor(status: string) {
    if (status === "피드백 준비") return ["#f3e8ff", "#7e22ce"];
    if (status === "주의 필요") return ["#fee2e2", "#dc2626"];
    if (status === "반 이동 후보") return ["#dbeafe", "#2563eb"];
    if (status === "초안") return ["#fef3c7", "#d97706"];
    return ["#e2e8f0", "#475569"];
}

function buildParentCopy(form: FormState) {
    return [
        `[코딩쏙] ${form.studentName || "학생"} 성장 피드백 초안`,
        "",
        `현재 반: ${form.currentClass || "-"}`,
        `실력 단계: ${form.skillLevel || "-"}`,
        `현재 목표: ${form.currentGoal || "-"}`,
        "",
        `잘하는 점: ${form.strengths || "-"}`,
        `보완할 점: ${form.weaknesses || "-"}`,
        `다음 반 이동 가능성: ${form.nextClassPotential || "-"}`,
        "",
        form.parentFeedbackDraft || "학부모 전달사항을 입력해주세요.",
    ].join("\n");
}

export default function GrowthManagementPage() {
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [records, setRecords] = useState<GrowthRecord[]>([]);
    const [entries, setEntries] = useState<GrowthEntry[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [query, setQuery] = useState("");
    const [track, setTrack] = useState("전체 반");
    const [statusFilter, setStatusFilter] = useState("전체");
    const [activeTab, setActiveTab] = useState<typeof TABS[number]>("전체 매트릭스");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [migrationRequired, setMigrationRequired] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

    const recordByStudent = useMemo(() => new Map(records.map(record => [record.student_id, record])), [records]);
    const entriesByStudent = useMemo(() => {
        const map = new Map<string, GrowthEntry[]>();
        for (const entry of entries) {
            const list = map.get(entry.student_id) || [];
            list.push(entry);
            map.set(entry.student_id, list);
        }
        return map;
    }, [entries]);

    const selectedStudent = useMemo(() => students.find(student => student.id === selectedId), [selectedId, students]);
    const selectedRecord = selectedId ? recordByStudent.get(selectedId) : undefined;
    const selectedEntries = selectedId ? entriesByStudent.get(selectedId) || [] : [];

    const filteredStudents = useMemo(() => {
        const normalizedQuery = query.trim().replace(/\s+/g, "");
        return students.filter(student => {
            const record = recordByStudent.get(student.id);
            const rowStatus = statusOf(record);
            const className = record?.current_class || student.class || "";
            const queryMatch = !normalizedQuery
                || student.name.replace(/\s+/g, "").includes(normalizedQuery)
                || className.replace(/\s+/g, "").includes(normalizedQuery);
            const trackMatch = track === "전체 반" || className === track;
            const statusMatch = statusFilter === "전체" || rowStatus === statusFilter;
            return queryMatch && trackMatch && statusMatch;
        });
    }, [query, recordByStudent, statusFilter, students, track]);

    const stats = useMemo(() => {
        const written = students.filter(student => recordByStudent.has(student.id)).length;
        const statuses = students.map(student => statusOf(recordByStudent.get(student.id)));
        return {
            total: students.length,
            written,
            draft: statuses.filter(status => status === "초안").length,
            feedbackReady: statuses.filter(status => status === "피드백 준비").length,
            moveCandidates: statuses.filter(status => status === "반 이동 후보").length,
            needsCare: statuses.filter(status => status === "주의 필요").length,
            percent: students.length ? Math.round((written / students.length) * 100) : 0,
        };
    }, [recordByStudent, students]);

    const completion = useMemo(() => Math.round((filledCount(form) / 9) * 100), [form]);

    const selectStudent = useCallback((studentId: string, sourceStudents = students, sourceRecords = records) => {
        const student = sourceStudents.find(item => item.id === studentId);
        const record = sourceRecords.find(item => item.student_id === studentId);
        setSelectedId(studentId);
        if (record) setForm(toForm(record, student));
        else if (student) setForm(newForm(student));
    }, [records, students]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/teacher/growth-management", { cache: "no-store" });
            const data = await response.json() as ApiResponse;
            if (!response.ok || !data.success) throw new Error(data.error || "성장관리표를 불러오지 못했습니다.");

            const nextStudents = data.students || [];
            const nextRecords = data.records || [];
            setStudents(nextStudents);
            setRecords(nextRecords);
            setEntries(data.entries || []);
            setMigrationRequired(Boolean(data.migrationRequired));

            const nextSelected = selectedId && nextStudents.some(student => student.id === selectedId)
                ? selectedId
                : nextStudents[0]?.id || "";
            if (nextSelected) selectStudent(nextSelected, nextStudents, nextRecords);
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "성장관리표를 불러오지 못했습니다." });
        } finally {
            setLoading(false);
        }
    }, [selectStudent, selectedId]);

    useEffect(() => {
        void load();
    }, [load]);

    const updateForm = (key: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const save = async () => {
        if (!form.studentId) {
            setMessage({ type: "error", text: "학생을 먼저 선택해주세요." });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch("/api/teacher/growth-management", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await response.json() as ApiResponse;
            if (!response.ok || !data.success || !data.record) throw new Error(data.error || "저장에 실패했습니다.");

            setRecords(prev => {
                const rest = prev.filter(record => record.student_id !== data.record!.student_id);
                return [data.record!, ...rest];
            });
            if (data.entry) setEntries(prev => [data.entry!, ...prev]);
            setForm(prev => ({ ...prev, entryNote: "" }));
            setMessage({ type: "ok", text: "성장 기록을 저장했습니다. 누적 히스토리에도 1건 추가되었습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "저장에 실패했습니다." });
        } finally {
            setSaving(false);
        }
    };

    const removeRecord = async () => {
        if (!form.studentId) return;
        if (!window.confirm(`${form.studentName || "선택한 학생"}의 성장 기록을 삭제할까요?`)) return;

        try {
            const response = await fetch("/api/teacher/growth-management", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: form.studentId }),
            });
            const data = await response.json() as ApiResponse;
            if (!response.ok || !data.success) throw new Error(data.error || "삭제에 실패했습니다.");

            setRecords(prev => prev.filter(record => record.student_id !== form.studentId));
            setEntries(prev => prev.filter(entry => entry.student_id !== form.studentId));
            const student = students.find(item => item.id === form.studentId);
            if (student) setForm(newForm(student));
            setMessage({ type: "ok", text: "성장 기록을 삭제했습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "삭제에 실패했습니다." });
        }
    };

    const exportCsv = () => {
        const header = ["학생", "현재 반", "작성 상태", "실력 단계", "반 이동", "현재 목표", "잘하는 점", "부족한 점", "학부모 피드백", "최근 수정"];
        const rows = filteredStudents.map(student => {
            const record = recordByStudent.get(student.id);
            return [
                student.name,
                record?.current_class || student.class || "",
                statusOf(record),
                record?.skill_level || "",
                record?.next_class_potential || "",
                record?.current_goal || "",
                record?.strengths || "",
                record?.weaknesses || "",
                record?.parent_feedback_draft || "",
                record?.updated_at || "",
            ];
        });
        const csv = [header, ...rows]
            .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `codingssok-growth-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const copyFeedback = async () => {
        await navigator.clipboard.writeText(buildParentCopy(form));
        setMessage({ type: "ok", text: "학부모 전달용 피드백을 복사했습니다." });
    };

    return (
        <div className="growth-page">
            <section className="growth-main">
                <header className="growth-header">
                    <div className="header-title-wrap">
                        <div className="header-icon"><Eye size={28} /></div>
                        <div>
                            <div className="eyebrow">GROWTH MANAGEMENT</div>
                            <h1>성장 기록 한눈에 보기</h1>
                            <p>학생 성장 관리표에서 작성 상태와 핵심 내용을 한 번에 확인하고, 기록을 누적 관리합니다.</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <span className="last-sync"><RefreshCw size={16} /> 마지막 업데이트: 방금 전</span>
                        <button className="subtle-button" onClick={exportCsv}><Download size={16} /> 데이터 내보내기</button>
                    </div>
                </header>

                {migrationRequired && (
                    <div className="notice error">
                        <AlertTriangle size={19} />
                        Supabase 성장관리표 테이블이 아직 적용되지 않았습니다. migration SQL 적용 후 저장 기능이 활성화됩니다.
                    </div>
                )}
                {message && (
                    <div className={`notice ${message.type === "ok" ? "ok" : "error"}`}>
                        {message.type === "ok" ? <ThumbsUp size={18} /> : <AlertTriangle size={18} />}
                        {message.text}
                    </div>
                )}

                <section className="filters">
                    <label>
                        <span>기간</span>
                        <select defaultValue="2026-06">
                            <option value="2026-06">2026.06</option>
                            <option value="all">전체 기간</option>
                        </select>
                    </label>
                    <label>
                        <span>반</span>
                        <select value={track} onChange={event => setTrack(event.target.value)}>
                            {TRACKS.map(item => <option key={item}>{item}</option>)}
                        </select>
                    </label>
                    <label>
                        <span>작성 상태</span>
                        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                            {STATUS_FILTERS.map(item => <option key={item}>{item}</option>)}
                        </select>
                    </label>
                    <label className="search-field">
                        <span>학생 검색</span>
                        <div>
                            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="이름을 입력하세요" />
                            <Search size={18} />
                        </div>
                    </label>
                    <div className="quick-filter">
                        <span>빠른 필터</span>
                        {STATUS_FILTERS.slice(1).map(item => (
                            <button key={item} onClick={() => setStatusFilter(item)} className={statusFilter === item ? "active" : ""}>
                                {item}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="stats">
                    <StatCard title="작성률" value={`${stats.percent}%`} note={`${stats.written}명 / ${stats.total}명`} icon={<Target />} accent="#2563eb" />
                    <StatCard title="미작성" value={`${stats.total - stats.written}명`} note="전체 미작성" icon={<FileText />} accent="#64748b" />
                    <StatCard title="초안" value={`${stats.draft}명`} note="검토 필요" icon={<Pencil />} accent="#f59e0b" />
                    <StatCard title="피드백 준비" value={`${stats.feedbackReady}명`} note="복사 후 전달" icon={<MessageSquareText />} accent="#7c3aed" />
                    <StatCard title="반 이동 후보" value={`${stats.moveCandidates}명`} note="상담 후보" icon={<Users />} accent="#0ea5e9" />
                    <StatCard title="주의 필요" value={`${stats.needsCare}명`} note="집중 관리" icon={<AlertTriangle />} accent="#ef4444" />
                </section>

                <section className="matrix-card">
                    <div className="tabs">
                        {TABS.map(tab => (
                            <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="empty-state">성장관리표를 불러오는 중입니다.</div>
                    ) : activeTab === "상태 보드" ? (
                        <StatusBoard students={students} records={recordByStudent} onSelect={selectStudent} selectedId={selectedId} />
                    ) : activeTab === "학생 타임라인" ? (
                        <Timeline entries={entries} />
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>학생</th>
                                        <th>현재 반</th>
                                        <th>작성 상태</th>
                                        <th>실력 단계</th>
                                        <th>반 이동</th>
                                        <th>현재 목표</th>
                                        <th>잘하는 점</th>
                                        <th>부족한 점</th>
                                        <th>학부모 피드백</th>
                                        <th>최근 수정</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => {
                                        const record = recordByStudent.get(student.id);
                                        const status = statusOf(record);
                                        const [bg, fg] = badgeColor(status);
                                        const active = student.id === selectedId;
                                        return (
                                            <tr key={student.id} className={active ? "selected" : ""} onClick={() => selectStudent(student.id)}>
                                                <td>
                                                    <div className="student-cell">
                                                        <span>{student.name.slice(0, 1)}</span>
                                                        <strong>{student.name}</strong>
                                                    </div>
                                                </td>
                                                <td>{record?.current_class || student.class || "-"}</td>
                                                <td><em style={{ background: bg, color: fg }}>{status}</em></td>
                                                <td>{record?.skill_level || "-"}</td>
                                                <td>{record?.next_class_potential || "-"}</td>
                                                <td>{compactText(record?.current_goal)}</td>
                                                <td>{compactText(record?.strengths)}</td>
                                                <td>{compactText(record?.weaknesses)}</td>
                                                <td>{record?.parent_feedback_draft ? <em className="purple">준비됨</em> : "-"}</td>
                                                <td>{formatDate(record?.updated_at)}</td>
                                            </tr>
                                        );
                                    })}
                                    {!filteredStudents.length && (
                                        <tr><td colSpan={10} className="empty-row">표시할 학생이 없습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </section>

            <aside className="detail-panel">
                {selectedStudent ? (
                    <>
                        <div className="detail-head">
                            <div className="large-avatar">{selectedStudent.name.slice(0, 1)}</div>
                            <div>
                                <h2>{selectedStudent.name}</h2>
                                <p>{form.currentClass || selectedStudent.class || "반 미지정"} · {form.skillLevel || "단계 미입력"}</p>
                            </div>
                        </div>
                        <div className="completion">
                            <span>작성 완성도</span>
                            <strong>{completion}%</strong>
                            <div><i style={{ width: `${completion}%` }} /></div>
                        </div>

                        <div className="form-grid">
                            <Field label="현재 반">
                                <select value={form.currentClass} onChange={event => updateForm("currentClass", event.target.value)}>
                                    <option value="">선택</option>
                                    {TRACKS.slice(1).map(item => <option key={item}>{item}</option>)}
                                </select>
                            </Field>
                            <Field label="실력 단계">
                                <select value={form.skillLevel} onChange={event => updateForm("skillLevel", event.target.value)}>
                                    <option value="">선택</option>
                                    {LEVELS.map(item => <option key={item}>{item}</option>)}
                                </select>
                            </Field>
                            <Field label="반 이동 가능성">
                                <select value={form.nextClassPotential} onChange={event => updateForm("nextClassPotential", event.target.value)}>
                                    {MOVE_OPTIONS.map(item => <option key={item}>{item}</option>)}
                                </select>
                            </Field>
                            <Field label="성향">
                                <textarea value={form.temperament} onChange={event => updateForm("temperament", event.target.value)} />
                            </Field>
                            <Field label="현재 목표">
                                <textarea value={form.currentGoal} onChange={event => updateForm("currentGoal", event.target.value)} />
                            </Field>
                            <Field label="잘하는 점">
                                <textarea value={form.strengths} onChange={event => updateForm("strengths", event.target.value)} />
                            </Field>
                            <Field label="부족한 점">
                                <textarea value={form.weaknesses} onChange={event => updateForm("weaknesses", event.target.value)} />
                            </Field>
                            <Field label="반별 진행 상황">
                                <textarea value={form.classProgress} onChange={event => updateForm("classProgress", event.target.value)} />
                            </Field>
                            <Field label="학부모 전달사항">
                                <textarea value={form.parentFeedbackDraft} onChange={event => updateForm("parentFeedbackDraft", event.target.value)} />
                            </Field>
                            <Field label="선생님 메모">
                                <textarea value={form.teacherMemo} onChange={event => updateForm("teacherMemo", event.target.value)} />
                            </Field>
                            <Field label="이번 저장 메모">
                                <textarea value={form.entryNote} onChange={event => updateForm("entryNote", event.target.value)} />
                            </Field>
                        </div>

                        <div className="detail-actions">
                            <button className="outline" onClick={copyFeedback}><ClipboardCopy size={17} /> 피드백 복사</button>
                            <button className="danger" onClick={removeRecord} disabled={!selectedRecord}><Trash2 size={17} /> 삭제</button>
                            <button className="primary" onClick={save} disabled={saving || migrationRequired}><Save size={17} /> {saving ? "저장 중" : "저장하기"}</button>
                        </div>

                        <section className="history">
                            <h3>활동 기록</h3>
                            {selectedEntries.length ? selectedEntries.map(entry => (
                                <article key={entry.id}>
                                    <strong>{formatDate(entry.created_at)}</strong>
                                    <p>{entry.entry_note || entry.class_progress || entry.parent_feedback_draft || "성장 기록 저장"}</p>
                                </article>
                            )) : (
                                <p className="muted">아직 누적 기록이 없습니다.</p>
                            )}
                        </section>
                    </>
                ) : (
                    <div className="empty-state">학생을 선택해주세요.</div>
                )}
            </aside>

            <style>{`
                .growth-page { min-height: calc(100vh - 48px); display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 22px; color: #0f172a; }
                .growth-main { min-width: 0; }
                .growth-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
                .header-title-wrap { display: flex; align-items: center; gap: 18px; }
                .header-icon { width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center; background: #eaf2ff; color: #2563eb; }
                .eyebrow { font-size: 13px; letter-spacing: .22em; font-weight: 900; color: #2563eb; }
                h1 { margin: 4px 0 8px; font-size: clamp(32px, 4.5vw, 52px); line-height: 1.04; letter-spacing: -0.04em; }
                p { margin: 0; }
                .growth-header p { color: #64748b; font-size: 16px; }
                .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
                .last-sync { display: inline-flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; font-weight: 700; }
                button, input, select, textarea { font: inherit; }
                button { cursor: pointer; }
                .subtle-button, .primary, .outline, .danger { min-height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 850; border: 1px solid #dbe6f5; background: #fff; color: #1e293b; padding: 0 15px; }
                .primary { background: #2563eb; border-color: #2563eb; color: #fff; box-shadow: 0 14px 24px rgba(37,99,235,.22); }
                .danger { color: #dc2626; }
                .outline { color: #2563eb; }
                button:disabled { opacity: .5; cursor: not-allowed; }
                .notice { display: flex; align-items: center; gap: 10px; border-radius: 14px; padding: 14px 16px; margin-bottom: 16px; font-weight: 800; }
                .notice.error { color: #dc2626; background: #fff1f2; border: 1px solid #fecdd3; }
                .notice.ok { color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; }
                .filters { display: grid; grid-template-columns: 1.15fr .8fr .8fr 1fr 1.25fr; gap: 14px; margin-bottom: 22px; align-items: end; }
                label { display: grid; gap: 8px; font-size: 12px; color: #334155; font-weight: 900; }
                select, input, textarea { width: 100%; border: 1px solid #dbe6f5; background: #fff; color: #0f172a; border-radius: 12px; min-height: 44px; padding: 0 13px; outline: none; }
                textarea { min-height: 78px; padding: 12px 13px; resize: vertical; line-height: 1.55; }
                .search-field div { position: relative; }
                .search-field svg { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-field input { padding-right: 42px; }
                .quick-filter { display: flex; align-items: end; gap: 7px; flex-wrap: wrap; }
                .quick-filter span { width: 100%; color: #334155; font-size: 12px; font-weight: 900; }
                .quick-filter button { min-height: 34px; border: 1px solid #dbe6f5; background: #fff; border-radius: 10px; padding: 0 10px; color: #64748b; font-size: 12px; font-weight: 850; }
                .quick-filter button.active { background: #2563eb; border-color: #2563eb; color: #fff; }
                .stats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
                .stat { min-height: 102px; border: 1px solid #dbe6f5; border-radius: 16px; background: #fff; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 10px 24px rgba(15,23,42,.04); }
                .stat-icon { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; background: #eff6ff; }
                .stat-icon svg { width: 24px; height: 24px; }
                .stat strong { display: block; font-size: 29px; line-height: 1; letter-spacing: -.04em; }
                .stat span { display: block; margin-top: 8px; color: #64748b; font-size: 12px; font-weight: 800; }
                .matrix-card { border: 1px solid #dbe6f5; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 40px rgba(15,23,42,.05); }
                .tabs { display: flex; border-bottom: 1px solid #e2e8f0; }
                .tabs button { min-height: 48px; padding: 0 24px; border: 0; background: #fff; color: #475569; font-weight: 900; border-right: 1px solid #e2e8f0; }
                .tabs button.active { color: #2563eb; box-shadow: inset 0 -3px 0 #2563eb; }
                .table-wrap { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; min-width: 1140px; }
                th, td { border-bottom: 1px solid #edf2f7; padding: 14px 14px; text-align: left; font-size: 13px; vertical-align: middle; }
                th { background: #f8fafc; color: #475569; font-weight: 950; }
                tr { transition: background .16s ease; }
                tbody tr:hover, tr.selected { background: #f5f9ff; }
                tr.selected { outline: 1px solid #93c5fd; outline-offset: -1px; }
                em { font-style: normal; display: inline-flex; align-items: center; min-height: 25px; border-radius: 8px; padding: 0 9px; font-size: 12px; font-weight: 900; white-space: nowrap; }
                .purple { background: #f3e8ff; color: #7e22ce; }
                .student-cell { display: flex; align-items: center; gap: 10px; }
                .student-cell span { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; background: #eaf2ff; color: #2563eb; font-weight: 950; }
                .empty-row, .empty-state { min-height: 160px; text-align: center; color: #94a3b8; font-weight: 800; padding: 56px 20px; }
                .detail-panel { position: sticky; top: 24px; height: calc(100vh - 48px); overflow-y: auto; border: 1px solid #e2e8f0; background: rgba(255,255,255,.95); border-radius: 22px; padding: 22px; box-shadow: 0 24px 60px rgba(15,23,42,.08); }
                .detail-head { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
                .large-avatar { width: 62px; height: 62px; border-radius: 18px; display: grid; place-items: center; background: #eaf2ff; color: #2563eb; font-size: 29px; font-weight: 950; }
                .detail-head h2 { margin: 0 0 6px; font-size: 26px; }
                .detail-head p { color: #64748b; font-size: 13px; font-weight: 800; }
                .completion { display: grid; gap: 8px; margin-bottom: 18px; }
                .completion span { color: #64748b; font-size: 12px; font-weight: 900; }
                .completion strong { font-size: 22px; }
                .completion div { height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
                .completion i { display: block; height: 100%; background: linear-gradient(90deg,#2563eb,#0ea5e9); border-radius: inherit; }
                .form-grid { display: grid; gap: 14px; }
                .detail-actions { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 10px; margin: 18px 0 22px; }
                .history { border-top: 1px solid #e2e8f0; padding-top: 16px; }
                .history h3 { margin: 0 0 12px; font-size: 16px; }
                .history article { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; margin-bottom: 10px; background: #f8fafc; }
                .history article strong { display: block; margin-bottom: 6px; font-size: 12px; color: #2563eb; }
                .history article p, .muted { color: #64748b; font-size: 13px; line-height: 1.55; }
                .board { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; padding: 18px; }
                .board-column { border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; background: #f8fafc; min-height: 180px; }
                .board-column h3 { margin: 0 0 12px; font-size: 15px; }
                .board-card { border: 1px solid #e2e8f0; background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 9px; text-align: left; width: 100%; }
                .board-card strong { display: block; margin-bottom: 5px; }
                .board-card span { color: #64748b; font-size: 12px; }
                .timeline { padding: 18px; display: grid; gap: 10px; }
                .timeline article { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; background: #fff; }
                .timeline strong { color: #2563eb; }
                .timeline p { margin-top: 7px; color: #475569; line-height: 1.55; }
                @media (max-width: 1280px) {
                    .growth-page { grid-template-columns: 1fr; }
                    .detail-panel { position: static; height: auto; }
                    .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                    .filters { grid-template-columns: repeat(2, minmax(0,1fr)); }
                }
                @media (max-width: 760px) {
                    .growth-header, .header-title-wrap { flex-direction: column; align-items: flex-start; }
                    .filters, .stats, .board { grid-template-columns: 1fr; }
                    .detail-actions { grid-template-columns: 1fr; }
                    .tabs { overflow-x: auto; }
                }
            `}</style>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label>
            <span>{label}</span>
            {children}
        </label>
    );
}

function StatCard({ title, value, note, icon, accent }: { title: string; value: string; note: string; icon: ReactNode; accent: string }) {
    return (
        <article className="stat">
            <div className="stat-icon" style={{ color: accent }}>{icon}</div>
            <div>
                <strong>{value}</strong>
                <span>{title} · {note}</span>
            </div>
        </article>
    );
}

function StatusBoard({
    students,
    records,
    selectedId,
    onSelect,
}: {
    students: StudentOption[];
    records: Map<string, GrowthRecord>;
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    const groups = ["미작성", "주의 필요", "피드백 준비", "반 이동 후보"];
    return (
        <div className="board">
            {groups.map(group => (
                <section className="board-column" key={group}>
                    <h3>{group}</h3>
                    {students
                        .filter(student => statusOf(records.get(student.id)) === group)
                        .map(student => {
                            const record = records.get(student.id);
                            return (
                                <button key={student.id} className="board-card" onClick={() => onSelect(student.id)} style={{ outline: selectedId === student.id ? "2px solid #93c5fd" : "none" }}>
                                    <strong>{student.name}</strong>
                                    <span>{record?.current_class || student.class || "반 미지정"} · {record?.current_goal || "목표 미입력"}</span>
                                </button>
                            );
                        })}
                </section>
            ))}
        </div>
    );
}

function Timeline({ entries }: { entries: GrowthEntry[] }) {
    if (!entries.length) return <div className="empty-state">아직 누적 성장 기록이 없습니다.</div>;
    return (
        <div className="timeline">
            {entries.slice(0, 80).map(entry => (
                <article key={entry.id}>
                    <strong>{entry.student_name} · {formatDate(entry.created_at)}</strong>
                    <p>{entry.entry_note || entry.class_progress || entry.parent_feedback_draft || "성장 기록 저장"}</p>
                </article>
            ))}
        </div>
    );
}
