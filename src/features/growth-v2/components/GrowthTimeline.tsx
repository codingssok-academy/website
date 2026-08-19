import {
  CheckCircle2,
  History,
  Medal,
  MessageSquareQuote,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import type {
  GrowthActivityType,
  GrowthTimelineEntry,
} from "@/features/growth-v2/types/student-dashboard";
import { DashboardSectionTitle } from "./DashboardSectionTitle";
import dashboardStyles from "./StudentDashboard.module.css";
import styles from "./GrowthTimeline.module.css";

interface GrowthTimelineProps {
  entries: GrowthTimelineEntry[];
  highlightedEntryId?: string;
  announcement: string;
}

const TYPE_DETAILS: Record<
  GrowthActivityType,
  { label: string; icon: LucideIcon }
> = {
  mission: { label: "미션", icon: CheckCircle2 },
  feedback: { label: "피드백", icon: MessageSquareQuote },
  project: { label: "프로젝트", icon: Rocket },
  badge: { label: "배지", icon: Medal },
};

function GrowthTimelineItem({
  entry,
  isHighlighted,
}: {
  entry: GrowthTimelineEntry;
  isHighlighted: boolean;
}) {
  const typeDetail = TYPE_DETAILS[entry.type];
  const Icon = typeDetail.icon;

  return (
    <li
      className={isHighlighted ? styles.highlightedItem : styles.timelineItem}
      data-activity-id={entry.id}
    >
      <span className={styles.itemIcon} data-type={entry.type} aria-hidden="true">
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <div className={styles.itemContent}>
        <div className={styles.itemMeta}>
          <time>{entry.timeLabel}</time>
          <span className={styles.typeLabel} data-type={entry.type}>
            {typeDetail.label}
          </span>
          {typeof entry.xp === "number" ? (
            <strong className={styles.xpReward}>+{entry.xp} XP</strong>
          ) : null}
        </div>
        <p className={styles.itemTitle}>{entry.title}</p>
        {entry.detail ? <p className={styles.itemDetail}>{entry.detail}</p> : null}
      </div>
    </li>
  );
}

export function GrowthTimeline({
  entries,
  highlightedEntryId,
  announcement,
}: GrowthTimelineProps) {
  const visibleEntries = entries.slice(0, 6);

  return (
    <section
      className={dashboardStyles.panel}
      aria-labelledby="growth-timeline-title"
    >
      <DashboardSectionTitle
        id="growth-timeline-title"
        icon={History}
        title="최근 성장 기록"
        note="미션, 수업, 프로젝트에서 쌓인 성장 기록이에요."
      />

      <ol className={styles.timelineList} aria-label="최근 성장 기록 목록">
        {visibleEntries.map((entry) => (
          <GrowthTimelineItem
            entry={entry}
            isHighlighted={entry.id === highlightedEntryId}
            key={entry.id}
          />
        ))}
      </ol>

      <p
        className={styles.screenReaderAnnouncement}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </p>
    </section>
  );
}
