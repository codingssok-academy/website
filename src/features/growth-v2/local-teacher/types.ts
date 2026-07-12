export interface LocalTeacherSession {
  accessToken: string;
  expiresIn: number;
}

export interface LocalTeacherStudent {
  id: string;
  display_name: string;
  week_start: string;
  has_draft: boolean;
  has_published: boolean;
  evaluation_status: "draft" | "published" | "not_started";
}

export interface LocalConcept {
  key: "for-loop" | "condition" | "debugging";
  label: string;
  description?: string | null;
}

export interface LocalEvaluationRecord {
  evaluation_id: string;
  status: "draft" | "published";
  version: number;
  updated_at?: string;
  published_at?: string | null;
  understanding: string;
  participation: string;
  homework_status: string;
  strength: string;
  improvement: string;
  next_goal: string;
  concepts: LocalConcept[];
}

export interface LocalProjectRecord {
  project_id: string;
  name: string;
  description: string;
  latest_update: {
    status: string;
    recent_work: string;
    next_work: string;
    progress_pct: number;
    occurred_at: string;
  } | null;
}

export interface LocalTeacherEvaluationResponse {
  api_version: string;
  period: { week_start: string; week_end: string };
  data: {
    student: { id: string; display_name: string };
    draft: LocalEvaluationRecord | null;
    published: LocalEvaluationRecord | null;
    project: LocalProjectRecord | null;
  };
  empty_state_reason?: Record<string, string>;
}

export interface LocalTeacherStudentsResponse {
  api_version: string;
  period: { week_start: string; week_end: string };
  data: LocalTeacherStudent[];
}

export interface LocalDraftForm {
  understanding: string;
  participation: string;
  homeworkStatus: string;
  strength: string;
  improvement: string;
  nextGoal: string;
  conceptKeys: LocalConcept["key"][];
}

export interface LocalDraftSaveResult {
  saved: boolean;
  created: boolean;
  conflict: boolean;
  evaluation_id: string | null;
  version: number | null;
  status: "draft";
  updated_at: string | null;
  selected_concepts: Array<Pick<LocalConcept, "key" | "label">>;
}

export type LocalTeacherErrorCode =
  | "BACKEND_UNAVAILABLE"
  | "SESSION_EXPIRED"
  | "ACCESS_DENIED"
  | "LOGIN_FAILED"
  | "INVALID_RESPONSE"
  | "SAVE_FAILED";

export class LocalTeacherPreviewError extends Error {
  constructor(public code: LocalTeacherErrorCode, message: string) {
    super(message);
    this.name = "LocalTeacherPreviewError";
  }
}
