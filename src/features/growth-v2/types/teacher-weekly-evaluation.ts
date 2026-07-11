export type EvaluationTextField = "strength" | "improvement" | "nextLessonGoal";

export interface EvaluationChoice {
  id: string;
  label: string;
}

export interface EvaluationTextValues {
  strength: string;
  improvement: string;
  nextLessonGoal: string;
}

export interface ProjectEvaluationValues {
  recentWork: string;
  nextWork: string;
}

export interface RecommendationPhrase {
  label: string;
  sentence: string;
}

export interface TeacherWeeklyEvaluationData {
  dataKind: "mock";
  studentName: string;
  period: string;
  summary: {
    attendance: string;
    assignmentCompletion: number;
    weeklyGoalProgress: number;
    projectProgress: number;
  };
  understandingOptions: EvaluationChoice[];
  participationOptions: EvaluationChoice[];
  homeworkOptions: EvaluationChoice[];
  learnedConcepts: string[];
  defaults: {
    understanding: string;
    participation: string;
    homework: string;
    evaluation: EvaluationTextValues;
    project: ProjectEvaluationValues;
  };
  recommendations: Record<EvaluationTextField, RecommendationPhrase[]>;
  projectName: string;
}
