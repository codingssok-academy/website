"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
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
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { MOCK_TEACHER_WEEKLY_EVALUATION } from "@/features/growth-v2/data/teacher-weekly-evaluation.mock";
import {
  formatStudentDisplayName,
  getGrowthPreviewEnvironmentCopy,
  shouldShowGrowthPreviewDemoNavigation,
} from "@/features/growth-v2/preview-presentation";
import {
  createLocalTeacherSession,
  fetchLocalTeacherEvaluation,
  fetchLocalTeacherStudents,
  publishLocalTeacherEvaluation,
  saveLocalTeacherDraft,
} from "./local-teacher-client";
import type {
  LocalConcept,
  LocalDraftForm,
  LocalPublishResult,
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
  const environment = getGrowthPreviewEnvironmentCopy();
  const showDemoNavigation = shouldShowGrowthPreviewDemoNavigation();
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishResult, setPublishResult] = useState<LocalPublishResult | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const strengthRef = useRef<HTMLTextAreaElement>(null);
  const improvementRef = useRef<HTMLTextAreaElement>(null);
  const nextGoalRef = useRef<HTMLTextAreaElement>(null);
  const conceptRef = useRef<HTMLFieldSetElement>(null);
  const customConceptRef = useRef<HTMLInputElement>(null);
  const publishTriggerRef = useRef<HTMLButtonElement>(null);
  const publishCancelRef = useRef<HTMLButtonElement>(null);
  const publishRequestRef = useRef(false);

  useEffect(() => {
    if (!isPublishDialogOpen) return;
    const publishTrigger = publishTriggerRef.current;
    publishCancelRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !publishRequestRef.current) {
        setIsPublishDialogOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      publishTrigger?.focus();
    };
  }, [isPublishDialogOpen]);

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
    setIsPublishDialogOpen(false);
    setIsPublishing(false);
    setPublishResult(null);
    publishRequestRef.current = false;
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
    setPublishResult(null);
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
    setPublishResult(null);
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
      setMessage("평가 초안이 안전하게 저장됐습니다.");
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

  const publishEvaluation = useCallback(async () => {
    const currentDraft = evaluation?.data.draft;
    if (
      !session || !selectedStudent || !evaluation || !currentDraft?.updated_at ||
      publishRequestRef.current || isDirty || hasConflict
    ) return;

    publishRequestRef.current = true;
    setIsPublishing(true);
    setErrorMessage("");
    setMessage("");
    try {
      const result = await publishLocalTeacherEvaluation(
        session,
        currentDraft.evaluation_id,
        currentDraft.updated_at,
      );
      if (result.conflict) {
        setHasConflict(true);
        setIsPublishDialogOpen(false);
        setErrorMessage("다른 곳에서 초안이 변경됐어요. 최신 내용을 다시 확인해 주세요.");
        return;
      }
      if (!result.published) {
        setIsPublishDialogOpen(false);
        setErrorMessage("평가를 공개하지 못했어요.");
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
        setIsPublishDialogOpen(false);
        setErrorMessage("공개했지만 최신 화면을 다시 불러오지 못했어요.");
        return;
      }
      if (
        refreshed.data.draft ||
        refreshed.data.published?.status !== "published" ||
        refreshed.data.published.version !== result.version
      ) {
        setIsPublishDialogOpen(false);
        setErrorMessage("공개했지만 최신 화면을 다시 불러오지 못했어요.");
        return;
      }

      setEvaluation(refreshed);
      setForm(formFromEvaluation(refreshed));
      setIsDirty(false);
      setHasConflict(false);
      setPublishResult(result);
      setIsPublishDialogOpen(false);
      setMessage("평가 공개 완료");
      const nextStudents = await refreshStudentList(session);
      const updatedStudent = nextStudents.find((student) => student.id === selectedStudent.id);
      if (updatedStudent) setSelectedStudent(updatedStudent);
    } catch (error) {
      setIsPublishDialogOpen(false);
      showRequestError(error, "평가를 공개하지 못했어요.");
    } finally {
      publishRequestRef.current = false;
      setIsPublishing(false);
    }
  }, [evaluation, hasConflict, isDirty, selectedStudent, session, showRequestError]);

  if (viewState !== "ready" || !session) {
    const isLoading = viewState === "signing-in";
    return (
      <main className={styles.loginShell}>
        <section className={styles.loginPanel} aria-labelledby="teacher-local-title">
          <span className={styles.loginIcon} aria-hidden="true"><Database size={30} /></span>
          <p className={styles.eyebrow}>{environment.label}</p>
          <h1 id="teacher-local-title">선생님 평가 공개 체험</h1>
          <p className={styles.loginIntro}>{environment.description} 초안 저장과 공개 흐름을 확인합니다.</p>
          <ul className={styles.noticeList}>
            <li>저장된 평가 초안을 확인하고 공개하는 연습 화면입니다.</li>
            <li>공개하면 학생과 연결 학부모 화면에 최신 평가가 나타납니다.</li>
            <li>새로고침하면 가상 로그인이 해제됩니다.</li>
            <li>운영 DB와 연결되지 않았습니다.</li>
          </ul>
          {errorMessage ? <p className={styles.loginError} role="alert">{errorMessage}</p> : null}
          <button className={styles.primaryButton} type="button" disabled={isLoading} onClick={login}>
            {isLoading ? <><LoaderCircle className={styles.spinner} size={18} /> 로그인 중</> :
              <><LockKeyhole size={18} /> 테스트 선생님으로 들어가기</>}
          </button>
          {showDemoNavigation ? (
            <Link className={styles.mockLink} href="/growth-preview/teacher">기존 데모 선생님 화면 보기</Link>
          ) : null}
        </section>
      </main>
    );
  }

  const draft = evaluation?.data.draft ?? null;
  const published = evaluation?.data.published ?? null;
  const project = evaluation?.data.project ?? null;
  const displayedEvaluation = draft ?? published;
  const disabled = isSaving || isPublishing || isLoadingStudent || !evaluation;
  const hasRequiredPublishContent = Boolean(
    draft &&
    draft.strength.trim().length >= 10 &&
    draft.improvement.trim().length >= 10 &&
    draft.next_goal.trim().length >= 10 &&
    ((draft.selected_concepts ?? draft.concepts).length + (draft.custom_concepts?.length ?? 0) > 0) &&
    draft.updated_at,
  );
  const canPublish = Boolean(
    session && selectedStudent && draft && !isDirty && !hasConflict &&
    hasRequiredPublishContent && !isSaving && !isPublishing && !isLoadingStudent,
  );
  const publishDisabledReason = !draft
    ? "현재 공개할 평가 초안이 없습니다."
    : isDirty
      ? "공개하기 전에 변경한 내용을 초안으로 저장해 주세요."
      : hasConflict
        ? "최신 평가를 다시 불러온 뒤 공개해 주세요."
        : !hasRequiredPublishContent
          ? "필수 문장과 학습 개념을 확인해 주세요."
          : "";

  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        {showDemoNavigation ? (
          <Link href="/growth-preview/teacher" className={styles.brand}>
            <span className={styles.brandMark}>C</span>
            <span><strong>코딩쏙</strong><small>Growth 2.0</small></span>
          </Link>
        ) : (
          <div className={styles.brand}>
            <span className={styles.brandMark}>C</span>
            <span><strong>코딩쏙</strong><small>Growth 2.0</small></span>
          </div>
        )}
        <div className={styles.topbarActions}>
          <span className={styles.localBadge}><Database size={15} /> {environment.badge}</span>
          <button type="button" onClick={clearSession}><LogOut size={16} /> 체험 끝내기</button>
        </div>
      </header>

      <div className={styles.safetyBand}>
        <FileLock2 size={18} aria-hidden="true" />
        <strong>{environment.label}</strong>
        <span>{environment.description} 공개하면 학생과 연결 학부모 화면에 최신 평가가 나타납니다.</span>
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
                <strong>{formatStudentDisplayName(student.display_name)}</strong>
                <span>{student.has_draft ? "초안 저장됨" : student.has_published ? "공개된 평가 있음" : "평가 시작 전"}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.editorArea}>
          <div className={styles.pageHeading}>
            <div>
              <p className={styles.eyebrow}>선생님 주간 평가</p>
              <h1>{selectedStudent ? formatStudentDisplayName(selectedStudent.display_name) : "학생"} 평가 초안</h1>
              <p>{evaluation ? `${evaluation.period.week_start} ~ ${evaluation.period.week_end}` : "평가를 불러오는 중입니다."}</p>
            </div>
            <div className={styles.statusSummary} aria-label="평가 상태">
              <span className={published ? styles.publishedStatus : styles.emptyStatus}>
                {published ? "현재 공개 평가" : "아직 공개된 평가 없음"}
              </span>
              <span className={draft ? styles.draftStatus : styles.emptyStatus}>
                {draft ? "저장된 초안" : "저장된 초안 없음"}
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
          {publishResult ? (
            <section className={styles.publishSuccess} aria-live="polite" aria-labelledby="publish-success-title">
              <ShieldCheck size={21} aria-hidden="true" />
              <div>
                <h2 id="publish-success-title">평가 공개 완료</h2>
                <p>최신 공개 완료 · {formatSavedAt(publishResult.published_at ?? undefined)}</p>
                <p>{publishResult.archived_previous_version
                  ? "기존 공개 평가는 이전 평가 기록으로 보관됐습니다."
                  : "이전에 공개된 평가가 없는 첫 평가입니다."}</p>
                <p>현재 초안 없음 · 학생과 연결 학부모에게 공개됨</p>
              </div>
            </section>
          ) : null}

          <div className={styles.contentGrid}>
            <form className={styles.formPanel} onSubmit={(event) => event.preventDefault()}>
              <div className={styles.sectionHeading}>
                <BookOpenCheck size={20} />
                <div><h2>빠른 평가 입력</h2><p>변경한 내용은 저장 버튼을 눌러야 안전하게 저장됩니다.</p></div>
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
                <button
                  ref={publishTriggerRef}
                  className={styles.publishButton}
                  type="button"
                  disabled={!canPublish}
                  aria-haspopup="dialog"
                  onClick={() => setIsPublishDialogOpen(true)}
                >
                  {isPublishing ? <><LoaderCircle className={styles.spinner} size={18} /> 평가 공개 중</> : <><Send size={18} /> 평가 공개하기</>}
                </button>
                <span><FileLock2 size={15} /> {draft ? "초안은 학생·학부모 미공개" : "최신 공개 평가 표시 중"}</span>
              </div>
              {publishDisabledReason ? <p className={styles.publishHelp}>{publishDisabledReason}</p> : null}
              <p className={styles.successMessage} role="status" aria-live="polite">{message}</p>
            </form>

            <aside className={styles.readbackPanel} aria-label="평가 저장 상태">
              <h2>평가 저장 상태</h2>
              <dl>
                <div><dt>초안</dt><dd>{draft ? "저장됨" : "없음"}</dd></div>
                <div><dt>공개 평가</dt><dd>{published ? "공개됨" : "없음"}</dd></div>
                <div><dt>공개 여부</dt><dd>{draft ? "학생·학부모 미공개" : published ? "학생·학부모 공개" : "공개 평가 없음"}</dd></div>
                <div><dt>기록 시각</dt><dd><Clock3 size={15} /> {formatSavedAt(draft?.updated_at ?? published?.published_at ?? undefined)}</dd></div>
              </dl>
              <div className={styles.savedConcepts}>
                <h3>저장된 준비된 개념</h3>
                {(displayedEvaluation?.selected_concepts ?? displayedEvaluation?.concepts ?? []).length
                  ? (displayedEvaluation?.selected_concepts ?? displayedEvaluation?.concepts ?? []).map((concept) => <span key={concept.key}>{concept.label}</span>)
                  : <p>저장된 준비된 개념이 없습니다.</p>}
              </div>
              <div className={styles.savedConcepts}>
                <h3>저장된 직접 입력 개념</h3>
                {displayedEvaluation?.custom_concepts?.length
                  ? displayedEvaluation.custom_concepts.map((concept) => <span key={concept.id}>{concept.label}</span>)
                  : <p>저장된 직접 입력 개념이 없습니다.</p>}
              </div>
              <p className={styles.readbackNote}>저장한 내용을 다시 불러와 확인한 경우에만 저장 완료로 표시합니다.</p>
            </aside>
          </div>
        </section>
      </main>
      {isPublishDialogOpen && draft ? (
        <div className={styles.dialogBackdrop}>
          <section
            className={styles.publishDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-dialog-title"
            aria-describedby="publish-dialog-description"
          >
            <div className={styles.dialogHeading}>
              <span aria-hidden="true"><Send size={22} /></span>
              <div>
                <h2 id="publish-dialog-title">평가를 공개할까요?</h2>
                <p id="publish-dialog-description">공개하면 학생과 연결된 학부모가 최신 평가를 볼 수 있습니다.</p>
              </div>
            </div>
            <div className={styles.publishScope}>
              <section>
                <h3>학생에게 공개</h3>
                <ul><li>잘한 점</li><li>다음 수업 목표</li><li>이번 주에 배운 내용</li></ul>
              </section>
              <section>
                <h3>학부모에게 공개</h3>
                <ul><li>잘한 점</li><li>보완할 점</li><li>다음 수업 목표</li><li>이번 주에 배운 내용</li></ul>
              </section>
            </div>
            <div className={styles.archiveNotice}>
              <Archive size={18} aria-hidden="true" />
              <p>{published
                ? "기존 공개 평가는 삭제되지 않고 이전 기록으로 보관됩니다."
                : "기존 공개 평가가 없어 이번 평가가 첫 공개 평가가 됩니다."}</p>
            </div>
            <p className={styles.dialogFootnote}>프로젝트 기록과 알림은 이번 단계에서 전송하지 않습니다.</p>
            <div className={styles.dialogActions}>
              <button
                ref={publishCancelRef}
                type="button"
                disabled={isPublishing}
                onClick={() => setIsPublishDialogOpen(false)}
              >취소</button>
              <button type="button" disabled={isPublishing} onClick={publishEvaluation}>
                {isPublishing ? <><LoaderCircle className={styles.spinner} size={18} /> 선생님 평가 공개 중</> : <><ShieldCheck size={18} /> 정말 공개하기</>}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
