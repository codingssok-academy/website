"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MonthlyAttendancePanel } from "@/features/growth-v2/attendance/MonthlyAttendancePanel";

type StudentOption = {
    id: string;
    name: string;
    school: string | null;
    grade: string | null;
    class: string | null;
    status: string | null;
};

type GrowthRecord = {
    id: string;
    student_id: string;
    student_name: string;
    current_class: string | null;
    skill_level: string | null;
    strengths: string | null;
    weaknesses: string | null;
    current_goal: string | null;
    next_class_potential: string | null;
    class_progress: string | null;
    parent_feedback_draft: string | null;
    teacher_memo: string | null;
    status: string | null;
    period_month?: string | null;
    updated_at: string | null;
};

type GrowthEntry = GrowthRecord & {
    entry_note: string | null;
    created_at: string | null;
};

type ApiResponse = {
    success: boolean;
    freshMode?: boolean;
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

type EntryEditState = {
    currentClass: string;
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

const NO_CLASS_PROGRESS_LABEL = "수업 미진행";
const CLASS_OPTIONS = ["공통기초반", "흥미반", "만들기반", "프로젝트반", "대회반", "내신반", "자격증반"];
const TRACKS = ["전체 반", NO_CLASS_PROGRESS_LABEL, ...CLASS_OPTIONS];
const MOVE_OPTIONS = ["-", "관찰 필요", "이동 가능", "보강 후 이동", "상담 필요"];
const RECORD_STATUS_OPTIONS = ["관찰중", "초안", "전달 준비", "상담 필요", "완료"];
const FRESH_RECORD_STATUS_OPTIONS = ["초안", "완료"];

function safeText(value: string | null | undefined) {
    return String(value || "").trim();
}

function compact(value: string | null | undefined, limit = 80) {
    const text = safeText(value).replace(/\s+/g, " ");
    if (!text) return "-";
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function displayValue(value: string | null | undefined) {
    return safeText(value) || "-";
}

function classTone(className: string) {
    if (className === NO_CLASS_PROGRESS_LABEL) return "not-started";
    if (className.includes("공통")) return "foundation";
    if (className.includes("흥미")) return "interest";
    if (className.includes("만들기")) return "maker";
    if (className.includes("프로젝트")) return "project";
    if (className.includes("대회")) return "contest";
    if (className.includes("내신")) return "school";
    if (className.includes("자격증")) return "cert";
    return "default";
}

function statusTone(status: string | null | undefined) {
    const text = safeText(status);
    if (text.includes("상담")) return "danger";
    if (text.includes("전달")) return "ready";
    if (text.includes("완료")) return "done";
    if (text.includes("초안")) return "draft";
    return "watch";
}

function moveTone(value: string | null | undefined) {
    const text = safeText(value);
    if (text.includes("이동 가능")) return "go";
    if (text.includes("상담")) return "danger";
    if (text.includes("보강")) return "watch";
    return "neutral";
}

function hasGrowthContent(record: GrowthRecord | undefined) {
    if (!record) return false;
    return Boolean(
        record.updated_at
        || safeText(record.strengths)
        || safeText(record.weaknesses)
        || safeText(record.current_goal)
        || safeText(record.next_class_potential)
        || safeText(record.class_progress)
        || safeText(record.parent_feedback_draft)
        || safeText(record.teacher_memo),
    );
}

function getClassLabel(student: StudentOption, record: GrowthRecord | undefined) {
    if (!hasGrowthContent(record)) return NO_CLASS_PROGRESS_LABEL;
    return record?.current_class || student.class || "반 미지정";
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

function formatPeriodMonth(value: string | null | undefined) {
    const match = value?.match(/^(\d{4})-(\d{2})/);
    return match ? `${Number(match[1])}년 ${Number(match[2])}월` : "";
}

function toForm(record: GrowthRecord, fallback?: StudentOption): FormState {
    return {
        studentId: record.student_id,
        studentName: record.student_name || fallback?.name || "",
        currentClass: record.current_class || fallback?.class || "",
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

function newForm(student: StudentOption, freshMode = false): FormState {
    return {
        ...EMPTY_FORM,
        studentId: student.id,
        studentName: student.name,
        currentClass: student.class || "",
        recordStatus: freshMode ? "초안" : EMPTY_FORM.recordStatus,
    };
}

function toEntryEdit(entry: GrowthEntry): EntryEditState {
    return {
        currentClass: entry.current_class || "",
        strengths: entry.strengths || "",
        weaknesses: entry.weaknesses || "",
        currentGoal: entry.current_goal || "",
        nextClassPotential: entry.next_class_potential || "",
        classProgress: entry.class_progress || "",
        parentFeedbackDraft: entry.parent_feedback_draft || "",
        teacherMemo: entry.teacher_memo || "",
        entryNote: entry.entry_note || "",
        recordStatus: entry.status || "관찰중",
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
        `배운 개념·수업 내용: ${form.classProgress || "-"}`,
        `다음 수업 목표: ${form.currentGoal || "-"}`,
        "",
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
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [entryEdit, setEntryEdit] = useState<EntryEditState | null>(null);
    const [entrySaving, setEntrySaving] = useState(false);
    const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
    const [freshMode, setFreshMode] = useState(false);
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
    const summary = useMemo(() => {
        const recorded = records.filter(record => hasGrowthContent(record)).length;
        const ready = records.filter(record => {
            const status = safeText(record.status);
            return status.includes("전달") || status.includes("완료");
        }).length;
        return {
            total: students.length,
            recorded,
            pending: Math.max(students.length - recorded, 0),
            ready,
        };
    }, [records, students.length]);

    const filteredStudents = useMemo(() => {
        const normalizedQuery = query.trim().replace(/\s+/g, "");
        return students.filter(student => {
            const record = recordByStudent.get(student.id);
            const className = getClassLabel(student, record);
            const queryMatch = !normalizedQuery
                || student.name.replace(/\s+/g, "").includes(normalizedQuery)
                || (student.school || "").replace(/\s+/g, "").includes(normalizedQuery)
                || (student.grade || "").replace(/\s+/g, "").includes(normalizedQuery)
                || className.replace(/\s+/g, "").includes(normalizedQuery);
            const trackMatch = track === "전체 반" || className === track;
            return queryMatch && trackMatch;
        });
    }, [query, recordByStudent, students, track]);

    const classCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const student of students) {
            const record = recordByStudent.get(student.id);
            const className = getClassLabel(student, record);
            counts.set(className, (counts.get(className) || 0) + 1);
        }
        return counts;
    }, [recordByStudent, students]);

    const selectStudent = useCallback((studentId: string, sourceStudents = students, sourceRecords = records) => {
        const student = sourceStudents.find(item => item.id === studentId);
        const record = sourceRecords.find(item => item.student_id === studentId);
        selectedIdRef.current = studentId;
        setSelectedId(studentId);
        setEditingEntryId(null);
        setEntryEdit(null);
        const nextForm = record ? toForm(record, student) : student ? newForm(student, freshMode) : EMPTY_FORM;
        setForm(nextForm);
        lastSavedSnapshotRef.current = snapshot(nextForm);
        setSaveState("idle");
    }, [freshMode, records, students]);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        setEditingEntryId(null);
        setEntryEdit(null);
        try {
            const response = await fetch("/api/teacher/growth-management", { cache: "no-store" });
            const data = await readApiJson(response);
            if (!response.ok || !data.success) throw new Error(data.error || "성장관리표를 불러오지 못했습니다.");

            const nextStudents = data.students || [];
            const nextRecords = data.records || [];
            const nextFreshMode = Boolean(data.freshMode);
            setStudents(nextStudents);
            setRecords(nextRecords);
            setEntries(data.entries || []);
            setFreshMode(nextFreshMode);
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
                const nextForm = record ? toForm(record, student) : student ? newForm(student, nextFreshMode) : EMPTY_FORM;
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
                    recordId: selectedRecord?.id || null,
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
            if (data.entry) setEntries(prev => [data.entry!, ...prev.filter(entry => entry.id !== data.entry!.id)]);
            lastSavedSnapshotRef.current = currentSnapshot;
            setSaveState("saved");
            if (mode === "entry") {
                setForm(prev => ({ ...prev, entryNote: "" }));
                setMessage({
                    type: "ok",
                    text: freshMode
                        ? form.recordStatus === "완료"
                            ? "이번 달 성장 기록을 저장하고 학부모·학생에게 공개했습니다."
                            : "이번 달 성장 기록을 초안으로 안전하게 저장했습니다."
                        : "현재 내용을 저장하고 누적 기록을 남겼습니다.",
                });
            }
        } catch (error) {
            setSaveState("error");
            if (mode === "entry") {
                setMessage({ type: "error", text: error instanceof Error ? error.message : "저장에 실패했습니다." });
            }
        } finally {
            setSaving(false);
        }
    }, [form, freshMode, migrationRequired, selectedRecord]);

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

    const startEntryEdit = (entry: GrowthEntry) => {
        if (entry.student_id !== form.studentId) return;
        setEditingEntryId(entry.id);
        setEntryEdit(toEntryEdit(entry));
        setMessage(null);
    };

    const cancelEntryEdit = () => {
        setEditingEntryId(null);
        setEntryEdit(null);
    };

    const updateEntryEdit = (key: keyof EntryEditState, value: string) => {
        setEntryEdit(prev => prev ? { ...prev, [key]: value } : prev);
    };

    const saveEntryEdit = async () => {
        if (!editingEntryId || !entryEdit || !form.studentId) return;

        setEntrySaving(true);
        try {
            const response = await fetch("/api/teacher/growth-management", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entryId: editingEntryId,
                    studentId: form.studentId,
                    ...entryEdit,
                }),
            });
            const data = await readApiJson(response);
            if (!response.ok || !data.success || !data.entry) throw new Error(data.error || "성장 기록 수정에 실패했습니다.");

            setEntries(prev => prev.map(entry => entry.id === data.entry!.id ? data.entry! : entry));
            if (data.record) {
                setRecords(prev => prev.map(record => record.id === data.record!.id ? data.record! : record));
            }
            setEditingEntryId(null);
            setEntryEdit(null);
            setMessage({ type: "ok", text: "선택한 누적 성장 기록을 수정했습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "성장 기록 수정에 실패했습니다." });
        } finally {
            setEntrySaving(false);
        }
    };

    const removeRecord = async () => {
        if (!form.studentId) return;
        if (!window.confirm(
            freshMode
                ? `${form.studentName || "선택한 학생"}의 성장관리 기록을 보관 처리할까요? 학부모·학생 화면에서는 숨겨집니다.`
                : `${form.studentName || "선택한 학생"}의 성장관리 기록을 초기화할까요?`,
        )) return;

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
            const nextForm = student ? newForm(student, freshMode) : EMPTY_FORM;
            setForm(nextForm);
            lastSavedSnapshotRef.current = snapshot(nextForm);
            setSaveState("idle");
            setMessage({
                type: "ok",
                text: freshMode
                    ? "성장관리 기록을 안전하게 보관 처리했습니다. 학부모·학생 화면에서는 더 이상 보이지 않습니다."
                    : "성장관리 기록을 초기화했습니다.",
            });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "삭제에 실패했습니다." });
        }
    };

    const copyFeedback = async () => {
        await navigator.clipboard.writeText(buildParentCopy(form));
        setMessage({ type: "ok", text: "학부모 전달용 피드백을 복사했습니다." });
    };

    const exportCsv = () => {
        const header = ["이름", "반", "학교", "학년", "관리상태", "반이동가능성", "배운 개념·수업 내용", "다음 수업 목표", "잘한 점", "보완할 점"];
        const rows = filteredStudents.map(student => {
            const record = recordByStudent.get(student.id);
            const classLabel = getClassLabel(student, record);
            return [
                student.name,
                classLabel,
                student.school || "",
                student.grade || "",
                record?.status || "",
                record?.next_class_potential || "",
                record?.class_progress || "",
                record?.current_goal || "",
                record?.strengths || "",
                record?.weaknesses || "",
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
                        <div className="eyebrow">CODINGSSOK GROWTH 2.0</div>
                        <div className="title-line">
                            <h1>Growth 2.0 성장관리</h1>
                            <span className="live-badge">실제 DB 연동</span>
                        </div>
                        <p>기존 성장관리표를 유지하면서 배운 내용, 잘한 점, 보완할 점과 다음 목표를 한 흐름으로 기록합니다.</p>
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

                <section className="growth-summary" aria-label="Growth 2.0 성장관리 현황">
                    <article><span>전체 학생</span><strong>{summary.total}</strong><small>운영 학생 명단</small></article>
                    <article><span>성장 기록 있음</span><strong>{summary.recorded}</strong><small>현재 기록 보유</small></article>
                    <article><span>기록 미작성</span><strong>{summary.pending}</strong><small>첫 기록 필요</small></article>
                    <article><span>{freshMode ? "공개 완료" : "전달 준비·완료"}</span><strong>{summary.ready}</strong><small>학부모 공유 단계</small></article>
                </section>

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
                        <span>이름</span>
                        <span>반</span>
                        <span>학교</span>
                        <span>학년</span>
                        <span>관리상태</span>
                        <span>반이동가능성</span>
                        <span>배운 내용</span>
                        <span>다음 목표</span>
                        <span>잘한 점</span>
                        <span>보완할 점</span>
                    </div>
                    {filteredStudents.map(student => {
                        const record = recordByStudent.get(student.id);
                        const active = student.id === selectedId;
                        const classLabel = getClassLabel(student, record);
                        const notStarted = classLabel === NO_CLASS_PROGRESS_LABEL;
                        const recordStatus = record?.status || "관찰중";
                        const moveStatus = record?.next_class_potential || "-";
                        return (
                            <button
                                key={student.id}
                                className={`student-row ${active ? "selected" : ""} ${notStarted ? "not-started" : ""}`}
                                onClick={() => selectStudent(student.id)}
                            >
                                <span className="name-cell">
                                    <strong>{student.name}</strong>
                                    <small>{formatDate(record?.updated_at)}</small>
                                </span>
                                <span>
                                    <em className={`class-badge ${classTone(classLabel)}`}>{classLabel}</em>
                                </span>
                                <span className="plain-cell">{displayValue(student.school)}</span>
                                <span className="plain-cell">{displayValue(student.grade)}</span>
                                <span>
                                    <em className={`status-badge ${statusTone(recordStatus)}`}>{recordStatus}</em>
                                </span>
                                <span>
                                    <em className={`move-badge ${moveTone(moveStatus)}`}>{moveStatus}</em>
                                </span>
                                <span className="long-cell">{compact(record?.class_progress, 72)}</span>
                                <span className="long-cell">{compact(record?.current_goal, 72)}</span>
                                <span className="long-cell">{compact(record?.strengths, 72)}</span>
                                <span className="long-cell">{compact(record?.weaknesses, 72)}</span>
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

                        <div className="growth-workflow" aria-label="성장 기록 작성 순서">
                            <span className="complete"><b>1</b>학생 선택</span>
                            <span className={hasGrowthContent(selectedRecord) || saveState !== "idle" ? "complete" : ""}><b>2</b>성장 내용 작성</span>
                            <span className={selectedEntries.length ? "complete" : ""}><b>3</b>{freshMode ? "월별 기록 저장" : "누적 기록 남기기"}</span>
                        </div>

                        <div className="autosave-note">
                            <strong>현재 기록</strong>
                            <span>
                                {freshMode
                                    ? "아래 내용을 바꾸면 이번 달 초안으로 자동 저장됩니다. 관리 상태를 ‘완료’로 선택하고 공개 버튼을 눌러야 학부모·학생에게 보입니다."
                                    : "아래 내용을 바꾸면 자동 저장됩니다. 지난 기록은 누적 기록의 수정 버튼을 이용해주세요."}
                            </span>
                        </div>

                        <div className="form-grid">
                            <Field label="현재 반">
                                <select value={form.currentClass} onChange={event => updateForm("currentClass", event.target.value)}>
                                    <option value="">선택</option>
                                    {CLASS_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </Field>
                            <Field label="관리 상태">
                                <select value={form.recordStatus} onChange={event => updateForm("recordStatus", event.target.value)}>
                                    {(freshMode ? FRESH_RECORD_STATUS_OPTIONS : RECORD_STATUS_OPTIONS).map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </Field>
                            <Field label="반 이동 가능성">
                                <select value={form.nextClassPotential} onChange={event => updateForm("nextClassPotential", event.target.value)}>
                                    {MOVE_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </Field>
                            <Field label="배운 개념·수업 내용">
                                <textarea
                                    className="large-textarea"
                                    value={form.classProgress}
                                    onChange={event => updateForm("classProgress", event.target.value)}
                                    placeholder="예: for 반복문, 조건 비교, 오류 찾기처럼 선생님이 직접 작성해주세요."
                                />
                            </Field>
                            <Field label="다음 수업 목표">
                                <textarea value={form.currentGoal} onChange={event => updateForm("currentGoal", event.target.value)} />
                            </Field>
                            <Field label="잘한 점">
                                <textarea value={form.strengths} onChange={event => updateForm("strengths", event.target.value)} />
                            </Field>
                            <Field label="보완할 점">
                                <textarea value={form.weaknesses} onChange={event => updateForm("weaknesses", event.target.value)} />
                            </Field>
                            <Field label="학부모 전달 문구">
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
                            <button className="danger" onClick={removeRecord} disabled={!selectedRecord}>{freshMode ? "기록 보관" : "기록 초기화"}</button>
                            <button className="primary" onClick={() => void submit("entry")} disabled={saving || migrationRequired}>
                                {freshMode
                                    ? form.recordStatus === "완료" ? "이번 달 기록 공개" : "이번 달 초안 저장"
                                    : "이번 주 기록 남기기"}
                            </button>
                        </div>

                        <MonthlyAttendancePanel source="teacher" studentId={selectedStudent.id} editable />

                        <section className="history">
                            <div className="history-title">
                                <div>
                                    <h3>누적 기록</h3>
                                    <p>지난 기록을 확인하거나 필요한 부분만 다시 수정할 수 있습니다.</p>
                                </div>
                                <span>{selectedEntries.length}건</span>
                            </div>
                            {selectedEntries.length ? selectedEntries.slice(0, 8).map(entry => {
                                const editDraft = editingEntryId === entry.id ? entryEdit : null;
                                return (
                                    <article key={entry.id} className={editDraft ? "editing" : ""}>
                                        <div className="history-card-head">
                                            <div>
                                                <strong>{formatPeriodMonth(entry.period_month) || formatDate(entry.created_at)}</strong>
                                                <em className={`status-badge ${statusTone(entry.status)}`}>{entry.status || "관찰중"}</em>
                                            </div>
                                            {!editDraft && (
                                                <button className="history-edit-button" onClick={() => startEntryEdit(entry)}>
                                                    기록 수정
                                                </button>
                                            )}
                                        </div>

                                        {editDraft ? (
                                            <div className="history-edit-form">
                                                <div className="history-edit-grid">
                                                    <Field label="기록 당시 반">
                                                        <select
                                                            aria-label="누적 기록 당시 반 수정"
                                                            value={editDraft.currentClass}
                                                            onChange={event => updateEntryEdit("currentClass", event.target.value)}
                                                        >
                                                            <option value="">선택</option>
                                                            {CLASS_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                                                        </select>
                                                    </Field>
                                                    <Field label="관리 상태">
                                                        <select
                                                            aria-label="누적 기록 관리 상태 수정"
                                                            value={editDraft.recordStatus}
                                                            onChange={event => updateEntryEdit("recordStatus", event.target.value)}
                                                        >
                                                            {(freshMode ? FRESH_RECORD_STATUS_OPTIONS : RECORD_STATUS_OPTIONS).map(item => <option key={item} value={item}>{item}</option>)}
                                                        </select>
                                                    </Field>
                                                    <Field label="반 이동 가능성">
                                                        <select
                                                            aria-label="누적 기록 반 이동 가능성 수정"
                                                            value={editDraft.nextClassPotential}
                                                            onChange={event => updateEntryEdit("nextClassPotential", event.target.value)}
                                                        >
                                                            {MOVE_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                                                        </select>
                                                    </Field>
                                                </div>
                                                <Field label="기록 메모">
                                                    <textarea
                                                        aria-label="누적 기록 메모 수정"
                                                        value={editDraft.entryNote}
                                                        onChange={event => updateEntryEdit("entryNote", event.target.value)}
                                                    />
                                                </Field>
                                                <Field label="배운 개념·수업 내용">
                                                    <textarea
                                                        aria-label="누적 기록 배운 개념·수업 내용 수정"
                                                        value={editDraft.classProgress}
                                                        onChange={event => updateEntryEdit("classProgress", event.target.value)}
                                                    />
                                                </Field>
                                                <Field label="다음 수업 목표">
                                                    <textarea
                                                        aria-label="누적 기록 다음 수업 목표 수정"
                                                        value={editDraft.currentGoal}
                                                        onChange={event => updateEntryEdit("currentGoal", event.target.value)}
                                                    />
                                                </Field>
                                                <Field label="잘한 점">
                                                    <textarea
                                                        aria-label="누적 기록 잘한 점 수정"
                                                        value={editDraft.strengths}
                                                        onChange={event => updateEntryEdit("strengths", event.target.value)}
                                                    />
                                                </Field>
                                                <Field label="보완할 점">
                                                    <textarea
                                                        aria-label="누적 기록 보완할 점 수정"
                                                        value={editDraft.weaknesses}
                                                        onChange={event => updateEntryEdit("weaknesses", event.target.value)}
                                                    />
                                                </Field>
                                                <Field label="학부모 전달 문구">
                                                    <textarea
                                                        aria-label="누적 기록 학부모 전달 문구 수정"
                                                        value={editDraft.parentFeedbackDraft}
                                                        onChange={event => updateEntryEdit("parentFeedbackDraft", event.target.value)}
                                                    />
                                                </Field>
                                                <Field label="내부 메모">
                                                    <textarea
                                                        aria-label="누적 기록 내부 메모 수정"
                                                        value={editDraft.teacherMemo}
                                                        onChange={event => updateEntryEdit("teacherMemo", event.target.value)}
                                                    />
                                                </Field>
                                                <div className="history-edit-actions">
                                                    <button className="outline" onClick={cancelEntryEdit} disabled={entrySaving}>취소</button>
                                                    <button className="primary" onClick={() => void saveEntryEdit()} disabled={entrySaving}>
                                                        {entrySaving ? "저장 중..." : "수정 내용 저장"}
                                                    </button>
                                                </div>
                                                <small className="history-edit-help">선택한 날짜의 누적 기록만 수정됩니다.</small>
                                            </div>
                                        ) : (
                                            <div className="history-card-body">
                                                <p className="history-summary">{entry.entry_note || entry.class_progress || entry.parent_feedback_draft || "성장 기록 저장"}</p>
                                                <dl>
                                                    <div><dt>배운 내용</dt><dd>{compact(entry.class_progress, 120)}</dd></div>
                                                    <div><dt>다음 목표</dt><dd>{compact(entry.current_goal, 120)}</dd></div>
                                                    <div><dt>잘한 점</dt><dd>{compact(entry.strengths, 120)}</dd></div>
                                                </dl>
                                            </div>
                                        )}
                                    </article>
                                );
                            }) : <p className="muted">아직 누적 기록이 없습니다.</p>}
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
                    grid-template-columns: minmax(0, 1fr) 410px;
                    gap: 20px;
                    color: #0f172a;
                    background:
                        linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%);
                    font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
                }
                .growth-main {
                    min-width: 0;
                }
                .growth-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 16px;
                }
                .eyebrow {
                    font-size: 12px;
                    letter-spacing: 0;
                    font-weight: 900;
                    color: #4b5563;
                }
                h1 {
                    margin: 4px 0 8px;
                    font-size: 32px;
                    line-height: 1.2;
                    letter-spacing: 0;
                }
                h2, h3, p { margin: 0; }
                .growth-header p {
                    color: #6b7280;
                    font-size: 14px;
                    font-weight: 600;
                    max-width: 760px;
                    line-height: 1.6;
                }
                .title-line {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .live-badge {
                    display: inline-flex;
                    align-items: center;
                    min-height: 26px;
                    padding: 0 10px;
                    border-radius: 999px;
                    border: 1px solid #bbf7d0;
                    background: #ecfdf5;
                    color: #047857;
                    font-size: 11px;
                    font-weight: 950;
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
                .growth-summary {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 10px;
                    margin-bottom: 14px;
                }
                .growth-summary article {
                    min-width: 0;
                    border: 1px solid #dbe7f5;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, .9);
                    padding: 14px 16px;
                    box-shadow: 0 10px 28px rgba(37, 99, 235, .05);
                }
                .growth-summary span,
                .growth-summary small {
                    display: block;
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 850;
                }
                .growth-summary strong {
                    display: block;
                    margin: 5px 0 3px;
                    color: #172554;
                    font-size: 24px;
                    line-height: 1;
                    font-weight: 950;
                }
                .filters {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 280px;
                    gap: 12px;
                    margin-bottom: 12px;
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
                    background: rgba(255,255,255,.86);
                    border-radius: 10px;
                    overflow: auto;
                    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
                    max-height: calc(100vh - 320px);
                }
                .table-head, .student-row {
                    display: grid;
                    grid-template-columns: 90px 116px 138px 76px 112px 126px minmax(190px, 1fr) minmax(190px, 1fr) minmax(190px, 1fr) minmax(190px, 1fr);
                    gap: 10px;
                    align-items: center;
                    min-width: 1480px;
                }
                .table-head {
                    position: sticky;
                    top: 0;
                    z-index: 3;
                    min-height: 46px;
                    padding: 0 14px;
                    background: rgba(248, 250, 252, .96);
                    backdrop-filter: blur(14px);
                    color: #4b5563;
                    border-bottom: 1px solid #e5edf6;
                    font-size: 11px;
                    font-weight: 950;
                    text-transform: uppercase;
                }
                .student-row {
                    width: 100%;
                    min-height: 62px;
                    padding: 9px 14px;
                    border: 0;
                    border-bottom: 1px solid #edf1f6;
                    background: #fff;
                    color: #0f172a;
                    text-align: left;
                    font-size: 13px;
                    font-weight: 760;
                    transition: background .16s ease, box-shadow .16s ease;
                }
                .student-row:hover, .student-row.selected { background: #f5f9ff; }
                .student-row.not-started { background: #fffaf2; }
                .student-row.not-started:hover, .student-row.not-started.selected { background: #fff4df; }
                .student-row.selected {
                    box-shadow: inset 3px 0 0 #2563eb, inset 0 0 0 1px rgba(37, 99, 235, .18);
                }
                .student-row span {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .name-cell {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 2px;
                }
                .name-cell strong {
                    display: block;
                    font-size: 14px;
                    font-weight: 950;
                    white-space: nowrap;
                }
                .name-cell small {
                    display: block;
                    max-width: 82px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 850;
                }
                .plain-cell {
                    color: #334155;
                    font-weight: 850;
                }
                .long-cell {
                    color: #1f2937;
                    line-height: 1.35;
                }
                .class-badge {
                    display: inline-flex;
                    align-items: center;
                    min-height: 24px;
                    max-width: 108px;
                    padding: 0 8px;
                    border: 1px solid #d9e1ec;
                    border-radius: 999px;
                    background: #f8fafc;
                    font-style: normal;
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 850;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .class-badge.not-started,
                .class-badge.default {
                    color: #64748b;
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }
                .class-badge.not-started {
                    color: #b45309;
                    background: #fff7ed;
                    border-color: #fed7aa;
                }
                .class-badge.foundation { color: #075985; background: #e0f2fe; border-color: #bae6fd; }
                .class-badge.interest { color: #166534; background: #dcfce7; border-color: #bbf7d0; }
                .class-badge.maker { color: #9a3412; background: #ffedd5; border-color: #fed7aa; }
                .class-badge.project { color: #1d4ed8; background: #dbeafe; border-color: #bfdbfe; }
                .class-badge.contest { color: #7e22ce; background: #f3e8ff; border-color: #e9d5ff; }
                .class-badge.school { color: #be123c; background: #ffe4e6; border-color: #fecdd3; }
                .class-badge.cert { color: #0f766e; background: #ccfbf1; border-color: #99f6e4; }
                .status-badge, .move-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 24px;
                    max-width: 112px;
                    padding: 0 8px;
                    border-radius: 7px;
                    border: 1px solid #d9e1ec;
                    font-style: normal;
                    font-size: 12px;
                    font-weight: 900;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .status-badge.watch, .move-badge.neutral { color: #475569; background: #f8fafc; border-color: #e2e8f0; }
                .status-badge.draft { color: #92400e; background: #fffbeb; border-color: #fde68a; }
                .status-badge.ready { color: #5b21b6; background: #ede9fe; border-color: #ddd6fe; }
                .status-badge.done { color: #047857; background: #ecfdf5; border-color: #bbf7d0; }
                .status-badge.danger, .move-badge.danger { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
                .move-badge.go { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
                .move-badge.watch { color: #b45309; background: #fffbeb; border-color: #fde68a; }
                .matrix-card::-webkit-scrollbar,
                .detail-panel::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }
                .matrix-card::-webkit-scrollbar-thumb,
                .detail-panel::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                    border: 2px solid #f8fafc;
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
                    background: rgba(255,255,255,.92);
                    border-radius: 10px;
                    padding: 18px;
                    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
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
                .growth-workflow {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 6px;
                    margin-bottom: 14px;
                }
                .growth-workflow span {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid #e2e8f0;
                    border-radius: 9px;
                    background: #f8fafc;
                    color: #64748b;
                    padding: 8px;
                    font-size: 10px;
                    font-weight: 900;
                    line-height: 1.25;
                }
                .growth-workflow span.complete {
                    border-color: #bfdbfe;
                    background: #eff6ff;
                    color: #1d4ed8;
                }
                .growth-workflow b {
                    flex: 0 0 auto;
                    width: 20px;
                    height: 20px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    background: #e2e8f0;
                    color: #475569;
                    font-size: 10px;
                }
                .growth-workflow .complete b {
                    background: #2563eb;
                    color: #fff;
                }
                .autosave-note {
                    display: grid;
                    grid-template-columns: auto minmax(0, 1fr);
                    gap: 8px;
                    align-items: start;
                    margin-bottom: 14px;
                    border: 1px solid #dbeafe;
                    border-radius: 9px;
                    background: #eff6ff;
                    padding: 10px 12px;
                    color: #475569;
                    font-size: 11px;
                    font-weight: 750;
                    line-height: 1.45;
                }
                .autosave-note strong { color: #1d4ed8; white-space: nowrap; }
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
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                    margin: 16px 0 18px;
                }
                .detail-actions button {
                    min-width: 0;
                    min-height: 42px;
                    padding: 0 10px;
                    font-size: 13px;
                    font-weight: 850;
                    line-height: 1;
                    white-space: nowrap;
                    word-break: keep-all;
                    letter-spacing: 0;
                }
                .history {
                    border-top: 1px solid #e5edf6;
                    padding-top: 14px;
                }
                .history-title {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 10px;
                }
                .history-title h3 { margin-bottom: 3px; font-size: 15px; }
                .history-title p { color: #64748b; font-size: 11px; font-weight: 750; line-height: 1.45; }
                .history-title > span {
                    flex: 0 0 auto;
                    border-radius: 999px;
                    background: #eff6ff;
                    color: #1d4ed8;
                    padding: 4px 9px;
                    font-size: 11px;
                    font-weight: 900;
                }
                .history article {
                    border: 1px solid #e5edf6;
                    border-radius: 10px;
                    padding: 12px;
                    margin-bottom: 10px;
                    background: #fff;
                    transition: border-color .16s ease, box-shadow .16s ease;
                }
                .history article.editing {
                    border-color: #93c5fd;
                    box-shadow: 0 12px 28px rgba(37, 99, 235, .10);
                }
                .history-card-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                .history-card-head > div {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                }
                .history-card-head strong { color: #2563eb; font-size: 12px; }
                .history-edit-button {
                    flex: 0 0 auto;
                    min-height: 32px;
                    border: 1px solid #bfdbfe;
                    border-radius: 7px;
                    background: #eff6ff;
                    color: #1d4ed8;
                    padding: 0 10px;
                    font-size: 11px;
                    font-weight: 900;
                }
                .history-summary {
                    margin: 0;
                    color: #334155;
                    font-size: 13px;
                    font-weight: 850;
                    line-height: 1.55;
                }
                .history-card-body dl {
                    display: grid;
                    gap: 7px;
                    margin-top: 10px;
                }
                .history-card-body dl div {
                    display: grid;
                    grid-template-columns: 62px minmax(0, 1fr);
                    gap: 8px;
                    align-items: start;
                }
                .history-card-body dt { color: #64748b; font-size: 11px; font-weight: 900; }
                .history-card-body dd { color: #475569; font-size: 11px; font-weight: 750; line-height: 1.45; }
                .history-edit-form { display: grid; gap: 11px; }
                .history-edit-grid { display: grid; gap: 9px; }
                .history-edit-form textarea { min-height: 82px; }
                .history-edit-actions {
                    display: grid;
                    grid-template-columns: 1fr 1.4fr;
                    gap: 8px;
                    margin-top: 2px;
                }
                .history-edit-actions button { min-height: 40px; font-size: 12px; font-weight: 900; }
                .history-edit-help { color: #64748b; font-size: 11px; font-weight: 750; text-align: right; }
                .history article .status-badge {
                    min-height: 22px;
                    max-width: 100px;
                    font-size: 10px;
                }
                .muted { color: #64748b; font-size: 13px; line-height: 1.55; }
                @media (max-width: 1280px) {
                    .growth-page { grid-template-columns: 1fr; }
                    .detail-panel { position: static; height: auto; }
                    .matrix-card { max-height: 62vh; }
                }
                @media (max-width: 1040px) {
                    .growth-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
                @media (max-width: 820px) {
                    .growth-header { flex-direction: column; }
                    .filters { grid-template-columns: 1fr; }
                    .table-head, .student-row {
                        min-width: 1380px;
                        grid-template-columns: 82px 104px 122px 70px 108px 120px minmax(170px, 1fr) minmax(170px, 1fr) minmax(170px, 1fr) minmax(170px, 1fr);
                    }
                    .detail-actions { grid-template-columns: 1fr; }
                }
                @media (max-width: 520px) {
                    .growth-summary { grid-template-columns: 1fr 1fr; }
                    .growth-summary article { padding: 12px; }
                    .growth-workflow { grid-template-columns: 1fr; }
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
