import type { Metadata } from "next";
import { IntegratedGrowthPrototype } from "@/features/growth-v2/integrated/IntegratedGrowthPrototype";

export const metadata: Metadata = {
  title: "Growth 2.0 홈페이지 통합형 시안",
  description: "가상 데이터로 확인하는 코딩쏙 Growth 2.0 역할별 통합 UI/UX 시안",
  robots: {
    index: false,
    follow: false,
  },
};

export default function IntegratedGrowthPreviewPage() {
  return <IntegratedGrowthPrototype />;
}
