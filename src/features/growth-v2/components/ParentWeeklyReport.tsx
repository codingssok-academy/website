import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FolderKanban,
  Lightbulb,
  MessageCircleQuestion,
  MessageSquareQuote,
  Target,
  TrendingUp,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import type { ParentWeeklyReportData } from "@/features/growth-v2/types/parent-weekly-report";
import styles from "./ParentWeeklyReport.module.css";

interface ParentWeeklyReportProps {
  report: ParentWeeklyReportData;
}

interface SectionHeadingProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

function SectionHeading({ id, icon: Icon, title, description }: SectionHeadingProps) {
  return (
    <div className={styles.sectionHeading}>
      <span className={styles.sectionIcon} aria-hidden="true">
        <Icon size={20} strokeWidth={2.1} />
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      className={styles.progressTrack}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function ParentWeeklyReport({ report }: ParentWeeklyReportProps) {
  const metrics = [
    {
      label: "출석",
      value: `${report.attendance.attended}회 / ${report.attendance.scheduled}회`,
      description: "예정된 수업에 모두 참여했어요.",
      icon: UserCheck,
    },
    {
      label: "과제 완료율",
      value: `${report.assignmentCompletion}%`,
      description: "이번 주 과제 수행 비율이에요.",
      progress: report.assignmentCompletion,
      icon: ClipboardCheck,
    },
    {
      label: "주간 목표 진행률",
      value: `${report.weeklyGoalProgress}%`,
      description: "정한 학습 목표를 따라가고 있어요.",
      progress: report.weeklyGoalProgress,
      icon: Target,
    },
    {
      label: "프로젝트 진행률",
      value: `${report.project.progress}%`,
      description: "우주 탐험 게임을 만들고 있어요.",
      progress: report.project.progress,
      icon: FolderKanban,
    },
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
          <Link href="/growth-preview">학생 화면 보기</Link>
          <span aria-current="page">학부모 화면</span>
          <Link href="/growth-preview/teacher">선생님 화면 보기</Link>
        </nav>
      </header>

      <main id="main-content" className={styles.report}>
        <section className={styles.reportIntro} aria-labelledby="parent-report-title">
          <div>
            <p className={styles.eyebrow}>주간 성장 리포트</p>
            <h1 id="parent-report-title">{report.studentName} 학생의 이번 주 성장</h1>
            <p className={styles.introduction}>{report.introduction}</p>
          </div>
          <div className={styles.reportMeta}>
            <span>
              <CalendarDays size={17} aria-hidden="true" />
              {report.period}
            </span>
            <small>Growth 2.0 테스트 화면 · 실제 학생 정보가 아닙니다.</small>
          </div>
        </section>

        <dl className={styles.metricGrid} aria-label="이번 주 핵심 지표">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div className={styles.metricItem} key={metric.label}>
                <div className={styles.metricHeading}>
                  <span aria-hidden="true">
                    <Icon size={20} strokeWidth={2.1} />
                  </span>
                  <dt>{metric.label}</dt>
                </div>
                <dd>{metric.value}</dd>
                <p>{metric.description}</p>
                {typeof metric.progress === "number" ? (
                  <ProgressBar value={metric.progress} label={metric.label} />
                ) : null}
              </div>
            );
          })}
        </dl>

        <section className={styles.teacherPanel} aria-labelledby="teacher-review-title">
          <SectionHeading
            id="teacher-review-title"
            icon={MessageSquareQuote}
            title="선생님 주간 평가"
            description="이번 주 수업에서 관찰한 성장과 다음 목표입니다."
          />
          <div className={styles.evaluationGrid}>
            <article>
              <span className={styles.evaluationLabel}>잘한 점</span>
              <p>{report.teacherEvaluation.strength}</p>
            </article>
            <article>
              <span className={styles.evaluationLabel}>보완할 점</span>
              <p>{report.teacherEvaluation.improvement}</p>
            </article>
            <article>
              <span className={styles.evaluationLabel}>다음 수업 목표</span>
              <p>{report.teacherEvaluation.nextLessonGoal}</p>
            </article>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.panel} aria-labelledby="learned-title">
            <SectionHeading
              id="learned-title"
              icon={BookOpenCheck}
              title="이번 주에 배운 내용"
              description="어려운 용어보다 실제로 무엇을 연습했는지 정리했어요."
            />
            <ul className={styles.conceptList}>
              {report.learnedConcepts.map((concept) => (
                <li key={concept.name}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <div>
                    <strong>{concept.name}</strong>
                    <p>{concept.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel} aria-labelledby="project-report-title">
            <SectionHeading
              id="project-report-title"
              icon={FolderKanban}
              title="프로젝트 현황"
              description="결과물을 완성해 가는 과정입니다."
            />
            <div className={styles.projectSummary}>
              <div className={styles.projectTitleRow}>
                <h3>{report.project.name}</h3>
                <strong>{report.project.progress}%</strong>
              </div>
              <ProgressBar value={report.project.progress} label="프로젝트 진행률" />
              <dl className={styles.projectDetails}>
                <div>
                  <dt>최근 작업</dt>
                  <dd>{report.project.recentWork}</dd>
                </div>
                <div>
                  <dt>다음 작업</dt>
                  <dd>{report.project.nextWork}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="growth-summary-title">
            <SectionHeading
              id="growth-summary-title"
              icon={TrendingUp}
              title="이번 주 성장 기록"
              description="학생이 직접 해낸 행동을 중심으로 모았어요."
            />
            <ul className={styles.activityList}>
              {report.growthActivities.map((activity) => (
                <li key={activity.id}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  <span>{activity.title}</span>
                </li>
              ))}
            </ul>
          </section>

          <aside className={styles.conversationCard} aria-labelledby="conversation-title">
            <SectionHeading
              id="conversation-title"
              icon={MessageCircleQuestion}
              title="이번 주에는 이렇게 물어보세요"
              description="정답을 확인하기보다 배운 내용을 이야기하는 시간이에요."
            />
            <div className={styles.conversationPrompt}>
              <Lightbulb size={22} aria-hidden="true" />
              <p>{report.conversationPrompt}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
