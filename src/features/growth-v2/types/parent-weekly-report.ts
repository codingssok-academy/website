import type { GrowthActivityType } from "@/features/growth-v2/types/student-dashboard";

export interface ParentReportConcept {
  name: string;
  description: string;
}

export interface ParentGrowthActivity {
  id: string;
  type: GrowthActivityType;
  title: string;
}

export interface ParentTeacherEvaluation {
  strength: string;
  improvement: string;
  nextLessonGoal: string;
}

export interface ParentProjectReport {
  name: string;
  progress: number;
  recentWork: string;
  nextWork: string;
}

export interface ParentWeeklyReportData {
  dataKind: "mock";
  studentName: string;
  period: string;
  introduction: string;
  attendance: {
    attended: number;
    scheduled: number;
  };
  assignmentCompletion: number;
  weeklyGoalProgress: number;
  learnedConcepts: ParentReportConcept[];
  teacherEvaluation: ParentTeacherEvaluation;
  growthActivities: ParentGrowthActivity[];
  project: ParentProjectReport;
  conversationPrompt: string;
}
