"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { MOCK_TEACHER_WEEKLY_EVALUATION } from "@/features/growth-v2/data/teacher-weekly-evaluation.mock";
import type {
  EvaluationTextValues,
  ProjectEvaluationValues,
  TeacherWeeklyEvaluationData,
} from "@/features/growth-v2/types/teacher-weekly-evaluation";

export interface GrowthPreviewTeacherDraft {
  understanding: string;
  participation: string;
  homework: string;
  learnedConcepts: string[];
  evaluation: EvaluationTextValues;
  project: ProjectEvaluationValues;
}

interface GrowthPreviewStateValue {
  draft: GrowthPreviewTeacherDraft;
  published: GrowthPreviewTeacherDraft | null;
  updateDraft: (
    updater: (current: GrowthPreviewTeacherDraft) => GrowthPreviewTeacherDraft,
  ) => void;
  publishDraft: () => void;
  resetPreview: () => void;
}

interface GrowthPreviewStateProviderProps {
  children: ReactNode;
  initialData?: TeacherWeeklyEvaluationData;
}

const GrowthPreviewStateContext = createContext<GrowthPreviewStateValue | null>(null);

function createDraft(data: TeacherWeeklyEvaluationData): GrowthPreviewTeacherDraft {
  return {
    understanding: data.defaults.understanding,
    participation: data.defaults.participation,
    homework: data.defaults.homework,
    learnedConcepts: [...data.learnedConcepts],
    evaluation: { ...data.defaults.evaluation },
    project: { ...data.defaults.project },
  };
}

function copyDraft(draft: GrowthPreviewTeacherDraft): GrowthPreviewTeacherDraft {
  return {
    ...draft,
    learnedConcepts: [...draft.learnedConcepts],
    evaluation: { ...draft.evaluation },
    project: { ...draft.project },
  };
}

export function GrowthPreviewStateProvider({
  children,
  initialData = MOCK_TEACHER_WEEKLY_EVALUATION,
}: GrowthPreviewStateProviderProps) {
  const [draft, setDraft] = useState(() => createDraft(initialData));
  const [published, setPublished] = useState<GrowthPreviewTeacherDraft | null>(null);

  const updateDraft = useCallback(
    (updater: (current: GrowthPreviewTeacherDraft) => GrowthPreviewTeacherDraft) => {
      setDraft(updater);
    },
    [],
  );

  const publishDraft = useCallback(() => {
    setPublished(copyDraft(draft));
  }, [draft]);

  const resetPreview = useCallback(() => {
    setDraft(createDraft(initialData));
    setPublished(null);
  }, [initialData]);

  return (
    <GrowthPreviewStateContext.Provider
      value={{ draft, published, updateDraft, publishDraft, resetPreview }}
    >
      {children}
    </GrowthPreviewStateContext.Provider>
  );
}

export function useGrowthPreviewState() {
  const context = useContext(GrowthPreviewStateContext);

  if (!context) {
    throw new Error("GrowthPreviewStateProvider 안에서 사용해야 합니다.");
  }

  return context;
}
