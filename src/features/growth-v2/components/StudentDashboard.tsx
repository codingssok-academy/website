"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
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
  DailyMission,
  EarnedBadge,
  GrowthIconName,
  StudentGrowthDashboard,
} from "@/features/growth-v2/types/student-dashboard";
import { PREVIEW_MISSION_TIMELINE_ENTRY } from "@/features/growth-v2/data/growth-timeline.mock";
import { DashboardSectionTitle } from "./DashboardSectionTitle";
import { GrowthTimeline } from "./GrowthTimeline";
import { MissionPanel } from "./MissionPanel";
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

function getInitiallyCompletedMissionIds(missions: DailyMission[]) {
  return new Set(
    missions
      .filter((mission) => mission.status === "completed")
      .map((mission) => mission.id),
  );
}

export function StudentDashboard({ dashboard }: StudentDashboardProps) {
  const {
    student,
    missions,
    weeklyGrowth,
    teacherFeedback,
    project,
    recentBadges,
    growthTimeline: initialGrowthTimeline,
  } = dashboard;
  const [completedMissionIds, setCompletedMissionIds] = useState(() =>
    getInitiallyCompletedMissionIds(missions),
  );
  const [earnedPreviewXp, setEarnedPreviewXp] = useState(0);
  const [completionMessage, setCompletionMessage] = useState("");
  const [growthTimeline, setGrowthTimeline] = useState(initialGrowthTimeline);
  const [highlightedTimelineEntryId, setHighlightedTimelineEntryId] = useState("");
  const [timelineAnnouncement, setTimelineAnnouncement] = useState("");
  const rewardedMissionIdsRef = useRef(new Set<string>());
  const totalXp = student.totalXp + earnedPreviewXp;
  const xpRemaining = student.nextLevelXp - totalXp;
  const levelProgress = Math.min(
    100,
    Math.round((totalXp / student.nextLevelXp) * 100),
  );

  const handleCompleteMission = useCallback(
    (missionId: string) => {
      const mission = missions.find((item) => item.id === missionId);

      if (
        !mission ||
        mission.status === "completed" ||
        rewardedMissionIdsRef.current.has(missionId)
      ) {
        return;
      }

      rewardedMissionIdsRef.current.add(missionId);
      setCompletedMissionIds((current) => new Set(current).add(missionId));
      setEarnedPreviewXp((current) => current + mission.xp);
      setCompletionMessage(`미션 완료! +${mission.xp} XP를 획득했어요.`);
      setGrowthTimeline((current) => [
        PREVIEW_MISSION_TIMELINE_ENTRY,
        ...current,
      ].slice(0, 6));
      setHighlightedTimelineEntryId(PREVIEW_MISSION_TIMELINE_ENTRY.id);
      setTimelineAnnouncement(
        `새 성장 기록: ${PREVIEW_MISSION_TIMELINE_ENTRY.title}, +${PREVIEW_MISSION_TIMELINE_ENTRY.xp} XP`,
      );
    },
    [missions],
  );

  const handleResetPreview = useCallback(() => {
    rewardedMissionIdsRef.current.clear();
    setCompletedMissionIds(getInitiallyCompletedMissionIds(missions));
    setEarnedPreviewXp(0);
    setCompletionMessage("");
    setGrowthTimeline(initialGrowthTimeline);
    setHighlightedTimelineEntryId("");
    setTimelineAnnouncement("");
  }, [initialGrowthTimeline, missions]);

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
        <div className={styles.topbarActions}>
          <Link href="/growth-preview/parent" className={styles.previewSwitch}>
            학부모 화면 보기
          </Link>
          <span className={styles.previewBadge}>가상 학생 미리보기</span>
        </div>
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
                <span
                  data-testid="level-progress-fill"
                  style={{ width: `${levelProgress}%` }}
                />
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
              <dd>{totalXp.toLocaleString()} XP</dd>
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
            <MissionPanel
              missions={missions}
              completedMissionIds={completedMissionIds}
              completionMessage={completionMessage}
              hasPreviewChanges={earnedPreviewXp > 0}
              onComplete={handleCompleteMission}
              onReset={handleResetPreview}
            />

            <section className={styles.panel} aria-labelledby="weekly-growth-title">
              <div className={styles.panelHeader}>
                <DashboardSectionTitle
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
                <DashboardSectionTitle
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

            <GrowthTimeline
              entries={growthTimeline}
              highlightedEntryId={highlightedTimelineEntryId}
              announcement={timelineAnnouncement}
            />
          </div>

          <aside className={styles.sideColumn} aria-label="학습 도움 정보">
            <section className={styles.feedbackPanel} aria-labelledby="feedback-title">
              <DashboardSectionTitle
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
              <DashboardSectionTitle
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
