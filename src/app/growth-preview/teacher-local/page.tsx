import type { Metadata } from "next";
import { LocalTeacherDraftPreview } from "@/features/growth-v2/local-teacher/LocalTeacherDraftPreview";

export const metadata: Metadata = {
  title: "Growth 2.0 로컬 선생님 평가 공개",
  description: "로컬 연습 DB에서 선생님 평가 초안을 확인하고 공개하는 Growth 2.0 체험 화면",
  robots: { index: false, follow: false },
};

export default function LocalTeacherDraftPage() {
  return <LocalTeacherDraftPreview />;
}
