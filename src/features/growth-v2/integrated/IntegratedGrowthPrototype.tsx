"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  FolderKanban,
  Heart,
  Home,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  MessageSquareQuote,
  Plus,
  Rocket,
  Save,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  MAX_CUSTOM_CONCEPTS,
  validateCustomConcept,
} from "@/features/growth-v2/local-teacher/custom-concepts";
import styles from "./IntegratedGrowthPrototype.module.css";

type PreviewRole = "teacher" | "student" | "parent";

interface WeeklyEvaluation {
  preparedConcepts: string[];
  customConcepts: string[];
  strength: string;
  improvement: string;
  nextGoal: string;
  recentWork: string;
  nextWork: string;
}

type AttendanceMonthId = "2026-08" | "2026-09";

interface MonthlyAttendanceRecord {
  date: string;
  lesson: string;
  status: "출석" | "결석" | "보강 완료" | "예정";
}

interface MonthlyAttendanceData {
  id: AttendanceMonthId;
  label: string;
  shortLabel: string;
  scheduled: number;
  attended: number;
  absent: number;
  makeup: number;
  upcoming: number;
  records: MonthlyAttendanceRecord[];
}

const PREPARED_CONCEPTS = ["for 반복문", "조건 비교", "오류 찾기"];

const INITIAL_EVALUATION: WeeklyEvaluation = {
  preparedConcepts: [...PREPARED_CONCEPTS],
  customConcepts: [],
  strength: "막히는 부분을 그냥 넘기지 않고 직접 질문하며 해결하는 습관이 좋아졌습니다.",
  improvement: "문제를 바로 코딩하기 전에 실행 순서를 글이나 그림으로 정리하는 연습이 더 필요합니다.",
  nextGoal: "반복문 안에 조건문을 넣어 간단한 점수 계산기를 완성합니다.",
  recentWork: "행성이 나타나는 순서를 반복문으로 정리했습니다.",
  nextWork: "조건문을 사용해 점수 계산 기능을 추가할 예정입니다.",
};

const MONTHLY_ATTENDANCE: MonthlyAttendanceData[] = [
  {
    id: "2026-08",
    label: "2026년 8월",
    shortLabel: "8월",
    scheduled: 8,
    attended: 7,
    absent: 1,
    makeup: 1,
    upcoming: 0,
    records: [
      { date: "8월 4일", lesson: "프로젝트반 정규 수업", status: "출석" },
      { date: "8월 6일", lesson: "프로젝트반 정규 수업", status: "출석" },
      { date: "8월 20일", lesson: "프로젝트반 정규 수업", status: "결석" },
      { date: "8월 22일", lesson: "결석 수업 보강", status: "보강 완료" },
    ],
  },
  {
    id: "2026-09",
    label: "2026년 9월",
    shortLabel: "9월",
    scheduled: 8,
    attended: 0,
    absent: 0,
    makeup: 0,
    upcoming: 8,
    records: [
      { date: "9월 1일", lesson: "프로젝트반 정규 수업", status: "예정" },
      { date: "9월 3일", lesson: "프로젝트반 정규 수업", status: "예정" },
      { date: "9월 8일", lesson: "프로젝트반 정규 수업", status: "예정" },
      { date: "9월 10일", lesson: "프로젝트반 정규 수업", status: "예정" },
    ],
  },
];

const ROLE_OPTIONS: Array<{
  id: PreviewRole;
  label: string;
  description: string;
  icon: LucideIcon;
  liveHref: string;
  portalHref: string;
}> = [
  {
    id: "teacher",
    label: "선생님",
    description: "작성·미리보기·공개",
    icon: ClipboardList,
    liveHref: "/growth-preview/teacher-local",
    portalHref: "/teacher/login",
  },
  {
    id: "student",
    label: "학생",
    description: "성장 확인·다음 목표",
    icon: Rocket,
    liveHref: "/growth-preview/student-local",
    portalHref: "/login",
  },
  {
    id: "parent",
    label: "학부모",
    description: "주간 리포트·대화 도움",
    icon: Heart,
    liveHref: "/growth-preview/parent-local",
    portalHref: "/parent/feedback",
  },
];

function copyEvaluation(value: WeeklyEvaluation): WeeklyEvaluation {
  return {
    ...value,
    preparedConcepts: [...value.preparedConcepts],
    customConcepts: [...value.customConcepts],
  };
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={styles.brand}>
      <span className={styles.brandMark}>C</span>
      <span>
        <strong>코딩쏙</strong>
        {!compact ? <small>Growth 2.0</small> : null}
      </span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "violet";
}) {
  return (
    <div className={styles.statCard} data-tone={tone}>
      <span><Icon size={18} aria-hidden="true" /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <p className={styles.previewNotice}>
      <Sparkles size={15} aria-hidden="true" /> {children}
    </p>
  );
}

function MonthlyAttendance({
  selectedMonth,
  onMonthChange,
  compact = false,
}: {
  selectedMonth: AttendanceMonthId;
  onMonthChange: (month: AttendanceMonthId) => void;
  compact?: boolean;
}) {
  const attendance =
    MONTHLY_ATTENDANCE.find((month) => month.id === selectedMonth) ??
    MONTHLY_ATTENDANCE[0];
  const completed = attendance.attended + attendance.makeup;
  const completionRate = attendance.scheduled
    ? Math.round((completed / attendance.scheduled) * 100)
    : 0;
  const summary = attendance.upcoming
    ? `정규 수업 ${attendance.scheduled}회가 예정되어 있어요.`
    : `정규 출석 ${attendance.attended}회와 보강 ${attendance.makeup}회로 총 ${completed}회를 이수했어요.`;

  return (
    <section
      className={`${styles.monthlyAttendance} ${compact ? styles.monthlyAttendanceCompact : ""}`}
      aria-labelledby="monthly-attendance-title"
    >
      <div className={styles.monthlyAttendanceHeading}>
        <div>
          <span aria-hidden="true"><CalendarDays size={19} /></span>
          <div>
            <small>MONTHLY ATTENDANCE</small>
            <h3 id="monthly-attendance-title">{attendance.label} 출석 현황</h3>
          </div>
        </div>
        <div className={styles.monthTabs} role="tablist" aria-label="출석 확인 월 선택">
          {MONTHLY_ATTENDANCE.map((month) => (
            <button
              key={month.id}
              type="button"
              role="tab"
              aria-selected={month.id === attendance.id}
              aria-label={`${month.shortLabel} 출석 보기`}
              onClick={() => onMonthChange(month.id)}
            >
              {month.shortLabel}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.monthlyAttendanceDescription}>
        학습 평가는 매주, 출석은 월 수강 기준으로 따로 확인합니다.
      </p>

      <div className={styles.monthlyAttendanceMetrics}>
        <div><strong>{completed}/{attendance.scheduled}</strong><small>수업 이수</small></div>
        <div><strong>{attendance.attended}회</strong><small>정규 출석</small></div>
        <div><strong>{attendance.absent}회</strong><small>결석</small></div>
        <div><strong>{attendance.makeup}회</strong><small>보강 완료</small></div>
        <div><strong>{attendance.upcoming}회</strong><small>예정 수업</small></div>
      </div>

      <div className={styles.attendanceProgress}>
        <div>
          <span>월 수업 이수율</span>
          <strong>{completionRate}%</strong>
        </div>
        <div
          className={styles.attendanceProgressTrack}
          role="progressbar"
          aria-label={`${attendance.label} 수업 이수율`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionRate}
        >
          <span style={{ width: `${completionRate}%` }} />
        </div>
        <p>{summary}</p>
      </div>

      <div className={styles.attendanceRecords}>
        <strong>날짜별 출석 기록</strong>
        <ul>
          {attendance.records.map((record) => (
            <li key={`${attendance.id}-${record.date}`}>
              <time>{record.date}</time>
              <span>{record.lesson}</span>
              <em data-status={record.status}>{record.status}</em>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TeacherView({
  draft,
  onDraftChange,
  onPublish,
  selectedAttendanceMonth,
  onAttendanceMonthChange,
}: {
  draft: WeeklyEvaluation;
  onDraftChange: (next: WeeklyEvaluation) => void;
  onPublish: () => void;
  selectedAttendanceMonth: AttendanceMonthId;
  onAttendanceMonthChange: (month: AttendanceMonthId) => void;
}) {
  const [customInput, setCustomInput] = useState("");
  const [conceptError, setConceptError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const concepts = [...draft.preparedConcepts, ...draft.customConcepts];

  const updateField = (field: keyof WeeklyEvaluation, value: string) => {
    onDraftChange({ ...draft, [field]: value });
    setSaveMessage("");
  };

  const togglePreparedConcept = (concept: string) => {
    const selected = draft.preparedConcepts.includes(concept);
    onDraftChange({
      ...draft,
      preparedConcepts: selected
        ? draft.preparedConcepts.filter((item) => item !== concept)
        : [...draft.preparedConcepts, concept],
    });
    setConceptError("");
    setSaveMessage("");
  };

  const addCustomConcept = () => {
    const result = validateCustomConcept(
      customInput,
      draft.customConcepts,
      draft.preparedConcepts,
    );

    if (result.error) {
      setConceptError(result.error);
      return;
    }

    onDraftChange({
      ...draft,
      customConcepts: [...draft.customConcepts, result.value],
    });
    setCustomInput("");
    setConceptError("");
    setSaveMessage("");
  };

  const removeCustomConcept = (concept: string) => {
    onDraftChange({
      ...draft,
      customConcepts: draft.customConcepts.filter((item) => item !== concept),
    });
    setConceptError("");
    setSaveMessage("");
  };

  const publish = () => {
    onPublish();
    setSaveMessage("공개된 화면에 최신 평가가 반영된 시안입니다.");
  };

  return (
    <section className={styles.rolePanel} id="integrated-teacher-panel" role="tabpanel">
      <div className={styles.teacherApp}>
        <aside className={styles.teacherSidebar}>
          <Brand />
          <p className={styles.sidebarLabel}>운영 메뉴</p>
          <nav aria-label="선생님 시안 메뉴">
            <span><Home size={18} /> 홈</span>
            <span><Users size={18} /> 학생 계정 관리</span>
            <span><FolderOpen size={18} /> 학생 파일함</span>
            <span><BarChart3 size={18} /> 성장 관리표</span>
            <span className={styles.activeNav}><ClipboardList size={18} /> 주간 성장 평가</span>
          </nav>
          <div className={styles.teacherAccount}>
            <span>김</span>
            <div><strong>김선생 선생님</strong><small>관리자 계정</small></div>
            <Settings size={16} aria-hidden="true" />
          </div>
        </aside>

        <div className={styles.teacherMain}>
          <header className={styles.teacherHeader}>
            <div>
              <p>성장 관리 <span>/</span> 주간 성장 평가</p>
              <h2>주간 성장 평가</h2>
              <small>수업 내용을 기록하고 공개 전 화면을 함께 확인하세요.</small>
            </div>
            <div className={styles.headerBadges}>
              <span><CalendarDays size={15} /> 7월 6일 ~ 7월 12일</span>
              <strong>초안 작성 중</strong>
            </div>
          </header>

          <ol className={styles.workflow} aria-label="평가 작성 순서">
            <li className={styles.workflowDone}><span><Check size={14} /></span><div><b>1. 학생 선택</b><small>민준 학생</small></div></li>
            <li className={styles.workflowActive}><span>2</span><div><b>2. 평가 작성</b><small>현재 단계</small></div></li>
            <li><span>3</span><div><b>3. 확인 후 공개</b><small>학생·학부모 전달</small></div></li>
          </ol>

          <section className={styles.studentStrip} aria-label="평가할 학생 선택">
            <div className={styles.studentStripTitle}>
              <span>이번 주 평가</span>
              <strong>2명 중 1명 작성 완료</strong>
            </div>
            <button className={styles.studentSelected} type="button" aria-pressed="true">
              <span>민</span><div><strong>민준</strong><small>프로젝트반 · 작성 중</small></div><CheckCircle2 size={18} />
            </button>
            <button type="button" aria-pressed="false">
              <span>서</span><div><strong>서윤</strong><small>흥미반 · 작성 전</small></div><ArrowRight size={18} />
            </button>
          </section>

          <div className={styles.teacherStats}>
            <StatCard icon={CalendarDays} label="이번 주 수업" value="2회" tone="blue" />
            <StatCard icon={ClipboardCheck} label="과제 완료율" value="80%" tone="green" />
            <StatCard icon={Target} label="주간 목표" value="72%" tone="amber" />
            <StatCard icon={FolderKanban} label="프로젝트" value="64%" tone="violet" />
          </div>

          <MonthlyAttendance
            selectedMonth={selectedAttendanceMonth}
            onMonthChange={onAttendanceMonthChange}
          />

          <div className={styles.teacherWorkbench}>
            <form className={styles.evaluationCard} onSubmit={(event) => event.preventDefault()}>
              <div className={styles.cardHeading}>
                <span><BookOpenCheck size={20} /></span>
                <div><h3>이번 주 수업 기록</h3><p>필요한 내용만 빠르게 작성할 수 있어요.</p></div>
              </div>

              <fieldset className={styles.conceptFieldset}>
                <legend>배운 개념</legend>
                <p>준비된 개념을 선택하거나 직접 입력하세요.</p>
                <div className={styles.preparedConcepts}>
                  {PREPARED_CONCEPTS.map((concept) => {
                    const selected = draft.preparedConcepts.includes(concept);
                    return (
                      <button
                        key={concept}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => togglePreparedConcept(concept)}
                      >
                        {selected ? <Check size={14} /> : <Plus size={14} />} {concept}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.customConceptInput}>
                  <label htmlFor="integrated-custom-concept">선생님 직접 입력</label>
                  <div>
                    <input
                      id="integrated-custom-concept"
                      value={customInput}
                      maxLength={41}
                      placeholder="예: 리스트 활용, 함수 만들기"
                      aria-invalid={Boolean(conceptError)}
                      aria-describedby="integrated-custom-help"
                      onChange={(event) => {
                        setCustomInput(event.target.value);
                        setConceptError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomConcept();
                        }
                      }}
                    />
                    <button type="button" onClick={addCustomConcept}>
                      <Plus size={16} /> 개념 추가
                    </button>
                  </div>
                  <small id="integrated-custom-help">
                    2~40자 · 직접 입력 {draft.customConcepts.length}/{MAX_CUSTOM_CONCEPTS}개
                  </small>
                  {conceptError ? <p role="alert">{conceptError}</p> : null}
                </div>
                {draft.customConcepts.length > 0 ? (
                  <div className={styles.customConceptTags} aria-label="선생님이 직접 입력한 개념">
                    {draft.customConcepts.map((concept) => (
                      <span key={concept}>
                        {concept}
                        <button
                          type="button"
                          aria-label={`${concept} 개념 삭제`}
                          onClick={() => removeCustomConcept(concept)}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </fieldset>

              <div className={styles.feedbackFields}>
                <label htmlFor="integrated-strength">잘한 점</label>
                <textarea
                  id="integrated-strength"
                  rows={3}
                  maxLength={200}
                  value={draft.strength}
                  onChange={(event) => updateField("strength", event.target.value)}
                />
                <label htmlFor="integrated-improvement">보완할 점</label>
                <textarea
                  id="integrated-improvement"
                  rows={3}
                  maxLength={200}
                  value={draft.improvement}
                  onChange={(event) => updateField("improvement", event.target.value)}
                />
                <label htmlFor="integrated-next-goal">다음 수업 목표</label>
                <textarea
                  id="integrated-next-goal"
                  rows={3}
                  maxLength={200}
                  value={draft.nextGoal}
                  onChange={(event) => updateField("nextGoal", event.target.value)}
                />
              </div>

              <div className={styles.teacherActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setSaveMessage("초안이 저장된 것처럼 보여주는 UI 시안입니다.")}
                >
                  <Save size={17} /> 초안 저장
                </button>
                <button className={styles.primaryButton} type="button" onClick={publish}>
                  <Sparkles size={17} /> 학생·학부모에게 공개
                </button>
              </div>
              <p className={styles.actionStatus} role="status" aria-live="polite">{saveMessage}</p>
            </form>

            <aside className={styles.livePreview} aria-label="학부모 공개 화면 미리보기">
              <div className={styles.livePreviewHeading}>
                <div><span>실시간 미리보기</span><h3>학부모에게 이렇게 보여요</h3></div>
                <strong>공개 전</strong>
              </div>
              <div className={styles.previewStudent}>
                <span>민</span>
                <div><strong>민준 학생의 이번 주 성장</strong><small>7월 6일 ~ 7월 12일</small></div>
              </div>
              <section className={styles.previewBlock}>
                <h4><BookOpenCheck size={16} /> 배운 개념</h4>
                <div className={styles.previewConcepts}>
                  {concepts.length > 0 ? concepts.map((concept) => <span key={concept}>{concept}</span>) : <small>선택된 개념이 없습니다.</small>}
                </div>
              </section>
              <section className={styles.previewBlock}>
                <h4><MessageSquareQuote size={16} /> 선생님 이야기</h4>
                <dl className={styles.previewFeedback}>
                  <div><dt>잘한 점</dt><dd>{draft.strength}</dd></div>
                  <div><dt>보완할 점</dt><dd>{draft.improvement}</dd></div>
                  <div><dt>다음 목표</dt><dd>{draft.nextGoal}</dd></div>
                </dl>
              </section>
              <PreviewNotice>공개 버튼을 누르기 전까지 학생·학부모에게 보이지 않아요.</PreviewNotice>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function StudentView({
  evaluation,
  selectedAttendanceMonth,
  onAttendanceMonthChange,
}: {
  evaluation: WeeklyEvaluation;
  selectedAttendanceMonth: AttendanceMonthId;
  onAttendanceMonthChange: (month: AttendanceMonthId) => void;
}) {
  const concepts = [...evaluation.preparedConcepts, ...evaluation.customConcepts];

  return (
    <section className={styles.rolePanel} id="integrated-student-panel" role="tabpanel">
      <div className={styles.mobileStage} data-portal="student">
        <div className={styles.mobileFrame}>
          <header className={styles.mobileHeader}>
            <Brand compact />
            <div><span className={styles.levelBadge}>🚀 Lv.12</span><strong>민준</strong><button type="button" aria-label="알림"><Bell size={17} /></button></div>
          </header>
          <main className={styles.mobileContent}>
            <div className={styles.mobileWelcome}>
              <p>안녕, 민준! 👋</p>
              <h2>이번 주에도 한 단계 성장했어요</h2>
              <span><CalendarDays size={14} /> 7월 6일 ~ 7월 12일</span>
            </div>

            <section className={styles.studentHero}>
              <div><span><TrendingUp size={20} /></span><small>이번 주 성장</small></div>
              <h3>반복문을 스스로 완성했어요!</h3>
              <p>{evaluation.strength}</p>
              <div className={styles.growthProgress}><span style={{ width: "72%" }} /></div>
              <strong>주간 목표 72% 달성</strong>
            </section>

            <div className={styles.mobileStats}>
              <StatCard icon={CalendarDays} label="이번 주 수업" value="2회" tone="blue" />
              <StatCard icon={ClipboardCheck} label="과제" value="80%" tone="green" />
              <StatCard icon={FolderKanban} label="프로젝트" value="64%" tone="violet" />
            </div>

            <MonthlyAttendance
              selectedMonth={selectedAttendanceMonth}
              onMonthChange={onAttendanceMonthChange}
              compact
            />

            <section className={styles.mobileCard}>
              <div className={styles.mobileSectionHeading}><span><BookOpenCheck size={18} /></span><div><h3>이번 주에 배운 개념</h3><p>내가 새롭게 익힌 내용이에요.</p></div></div>
              <div className={styles.studentConcepts}>
                {concepts.map((concept, index) => (
                  <span key={concept}><CheckCircle2 size={15} /> {concept}<small>+{20 + index * 5} XP</small></span>
                ))}
              </div>
            </section>

            <section className={styles.mobileCard}>
              <div className={styles.mobileSectionHeading}><span><MessageCircle size={18} /></span><div><h3>선생님의 다음 미션</h3><p>다음 수업에서 도전해 보세요.</p></div></div>
              <p className={styles.teacherMessage}>{evaluation.nextGoal}</p>
              <button className={styles.studentCta} type="button">내 성장 기록 전체 보기 <ArrowRight size={16} /></button>
            </section>
          </main>
          <nav className={styles.mobileBottomNav} aria-label="학생 시안 하단 메뉴">
            <span><Home size={19} /><small>홈</small></span>
            <span><BookOpenCheck size={19} /><small>학습</small></span>
            <span className={styles.mobileNavActive}><TrendingUp size={19} /><small>성장</small></span>
            <span><MessageCircle size={19} /><small>채팅</small></span>
            <span><UserRound size={19} /><small>내 정보</small></span>
          </nav>
        </div>
        <aside className={styles.prototypeRationale}>
          <span>학생 UX 기준</span>
          <h3>결과보다 ‘내가 해낸 것’을 먼저 보여줘요.</h3>
          <ul>
            <li><CheckCircle2 size={16} /> 한 화면에서 이번 주 성장을 이해</li>
            <li><CheckCircle2 size={16} /> 배운 개념을 XP와 함께 긍정적으로 표현</li>
            <li><CheckCircle2 size={16} /> 다음 목표는 부담 없는 ‘미션’ 언어 사용</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}

function ParentView({
  evaluation,
  selectedAttendanceMonth,
  onAttendanceMonthChange,
}: {
  evaluation: WeeklyEvaluation;
  selectedAttendanceMonth: AttendanceMonthId;
  onAttendanceMonthChange: (month: AttendanceMonthId) => void;
}) {
  const concepts = [...evaluation.preparedConcepts, ...evaluation.customConcepts];

  return (
    <section className={styles.rolePanel} id="integrated-parent-panel" role="tabpanel">
      <div className={styles.mobileStage} data-portal="parent">
        <div className={`${styles.mobileFrame} ${styles.parentFrame}`}>
          <header className={styles.mobileHeader}>
            <Brand compact />
            <button className={styles.childSelector} type="button">민준 학생 <ChevronDown size={15} /></button>
          </header>
          <main className={styles.mobileContent}>
            <div className={styles.parentWelcome}>
              <span>WEEKLY GROWTH REPORT</span>
              <h2>민준 학생의 이번 주 성장</h2>
              <p>수업에서 달라진 점과 다음 목표를 한눈에 확인하세요.</p>
              <small><CalendarDays size={14} /> 7월 6일 ~ 7월 12일</small>
            </div>

            <section className={styles.parentSummary}>
              <div><strong>80%</strong><small>과제 완료</small></div>
              <div><strong>72%</strong><small>주간 목표</small></div>
              <div><strong>64%</strong><small>프로젝트</small></div>
            </section>

            <MonthlyAttendance
              selectedMonth={selectedAttendanceMonth}
              onMonthChange={onAttendanceMonthChange}
              compact
            />

            <section className={styles.mobileCard}>
              <div className={styles.mobileSectionHeading}><span><MessageSquareQuote size={18} /></span><div><h3>선생님이 전하는 이야기</h3><p>이번 주 수업에서 관찰한 변화예요.</p></div></div>
              <dl className={styles.parentFeedback}>
                <div><dt>잘한 점</dt><dd>{evaluation.strength}</dd></div>
                <div><dt>보완할 점</dt><dd>{evaluation.improvement}</dd></div>
                <div><dt>다음 수업 목표</dt><dd>{evaluation.nextGoal}</dd></div>
              </dl>
            </section>

            <section className={styles.mobileCard}>
              <div className={styles.mobileSectionHeading}><span><BookOpenCheck size={18} /></span><div><h3>이번 주에 배운 내용</h3><p>아이에게 설명을 부탁해 보세요.</p></div></div>
              <ul className={styles.parentConcepts}>
                {concepts.map((concept) => (
                  <li key={concept}><CheckCircle2 size={17} /><div><strong>{concept}</strong><p>선생님이 이번 주 수업에서 배운 개념으로 기록했습니다.</p></div></li>
                ))}
              </ul>
            </section>

            <aside className={styles.conversationPrompt}>
              <span><Lightbulb size={19} /></span>
              <div><strong>이번 주에는 이렇게 물어보세요</strong><p>“반복문을 사용하면 어떤 일을 편하게 할 수 있어?”</p></div>
            </aside>
          </main>
          <nav className={styles.mobileBottomNav} aria-label="학부모 시안 하단 메뉴">
            <span><Home size={19} /><small>홈</small></span>
            <span><ClipboardCheck size={19} /><small>학습 현황</small></span>
            <span className={styles.mobileNavActive}><TrendingUp size={19} /><small>성장</small></span>
            <span><MessageCircle size={19} /><small>문의</small></span>
            <span><Settings size={19} /><small>설정</small></span>
          </nav>
        </div>
        <aside className={styles.prototypeRationale}>
          <span>학부모 UX 기준</span>
          <h3>점수보다 변화와 대화 방법을 먼저 전달해요.</h3>
          <ul>
            <li><CheckCircle2 size={16} /> 공개된 평가만 간결하게 표시</li>
            <li><CheckCircle2 size={16} /> 전문 용어를 쉬운 설명과 함께 제공</li>
            <li><CheckCircle2 size={16} /> 집에서 이어갈 대화 질문까지 안내</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}

export function IntegratedGrowthPrototype({
  mode = "preview",
}: {
  mode?: "preview" | "homepage";
}) {
  const [activeRole, setActiveRole] = useState<PreviewRole>("teacher");
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] =
    useState<AttendanceMonthId>("2026-08");
  const [draft, setDraft] = useState<WeeklyEvaluation>(() => copyEvaluation(INITIAL_EVALUATION));
  const [published, setPublished] = useState<WeeklyEvaluation>(() => copyEvaluation(INITIAL_EVALUATION));
  const activeRoleInfo = useMemo(
    () => ROLE_OPTIONS.find((role) => role.id === activeRole) ?? ROLE_OPTIONS[0],
    [activeRole],
  );
  const isHomepage = mode === "homepage";
  const activeHref = isHomepage ? activeRoleInfo.portalHref : activeRoleInfo.liveHref;

  return (
    <div className={styles.prototype}>
      <header className={styles.prototypeHeader}>
        <div className={styles.prototypeTitle}>
          <Brand />
          <div>
            <span>{isHomepage ? "코딩쏙 성장관리 기능 미리보기" : "홈페이지 통합형 UI/UX 시안"}</span>
            <p>선생님이 기록하고, 학생과 학부모가 같은 성장을 확인하는 흐름</p>
          </div>
        </div>
        <span className={styles.mockBadge}>
          {isHomepage ? "기능 미리보기 · 입력 내용 저장 안 됨" : "가상 데이터 · 실제 저장 없음"}
        </span>
      </header>

      <nav className={styles.roleSwitcher} role="tablist" aria-label="역할별 통합 시안 전환">
        {ROLE_OPTIONS.map((role) => {
          const Icon = role.icon;
          const active = role.id === activeRole;
          return (
            <button
              key={role.id}
              id={`integrated-${role.id}-tab`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`integrated-${role.id}-panel`}
              className={active ? styles.roleSelected : undefined}
              onClick={() => setActiveRole(role.id)}
            >
              <span><Icon size={19} /></span>
              <div><strong>{role.label}</strong><small>{role.description}</small></div>
            </button>
          );
        })}
      </nav>

      <div className={styles.roleContext}>
        <div>
          <span>{activeRoleInfo.label} 화면</span>
          <p>
            {isHomepage
              ? `${activeRoleInfo.description} 기능을 살펴보고 전용 포털로 이동할 수 있습니다.`
              : `${activeRoleInfo.description} 흐름을 코딩쏙 기존 메뉴 안에서 확인하는 시안입니다.`}
          </p>
        </div>
        <Link href={activeHref}>
          <LockKeyhole size={15} aria-hidden="true" />
          {isHomepage
            ? `${activeRoleInfo.label} 포털 열기`
            : `${activeRoleInfo.label} 시험 DB 연결 화면 열기`}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {activeRole === "teacher" ? (
        <TeacherView
          draft={draft}
          onDraftChange={setDraft}
          onPublish={() => setPublished(copyEvaluation(draft))}
          selectedAttendanceMonth={selectedAttendanceMonth}
          onAttendanceMonthChange={setSelectedAttendanceMonth}
        />
      ) : null}
      {activeRole === "student" ? (
        <StudentView
          evaluation={published}
          selectedAttendanceMonth={selectedAttendanceMonth}
          onAttendanceMonthChange={setSelectedAttendanceMonth}
        />
      ) : null}
      {activeRole === "parent" ? (
        <ParentView
          evaluation={published}
          selectedAttendanceMonth={selectedAttendanceMonth}
          onAttendanceMonthChange={setSelectedAttendanceMonth}
        />
      ) : null}
    </div>
  );
}
