export type MissionStatus = "completed" | "in-progress";

export type GrowthActivityType = "mission" | "feedback" | "project" | "badge";

export type GrowthIconName =
  | "code"
  | "calendar"
  | "rocket"
  | "trophy"
  | "sparkles"
  | "flame";

export interface StudentSummary {
  displayName: string;
  level: number;
  totalXp: number;
  nextLevelXp: number;
  streakDays: number;
}

export interface DailyMission {
  id: string;
  title: string;
  detail: string;
  status: MissionStatus;
  xp: number;
}

export interface WeeklyGrowth {
  goalProgress: number;
  learnedConcepts: string[];
  assignmentCompletion: number;
  changeFromLastWeek: string;
}

export interface TeacherFeedback {
  comment: string;
  nextLessonGoal: string;
}

export interface StudentProject {
  name: string;
  progress: number;
  recentWork: string;
}

export interface EarnedBadge {
  id: string;
  name: string;
  description: string;
  icon: GrowthIconName;
}

export interface GrowthTimelineEntry {
  id: string;
  timeLabel: string;
  type: GrowthActivityType;
  title: string;
  detail?: string;
  xp?: number;
}

export interface StudentGrowthDashboard {
  dataKind: "mock";
  student: StudentSummary;
  missions: DailyMission[];
  weeklyGrowth: WeeklyGrowth;
  teacherFeedback: TeacherFeedback;
  project: StudentProject;
  recentBadges: EarnedBadge[];
  growthTimeline: GrowthTimelineEntry[];
}
