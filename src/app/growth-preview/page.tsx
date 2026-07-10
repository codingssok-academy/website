import type { Metadata } from "next";
import { StudentDashboard } from "@/features/growth-v2/components/StudentDashboard";
import { studentDashboardRepository } from "@/features/growth-v2/services/student-dashboard-repository";

export const metadata: Metadata = {
  title: "Growth 2.0 학생 홈 미리보기",
  description: "가짜 데이터로 확인하는 코딩쏙 Growth 2.0 학생 홈 화면",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GrowthPreviewPage() {
  const dashboard = await studentDashboardRepository.getStudentDashboard();

  return <StudentDashboard dashboard={dashboard} />;
}
