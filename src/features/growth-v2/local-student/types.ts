export type LocalStudentCode = "student-a" | "student-b";

export interface LocalStudentSession {
  accessToken: string;
  expiresIn: number;
}

export interface LocalStudentConcept {
  key?: string;
  label: string;
  description?: string | null;
}

export interface LocalStudentCustomConcept {
  label: string;
  sort_order?: number;
}

export interface LocalStudentHomeResponse {
  api_version: string;
  period: { week_start: string; week_end: string };
  data: {
    student: { id: string; display_name: string };
    total_xp: number;
    missions: Array<{
      student_mission_id: string;
      code: string;
      title: string;
      detail: string;
      xp_reward: number;
      status: string;
      assigned_at: string;
      completed_at: string | null;
    }>;
    recent_growth: Array<{
      type: string;
      title: string;
      detail: string | null;
      occurred_at: string;
    }>;
    published_feedback: {
      evaluation_id?: string;
      status: "published";
      version: number;
      strength: string;
      next_goal: string;
      published_at: string | null;
      concepts?: LocalStudentConcept[];
      selected_concepts?: LocalStudentConcept[];
      custom_concepts?: LocalStudentCustomConcept[];
    } | null;
    projects: Array<{
      project_id: string;
      name: string;
      description: string;
      latest_update: {
        recent_work: string;
        next_work: string;
        progress_pct: number | null;
        occurred_at: string;
      } | null;
    }>;
    badges: Array<{
      code: string;
      name: string;
      description: string;
      icon_key: string;
      awarded_at: string;
    }>;
  } | null;
  empty_state_reason?: Record<string, string> | string | null;
}

export type LocalStudentErrorCode =
  | "BACKEND_UNAVAILABLE"
  | "LOGIN_FAILED"
  | "SESSION_EXPIRED"
  | "STUDENT_NOT_FOUND"
  | "REQUEST_FAILED";

export class LocalStudentPreviewError extends Error {
  constructor(public code: LocalStudentErrorCode, message: string) {
    super(message);
    this.name = "LocalStudentPreviewError";
  }
}
