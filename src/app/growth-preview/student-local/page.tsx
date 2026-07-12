import type { Metadata } from "next";
import { LocalStudentReport } from "@/features/growth-v2/local-student/LocalStudentReport";

export const metadata: Metadata = {
  title: "Growth 2.0 로컬 학생 성장 리포트",
  description: "가상 학생이 공개된 최신 평가와 학습 정보를 읽는 로컬 전용 화면입니다.",
  robots: { index: false, follow: false },
};

export default function LocalStudentReportPage() {
  return <LocalStudentReport />;
}
