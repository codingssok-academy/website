import type { Metadata } from "next";
import { LocalParentWeeklyReport } from "@/features/growth-v2/local-parent/LocalParentWeeklyReport";

export const metadata: Metadata = {
  title: "Growth 2.0 학부모 주간 리포트 | 코딩쏙",
  description: "가상 자료로 공개된 최신 주간 평가를 확인하는 시험 전용 화면입니다.",
  robots: { index: false, follow: false },
};

export default function LocalParentReportPage() {
  return <LocalParentWeeklyReport />;
}
