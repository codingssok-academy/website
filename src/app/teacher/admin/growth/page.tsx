"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

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
    status: string | null;
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
    entry?: GrowthEntry | null;
    error?: string;
};

type FormState = {
    studentId: string;
    studentName: string;
    currentClass: string;
    temperament: string;
    strengths: string;
    weaknesses: string;
    currentGoal: string;
    nextClassPotential: string;
    classProgress: string;
    parentFeedbackDraft: string;
    teacherMemo: string;
    entryNote: string;
    recordStatus: string;
};

const EMPTY_FORM: FormState = {
    studentId: "",
    studentName: "",
    currentClass: "",
    temperament: "",
    strengths: "",
    weaknesses: "",
    currentGoal: "",
    nextClassPotential: "",
    classProgress: "",
    parentFeedbackDraft: "",
    teacherMemo: "",
    entryNote: "",
    recordStatus: "관찰중",
};

const TRACKS = ["전체 반", "공통기초반", "흥미반", "만들기반", "프로젝트반", "대회반", "내신반", "자격증반"];
const MOVE_OPTIONS = ["-", "관찰 필요", "이동 가능", "보강 후 이동", "상담 필요"];
const RECORD_STATUS_OPTIONS = ["관찰중", "초안", "전달 준비", "상담 필요", "완료"];

function safeText(value: string | null | undefined) {
    return String(value || "").trim();
}

function compact(value: string | null | undefined, limit = 80) {
    const text = safeText(value).replace(/\s+/g, " ");
    if (!text) return "-";
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function formatDate(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toForm(record: GrowthRecord, fallback?: StudentOption): FormState {
    return {
        studentId: record.student_id,
        studentName: record.student_name || fallback?.name || "",
        currentClass: record.current_class || fallback?.class || "",
        temperament: record.temperament || "",
        strengths: record.strengths || "",
        weaknesses: record.weaknesses || "",
        currentGoal: record.current_goal || "",
        nextClassPotential: record.next_class_potential || "",
        classProgress: record.class_progress || "",
        parentFeedbackDraft: record.parent_feedback_draft || "",
        teacherMemo: record.teacher_memo || "",
        entryNote: "",
        recordStatus: record.status || "관찰중",
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

function snapshot(form: FormState) {
    const { entryNote: _entryNote, ...rest } = form;
    return JSON.stringify(rest);
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

function buildParentCopy(form: FormState) {
    return [
        `[코딩쏙] ${form.studentName || "학생"} 성장 피드백`,
        "",
        `현재 반: ${form.currentClass || "-"}`,
        `현재 목표: ${form.currentGoal || "-"}`,
        "",
        `성향: ${form.temperament || "-"}`,
        `잘하는 점: ${form.strengths || "-"}`,
        `보완할 점: ${form.weaknesses || "-"}`,
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
    const [migrationRequired, setMigrationRequired] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "error" | "info"; text: string } | null>(null);
    const selectedIdRef = useRef("");
    const lastSavedSnapshotRef = useRef(snapshot(EMPTY_FORM));
    const firstLoadRef = useRef(true);

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
            const className = record?.current_class || student.class || "";
            const queryMatch = !normalizedQuery
                || student.name.replace(/\s+/g, "").includes(normalizedQuery)
                || className.replace(/\s+/g, "").includes(normalizedQuery);
            const trackMatch = track === "전체 반" || className === track;
            return queryMatch && trackMatch;
        });
    }, [query, recordByStudent, students, track]);

    const classCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const student of students) {
            const record = recordByStudent.get(student.id);
            const className = record?.current_class || student.class || "미지정";
            counts.set(className, (counts.get(className) || 0) + 1);
        }
        return counts;
    }, [recordByStudent, students]);

    const selectStudent = useCallback((studentId: string, sourceStudents = students, sourceRecords = records) => {
        const student = sourceStudents.find(item => item.id === studentId);
        const record = sourceRecords.find(item => item.student_id === studentId);
        selectedIdRef.current = studentId;
        setSelectedId(studentId);
        const nextForm = record ? toForm(record, student) : student ? newForm(student) : EMPTY_FORM;
        setForm(nextForm);
        lastSavedSnapshotRef.current = snapshot(nextForm);
        setSaveState("idle");
    }, [records, students]);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch("/api/teacher/growth-management", { cache: "no-store" });
            const data = await readApiJson(response);
            if (!response.ok || !data.success) throw new Error(data.error || "성장관리표를 불러오지 못했습니다.");

            const nextStudents = data.students || [];
            const nextRecords = data.records || [];
            setStudents(nextStudents);
            setRecords(nextRecords);
            setEntries(data.entries || []);
            setMigrationRequired(Boolean(data.migrationRequired));

            const previousSelected = selectedIdRef.current;
            const nextSelected = previousSelected && nextStudents.some(student => student.id === previousSelected)
                ? previousSelected
                : nextStudents[0]?.id || "";
            selectedIdRef.current = nextSelected;
            setSelectedId(nextSelected);

            if (nextSelected) {
                const student = nextStudents.find(item => item.id === nextSelected);
                const record = nextRecords.find(item => item.student_id === nextSelected);
                const nextForm = record ? toForm(record, student) : student ? newForm(student) : EMPTY_FORM;
                setForm(nextForm);
                lastSavedSnapshotRef.current = snapshot(nextForm);
            } else {
                setForm(EMPTY_FORM);
                lastSavedSnapshotRef.current = snapshot(EMPTY_FORM);
            }
            setSaveState("idle");
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "성장관리표를 불러오지 못했습니다." });
        } finally {
            setLoading(false);
            firstLoadRef.current = false;
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const submit = useCallback(async (mode: "auto" | "entry") => {
        if (!form.studentId || migrationRequired) return;
        const currentSnapshot = snapshot(form);
        if (mode === "auto" && currentSnapshot === lastSavedSnapshotRef.current) return;

        setSaving(true);
        setSaveState("saving");
        try {
            const response = await fetch("/api/teacher/growth-management", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    autoSave: mode === "auto",
                    createEntry: mode === "entry",
                }),
            });
            const data = await readApiJson(response);
            if (!response.ok || !data.success || !data.record) throw new Error(data.error || "저장에 실패했습니다.");

            setRecords(prev => {
                const rest = prev.filter(record => record.student_id !== data.record!.student_id);
                return [data.record!, ...rest];
            });
            if (data.entry) setEntries(prev => [data.entry!, ...prev]);
            lastSavedSnapshotRef.current = currentSnapshot;
            setSaveState("saved");
            if (mode === "entry") {
                setForm(prev => ({ ...prev, entryNote: "" }));
                setMessage({ type: "ok", text: "현재 내용을 저장하고 누적 기록을 남겼습니다." });
            }
        } catch (error) {
            setSaveState("error");
            if (mode === "entry") {
                setMessage({ type: "error", text: error instanceof Error ? error.message : "저장에 실패했습니다." });
            }
        } finally {
            setSaving(false);
        }
    }, [form, migrationRequired]);

    useEffect(() => {
        if (firstLoadRef.current || loading || !form.studentId || migrationRequired) return;
        const currentSnapshot = snapshot(form);
        if (currentSnapshot === lastSavedSnapshotRef.current) return;
        setSaveState("dirty");
        const timer = window.setTimeout(() => {
            void submit("auto");
        }, 700);
        return () => window.clearTimeout(timer);
    }, [form, loading, migrationRequired, submit]);

    const updateForm = (key: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const removeRecord = async () => {
        if (!form.studentId) return;
        if (!window.confirm(`${form.studentName || "선택한 학생"}의 성장관리 기록을 초기화할까요?`)) return;

        try {
            const response = await fetch("/api/teacher/growth-management", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: form.studentId }),
            });
            const data = await readApiJson(response);
            if (!response.ok || !data.success) throw new Error(data.error || "삭제에 실패했습니다.");

            setRecords(prev => prev.filter(record => record.student_id !== form.studentId));
            setEntries(prev => prev.filter(entry => entry.student_id !== form.studentId));
            const student = students.find(item => item.id === form.studentId);
            const nextForm = student ? newForm(student) : EMPTY_FORM;
            setForm(nextForm);
            lastSavedSnapshotRef.current = snapshot(nextForm);
            setSaveState("idle");
            setMessage({ type: "ok", text: "성장관리 기록을 초기화했습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "삭제에 실패했습니다." });
        }
    };

    const copyFeedback = async () => {
        await navigator.clipboard.writeText(buildParentCopy(form));
        setMessage({ type: "ok", text: "학부모 전달용 피드백을 복사했습니다." });
    };

    const exportCsv = () => {
        const header = ["학생", "현재 반", "성향", "현재 목표", "학부모 피드백", "최근 수정"];
        const rows = filteredStudents.map(student => {
            const record = recordByStudent.get(student.id);
            return [
                student.name,
                record?.current_class || student.class || "",
                record?.temperament || "",
                record?.current_goal || "",
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

    const saveLabel = saveState === "saving"
        ? "저장 중"
        : saveState === "saved"
            ? "저장됨"
            : saveState === "dirty"
                ? "변경됨"
                : saveState === "error"
                    ? "저장 실패"
                    : "대기";

    if (loading && students.length === 0) {
        return (
            <div className="growth-page loading-shell">
                <div className="loading-card">
                    <strong>성장관리표를 불러오는 중입니다.</strong>
                    <span>학생 목록과 누적 기록을 확인하고 있습니다.</span>
                </div>
                <style>{`
                    .growth-page.loading-shell {
                        min-height: calc(100vh - 48px);
                        display: grid;
                        place-items: center;
                        background: #f4f6f9;
                        color: #111827;
                        font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
                    }
                    .loading-card {
                        width: min(420px, 100%);
                        border: 1px solid #d9e1ec;
                        background: #ffffff;
                        border-radius: 8px;
                        padding: 22px 24px;
                    }
                    .loading-card strong { display: block; font-size: 16px; font-weight: 900; margin-bottom: 8px; }
                    .loading-card span { color: #6b7280; font-size: 13px; font-weight: 700; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="growth-page">
            <section className="growth-main">
                <header className="growth-header">
                    <div>
                        <div className="eyebrow">성장 관리</div>
                        <h1>학생 성장 관리표</h1>
                        <p>학생별 현재 반, 성향, 목표, 학부모 피드백을 한 화면에서 관리합니다. 입력 내용은 자동 저장됩니다.</p>
                    </div>
                    <div className="header-actions">
                        <span className={`save-state ${saveState}`}>{saveLabel}</span>
                        <button className="subtle-button" onClick={() => void load()} disabled={loading}>새로고침</button>
                        <button className="subtle-button" onClick={exportCsv}>CSV 내보내기</button>
                    </div>
                </header>

                {migrationRequired && (
                    <div className="notice error">
                        Supabase 성장관리표 테이블이 아직 적용되지 않았습니다. migration SQL 적용 후 저장 기능이 활성화됩니다.
                    </div>
                )}
                {message && <div className={`notice ${message.type}`}>{message.text}</div>}

                <section className="filters">
                    <div className="track-filter">
                        {TRACKS.map(item => {
                            const count = item === "전체 반" ? students.length : classCounts.get(item) || 0;
                            return (
                                <button
                                    key={item}
                                    className={track === item ? "active" : ""}
                                    onClick={() => setTrack(item)}
                                >
                                    {item}
                                    <span>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                    <input
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder="학생 또는 반 검색"
                    />
                </section>

                <section className="matrix-card">
                    <div className="table-head">
                        <span>학생</span>
                        <span>성향</span>
                        <span>현재 목표</span>
                        <span>학부모 피드백</span>
                        <span>최근 수정</span>
                    </div>
                    {filteredStudents.map(student => {
                        const record = recordByStudent.get(student.id);
                        const active = student.id === selectedId;
                        return (
                            <button
                                key={student.id}
                                className={`student-row ${active ? "selected" : ""}`}
                                onClick={() => selectStudent(student.id)}
                            >
                                <span className="name-cell">
                                    <strong>{student.name}</strong>
                                    <em>{record?.current_class || student.class || "반 미지정"}</em>
                                </span>
                                <span>{compact(record?.temperament, 90)}</span>
                                <span>{compact(record?.current_goal, 90)}</span>
                                <span>{compact(record?.parent_feedback_draft, 110)}</span>
                                <span>{formatDate(record?.updated_at)}</span>
                            </button>
                        );
                    })}
                    {!filteredStudents.length && <div className="empty-row">표시할 학생이 없습니다.</div>}
                </section>
            </section>

            <aside className="detail-panel">
                {selectedStudent ? (
                    <>
                        <div className="detail-head">
                            <div>
                                <span>선택 학생</span>
                                <h2>{selectedStudent.name}</h2>
                            </div>
                            <strong className={`save-state ${saveState}`}>{saveLabel}</strong>
                        </div>

                        <div className="form-grid">
                            <Field label="현재 반">
                                <select value={form.currentClass} onChange={event => updateForm("currentClass", event.target.value)}>
                                    <option value="">선택</option>
                                    {TRACKS.slice(1).map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </Field>
                            <Field label="관리 상태">
                                <select value={form.recordStatus} onChange={event => updateForm("recordStatus", event.target.value)}>
                                    {RECORD_STATUS_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </Field>
                            <Field label="반 이동 가능성">
                                <select value={form.nextClassPotential} onChange={event => updateForm("nextClassPotential", event.target.value)}>
                                    {MOVE_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
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
                            <Field label="보완할 점">
                                <textarea value={form.weaknesses} onChange={event => updateForm("weaknesses", event.target.value)} />
                            </Field>
                            <Field label="반별 진행 상황">
                                <textarea value={form.classProgress} onChange={event => updateForm("classProgress", event.target.value)} />
                            </Field>
                            <Field label="학부모 전달사항">
                                <textarea className="large-textarea" value={form.parentFeedbackDraft} onChange={event => updateForm("parentFeedbackDraft", event.target.value)} />
                            </Field>
                            <Field label="내부 메모">
                                <textarea value={form.teacherMemo} onChange={event => updateForm("teacherMemo", event.target.value)} />
                            </Field>
                            <Field label="이번 기록 메모">
                                <textarea value={form.entryNote} onChange={event => updateForm("entryNote", event.target.value)} />
                            </Field>
                        </div>

                        <div className="detail-actions">
                            <button className="outline" onClick={copyFeedback}>피드백 복사</button>
                            <button className="danger" onClick={removeRecord} disabled={!selectedRecord}>기록 초기화</button>
                            <button className="primary" onClick={() => void submit("entry")} disabled={saving || migrationRequired}>
                                기록 남기기
                            </button>
                        </div>

                        <section className="history">
                            <h3>누적 기록</h3>
                            {selectedEntries.length ? selectedEntries.slice(0, 8).map(entry => (
                                <article key={entry.id}>
                                    <strong>{formatDate(entry.created_at)}</strong>
                                    <p>{entry.entry_note || entry.class_progress || entry.parent_feedback_draft || "성장 기록 저장"}</p>
                                </article>
                            )) : <p className="muted">아직 누적 기록이 없습니다.</p>}
                        </section>
                    </>
                ) : (
                    <div className="empty-state">학생을 선택해주세요.</div>
                )}
            </aside>

            <style>{`
                .growth-page {
                    min-height: calc(100vh - 48px);
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 390px;
                    gap: 18px;
                    color: #111827;
                    background: #f4f6f9;
                    font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
                }
                .growth-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 18px;
                }
                .eyebrow {
                    font-size: 12px;
                    letter-spacing: 0;
                    font-weight: 900;
                    color: #4b5563;
                }
                h1 {
                    margin: 4px 0 8px;
                    font-size: 30px;
                    line-height: 1.2;
                    letter-spacing: 0;
                }
                h2, h3, p { margin: 0; }
                .growth-header p {
                    color: #6b7280;
                    font-size: 14px;
                    font-weight: 600;
                }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                }
                button, input, select, textarea { font: inherit; }
                button { cursor: pointer; }
                .subtle-button, .primary, .outline, .danger {
                    min-height: 38px;
                    border-radius: 7px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-weight: 850;
                    border: 1px solid #d9e1ec;
                    background: #fff;
                    color: #1f2937;
                    padding: 0 13px;
                }
                .primary { background: #1f2937; border-color: #1f2937; color: #fff; }
                .danger { color: #b91c1c; border-color: #fecaca; background: #fff7f7; }
                button:disabled { opacity: .5; cursor: not-allowed; }
                .save-state {
                    min-height: 30px;
                    display: inline-flex;
                    align-items: center;
                    border: 1px solid #d9e1ec;
                    border-radius: 999px;
                    padding: 0 10px;
                    color: #64748b;
                    background: #fff;
                    font-size: 12px;
                    font-weight: 900;
                    white-space: nowrap;
                }
                .save-state.saving, .save-state.dirty { color: #b45309; background: #fffbeb; border-color: #fde68a; }
                .save-state.saved { color: #047857; background: #ecfdf5; border-color: #bbf7d0; }
                .save-state.error { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
                .notice {
                    border-radius: 8px;
                    padding: 12px 14px;
                    margin-bottom: 14px;
                    font-size: 13px;
                    font-weight: 800;
                    border: 1px solid;
                }
                .notice.error { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
                .notice.ok { color: #047857; background: #ecfdf5; border-color: #bbf7d0; }
                .notice.info { color: #475569; background: #f8fafc; border-color: #d9e1ec; }
                .filters {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 280px;
                    gap: 12px;
                    margin-bottom: 14px;
                    align-items: start;
                }
                .track-filter {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .track-filter button {
                    min-height: 34px;
                    border: 1px solid #d9e1ec;
                    background: #fff;
                    color: #475569;
                    border-radius: 999px;
                    padding: 0 12px;
                    font-size: 12px;
                    font-weight: 900;
                }
                .track-filter button.active {
                    color: #fff;
                    background: #1f2937;
                    border-color: #1f2937;
                }
                .track-filter span { margin-left: 6px; color: inherit; opacity: .75; }
                input, select, textarea {
                    width: 100%;
                    border: 1px solid #d9e1ec;
                    background: #fff;
                    color: #111827;
                    border-radius: 7px;
                    min-height: 40px;
                    padding: 0 12px;
                    outline: none;
                }
                textarea {
                    min-height: 70px;
                    padding: 11px 12px;
                    resize: vertical;
                    line-height: 1.55;
                }
                .large-textarea { min-height: 118px; }
                .matrix-card {
                    border: 1px solid #d9e1ec;
                    background: #fff;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .table-head, .student-row {
                    display: grid;
                    grid-template-columns: 210px 1fr 1fr 1.35fr 116px;
                    gap: 14px;
                    align-items: center;
                }
                .table-head {
                    min-height: 44px;
                    padding: 0 16px;
                    background: #f8fafc;
                    color: #4b5563;
                    border-bottom: 1px solid #e5edf6;
                    font-size: 12px;
                    font-weight: 950;
                }
                .student-row {
                    width: 100%;
                    min-height: 54px;
                    padding: 8px 16px;
                    border: 0;
                    border-bottom: 1px solid #edf1f6;
                    background: #fff;
                    color: #1f2937;
                    text-align: left;
                    font-size: 13px;
                    font-weight: 700;
                }
                .student-row:hover, .student-row.selected { background: #f5f9ff; }
                .student-row.selected { box-shadow: inset 3px 0 0 #2563eb; }
                .student-row span {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .name-cell {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .name-cell strong {
                    display: inline;
                    font-size: 14px;
                    font-weight: 950;
                    white-space: nowrap;
                }
                .name-cell em {
                    font-style: normal;
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 850;
                    white-space: nowrap;
                }
                .empty-row, .empty-state {
                    padding: 60px 20px;
                    text-align: center;
                    color: #7b8aa0;
                    font-weight: 850;
                }
                .detail-panel {
                    position: sticky;
                    top: 24px;
                    height: calc(100vh - 48px);
                    overflow-y: auto;
                    border: 1px solid #d9e1ec;
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 18px;
                }
                .detail-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 14px;
                    align-items: flex-start;
                    padding-bottom: 14px;
                    border-bottom: 1px solid #e5edf6;
                    margin-bottom: 14px;
                }
                .detail-head span {
                    display: block;
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 900;
                    margin-bottom: 5px;
                }
                .detail-head h2 { font-size: 24px; letter-spacing: 0; }
                .form-grid { display: grid; gap: 12px; }
                label {
                    display: grid;
                    gap: 7px;
                    font-size: 12px;
                    color: #334155;
                    font-weight: 950;
                }
                .detail-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1.2fr;
                    gap: 8px;
                    margin: 16px 0 18px;
                }
                .history {
                    border-top: 1px solid #e5edf6;
                    padding-top: 14px;
                }
                .history h3 { margin-bottom: 10px; font-size: 15px; }
                .history article {
                    border: 1px solid #e5edf6;
                    border-radius: 8px;
                    padding: 11px;
                    margin-bottom: 8px;
                    background: #f8fafc;
                }
                .history article strong { display: block; margin-bottom: 6px; font-size: 12px; color: #2563eb; }
                .history article p, .muted { color: #64748b; font-size: 13px; line-height: 1.55; }
                @media (max-width: 1280px) {
                    .growth-page { grid-template-columns: 1fr; }
                    .detail-panel { position: static; height: auto; }
                    .table-head, .student-row { grid-template-columns: 180px 1fr 1fr 1.2fr 105px; }
                }
                @media (max-width: 820px) {
                    .growth-header { flex-direction: column; }
                    .filters { grid-template-columns: 1fr; }
                    .table-head { display: none; }
                    .student-row { grid-template-columns: 1fr; gap: 5px; white-space: normal; }
                    .student-row span { white-space: normal; }
                    .detail-actions { grid-template-columns: 1fr; }
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
