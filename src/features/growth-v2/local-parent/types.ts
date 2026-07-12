export interface LocalParentSession {
  accessToken: string;
  expiresIn: number;
}

export interface LocalParentChild {
  id: string;
  display_name: string;
}

export interface LocalParentChildrenResponse {
  api_version: string;
  data: LocalParentChild[];
  empty_state_reason?: string | null;
}

export interface LocalParentConcept {
  key?: string;
  label: string;
  description?: string | null;
}

export interface LocalParentCustomConcept {
  id?: string;
  label: string;
  sort_order?: number;
}

export interface LocalParentEvaluation {
  evaluation_id?: string;
  status: "published";
  version: number;
  strength: string;
  improvement: string;
  next_goal: string;
  published_at: string | null;
  concepts?: LocalParentConcept[];
  selected_concepts?: LocalParentConcept[];
  custom_concepts?: LocalParentCustomConcept[];
}

export interface LocalParentProject {
  project_id: string;
  name: string;
  description: string;
  latest_update: {
    recent_work: string;
    next_work: string;
    progress_pct: number | null;
    occurred_at: string;
  } | null;
}

export interface LocalParentGrowthEvent {
  type: string;
  title: string;
  detail: string;
  occurred_at: string;
}

export interface LocalParentWeeklyReportResponse {
  api_version: string;
  period: { week_start: string; week_end: string };
  data: {
    student: LocalParentChild;
    published_evaluation: LocalParentEvaluation | null;
    projects: LocalParentProject[];
    growth_summary: LocalParentGrowthEvent[];
  };
  empty_state_reason?: Record<string, string>;
}

export type LocalParentErrorCode =
  | "BACKEND_UNAVAILABLE"
  | "SESSION_EXPIRED"
  | "ACCESS_DENIED"
  | "LOGIN_FAILED"
  | "REQUEST_FAILED";

export class LocalParentPreviewError extends Error {
  constructor(public code: LocalParentErrorCode, message: string) {
    super(message);
    this.name = "LocalParentPreviewError";
  }
}
