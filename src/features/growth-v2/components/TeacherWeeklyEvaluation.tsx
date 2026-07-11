"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ClipboardCheck,
  FolderKanban,
  MessageSquareText,
  RotateCcw,
  Save,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { ParentEvaluationPreview } from "./ParentEvaluationPreview";
import { useGrowthPreviewState } from "./GrowthPreviewStateProvider";
import type {
  EvaluationChoice,
  EvaluationTextField,
  RecommendationPhrase,
  TeacherWeeklyEvaluationData,
} from "@/features/growth-v2/types/teacher-weekly-evaluation";
import styles from "./TeacherWeeklyEvaluation.module.css";

interface TeacherWeeklyEvaluationProps {
  data: TeacherWeeklyEvaluationData;
}

type EvaluationErrors = Partial<Record<EvaluationTextField, string>>;

const FIELD_LABELS: Record<EvaluationTextField, string> = {
  strength: "잘한 점",
  improvement: "보완할 점",
  nextLessonGoal: "다음 수업 목표",
};

const FIELD_ERRORS: Record<EvaluationTextField, string> = {
  strength: "잘한 점을 10자 이상 적어주세요.",
  improvement: "보완할 점을 10자 이상 적어주세요.",
  nextLessonGoal: "다음 수업 목표를 10자 이상 적어주세요.",
};

function ChoiceGroup({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: EvaluationChoice[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className={styles.choiceGroup}>
      <legend>{legend}</legend>
      <div className={styles.choiceGrid}>
        {options.map((option) => {
          const isSelected = value === option.id;

          return (
            <button
              aria-pressed={isSelected}
              className={isSelected ? styles.choiceSelected : styles.choiceButton}
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
            >
              {isSelected ? <Check size={16} aria-hidden="true" /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function RecommendationButtons({
  phrases,
  onSelect,
}: {
  phrases: RecommendationPhrase[];
  onSelect: (phrase: RecommendationPhrase) => void;
}) {
  return (
    <div className={styles.recommendationList} aria-label="추천 문구">
      {phrases.map((phrase) => (
        <button key={phrase.label} type="button" onClick={() => onSelect(phrase)}>
          {phrase.label}
        </button>
      ))}
    </div>
  );
}

export function TeacherWeeklyEvaluation({ data }: TeacherWeeklyEvaluationProps) {
  const { draft, updateDraft, publishDraft, resetPreview } = useGrowthPreviewState();
  const {
    understanding,
    participation,
    homework,
    evaluation,
    project,
  } = draft;
  const [errors, setErrors] = useState<EvaluationErrors>({});
  const [saveMessage, setSaveMessage] = useState("");
  const strengthRef = useRef<HTMLTextAreaElement>(null);
  const improvementRef = useRef<HTMLTextAreaElement>(null);
  const nextGoalRef = useRef<HTMLTextAreaElement>(null);

  const fieldRefs = useMemo(
    () => ({
      strength: strengthRef,
      improvement: improvementRef,
      nextLessonGoal: nextGoalRef,
    }),
    [],
  );

  const selectedConcepts = useMemo(
    () => new Set(draft.learnedConcepts),
    [draft.learnedConcepts],
  );
  const visibleConcepts = data.learnedConcepts.filter((concept) => selectedConcepts.has(concept));

  const updateEvaluation = (field: EvaluationTextField, value: string) => {
    updateDraft((current) => ({
      ...current,
      evaluation: { ...current.evaluation, [field]: value },
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveMessage("");
  };

  const applyRecommendation = (
    field: EvaluationTextField,
    phrase: RecommendationPhrase,
  ) => {
    updateEvaluation(field, phrase.sentence);
  };

  const toggleConcept = (concept: string) => {
    updateDraft((current) => {
      const next = new Set(current.learnedConcepts);

      if (next.has(concept)) next.delete(concept);
      else next.add(concept);

      return { ...current, learnedConcepts: [...next] };
    });
    setSaveMessage("");
  };

  const validateEvaluation = () => {
    const nextErrors: EvaluationErrors = {};

    (Object.keys(FIELD_LABELS) as EvaluationTextField[]).forEach((field) => {
      const length = evaluation[field].trim().length;

      if (length < 10) {
        nextErrors[field] = FIELD_ERRORS[field];
      }
    });

    setErrors(nextErrors);

    const firstInvalidField = (Object.keys(FIELD_LABELS) as EvaluationTextField[]).find(
      (field) => nextErrors[field],
    );

    if (firstInvalidField) {
      fieldRefs[firstInvalidField].current?.focus();
      setSaveMessage("");
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateEvaluation()) return;

    publishDraft();
    setSaveMessage(
      "주간 평가 미리보기가 준비됐어요. 실제 데이터에는 저장되지 않았습니다.",
    );
  };

  const handleReset = () => {
    resetPreview();
    setErrors({});
    setSaveMessage("");
  };

  const summaryItems = [
    { label: "출석", value: data.summary.attendance, icon: UserRoundCheck },
    { label: "과제 완료율", value: `${data.summary.assignmentCompletion}%`, icon: ClipboardCheck },
    { label: "주간 목표 진행률", value: `${data.summary.weeklyGoalProgress}%`, icon: Target },
    { label: "프로젝트 진행률", value: `${data.summary.projectProgress}%`, icon: FolderKanban },
  ];

  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        <Link href="/growth-preview" className={styles.brand} aria-label="코딩쏙 Growth 2.0 학생 화면">
          <span className={styles.brandMark}>C</span>
          <span>
            <strong>코딩쏙</strong>
            <small>Growth 2.0</small>
          </span>
        </Link>
        <nav className={styles.previewNav} aria-label="Growth 2.0 미리보기 화면 전환">
          <Link href="/growth-preview">학생 화면</Link>
          <Link href="/growth-preview/parent">학부모 화면</Link>
          <span aria-current="page">선생님 화면</span>
        </nav>
      </header>

      <main id="main-content" className={styles.workspace}>
        <section className={styles.introPanel} aria-labelledby="teacher-page-title">
          <div>
            <p className={styles.eyebrow}>선생님 미리보기</p>
            <h1 id="teacher-page-title">주간 평가 작성</h1>
            <p>수업에서 확인한 성장과 다음 목표를 간편하게 기록해 보세요.</p>
          </div>
          <dl className={styles.studentMeta}>
            <div>
              <dt>선택된 가상 학생</dt>
              <dd>{data.studentName} 학생</dd>
            </div>
            <div>
              <dt>대상 기간</dt>
              <dd>
                <CalendarDays size={16} aria-hidden="true" /> {data.period}
              </dd>
            </div>
          </dl>
          <small>Growth 2.0 테스트 화면 · 입력 내용은 실제로 저장되지 않습니다.</small>
        </section>

        <dl className={styles.summaryGrid} aria-label="가상 학생 수업 현황">
          {summaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label}>
                <span aria-hidden="true">
                  <Icon size={19} strokeWidth={2.1} />
                </span>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            );
          })}
        </dl>

        <div className={styles.editorGrid}>
          <form className={styles.formPanel} onSubmit={(event) => event.preventDefault()}>
            <div className={styles.formHeading}>
              <span aria-hidden="true">
                <MessageSquareText size={21} strokeWidth={2.1} />
              </span>
              <div>
                <h2>빠른 평가 입력</h2>
                <p>기본값을 그대로 사용하거나 필요한 부분만 바꿔 주세요.</p>
              </div>
            </div>

            <ChoiceGroup
              legend="이번 주 수업 이해도"
              options={data.understandingOptions}
              value={understanding}
              onChange={(value) => {
                updateDraft((current) => ({ ...current, understanding: value }));
                setSaveMessage("");
              }}
            />
            <ChoiceGroup
              legend="수업 참여 모습"
              options={data.participationOptions}
              value={participation}
              onChange={(value) => {
                updateDraft((current) => ({ ...current, participation: value }));
                setSaveMessage("");
              }}
            />
            <ChoiceGroup
              legend="과제 상태"
              options={data.homeworkOptions}
              value={homework}
              onChange={(value) => {
                updateDraft((current) => ({ ...current, homework: value }));
                setSaveMessage("");
              }}
            />

            <fieldset className={styles.conceptGroup}>
              <legend>이번 주에 배운 개념</legend>
              <div className={styles.conceptOptions}>
                {data.learnedConcepts.map((concept) => (
                  <label key={concept}>
                    <input
                      type="checkbox"
                      checked={selectedConcepts.has(concept)}
                      onChange={() => toggleConcept(concept)}
                    />
                    <span>{concept}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <section className={styles.textEvaluation} aria-labelledby="evaluation-text-title">
              <div className={styles.subsectionHeading}>
                <h3 id="evaluation-text-title">선생님 평가 문장</h3>
                <p>각 문장은 10자 이상, 200자 이하로 적어 주세요.</p>
              </div>

              {(Object.keys(FIELD_LABELS) as EvaluationTextField[]).map((field) => {
                const errorId = `${field}-error`;
                const countId = `${field}-count`;

                return (
                  <div className={styles.textField} key={field}>
                    <div className={styles.labelRow}>
                      <label htmlFor={field}>{FIELD_LABELS[field]}</label>
                      <span id={countId}>{evaluation[field].length}/200자</span>
                    </div>
                    <textarea
                      id={field}
                      ref={fieldRefs[field]}
                      value={evaluation[field]}
                      maxLength={200}
                      rows={4}
                      aria-invalid={Boolean(errors[field])}
                      aria-describedby={`${countId}${errors[field] ? ` ${errorId}` : ""}`}
                      onChange={(event) => updateEvaluation(field, event.target.value)}
                    />
                    {errors[field] ? (
                      <p className={styles.fieldError} id={errorId} role="alert">
                        {errors[field]}
                      </p>
                    ) : null}
                    <p className={styles.recommendationHelp}>
                      추천 문구를 선택하면 이 입력 문장이 바뀝니다.
                    </p>
                    <RecommendationButtons
                      phrases={data.recommendations[field]}
                      onSelect={(phrase) => applyRecommendation(field, phrase)}
                    />
                  </div>
                );
              })}
            </section>

            <section className={styles.projectFields} aria-labelledby="project-fields-title">
              <div className={styles.subsectionHeading}>
                <h3 id="project-fields-title">프로젝트 기록</h3>
                <p>{data.projectName} · 현재 진행률 {data.summary.projectProgress}%</p>
              </div>
              <label htmlFor="project-recent-work">프로젝트 최근 작업</label>
              <textarea
                id="project-recent-work"
                rows={3}
                maxLength={200}
                value={project.recentWork}
                onChange={(event) => {
                  const recentWork = event.target.value;
                  updateDraft((current) => ({
                    ...current,
                    project: { ...current.project, recentWork },
                  }));
                  setSaveMessage("");
                }}
              />
              <label htmlFor="project-next-work">프로젝트 다음 작업</label>
              <textarea
                id="project-next-work"
                rows={3}
                maxLength={200}
                value={project.nextWork}
                onChange={(event) => {
                  const nextWork = event.target.value;
                  updateDraft((current) => ({
                    ...current,
                    project: { ...current.project, nextWork },
                  }));
                  setSaveMessage("");
                }}
              />
            </section>

            <div className={styles.formActions}>
              <button className={styles.saveButton} type="button" onClick={handleSave}>
                <Save size={18} aria-hidden="true" /> 평가 미리보기 저장
              </button>
              <button className={styles.resetButton} type="button" onClick={handleReset}>
                <RotateCcw size={17} aria-hidden="true" /> 입력 초기화
              </button>
            </div>
            <p className={styles.saveNotice} role="status" aria-live="polite" aria-atomic="true">
              {saveMessage}
            </p>
          </form>

          <ParentEvaluationPreview
            studentName={data.studentName}
            concepts={visibleConcepts}
            evaluation={evaluation}
            projectName={data.projectName}
            project={project}
          />
        </div>
      </main>
    </div>
  );
}
