import type { Metadata } from "next";
import { ParentWeeklyReport } from "@/features/growth-v2/components/ParentWeeklyReport";
import { MOCK_PARENT_WEEKLY_REPORT } from "@/features/growth-v2/data/parent-weekly-report.mock";

export const metadata: Metadata = {
  title: "Growth 2.0 학부모 주간 리포트 미리보기",
  description: "가짜 데이터로 확인하는 코딩쏙 Growth 2.0 학부모 주간 성장 리포트",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GrowthParentPreviewPage() {
  return <ParentWeeklyReport report={MOCK_PARENT_WEEKLY_REPORT} />;
}
