"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  History,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  createLocalParentSession,
  fetchLocalParentChildren,
  fetchLocalParentWeeklyReport,
} from "./local-parent-client";
import type {
  LocalParentChild,
  LocalParentSession,
  LocalParentWeeklyReportResponse,
} from "./types";
import { LocalParentPreviewError } from "./types";
import {
  formatStudentDisplayName,
  formatStudentPossessive,
  getGrowthPreviewEnvironmentCopy,
  shouldShowGrowthPreviewDemoNavigation,
} from "../preview-presentation";
import styles from "./LocalParentWeeklyReport.module.css";

function currentWeekStart() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - ((day + 6) % 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatPeriod(start: string, end: string) {
  return `${start.replaceAll("-", ".")} - ${end.replaceAll("-", ".")}`;
}

function formatPublishedAt(value: string | null) {
  if (!value) return "공개 시각 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "공개 시각 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function LocalParentWeeklyReport() {
  const environment = getGrowthPreviewEnvironmentCopy();
  const showDemoNavigation = shouldShowGrowthPreviewDemoNavigation();
  const [session, setSession] = useState<LocalParentSession | null>(null);
  const [children, setChildren] = useState<LocalParentChild[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [report, setReport] = useState<LocalParentWeeklyReportResponse | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const loginRequestRef = useRef(false);
  const reportRequestRef = useRef(false);

  const clearSession = () => {
    loginRequestRef.current = false;
    reportRequestRef.current = false;
    setSession(null);
    setChildren([]);
    setSelectedStudentId(null);
    setReport(null);
    setError(null);
    setNotice(null);
    setIsLoggingIn(false);
    setIsLoadingReport(false);
    setIsRefreshing(false);
  };

  const showError = (caught: unknown, fallback: string) => {
    if (caught instanceof LocalParentPreviewError) {
      if (caught.code === "SESSION_EXPIRED") clearSession();
      setError(caught.message);
      return;
    }
    setError(fallback);
  };

  const loadReport = async (
    activeSession: LocalParentSession,
    studentId: string,
    refresh = false,
  ) => {
    if (reportRequestRef.current) return;
    reportRequestRef.current = true;
    setError(null);
    setNotice(null);
    if (refresh) setIsRefreshing(true);
    else setIsLoadingReport(true);
    try {
      const nextReport = await fetchLocalParentWeeklyReport(
        activeSession,
        studentId,
        currentWeekStart(),
      );
      setReport(nextReport);
      if (refresh) setNotice("최신 공개 리포트를 다시 확인했습니다.");
    } catch (caught) {
      showError(caught, "최신 리포트를 불러오지 못했어요.");
    } finally {
      reportRequestRef.current = false;
      setIsLoadingReport(false);
      setIsRefreshing(false);
    }
  };

  const handleLogin = async () => {
    if (loginRequestRef.current) return;
    loginRequestRef.current = true;
    setIsLoggingIn(true);
    setError(null);
    setNotice(null);
    try {
      const nextSession = await createLocalParentSession();
      const childResponse = await fetchLocalParentChildren(nextSession);
      setSession(nextSession);
      setChildren(childResponse.data);
      if (childResponse.data.length > 0) {
        const firstStudent = childResponse.data[0];
        setSelectedStudentId(firstStudent.id);
        await loadReport(nextSession, firstStudent.id);
      }
    } catch (caught) {
      showError(caught, "테스트 학부모로 들어가지 못했어요.");
    } finally {
      loginRequestRef.current = false;
      setIsLoggingIn(false);
    }
  };

  const handleSelectStudent = async (studentId: string) => {
    if (!session || studentId === selectedStudentId || reportRequestRef.current) return;
    setSelectedStudentId(studentId);
    setReport(null);
    await loadReport(session, studentId);
  };

  const handleRefresh = async () => {
    if (!session || !selectedStudentId || reportRequestRef.current) return;
    await loadReport(session, selectedStudentId, true);
  };

  if (!session) {
    return (
      <main className={styles.loginPage} id="main-content">
        <section className={styles.loginPanel} aria-labelledby="parent-local-login-title">
          <span className={styles.loginIcon} aria-hidden="true"><ShieldCheck size={30} /></span>
          <p className={styles.eyebrow}>{environment.label}</p>
          <h1 id="parent-local-login-title">학부모 주간 성장 리포트</h1>
          <p className={styles.loginDescription}>
            {environment.description} 공개된 최신 평가를 확인합니다.
          </p>
          <ul className={styles.safetyList}>
            <li>공개된 최신 평가만 보여주는 읽기 전용 화면입니다.</li>
            <li>작성 중인 평가는 보이지 않습니다.</li>
            <li>운영 DB와 연결되지 않았습니다.</li>
            <li>새로고침하면 가상 로그인이 해제됩니다.</li>
          </ul>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? <RefreshCw className={styles.spin} size={18} /> : <Users size={18} />}
            {isLoggingIn ? "로그인 중" : "테스트 학부모로 들어가기"}
          </button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {showDemoNavigation ? (
            <Link href="/growth-preview/parent" className={styles.mockLink}>기존 데모 학부모 화면 보기</Link>
          ) : null}
        </section>
      </main>
    );
  }

  const evaluation = report?.data.published_evaluation ?? null;
  const selectedConcepts = evaluation?.selected_concepts ?? evaluation?.concepts ?? [];
  const customConcepts = evaluation?.custom_concepts ?? [];

  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        {showDemoNavigation ? (
          <Link href="/growth-preview/parent" className={styles.brand} aria-label="코딩쏙 Growth 2.0 기존 데모 학부모 화면">
            <span className={styles.brandMark}>C</span>
            <span><strong>코딩쏙</strong><small>Growth 2.0</small></span>
          </Link>
        ) : (
          <div className={styles.brand}>
            <span className={styles.brandMark}>C</span>
            <span><strong>코딩쏙</strong><small>Growth 2.0</small></span>
          </div>
        )}
        <span className={styles.localBadge}>{environment.badge}</span>
        <button type="button" className={styles.logoutButton} onClick={clearSession}>
          <LogOut size={17} /> 체험 끝내기
        </button>
      </header>

      <aside className={styles.safetyBanner}>
        <strong>{environment.label}</strong>
        <span>{environment.description} 공개된 최신 평가만 표시하며 작성 중인 평가는 보이지 않습니다.</span>
      </aside>

      <main id="main-content" className={styles.reportShell}>
        <section className={styles.childSelector} aria-labelledby="connected-children-title">
          <div>
            <p className={styles.eyebrow}>연결 자녀</p>
            <h1 id="connected-children-title">주간 성장 리포트</h1>
          </div>
          {children.length > 0 ? (
            <div className={styles.childTabs} role="group" aria-label="리포트를 확인할 자녀 선택">
              {children.map((child) => {
                const selected = child.id === selectedStudentId;
                return (
                  <button
                    type="button"
                    key={child.id}
                    className={selected ? styles.childTabSelected : styles.childTab}
                    aria-current={selected ? "true" : undefined}
                    onClick={() => handleSelectStudent(child.id)}
                    disabled={isLoadingReport || isRefreshing}
                  >
                    {formatStudentDisplayName(child.display_name)}
                    <small>{selected ? "현재 선택" : "리포트 보기"}</small>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyChildren}>연결된 자녀가 없습니다.</p>
          )}
        </section>

        {children.length > 0 ? (
          <div className={styles.toolbar}>
            <p>현재 공개된 최신 평가입니다.</p>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={handleRefresh}
              disabled={!selectedStudentId || isLoadingReport || isRefreshing}
            >
              <RefreshCw className={isRefreshing ? styles.spin : undefined} size={17} />
              {isRefreshing ? "불러오는 중" : "최신 리포트 다시 불러오기"}
            </button>
          </div>
        ) : null}

        <div className={styles.liveRegion} aria-live="polite">
          {notice ? <p className={styles.notice}>{notice}</p> : null}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </div>

        {isLoadingReport ? (
          <section className={styles.loadingPanel} aria-live="polite">
            <RefreshCw className={styles.spin} size={22} /> 최신 공개 리포트를 불러오는 중입니다.
          </section>
        ) : report && !evaluation ? (
          <section className={styles.emptyReport} aria-labelledby="empty-report-title">
            <span aria-hidden="true"><BookOpenCheck size={28} /></span>
            <h2 id="empty-report-title">아직 공개된 주간 평가가 없습니다.</h2>
            <p>선생님이 평가를 공개하면 이 화면에서 확인할 수 있어요.</p>
          </section>
        ) : report && evaluation ? (
          <div className={styles.reportContent}>
            <section className={styles.reportIntro} aria-labelledby="local-parent-report-title">
              <div>
                <p className={styles.eyebrow}>최신 주간 평가</p>
                <h2 id="local-parent-report-title">{formatStudentPossessive(report.data.student.display_name)} 이번 주 성장</h2>
                <p className={styles.publishedHint}>선생님이 공개한 최신 평가입니다.</p>
              </div>
              <div className={styles.reportMeta}>
                <span><CalendarDays size={16} /> {formatPeriod(report.period.week_start, report.period.week_end)}</span>
                <span><History size={16} /> 공개일 {formatPublishedAt(evaluation.published_at)}</span>
              </div>
            </section>

            <section className={styles.evaluationPanel} aria-labelledby="evaluation-title">
              <div className={styles.sectionTitle}>
                <span aria-hidden="true"><Sparkles size={20} /></span>
                <div><h3 id="evaluation-title">선생님 주간 평가</h3><p>이번 주 성장과 다음 수업 방향입니다.</p></div>
              </div>
              <div className={styles.evaluationGrid}>
                <article><strong>잘한 점</strong><p>{evaluation.strength}</p></article>
                <article><strong>보완할 점</strong><p>{evaluation.improvement}</p></article>
                <article><strong>다음 수업 목표</strong><p>{evaluation.next_goal}</p></article>
              </div>
            </section>

            <div className={styles.contentGrid}>
              <section className={styles.panel} aria-labelledby="concepts-title">
                <div className={styles.sectionTitle}>
                  <span aria-hidden="true"><BookOpenCheck size={20} /></span>
                  <div><h3 id="concepts-title">이번 주에 배운 내용</h3><p>수업에서 연습한 개념을 모았습니다.</p></div>
                </div>
                {selectedConcepts.length > 0 ? (
                  <div className={styles.conceptGroup}>
                    <h4>준비된 학습 개념</h4>
                    <ul>{selectedConcepts.map((concept) => <li key={`${concept.key}-${concept.label}`}><CheckCircle2 size={17} /><span><strong>{concept.label}</strong>{concept.description ? <small>{concept.description}</small> : null}</span></li>)}</ul>
                  </div>
                ) : null}
                {customConcepts.length > 0 ? (
                  <div className={styles.conceptGroup}>
                    <h4>선생님이 직접 기록한 개념</h4>
                    <ul>{customConcepts.map((concept, index) => <li key={`${concept.label}-${index}`}><CheckCircle2 size={17} /><span><strong>{concept.label}</strong></span></li>)}</ul>
                  </div>
                ) : null}
                {selectedConcepts.length === 0 && customConcepts.length === 0 ? <p className={styles.inlineEmpty}>공개된 학습 개념이 없습니다.</p> : null}
              </section>

              {report.data.projects.length > 0 ? (
                <section className={styles.panel} aria-labelledby="project-title">
                  <div className={styles.sectionTitle}>
                    <span aria-hidden="true"><FolderKanban size={20} /></span>
                    <div><h3 id="project-title">프로젝트 기록</h3><p>선생님이 공개한 최신 활동 기록입니다.</p></div>
                  </div>
                  <div className={styles.projectList}>
                    {report.data.projects.map((project) => (
                      <article key={project.project_id}>
                        <h4>{project.name}</h4>
                        {project.description ? <p>{project.description}</p> : null}
                        {project.latest_update ? <dl><div><dt>최근 작업</dt><dd>{project.latest_update.recent_work}</dd></div><div><dt>다음 작업</dt><dd>{project.latest_update.next_work}</dd></div></dl> : <p>아직 공개된 작업 기록이 없습니다.</p>}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            {report.data.growth_summary.length > 0 ? (
              <section className={styles.growthPanel} aria-labelledby="growth-title">
                <div className={styles.sectionTitle}>
                  <span aria-hidden="true"><Target size={20} /></span>
                  <div><h3 id="growth-title">최근 성장 기록</h3><p>학부모에게 공개된 기록만 표시합니다.</p></div>
                </div>
                <ul>{report.data.growth_summary.map((event, index) => <li key={`${event.occurred_at}-${index}`}><strong>{event.title}</strong><span>{event.detail}</span></li>)}</ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
