"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ClipboardCopy, RefreshCw, Save, Trash2 } from "lucide-react";

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

type ApiResponse = {
    success: boolean;
    migrationRequired?: boolean;
    students?: StudentOption[];
    records?: GrowthRecord[];
    record?: GrowthRecord;
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
};

const TRACKS = ["공통기초반", "흥미반", "만들기반", "프로젝트반", "대회반"];
const LEVELS = ["입문", "기초", "반복 훈련", "독립 구현", "심화", "대회 준비"];
const MOVE_OPTIONS = ["유지", "관찰 필요", "다음 반 이동 가능", "보강 후 이동", "상담 필요"];

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
    };
}

function formatDate(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function buildParentCopy(form: FormState) {
    const lines = [
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
    ];
    return lines.join("\n");
}

export default function GrowthManagementPage() {
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [records, setRecords] = useState<GrowthRecord[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [migrationRequired, setMigrationRequired] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

    const recordByStudent = useMemo(() => {
        return new Map(records.map(record => [record.student_id, record]));
    }, [records]);

    const studentById = useMemo(() => {
        return new Map(students.map(student => [student.id, student]));
    }, [students]);

    const filteredStudents = useMemo(() => {
        const normalizedQuery = query.trim().replace(/\s+/g, "");
        return students.filter(student => {
            if (!normalizedQuery) return true;
            return student.name.replace(/\s+/g, "").includes(normalizedQuery)
                || (student.class || "").replace(/\s+/g, "").includes(normalizedQuery);
        });
    }, [query, students]);

    const completion = useMemo(() => {
        const keys: (keyof FormState)[] = [
            "studentName",
            "currentClass",
            "temperament",
            "skillLevel",
            "strengths",
            "weaknesses",
            "currentGoal",
            "nextClassPotential",
            "parentFeedbackDraft",
        ];
        const filled = keys.filter(key => form[key].trim()).length;
        return Math.round((filled / keys.length) * 100);
    }, [form]);

    const load = useCallback(async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/growth-management", { cache: "no-store" });
            const data = await res.json() as ApiResponse;
            if (!res.ok || !data.success) throw new Error(data.error || "관리표를 불러오지 못했습니다.");

            const nextStudents = data.students || [];
            const nextRecords = data.records || [];
            setStudents(nextStudents);
            setRecords(nextRecords);
            setMigrationRequired(Boolean(data.migrationRequired));

            const firstId = selectedId || nextStudents[0]?.id || "";
            if (firstId) {
                selectStudent(firstId, nextStudents, nextRecords);
            }
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "관리표 조회 실패" });
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => {
        void load();
    }, [load]);

    const selectStudent = (studentId: string, sourceStudents = students, sourceRecords = records) => {
        const student = sourceStudents.find(item => item.id === studentId);
        const record = sourceRecords.find(item => item.student_id === studentId);
        setSelectedId(studentId);
        if (record) {
            setForm(toForm(record, student));
            return;
        }
        setForm({
            ...EMPTY_FORM,
            studentId,
            studentName: student?.name || "",
            currentClass: student?.class || "",
        });
    };

    const updateField = (key: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const save = async () => {
        if (!form.studentId || !form.studentName.trim()) {
            setMessage({ type: "error", text: "학생을 먼저 선택해주세요." });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/growth-management", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json() as ApiResponse;
            if (!res.ok || !data.success || !data.record) throw new Error(data.error || "저장 실패");

            setRecords(prev => {
                const others = prev.filter(record => record.student_id !== data.record?.student_id);
                return [data.record as GrowthRecord, ...others];
            });
            setMigrationRequired(false);
            setMessage({ type: "ok", text: `${form.studentName} 관리표를 저장했습니다.` });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "저장 실패" });
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!form.studentId) return;
        const ok = window.confirm(`${form.studentName} 성장 관리표 내용을 삭제할까요? 학생 자체나 학부모 코드는 삭제되지 않습니다.`);
        if (!ok) return;

        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch("/api/teacher/growth-management", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: form.studentId }),
            });
            const data = await res.json() as ApiResponse;
            if (!res.ok || !data.success) throw new Error(data.error || "삭제 실패");
            setRecords(prev => prev.filter(record => record.student_id !== form.studentId));
            const student = studentById.get(form.studentId);
            setForm({ ...EMPTY_FORM, studentId: form.studentId, studentName: student?.name || "", currentClass: student?.class || "" });
            setMessage({ type: "ok", text: "관리표 내용을 삭제했습니다." });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "삭제 실패" });
        } finally {
            setSaving(false);
        }
    };

    const copyParentDraft = async () => {
        try {
            await navigator.clipboard.writeText(buildParentCopy(form));
            setMessage({ type: "ok", text: "학부모 전달용 초안을 복사했습니다." });
        } catch {
            setMessage({ type: "error", text: "복사 권한이 없어 실패했습니다." });
        }
    };

    const selectedRecord = recordByStudent.get(form.studentId);

    return (
        <div className="growth-page">
            <header className="growth-head">
                <div>
                    <div className="eyebrow">Student Growth Management</div>
                    <h1>학생 성장 관리표</h1>
                    <p>선생님이 학생별 현재 위치, 강점, 부족한 점, 다음 목표, 반 이동 가능성, 학부모 전달사항을 한 화면에서 정리합니다.</p>
                </div>
                <div className="head-actions">
                    <button className="ghost" onClick={() => void load()} disabled={loading || saving}>
                        <RefreshCw size={16} />
                        새로고침
                    </button>
                    <button className="primary" onClick={save} disabled={saving || migrationRequired}>
                        <Save size={16} />
                        {saving ? "저장 중" : "저장"}
                    </button>
                </div>
            </header>

            <section className="mission-strip">
                {["학생별 성장 기록 관리", "반별 수업 진행 상황 정리", "반 이동 가능 학생 체크", "학부모 피드백 초안 정리"].map((item, index) => (
                    <div key={item} className="mission-item">
                        <span>{index + 1}</span>
                        <strong>{item}</strong>
                    </div>
                ))}
            </section>

            {migrationRequired && (
                <div className="notice error">
                    운영 DB에 `student_growth_management` 테이블 migration이 아직 적용되지 않았습니다. 화면 조회는 가능하지만 저장은 DB 적용 후 동작합니다.
                </div>
            )}
            {message && <div className={`notice ${message.type}`}>{message.text}</div>}

            <div className="growth-grid">
                <aside className="student-list">
                    <div className="list-top">
                        <div>
                            <strong>학생 목록</strong>
                            <small>{records.length}명 작성됨 / {students.length}명</small>
                        </div>
                        <div className="completion">{completion}%</div>
                    </div>
                    <input
                        className="search"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        placeholder="학생 또는 반 검색"
                    />
                    <div className="list-scroll">
                        {loading ? (
                            <div className="empty">불러오는 중입니다.</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="empty">표시할 학생이 없습니다.</div>
                        ) : (
                            filteredStudents.map(student => {
                                const record = recordByStudent.get(student.id);
                                const active = selectedId === student.id;
                                return (
                                    <button
                                        key={student.id}
                                        className={`student-button ${active ? "active" : ""}`}
                                        onClick={() => selectStudent(student.id)}
                                    >
                                        <span className="initial">{student.name.slice(0, 1)}</span>
                                        <span className="student-meta">
                                            <strong>{student.name}</strong>
                                            <small>{student.class || "반 미지정"} · {record ? `수정 ${formatDate(record.updated_at)}` : "미작성"}</small>
                                        </span>
                                        <span className={`dot ${record ? "done" : ""}`} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                <main className="editor">
                    <div className="editor-head">
                        <div>
                            <div className="eyebrow small">Weekly Student Brief</div>
                            <h2>{form.studentName || "학생 선택"}</h2>
                            <p>{selectedRecord ? `마지막 수정: ${formatDate(selectedRecord.updated_at)}` : "아직 작성된 관리표가 없습니다."}</p>
                        </div>
                        <div className="editor-actions">
                            <button className="ghost" onClick={copyParentDraft} disabled={!form.studentId}>
                                <ClipboardCopy size={16} />
                                피드백 복사
                            </button>
                            <button className="danger" onClick={remove} disabled={!selectedRecord || saving}>
                                <Trash2 size={16} />
                                내용 삭제
                            </button>
                        </div>
                    </div>

                    <section className="form-grid">
                        <Field label="이름">
                            <input value={form.studentName} onChange={event => updateField("studentName", event.target.value)} />
                        </Field>
                        <Field label="현재 반">
                            <select value={form.currentClass} onChange={event => updateField("currentClass", event.target.value)}>
                                <option value="">선택</option>
                                {TRACKS.map(track => <option key={track} value={track}>{track}</option>)}
                            </select>
                        </Field>
                        <Field label="성향">
                            <input value={form.temperament} onChange={event => updateField("temperament", event.target.value)} placeholder="예: 꼼꼼함, 빠른 시도형, 질문 많음" />
                        </Field>
                        <Field label="실력 단계">
                            <select value={form.skillLevel} onChange={event => updateField("skillLevel", event.target.value)}>
                                <option value="">선택</option>
                                {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                            </select>
                        </Field>
                        <Field label="현재 목표">
                            <input value={form.currentGoal} onChange={event => updateField("currentGoal", event.target.value)} placeholder="이번 달 목표" />
                        </Field>
                        <Field label="다음 반 이동 가능성">
                            <select value={form.nextClassPotential} onChange={event => updateField("nextClassPotential", event.target.value)}>
                                <option value="">선택</option>
                                {MOVE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </Field>
                    </section>

                    <section className="text-grid">
                        <TextArea label="잘하는 점" value={form.strengths} onChange={value => updateField("strengths", value)} placeholder="학생이 안정적으로 해내는 부분" />
                        <TextArea label="부족한 점" value={form.weaknesses} onChange={value => updateField("weaknesses", value)} placeholder="보완이 필요한 개념, 습관, 태도" />
                        <TextArea label="반별 수업 진행 상황" value={form.classProgress} onChange={value => updateField("classProgress", value)} placeholder="이번 주 수업 흐름, 진도, 관찰 내용" />
                        <TextArea label="학부모 전달사항" value={form.parentFeedbackDraft} onChange={value => updateField("parentFeedbackDraft", value)} placeholder="학부모에게 전달할 피드백 초안" />
                        <TextArea label="내부 메모" value={form.teacherMemo} onChange={value => updateField("teacherMemo", value)} placeholder="선생님끼리만 볼 참고사항" wide />
                    </section>
                </main>
            </div>

            <style>{`
                .growth-page {
                    min-height: 100vh;
                    padding: 46px 52px;
                    background: #f5f8fc;
                    color: #0f172a;
                    font-family: Pretendard, "Noto Sans KR", system-ui, sans-serif;
                }
                .growth-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 24px;
                    margin-bottom: 18px;
                }
                .eyebrow {
                    color: #2563eb;
                    font-size: 12px;
                    font-weight: 950;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                .eyebrow.small {
                    font-size: 10px;
                    margin-bottom: 5px;
                }
                h1, h2 {
                    margin: 0;
                    letter-spacing: -0.045em;
                    line-height: 1.05;
                }
                h1 {
                    font-size: clamp(36px, 4vw, 58px);
                    font-weight: 950;
                    margin-bottom: 12px;
                }
                h2 {
                    font-size: 30px;
                    font-weight: 950;
                    margin-bottom: 6px;
                }
                p {
                    margin: 0;
                    color: #52627a;
                    font-size: 15px;
                    line-height: 1.65;
                    font-weight: 650;
                    max-width: 780px;
                }
                .head-actions, .editor-actions {
                    display: flex;
                    gap: 9px;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                }
                button {
                    font-family: inherit;
                }
                .primary, .ghost, .danger {
                    border: 1px solid #d6e2f0;
                    min-height: 42px;
                    border-radius: 12px;
                    padding: 0 15px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-weight: 950;
                    cursor: pointer;
                    background: #ffffff;
                    color: #24334b;
                }
                .primary {
                    background: #2563eb;
                    border-color: #2563eb;
                    color: #ffffff;
                }
                .danger {
                    background: #fff7f7;
                    border-color: #fecaca;
                    color: #b91c1c;
                }
                button:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                }
                .mission-strip {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .mission-item {
                    background: #ffffff;
                    border: 1px solid #dbe6f3;
                    border-radius: 14px;
                    min-height: 70px;
                    padding: 14px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .mission-item span {
                    width: 28px;
                    height: 28px;
                    border-radius: 9px;
                    background: #eaf2ff;
                    color: #2563eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 950;
                    flex: 0 0 auto;
                }
                .mission-item strong {
                    font-size: 13px;
                    line-height: 1.35;
                    font-weight: 950;
                }
                .notice {
                    border: 1px solid;
                    border-radius: 12px;
                    padding: 14px 16px;
                    margin-bottom: 14px;
                    font-weight: 850;
                    line-height: 1.5;
                }
                .notice.ok {
                    background: #ecfdf5;
                    color: #047857;
                    border-color: #bbf7d0;
                }
                .notice.error {
                    background: #fef2f2;
                    color: #b91c1c;
                    border-color: #fecaca;
                }
                .growth-grid {
                    display: grid;
                    grid-template-columns: 340px minmax(0, 1fr);
                    gap: 18px;
                    align-items: start;
                }
                .student-list, .editor {
                    background: #ffffff;
                    border: 1px solid #dbe6f3;
                    border-radius: 18px;
                    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.05);
                }
                .student-list {
                    padding: 16px;
                    position: sticky;
                    top: 24px;
                }
                .list-top {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .list-top strong {
                    display: block;
                    font-size: 17px;
                    font-weight: 950;
                }
                .list-top small {
                    display: block;
                    margin-top: 3px;
                    color: #7c8aa0;
                    font-size: 12px;
                    font-weight: 750;
                }
                .completion {
                    min-width: 54px;
                    height: 36px;
                    border-radius: 12px;
                    background: #eff6ff;
                    color: #1d4ed8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 950;
                    font-size: 13px;
                }
                .search, input, select, textarea {
                    width: 100%;
                    border: 1px solid #d8e3f1;
                    border-radius: 12px;
                    background: #fbfdff;
                    color: #0f172a;
                    outline: none;
                    font-weight: 750;
                    font-size: 14px;
                }
                .search, input, select {
                    min-height: 44px;
                    padding: 0 13px;
                }
                textarea {
                    min-height: 132px;
                    resize: vertical;
                    padding: 13px;
                    line-height: 1.55;
                }
                .list-scroll {
                    max-height: calc(100vh - 250px);
                    overflow: auto;
                    padding-top: 10px;
                }
                .student-button {
                    width: 100%;
                    border: 1px solid transparent;
                    border-radius: 13px;
                    background: transparent;
                    min-height: 62px;
                    padding: 9px;
                    display: grid;
                    grid-template-columns: 42px minmax(0, 1fr) 10px;
                    gap: 10px;
                    align-items: center;
                    text-align: left;
                    cursor: pointer;
                    color: #132037;
                }
                .student-button.active {
                    background: #eef5ff;
                    border-color: #bfdbfe;
                }
                .initial {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: #eaf2ff;
                    color: #2563eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 950;
                }
                .student-meta {
                    min-width: 0;
                }
                .student-meta strong {
                    display: block;
                    font-size: 14px;
                    font-weight: 950;
                    margin-bottom: 3px;
                }
                .student-meta small {
                    display: block;
                    color: #7c8aa0;
                    font-size: 11px;
                    font-weight: 750;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 999px;
                    background: #cbd5e1;
                }
                .dot.done {
                    background: #22c55e;
                }
                .empty {
                    padding: 28px 8px;
                    text-align: center;
                    color: #7c8aa0;
                    font-weight: 850;
                }
                .editor {
                    padding: 22px;
                }
                .editor-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 18px;
                    align-items: flex-start;
                    padding-bottom: 18px;
                    border-bottom: 1px solid #e8eef7;
                    margin-bottom: 18px;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                    margin-bottom: 14px;
                }
                .field label, .textarea-field label {
                    display: block;
                    font-size: 12px;
                    color: #3b4b63;
                    font-weight: 950;
                    margin-bottom: 8px;
                }
                .text-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                }
                .textarea-field.wide {
                    grid-column: 1 / -1;
                }
                @media (max-width: 1180px) {
                    .growth-page {
                        padding: 34px 24px;
                    }
                    .mission-strip {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    .growth-grid {
                        grid-template-columns: 1fr;
                    }
                    .student-list {
                        position: static;
                    }
                    .list-scroll {
                        max-height: 360px;
                    }
                }
                @media (max-width: 767px) {
                    .growth-page {
                        padding: 76px 16px 24px;
                    }
                    .growth-head, .editor-head {
                        flex-direction: column;
                    }
                    .head-actions, .editor-actions {
                        justify-content: flex-start;
                    }
                    .mission-strip, .form-grid, .text-grid {
                        grid-template-columns: 1fr;
                    }
                    .textarea-field.wide {
                        grid-column: auto;
                    }
                }
            `}</style>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="field">
            <label>{label}</label>
            {children}
        </div>
    );
}

function TextArea({
    label,
    value,
    onChange,
    placeholder,
    wide,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    wide?: boolean;
}) {
    return (
        <div className={`textarea-field ${wide ? "wide" : ""}`}>
            <label>{label}</label>
            <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
        </div>
    );
}
