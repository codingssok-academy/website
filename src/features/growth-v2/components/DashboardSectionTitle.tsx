import type { LucideIcon } from "lucide-react";
import styles from "./StudentDashboard.module.css";

interface DashboardSectionTitleProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  note?: string;
}

export function DashboardSectionTitle({
  id,
  icon: Icon,
  title,
  note,
}: DashboardSectionTitleProps) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionIcon} aria-hidden="true">
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        {note ? <p>{note}</p> : null}
      </div>
    </div>
  );
}
