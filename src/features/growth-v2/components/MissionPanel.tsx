import { Check, Circle, RotateCcw, Target } from "lucide-react";
import type { DailyMission } from "@/features/growth-v2/types/student-dashboard";
import { DashboardSectionTitle } from "./DashboardSectionTitle";
import dashboardStyles from "./StudentDashboard.module.css";
import styles from "./MissionPanel.module.css";

interface MissionPanelProps {
  missions: DailyMission[];
  completedMissionIds: ReadonlySet<string>;
  completionMessage: string;
  hasPreviewChanges: boolean;
  onComplete: (missionId: string) => void;
  onReset: () => void;
}

export function MissionPanel({
  missions,
  completedMissionIds,
  completionMessage,
  hasPreviewChanges,
  onComplete,
  onReset,
}: MissionPanelProps) {
  const completedMissionCount = missions.filter((mission) =>
    completedMissionIds.has(mission.id),
  ).length;

  return (
    <section className={dashboardStyles.panel} aria-labelledby="missions-title">
      <div className={dashboardStyles.panelHeader}>
        <DashboardSectionTitle
          id="missions-title"
          icon={Target}
          title="오늘의 미션"
          note="오늘 할 일을 차근차근 끝내 보세요."
        />
        <div className={styles.headerActions}>
          <span className={dashboardStyles.countPill}>
            {completedMissionCount}/{missions.length} 완료
          </span>
          {hasPreviewChanges ? (
            <button className={styles.resetButton} type="button" onClick={onReset}>
              <RotateCcw size={14} aria-hidden="true" />
              체험 초기화
            </button>
          ) : null}
        </div>
      </div>

      <ul className={styles.missionList}>
        {missions.map((mission) => {
          const isCompleted = completedMissionIds.has(mission.id);
          const canCompleteInPreview = mission.status === "in-progress";
          const xpLabelId = `${mission.id}-xp`;

          return (
            <li
              className={isCompleted ? styles.missionCompleted : styles.missionPending}
              key={mission.id}
            >
              <span
                className={isCompleted ? styles.checkDone : styles.checkPending}
                aria-hidden="true"
              >
                {isCompleted ? <Check size={19} /> : <Circle size={19} />}
              </span>
              <div className={styles.missionCopy}>
                <strong>{mission.title}</strong>
                <span>{mission.detail}</span>
              </div>
              <div className={styles.missionAction}>
                <span
                  className={isCompleted ? styles.statusDone : styles.statusPending}
                >
                  {isCompleted ? "완료" : "미완료"}
                </span>
                {canCompleteInPreview ? (
                  <button
                    aria-describedby={xpLabelId}
                    aria-label={`${mission.title} ${isCompleted ? "완료됨" : "완료하기"}`}
                    className={styles.completeButton}
                    disabled={isCompleted}
                    type="button"
                    onClick={() => onComplete(mission.id)}
                  >
                    {isCompleted ? (
                      <>
                        <Check size={16} aria-hidden="true" /> 완료됨
                      </>
                    ) : (
                      "완료하기"
                    )}
                  </button>
                ) : null}
                <span
                  id={xpLabelId}
                  className={isCompleted ? styles.xpEarned : styles.xpPending}
                  aria-label={
                    isCompleted
                      ? `${mission.xp} 경험치 획득 완료`
                      : `완료하면 ${mission.xp} 경험치`
                  }
                >
                  {isCompleted ? `+${mission.xp} XP` : `완료 시 +${mission.xp} XP`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div
        className={styles.completionNotice}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {completionMessage}
      </div>
    </section>
  );
}
