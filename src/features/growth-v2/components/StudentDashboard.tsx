import {
  BookOpenCheck,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Code2,
  Flame,
  Medal,
  MessageSquareQuote,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type {
  EarnedBadge,
  GrowthIconName,
  StudentGrowthDashboard,
} from "@/features/growth-v2/types/student-dashboard";
import styles from "./StudentDashboard.module.css";

interface StudentDashboardProps {
  dashboard: StudentGrowthDashboard;
}

const BADGE_ICONS: Record<GrowthIconName, LucideIcon> = {
  code: Code2,
  calendar: CalendarDays,
  rocket: Rocket,
  trophy: Trophy,
  sparkles: Sparkles,
  flame: Flame,
};

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.progressGroup}>
      <div className={styles.progressLabel}>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span className={styles.progressFill} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  note,
}: {
  icon: LucideIcon;
  title: string;
  note?: string;
}) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionIcon} aria-hidden="true">
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <div>
        <h2>{title}</h2>
        {note ? <p>{note}</p> : null}
      </div>
    </div>
  );
}

function BadgeItem({ badge }: { badge: EarnedBadge }) {
  const Icon = BADGE_ICONS[badge.icon];

  return (
    <li className={styles.badgeItem}>
      <span className={styles.badgeIcon} aria-hidden="true">
        <Icon size={22} strokeWidth={2.2} />
      </span>
      <div>
        <strong>{badge.name}</strong>
        <span>{badge.description}</span>
      </div>
    </li>
  );
}

export function StudentDashboard({ dashboard }: StudentDashboardProps) {
  const { student, missions, weeklyGrowth, teacherFeedback, project, recentBadges } = dashboard;
  const xpRemaining = student.nextLevelXp - student.totalXp;
  const levelProgress = Math.round((student.totalXp / student.nextLevelXp) * 100);
  const completedMissionCount = missions.filter(
    (mission) => mission.status === "completed",
  ).length;

  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        <div className={styles.brand} aria-label="코딩쏙 Growth 2.0">
          <span className={styles.brandMark}>C</span>
          <span>
            <strong>코딩쏙</strong>
            <small>Growth 2.0</small>
          </span>
        </div>
        <span className={styles.previewBadge}>가상 학생 미리보기</span>
      </header>

      <main id="main-content" className={styles.dashboard}>
        <section className={styles.summary} aria-labelledby="student-greeting">
          <div className={styles.summaryIntro}>
            <p className={styles.kicker}>오늘도 한 걸음 성장 중</p>
            <h1 id="student-greeting">안녕하세요, {student.displayName} 학생</h1>
            <p className={styles.summaryMessage}>
              오늘 미션을 하나씩 마치며 나만의 코딩 실력을 쌓아 보세요.
            </p>

            <div className={styles.levelProgress}>
              <div className={styles.levelProgressText}>
                <span>레벨 {student.level} 진행도</span>
                <strong>다음 레벨까지 {xpRemaining.toLocaleString()} XP</strong>
              </div>
              <div
                className={styles.levelTrack}
                role="progressbar"
                aria-label={`레벨 ${student.level} 진행도`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={levelProgress}
              >
                <span style={{ width: `${levelProgress}%` }} />
              </div>
            </div>
          </div>

          <dl className={styles.summaryStats}>
            <div>
              <dt>현재 레벨</dt>
              <dd>Lv. {student.level}</dd>
            </div>
            <div>
              <dt>총 경험치</dt>
              <dd>{student.totalXp.toLocaleString()} XP</dd>
            </div>
            <div>
              <dt>연속 학습</dt>
              <dd className={styles.streakValue}>
                <Flame size={22} aria-hidden="true" /> {student.streakDays}일
              </dd>
            </div>
          </dl>
        </section>

        <div className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <section className={styles.panel} aria-labelledby="missions-title">
              <div className={styles.panelHeader}>
                <SectionTitle
                  icon={Target}
                  title="오늘의 미션"
                  note="오늘 할 일을 차근차근 끝내 보세요."
                />
                <span className={styles.countPill}>
                  {completedMissionCount}/{missions.length} 완료
                </span>
              </div>

              <ul className={styles.missionList}>
                {missions.map((mission) => {
                  const isCompleted = mission.status === "completed";

                  return (
                    <li className={styles.missionItem} key={mission.id}>
                      <span
                        className={isCompleted ? styles.checkDone : styles.checkPending}
                        aria-hidden="true"
                      >
                        {isCompleted ? <Check size={19} /> : <Circle size={19} />}
                      </span>
                      <div className={styles.missionCopy}>
                        <strong id={mission.id}>{mission.title}</strong>
                        <span>{mission.detail}</span>
                      </div>
                      <span
                        className={isCompleted ? styles.xpEarned : styles.xpPending}
                        aria-label={
                          isCompleted
                            ? `${mission.xp} 경험치 획득 완료`
                            : `완료하면 ${mission.xp} 경험치`
                        }
                      >
                        {isCompleted ? `+${mission.xp} XP` : `완료 시 +${mission.xp} XP`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className={styles.panel} aria-labelledby="weekly-growth-title">
              <div className={styles.panelHeader}>
                <SectionTitle
                  icon={TrendingUp}
                  title="이번 주 성장"
                  note="지난주와 비교해 달라진 점을 확인해요."
                />
                <span className={styles.positiveChange}>
                  <TrendingUp size={15} aria-hidden="true" /> 좋은 변화
                </span>
              </div>

              <div className={styles.growthMetrics}>
                <ProgressBar value={weeklyGrowth.goalProgress} label="주간 목표 진행률" />
                <ProgressBar
                  value={weeklyGrowth.assignmentCompletion}
                  label="과제 완료율"
                />
              </div>

              <div className={styles.conceptBlock}>
                <strong>이번 주에 배운 개념</strong>
                <div className={styles.conceptList}>
                  {weeklyGrowth.learnedConcepts.map((concept) => (
                    <span key={concept}>{concept}</span>
                  ))}
                </div>
              </div>

              <p className={styles.changeNote}>
                <Sparkles size={17} aria-hidden="true" />
                {weeklyGrowth.changeFromLastWeek}
              </p>
            </section>

            <section className={styles.panel} aria-labelledby="project-title">
              <div className={styles.panelHeader}>
                <SectionTitle
                  icon={Rocket}
                  title="진행 중인 프로젝트"
                  note="완성까지 얼마나 왔는지 살펴보세요."
                />
                <span className={styles.projectPercent}>{project.progress}%</span>
              </div>

              <div className={styles.projectHeading}>
                <div className={styles.projectIcon} aria-hidden="true">
                  <Code2 size={24} />
                </div>
                <div>
                  <h3 id="project-title">{project.name}</h3>
                  <p>{project.recentWork}</p>
                </div>
              </div>
              <div
                className={styles.projectTrack}
                role="progressbar"
                aria-label={`${project.name} 진행률`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={project.progress}
              >
                <span style={{ width: `${project.progress}%` }} />
              </div>
            </section>
          </div>

          <aside className={styles.sideColumn} aria-label="학습 도움 정보">
            <section className={styles.feedbackPanel} aria-labelledby="feedback-title">
              <SectionTitle
                icon={MessageSquareQuote}
                title="선생님 피드백"
                note="최근 수업에서 남긴 한줄평이에요."
              />
              <blockquote id="feedback-title">“{teacherFeedback.comment}”</blockquote>
              <div className={styles.nextGoal}>
                <span>
                  <Target size={17} aria-hidden="true" /> 다음 수업 목표
                </span>
                <p>{teacherFeedback.nextLessonGoal}</p>
              </div>
            </section>

            <section className={styles.panel} aria-labelledby="badges-title">
              <SectionTitle
                icon={Medal}
                title="최근 획득 배지"
                note="노력해서 얻은 멋진 기록이에요."
              />
              <ul id="badges-title" className={styles.badgeList}>
                {recentBadges.map((badge) => (
                  <BadgeItem badge={badge} key={badge.id} />
                ))}
              </ul>
            </section>

            <section className={styles.nextStudy} aria-label="다음 학습 안내">
              <Clock3 size={20} aria-hidden="true" />
              <div>
                <strong>다음 학습 추천</strong>
                <span>완료하지 않은 미션 1개부터 시작해 보세요.</span>
              </div>
              <BookOpenCheck size={22} aria-hidden="true" />
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
