"use client";

import Link from "next/link";
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  Database,
  FolderKanban,
  History,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { useRef, useState } from "react";
import { MonthlyAttendancePanel } from "@/features/growth-v2/attendance/MonthlyAttendancePanel";
import {
  createLocalStudentSession,
  fetchLocalStudentHome,
} from "./local-student-client";
import {
  LocalStudentPreviewError,
  type LocalStudentCode,
  type LocalStudentHomeResponse,
  type LocalStudentSession,
} from "./types";
import {
  formatStudentPossessive,
  getGrowthPreviewEnvironmentCopy,
  shouldShowGrowthPreviewDemoNavigation,
} from "../preview-presentation";
import styles from "./LocalStudentReport.module.css";

const STUDENT_LABELS: Record<LocalStudentCode, string> = {
  "student-a": "테스트 학생 A",
  "student-b": "테스트 학생 B",
};

function formatPeriod(start: string, end: string) {
  return `${start.replaceAll("-", ".")} - ${end.replaceAll("-", ".")}`;
}

function formatDate(value: string | null) {
  if (!value) return "날짜 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function LocalStudentReport() {
  const environment = getGrowthPreviewEnvironmentCopy();
  const showDemoNavigation = shouldShowGrowthPreviewDemoNavigation();
  const [session, setSession] = useState<LocalStudentSession | null>(null);
  const [studentCode, setStudentCode] = useState<LocalStudentCode | null>(null);
  const [home, setHome] = useState<LocalStudentHomeResponse | null>(null);
  const [loggingInCode, setLoggingInCode] = useState<LocalStudentCode | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const loginRequestRef = useRef(false);
  const homeRequestRef = useRef(false);

  const clearSession = (message: string | null = null) => {
    loginRequestRef.current = false;
    homeRequestRef.current = false;
    setSession(null);
    setStudentCode(null);
    setHome(null);
    setLoggingInCode(null);
    setIsRefreshing(false);
    setNotice(null);
    setError(message);
  };

  const showError = (caught: unknown, fallback: string) => {
    if (caught instanceof LocalStudentPreviewError) {
      if (caught.code === "SESSION_EXPIRED") {
        clearSession(caught.message);
        return;
      }
      setError(caught.message);
      return;
    }
    setError(fallback);
  };

  const handleLogin = async (code: LocalStudentCode) => {
    if (loginRequestRef.current) return;
    loginRequestRef.current = true;
    setLoggingInCode(code);
    setError(null);
    setNotice(null);
    try {
      const nextSession = await createLocalStudentSession(code);
      const nextHome = await fetchLocalStudentHome(nextSession);
      setSession(nextSession);
      setStudentCode(code);
      setHome(nextHome);
    } catch (caught) {
      setSession(null);
      setStudentCode(null);
      setHome(null);
      showError(caught, "학생 정보를 불러오지 못했어요.");
    } finally {
      loginRequestRef.current = false;
      setLoggingInCode(null);
    }
  };

  const handleRefresh = async () => {
    if (!session || homeRequestRef.current) return;
    homeRequestRef.current = true;
    setIsRefreshing(true);
    setError(null);
    setNotice(null);
    try {
      const nextHome = await fetchLocalStudentHome(session);
      setHome(nextHome);
      setNotice("최신 공개 내용을 다시 확인했어요.");
    } catch (caught) {
      showError(caught, "최신 내용을 다시 불러오지 못했어요.");
    } finally {
      homeRequestRef.current = false;
      setIsRefreshing(false);
    }
  };

  if (!session || !studentCode || !home?.data) {
    return (
      <main className={styles.loginPage} id="main-content">
        <section className={styles.loginPanel} aria-labelledby="student-local-login-title">
          <span className={styles.loginIcon} aria-hidden="true"><Database size={30} /></span>
          <p className={styles.eyebrow}>{environment.label}</p>
          <h1 id="student-local-login-title">학생 성장 리포트</h1>
          <p className={styles.loginDescription}>
            {environment.description} 나에게 공개된 최신 학습 기록을 확인합니다.
          </p>
          <ul className={styles.safetyList}>
            <li>공개된 최신 평가만 보여주는 읽기 전용 화면입니다.</li>
            <li>작성 중인 평가는 보이지 않습니다.</li>
            <li>보완할 점은 학생 화면에 표시되지 않습니다.</li>
            <li>운영 DB와 연결되지 않았습니다.</li>
            <li>새로고침하면 가상 로그인이 해제됩니다.</li>
          </ul>
          <div className={styles.studentChoices} aria-label="가상 학생 선택">
            {(Object.keys(STUDENT_LABELS) as LocalStudentCode[]).map((code) => {
              const isLoading = loggingInCode === code;
              return (
                <button
                  type="button"
                  key={code}
                  className={styles.studentButton}
                  onClick={() => handleLogin(code)}
                  disabled={loggingInCode !== null}
                >
                  {isLoading ? <RefreshCw className={styles.spin} size={18} /> : <UserRound size={18} />}
                  {isLoading ? "로그인 중" : `${STUDENT_LABELS[code]}로 들어가기`}
                </button>
              );
            })}
          </div>
          <div className={styles.liveRegion} aria-live="polite">
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
          </div>
          {showDemoNavigation ? (
            <Link href="/growth-preview" className={styles.mockLink}>기존 데모 학생 화면 보기</Link>
          ) : null}
        </section>
      </main>
    );
  }

  const data = home.data;
  const feedback = data.published_feedback;
  const selectedConcepts = feedback?.selected_concepts ?? feedback?.concepts ?? [];
  const customConcepts = feedback?.custom_concepts ?? [];

  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        {showDemoNavigation ? (
          <Link href="/growth-preview" className={styles.brand} aria-label="코딩쏙 Growth 2.0 기존 데모 학생 화면">
            <span className={styles.brandMark}>C</span>
            <span><strong>코딩쏙</strong><small>Growth 2.0</small></span>
          </Link>
        ) : (
          <div className={styles.brand}>
            <span className={styles.brandMark}>C</span>
            <span><strong>코딩쏙</strong><small>Growth 2.0</small></span>
          </div>
        )}
        {showDemoNavigation ? (
          <nav className={styles.screenLinks} aria-label="데모 화면 이동">
            <Link href="/growth-preview/parent-local">학부모</Link>
            <Link href="/growth-preview/teacher-local">선생님</Link>
          </nav>
        ) : null}
        <span className={styles.localBadge}>{environment.badge}</span>
        <button type="button" className={styles.logoutButton} onClick={() => clearSession()}>
          <LogOut size={17} /> 체험 끝내기
        </button>
      </header>

      <aside className={styles.safetyBanner}>
        <ShieldCheck size={18} aria-hidden="true" />
        <span><strong>{environment.label}</strong> {environment.description} 공개된 최신 평가만 표시하며 보완할 점과 작성 중인 평가는 보이지 않습니다.</span>
      </aside>

      <main id="main-content" className={styles.dashboard}>
        <section className={styles.summary} aria-labelledby="student-report-title">
          <div>
            <p className={styles.eyebrow}>현재 로그인 학생</p>
            <h1 id="student-report-title">{formatStudentPossessive(data.student.display_name)} 성장 리포트</h1>
            <p>선생님이 공개한 학습 기록을 내 화면에서 확인해요.</p>
          </div>
          <dl className={styles.xpSummary}>
            <div><dt>총 XP</dt><dd>{data.total_xp.toLocaleString()} XP</dd></div>
            <div><dt>이번 주 미션</dt><dd>{data.missions.length}개</dd></div>
          </dl>
        </section>

        <div className={styles.toolbar}>
          <div>
            <strong>현재 공개된 최신 평가입니다.</strong>
            <span>{formatPeriod(home.period.week_start, home.period.week_end)}</span>
          </div>
          <button type="button" className={styles.refreshButton} onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={isRefreshing ? styles.spin : undefined} size={17} />
            {isRefreshing ? "불러오는 중" : "최신 내용 다시 불러오기"}
          </button>
        </div>

        <div className={styles.liveRegion} aria-live="polite">
          {notice ? <p className={styles.notice}>{notice}</p> : null}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </div>

        <MonthlyAttendancePanel
          key={data.student.id}
          accessToken={session.accessToken}
          studentId={data.student.id}
        />

        {!feedback ? (
          <section className={styles.emptyReport} aria-labelledby="student-empty-report-title">
            <BookOpenCheck size={30} aria-hidden="true" />
            <h2 id="student-empty-report-title">아직 공개된 주간 평가가 없습니다.</h2>
            <p>선생님이 평가를 공개하면 이 화면에서 확인할 수 있어요.</p>
          </section>
        ) : (
          <div className={styles.evaluationGrid}>
            <section className={styles.feedbackPanel} aria-labelledby="student-feedback-title">
              <div className={styles.sectionTitle}>
                <Sparkles size={21} aria-hidden="true" />
                <div><h2 id="student-feedback-title">선생님 피드백</h2><p>이번 주에 잘한 점입니다.</p></div>
              </div>
              <blockquote>{feedback.strength}</blockquote>
              <div className={styles.nextGoal}>
                <Target size={19} aria-hidden="true" />
                <div><strong>다음 수업 목표</strong><p>{feedback.next_goal}</p></div>
              </div>
              <div className={styles.feedbackMeta}>
                <span><History size={15} /> {formatDate(feedback.published_at)}</span>
              </div>
            </section>

            <section className={styles.panel} aria-labelledby="student-concepts-title">
              <div className={styles.sectionTitle}>
                <BookOpenCheck size={21} aria-hidden="true" />
                <div><h2 id="student-concepts-title">이번 주에 배운 내용</h2><p>공개된 학습 개념을 모았어요.</p></div>
              </div>
              {selectedConcepts.length > 0 ? (
                <div className={styles.conceptGroup}>
                  <h3>준비된 개념</h3>
                  <ul>{selectedConcepts.map((concept) => <li key={`${concept.key}-${concept.label}`}><CheckCircle2 size={16} /><span><strong>{concept.label}</strong>{concept.description ? <small>{concept.description}</small> : null}</span></li>)}</ul>
                </div>
              ) : null}
              {customConcepts.length > 0 ? (
                <div className={styles.conceptGroup}>
                  <h3>선생님이 기록한 개념</h3>
                  <ul>{customConcepts.map((concept, index) => <li key={`${concept.label}-${index}`}><CheckCircle2 size={16} /><span><strong>{concept.label}</strong></span></li>)}</ul>
                </div>
              ) : null}
              {selectedConcepts.length === 0 && customConcepts.length === 0 ? <p className={styles.inlineEmpty}>공개된 학습 개념이 아직 없습니다.</p> : null}
            </section>
          </div>
        )}

        <div className={styles.contentGrid}>
          {data.missions.length > 0 ? (
            <section className={styles.panel} aria-labelledby="student-missions-title">
              <div className={styles.sectionTitle}>
                <Trophy size={21} aria-hidden="true" />
                <div><h2 id="student-missions-title">이번 주 미션</h2><p>현재 상태를 읽기만 할 수 있어요.</p></div>
              </div>
              <ul className={styles.missionList}>
                {data.missions.map((mission) => {
                  const complete = mission.status === "completed";
                  return (
                    <li key={mission.student_mission_id}>
                      <div><strong>{mission.title}</strong><p>{mission.detail}</p><small>{mission.xp_reward} XP</small></div>
                      {complete ? <span className={styles.completeStatus}><CheckCircle2 size={16} /> 완료됨</span> : <button type="button" disabled aria-label={`${mission.title} 읽기 전용`}>읽기 전용</button>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {data.projects.length > 0 ? (
            <section className={styles.panel} aria-labelledby="student-projects-title">
              <div className={styles.sectionTitle}>
                <FolderKanban size={21} aria-hidden="true" />
                <div><h2 id="student-projects-title">프로젝트 기록</h2><p>공개된 최신 작업 내용입니다.</p></div>
              </div>
              <div className={styles.projectList}>
                {data.projects.map((project) => (
                  <article key={project.project_id}>
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    {project.latest_update ? (
                      <dl>
                        <div><dt>최근 작업</dt><dd>{project.latest_update.recent_work}</dd></div>
                        <div><dt>다음 작업</dt><dd>{project.latest_update.next_work}</dd></div>
                        {project.latest_update.progress_pct !== null ? <div><dt>현재 진행</dt><dd>{project.latest_update.progress_pct}%</dd></div> : null}
                      </dl>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {data.recent_growth.length > 0 ? (
            <section className={styles.panel} aria-labelledby="student-growth-title">
              <div className={styles.sectionTitle}>
                <History size={21} aria-hidden="true" />
                <div><h2 id="student-growth-title">성장 기록</h2><p>학생에게 공개된 최근 활동입니다.</p></div>
              </div>
              <ol className={styles.growthList}>
                {data.recent_growth.map((entry, index) => <li key={`${entry.type}-${entry.occurred_at}-${index}`}><span aria-hidden="true" /><div><strong>{entry.title}</strong>{entry.detail ? <p>{entry.detail}</p> : null}<small>{formatDate(entry.occurred_at)}</small></div></li>)}
              </ol>
            </section>
          ) : null}

          {data.badges.length > 0 ? (
            <section className={styles.panel} aria-labelledby="student-badges-title">
              <div className={styles.sectionTitle}>
                <Award size={21} aria-hidden="true" />
                <div><h2 id="student-badges-title">획득 배지</h2><p>학생이 실제로 획득한 배지를 모았어요.</p></div>
              </div>
              <ul className={styles.badgeList}>{data.badges.map((badge) => <li key={badge.code}><span aria-hidden="true"><Award size={20} /></span><div><strong>{badge.name}</strong><p>{badge.description}</p></div></li>)}</ul>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
