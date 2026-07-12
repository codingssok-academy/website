"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  Clock3,
  Database,
  FileLock2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Users,
  X,
} from "lucide-react";
import { MOCK_TEACHER_WEEKLY_EVALUATION } from "@/features/growth-v2/data/teacher-weekly-evaluation.mock";
import {
  createLocalTeacherSession,
  fetchLocalTeacherEvaluation,
  fetchLocalTeacherStudents,
  saveLocalTeacherDraft,
} from "./local-teacher-client";
import type {
  LocalConcept,
  LocalDraftForm,
  LocalTeacherEvaluationResponse,
  LocalTeacherSession,
  LocalTeacherStudent,
} from "./types";
import { LocalTeacherPreviewError } from "./types";
import {
  MAX_CUSTOM_CONCEPTS,
  customConceptKey,
  validateCustomConcept,
} from "./custom-concepts";
import styles from "./LocalTeacherDraftPreview.module.css";

type ViewState = "signed-out" | "signing-in" | "ready" | "error";
type FormErrorKey = keyof LocalDraftForm;
type FormErrors = Partial<Record<FormErrorKey, string>>;

const CONCEPTS: Array<Pick<LocalConcept, "key" | "label">> = [
  { key: "for-loop", label: "for 반복문" },
  { key: "condition", label: "조건 비교" },
  { key: "debugging", label: "오류 찾기" },
];

const CHOICES = {
  understanding: [
    ["needs_help", "도움이 더 필요해요"],
    ["understands_basics", "기본 개념을 이해했어요"],
    ["solves_independently", "스스로 문제를 풀 수 있어요"],
    ["applies_elsewhere", "다른 문제에도 활용할 수 있어요"],
  ],
  participation: [
    ["listened", "설명을 들으며 참여했어요"],
    ["asked_questions", "질문하며 참여했어요"],
    ["tried_independently", "스스로 해결을 시도했어요"],
    ["explained_to_friend", "친구에게 설명할 수 있었어요"],
  ],
  homeworkStatus: [
    ["not_submitted", "미제출"],
    ["partly_complete", "일부 완료"],
    ["complete", "완료"],
    ["extra_challenge", "추가 도전까지 완료"],
  ],
} satisfies Record<string, Array<[string, string]>>;

const EMPTY_FORM: LocalDraftForm = {
  understanding: "understands_basics",
  participation: "listened",
  homeworkStatus: "partly_complete",
  strength: "",
  improvement: "",
  nextGoal: "",
  conceptKeys: [],
  customConcepts: [],
};

function formFromEvaluation(response: LocalTeacherEvaluationResponse): LocalDraftForm {
  const source = response.data.draft ?? response.data.published;
  if (!source) return { ...EMPTY_FORM, conceptKeys: [], customConcepts: [] };
  const selectedConcepts = source.selected_concepts ?? source.concepts;
  return {
    understanding: source.understanding,
    participation: source.participation,
    homeworkStatus: source.homework_status,
    strength: source.strength,
    improvement: source.improvement,
    nextGoal: source.next_goal,
    conceptKeys: selectedConcepts.map((concept) => concept.key),
    customConcepts: (source.custom_concepts ?? []).map((concept) => concept.label),
  };
}

function formatSavedAt(value?: string) {
  if (!value) return "저장 시각 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ChoiceGroup({
  label,
  options,
  value,
  disabled,
  onChange,
}: {
  label: string;
  options: Array<[string, string]>;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className={styles.choiceGroup} disabled={disabled}>
      <legend>{label}</legend>
      <div className={styles.choiceGrid}>
        {options.map(([id, text]) => (
          <button
            key={id}
            className={value === id ? styles.choiceSelected : styles.choiceButton}
            type="button"
            aria-pressed={value === id}
            onClick={() => onChange(id)}
          >
            {value === id ? <Check size={15} aria-hidden="true" /> : null}
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
export function LocalTeacherDraftPreview() {
  const [viewState, setViewState] = useState<ViewState>("signed-out");
  const [session, setSession] = useState<LocalTeacherSession | null>(null);
  const [students, setStudents] = useState<LocalTeacherStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<LocalTeacherStudent | null>(null);
  const [evaluation, setEvaluation] = useState<LocalTeacherEvaluationResponse | null>(null);
  const [form, setForm] = useState<LocalDraftForm>({ ...EMPTY_FORM, conceptKeys: [], customConcepts: [] });
  const [customConceptInput, setCustomConceptInput] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const strengthRef = useRef<HTMLTextAreaElement>(null);
  const improvementRef = useRef<HTMLTextAreaElement>(null);
  const nextGoalRef = useRef<HTMLTextAreaElement>(null);
  const conceptRef = useRef<HTMLFieldSetElement>(null);
  const customConceptRef = useRef<HTMLInputElement>(null);

  const clearSession = useCallback(() => {
    setSession(null);
    setStudents([]);
    setSelectedStudent(null);
    setEvaluation(null);
    setForm({ ...EMPTY_FORM, conceptKeys: [], customConcepts: [] });
    setCustomConceptInput("");
    setErrors({});
    setMessage("");
    setErrorMessage("");
    setIsDirty(false);
    setHasConflict(false);
    setViewState("signed-out");
  }, []);

  const showRequestError = useCallback((error: unknown, fallback: string) => {
    if (error instanceof LocalTeacherPreviewError && error.code === "SESSION_EXPIRED") {
      clearSession();
      setViewState("error");
      setErrorMessage(error.message);
      return;
    }
    setErrorMessage(error instanceof Error ? error.message : fallback);
  }, [clearSession]);

  const loadStudent = useCallback(async (
    activeSession: LocalTeacherSession,
    student: LocalTeacherStudent,
  ) => {
    setIsLoadingStudent(true);
    setErrorMessage("");
    setMessage("");
    setHasConflict(false);
    try {
      const next = await fetchLocalTeacherEvaluation(
        activeSession,
        student.id,
        student.week_start,
      );
      setSelectedStudent(student);
      setEvaluation(next);
      setForm(formFromEvaluation(next));
      setCustomConceptInput("");
      setErrors({});
      setIsDirty(false);
    } catch (error) {
      showRequestError(error, "학생 평가를 불러오지 못했습니다.");
    } finally {
      setIsLoadingStudent(false);
    }
  }, [showRequestError]);

  const login = useCallback(async () => {
    if (viewState === "signing-in") return;
    setViewState("signing-in");
    setErrorMessage("");
    try {
      const nextSession = await createLocalTeacherSession();
      const studentResponse = await fetchLocalTeacherStudents(nextSession);
      if (!studentResponse.data.length) throw new Error("담당 학생을 찾지 못했습니다.");
      const firstStudent = studentResponse.data[0];
      setSession(nextSession);
      setStudents(studentResponse.data);
      setViewState("ready");
      await loadStudent(nextSession, firstStudent);
    } catch (error) {
      setSession(null);
      setStudents([]);
      setViewState("error");
      setErrorMessage(error instanceof Error ? error.message : "테스트 선생님으로 들어가지 못했습니다.");
    }
  }, [loadStudent, viewState]);

  const updateForm = <K extends keyof LocalDraftForm>(key: K, value: LocalDraftForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setMessage("");
    setHasConflict(false);
    setIsDirty(true);
  };

  const selectedConceptLabels = form.conceptKeys.map((key) =>
    CONCEPTS.find((concept) => concept.key === key)?.label ?? key,
  );

  const addCustomConcept = () => {
    const result = validateCustomConcept(
      customConceptInput,
      form.customConcepts,
      selectedConceptLabels,
    );
    if (result.error) {
      setErrors((current) => ({ ...current, customConcepts: result.error }));
      customConceptRef.current?.focus();
      return;
    }
    updateForm("customConcepts", [...form.customConcepts, result.value]);
    setCustomConceptInput("");
    customConceptRef.current?.focus();
  };

  const removeCustomConcept = (concept: string) => {
    updateForm(
      "customConcepts",
      form.customConcepts.filter((value) => value !== concept),
    );
  };

  const togglePreparedConcept = (concept: LocalConcept) => {
    const isSelected = form.conceptKeys.includes(concept.key);
    if (!isSelected && form.customConcepts.some(
      (custom) => customConceptKey(custom) === customConceptKey(concept.label),
    )) {
      setErrors((current) => ({
        ...current,
        customConcepts: "직접 입력한 개념과 같은 준비된 개념은 함께 선택할 수 없어요.",
      }));
      return;
    }
    updateForm(
      "conceptKeys",
      isSelected
        ? form.conceptKeys.filter((key) => key !== concept.key)
        : [...form.conceptKeys, concept.key],
    );
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const fields: Array<["strength" | "improvement" | "nextGoal", string]> = [
      ["strength", "잘한 점"],
      ["improvement", "보완할 점"],
      ["nextGoal", "다음 수업 목표"],
    ];
    fields.forEach(([key, label]) => {
      const length = form[key].trim().length;
      if (length < 10 || length > 200) nextErrors[key] = `${label}을 10~200자로 적어 주세요.`;
    });
    if (!form.conceptKeys.length && !form.customConcepts.length) {
      nextErrors.conceptKeys = "준비된 개념이나 직접 입력한 개념을 하나 이상 추가해 주세요.";
    }
    setErrors(nextErrors);
    const firstTextError = fields.find(([key]) => nextErrors[key])?.[0];
    if (firstTextError === "strength") strengthRef.current?.focus();
    else if (firstTextError === "improvement") improvementRef.current?.focus();
    else if (firstTextError === "nextGoal") nextGoalRef.current?.focus();
    else if (nextErrors.conceptKeys) conceptRef.current?.focus();
    return Object.keys(nextErrors).length === 0;
  };

  const refreshStudentList = async (activeSession: LocalTeacherSession) => {
    const response = await fetchLocalTeacherStudents(activeSession);
    setStudents(response.data);
    return response.data;
  };

  const saveDraft = useCallback(async () => {
    if (!session || !selectedStudent || !evaluation || isSaving || !validate()) return;
    setIsSaving(true);
    setErrorMessage("");
    setMessage("");
    setHasConflict(false);
    try {
      const result = await saveLocalTeacherDraft(
        session,
        selectedStudent.id,
        evaluation.period.week_start,
        form,
        evaluation.data.draft?.updated_at ?? null,
      );
      if (result.conflict || !result.saved) {
        setHasConflict(true);
        setErrorMessage("다른 곳에서 평가가 변경됐어요. 최신 내용을 다시 불러와 주세요.");
        return;
      }

      let refreshed: LocalTeacherEvaluationResponse;
      try {
        refreshed = await fetchLocalTeacherEvaluation(
          session,
          selectedStudent.id,
          evaluation.period.week_start,
        );
      } catch {
        setErrorMessage("초안 저장 후 실제 저장 내용을 다시 읽지 못했습니다. 최신 내용을 다시 불러와 주세요.");
        return;
      }
      if (!refreshed.data.draft) {
        setErrorMessage("저장된 초안을 확인하지 못했습니다. 최신 내용을 다시 불러와 주세요.");
        return;
      }
      setEvaluation(refreshed);
      setForm(formFromEvaluation(refreshed));
      setIsDirty(false);
      setMessage(`평가 초안 version ${refreshed.data.draft.version}이 실제 로컬 DB에 저장됐습니다.`);
      const nextStudents = await refreshStudentList(session);
      const updatedStudent = nextStudents.find((student) => student.id === selectedStudent.id);
      if (updatedStudent) setSelectedStudent(updatedStudent);
    } catch (error) {
      showRequestError(error, "평가 초안을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  // validate and refreshStudentList only use current render state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation, form, isSaving, selectedStudent, session, showRequestError]);

  if (viewState !== "ready" || !session) {
    const isLoading = viewState === "signing-in";
    return (
      <main className={styles.loginShell}>
        <section className={styles.loginPanel} aria-labelledby="teacher-local-title">
          <span className={styles.loginIcon} aria-hidden="true"><Database size={30} /></span>
          <p className={styles.eyebrow}>Growth 2.0 로컬 연습 DB</p>
          <h1 id="teacher-local-title">선생님 평가 초안 체험</h1>
          <p className={styles.loginIntro}>실제 학생 정보가 아닌 가상 자료로 초안 저장 흐름을 확인합니다.</p>
          <ul className={styles.noticeList}>
            <li>이번 단계는 평가 초안 저장만 연결되어 있습니다.</li>
            <li>저장한 초안은 학생과 학부모에게 아직 공개되지 않습니다.</li>
            <li>새로고침하면 가상 로그인이 해제됩니다.</li>
            <li>운영 DB와 연결되지 않았습니다.</li>
          </ul>
          {errorMessage ? <p className={styles.loginError} role="alert">{errorMessage}</p> : null}
          <button className={styles.primaryButton} type="button" disabled={isLoading} onClick={login}>
            {isLoading ? <><LoaderCircle className={styles.spinner} size={18} /> 로그인 중</> :
              <><LockKeyhole size={18} /> 테스트 선생님으로 들어가기</>}
          </button>
          <Link className={styles.mockLink} href="/growth-preview/teacher">기존 mock 선생님 화면 보기</Link>
        </section>
      </main>
    );
  }

  const draft = evaluation?.data.draft ?? null;
  const published = evaluation?.data.published ?? null;
  const project = evaluation?.data.project ?? null;
  const disabled = isSaving || isLoadingStudent || !evaluation;

  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        <Link href="/growth-preview/teacher" className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          <span><strong>코딩쏙</strong><small>Growth 2.0</small></span>
        </Link>
        <div className={styles.topbarActions}>
          <span className={styles.localBadge}><Database size={15} /> 로컬 연습 DB</span>
          <button type="button" onClick={clearSession}><LogOut size={16} /> 체험 끝내기</button>
        </div>
      </header>

      <div className={styles.safetyBand}>
        <FileLock2 size={18} aria-hidden="true" />
        <strong>평가 초안 저장만 연결됨</strong>
        <span>실제 학생 정보가 아니며 학생·학부모에게 공개되지 않습니다. 운영 DB와 연결되지 않았습니다.</span>
      </div>

      <main className={styles.workspace}>
        <aside className={styles.studentRail} aria-label="담당 학생 목록">
          <div className={styles.railHeading}><Users size={18} /><h2>담당 학생</h2></div>
          <div className={styles.studentList}>
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                className={selectedStudent?.id === student.id ? styles.studentSelected : styles.studentButton}
                disabled={isLoadingStudent || isSaving}
                onClick={() => loadStudent(session, student)}
              >
                <strong>{student.display_name}</strong>
                <span>{student.has_draft ? "초안 저장됨" : student.has_published ? "공개본 있음" : "평가 시작 전"}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.editorArea}>
          <div className={styles.pageHeading}>
            <div>
              <p className={styles.eyebrow}>선생님 주간 평가</p>
              <h1>{selectedStudent?.display_name ?? "학생"} 평가 초안</h1>
              <p>{evaluation ? `${evaluation.period.week_start} ~ ${evaluation.period.week_end}` : "평가를 불러오는 중입니다."}</p>
            </div>
            <div className={styles.statusSummary} aria-label="평가 상태">
              <span className={published ? styles.publishedStatus : styles.emptyStatus}>
                {published ? `기존 공개본 v${published.version}` : "아직 공개된 평가 없음"}
              </span>
              <span className={draft ? styles.draftStatus : styles.emptyStatus}>
                {draft ? `작성 중 v${draft.version}` : "저장된 초안 없음"}
              </span>
            </div>
          </div>

          {isLoadingStudent ? <div className={styles.loadingRow}><LoaderCircle className={styles.spinner} /> 평가 불러오는 중</div> : null}
          {errorMessage ? (
            <div className={styles.errorBanner} role="alert">
              <AlertTriangle size={18} />
              <span>{errorMessage}</span>
              {hasConflict && selectedStudent ? (
                <button type="button" onClick={() => loadStudent(session, selectedStudent)}><RefreshCw size={15} /> 최신 내용 다시 불러오기</button>
              ) : null}
            </div>
          ) : null}

          <div className={styles.contentGrid}>
            <form className={styles.formPanel} onSubmit={(event) => event.preventDefault()}>
              <div className={styles.sectionHeading}>
                <BookOpenCheck size={20} />
                <div><h2>빠른 평가 입력</h2><p>변경한 내용은 저장 버튼을 누르기 전까지 DB에 반영되지 않습니다.</p></div>
                {isDirty ? <span className={styles.unsavedBadge}>저장되지 않은 변경</span> : null}
              </div>

              <ChoiceGroup label="이번 주 수업 이해도" options={CHOICES.understanding} value={form.understanding} disabled={disabled} onChange={(value) => updateForm("understanding", value)} />
              <ChoiceGroup label="수업 참여 모습" options={CHOICES.participation} value={form.participation} disabled={disabled} onChange={(value) => updateForm("participation", value)} />
              <ChoiceGroup label="과제 상태" options={CHOICES.homeworkStatus} value={form.homeworkStatus} disabled={disabled} onChange={(value) => updateForm("homeworkStatus", value)} />

              <fieldset className={styles.conceptGroup} ref={conceptRef} tabIndex={-1} disabled={disabled}>
                <legend>이번 주에 배운 개념</legend>
                <div className={styles.conceptOptions}>
                  {CONCEPTS.map((concept) => (
                    <label key={concept.key}>
                      <input
                        type="checkbox"
                        checked={form.conceptKeys.includes(concept.key)}
                        onChange={() => togglePreparedConcept(concept as LocalConcept)}
                      />
                      <span>{concept.label}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.customConceptSection}>
                  <div className={styles.customConceptHeading}>
                    <div>
                      <h3>직접 입력한 개념</h3>
                      <p>준비된 목록에 없는 개념은 직접 추가할 수 있어요.</p>
                    </div>
                    <strong aria-label={`직접 입력 개념 ${form.customConcepts.length}개, 최대 ${MAX_CUSTOM_CONCEPTS}개`}>
                      {form.customConcepts.length}/{MAX_CUSTOM_CONCEPTS}
                    </strong>
                  </div>
                  <div className={styles.customConceptInputRow}>
                    <label className={styles.srOnly} htmlFor="local-custom-concept">직접 입력할 개념</label>
                    <input
                      id="local-custom-concept"
                      ref={customConceptRef}
                      type="text"
                      maxLength={41}
                      value={customConceptInput}
                      disabled={disabled}
                      placeholder="예: 리스트, 함수, 터틀 그래픽"
                      aria-describedby="local-custom-concept-help"
                      onChange={(event) => {
                        setCustomConceptInput(event.target.value);
                        setErrors((current) => ({ ...current, customConcepts: undefined }));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomConcept();
                        }
                      }}
                    />
                    <button type="button" disabled={disabled} onClick={addCustomConcept}>
                      <Plus size={17} aria-hidden="true" /> 추가
                    </button>
                  </div>
                  <p id="local-custom-concept-help" className={styles.customConceptHelp}>2~40자, 최대 5개까지 입력할 수 있어요.</p>
                  {form.customConcepts.length ? (
                    <div className={styles.customConceptTags} aria-label="직접 입력한 개념 목록">
                      {form.customConcepts.map((concept) => (
                        <span key={concept}>
                          <b>{concept}</b>
                          <button
                            type="button"
                            disabled={disabled}
                            aria-label={`${concept} 개념 제거`}
                            onClick={() => removeCustomConcept(concept)}
                          >
                            <X size={14} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {errors.customConcepts ? <p className={styles.fieldError} role="alert">{errors.customConcepts}</p> : null}
                {errors.conceptKeys ? <p className={styles.fieldError} role="alert">{errors.conceptKeys}</p> : null}
              </fieldset>

              {([
                ["strength", "잘한 점", strengthRef],
                ["improvement", "보완할 점", improvementRef],
                ["nextGoal", "다음 수업 목표", nextGoalRef],
              ] as const).map(([key, label, ref]) => (
                <div className={styles.textField} key={key}>
                  <div className={styles.labelRow}><label htmlFor={`local-${key}`}>{label}</label><span>{form[key].length}/200자</span></div>
                  <textarea
                    id={`local-${key}`}
                    ref={ref}
                    rows={4}
                    maxLength={200}
                    value={form[key]}
                    disabled={disabled}
                    aria-invalid={Boolean(errors[key])}
                    onChange={(event) => updateForm(key, event.target.value)}
                  />
                  {errors[key] ? <p className={styles.fieldError} role="alert">{errors[key]}</p> : null}
                  <div className={styles.recommendations} aria-label={`${label} 추천 문구`}>
                    {MOCK_TEACHER_WEEKLY_EVALUATION.recommendations[key === "nextGoal" ? "nextLessonGoal" : key].slice(0, 2).map((phrase) => (
                      <button key={phrase.label} type="button" disabled={disabled} onClick={() => updateForm(key, phrase.sentence)}>{phrase.label}</button>
                    ))}
                  </div>
                </div>
              ))}

              <section className={styles.projectSection} aria-labelledby="local-project-title">
                <div className={styles.sectionHeading}><FileLock2 size={19} /><div><h3 id="local-project-title">프로젝트 기록</h3><p>프로젝트 기록 저장은 다음 단계에서 연결 예정</p></div></div>
                <label htmlFor="local-project-recent">프로젝트 최근 작업</label>
                <textarea id="local-project-recent" rows={3} readOnly disabled value={project?.latest_update?.recent_work ?? "현재 프로젝트 기록이 없습니다."} />
                <label htmlFor="local-project-next">프로젝트 다음 작업</label>
                <textarea id="local-project-next" rows={3} readOnly disabled value={project?.latest_update?.next_work ?? "현재 프로젝트 기록이 없습니다."} />
              </section>

              <div className={styles.saveRow}>
                <button className={styles.saveButton} type="button" disabled={disabled} onClick={saveDraft}>
                  {isSaving ? <><LoaderCircle className={styles.spinner} size={18} /> 초안 저장 중</> : <><Save size={18} /> 평가 초안 저장</>}
                </button>
                <span><FileLock2 size={15} /> 학생·학부모 미공개</span>
              </div>
              <p className={styles.successMessage} role="status" aria-live="polite">{message}</p>
            </form>

            <aside className={styles.readbackPanel} aria-label="실제 DB 저장 상태">
              <h2>실제 DB 상태</h2>
              <dl>
                <div><dt>초안</dt><dd>{draft ? `version ${draft.version}` : "없음"}</dd></div>
                <div><dt>공개본</dt><dd>{published ? `version ${published.version}` : "없음"}</dd></div>
                <div><dt>공개 여부</dt><dd>학생·학부모 미공개</dd></div>
                <div><dt>저장 시각</dt><dd><Clock3 size={15} /> {formatSavedAt(draft?.updated_at)}</dd></div>
              </dl>
              <div className={styles.savedConcepts}>
                <h3>DB에서 다시 읽은 준비된 개념</h3>
                {(draft?.selected_concepts ?? draft?.concepts ?? []).length
                  ? (draft?.selected_concepts ?? draft?.concepts ?? []).map((concept) => <span key={concept.key}>{concept.label}</span>)
                  : <p>저장된 준비된 개념이 없습니다.</p>}
              </div>
              <div className={styles.savedConcepts}>
                <h3>DB에서 다시 읽은 직접 입력 개념</h3>
                {draft?.custom_concepts?.length
                  ? draft.custom_concepts.map((concept) => <span key={concept.id}>{concept.label}</span>)
                  : <p>저장된 직접 입력 개념이 없습니다.</p>}
              </div>
              <p className={styles.readbackNote}>저장 성공 표시는 저장 API 호출 뒤 선생님 읽기 API로 실제 내용을 다시 확인한 경우에만 나타납니다.</p>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
