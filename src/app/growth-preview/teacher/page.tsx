import type { Metadata } from "next";
import { TeacherWeeklyEvaluation } from "@/features/growth-v2/components/TeacherWeeklyEvaluation";
import { MOCK_TEACHER_WEEKLY_EVALUATION } from "@/features/growth-v2/data/teacher-weekly-evaluation.mock";

export const metadata: Metadata = {
  title: "Growth 2.0 선생님 주간 평가 미리보기",
  description: "가짜 데이터로 확인하는 코딩쏙 Growth 2.0 선생님 주간 평가 입력 화면",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GrowthTeacherPreviewPage() {
  return <TeacherWeeklyEvaluation data={MOCK_TEACHER_WEEKLY_EVALUATION} />;
}
