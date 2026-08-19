import type { Metadata } from "next";
import Link from "next/link";
import { IntegratedGrowthPrototype } from "@/features/growth-v2/integrated/IntegratedGrowthPrototype";

export const metadata: Metadata = {
  title: "성장관리 Growth 2.0",
  description: "주간 학습 평가와 월별 출석을 학생·학부모·선생님이 함께 확인하는 코딩쏙 성장관리 서비스입니다.",
  alternates: {
    canonical: "/growth",
  },
  openGraph: {
    title: "코딩쏙 성장관리 Growth 2.0",
    description: "주간 성장과 월별 출석을 한눈에 확인하세요.",
    url: "https://codingssok.com/growth",
  },
};

export default function GrowthPage() {
  return (
    <main id="main-content">
      <nav
        aria-label="성장관리 바로가기"
        style={{
          minHeight: 64,
          padding: "12px clamp(18px, 4vw, 48px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          borderBottom: "1px solid #dbeafe",
          background: "#ffffff",
        }}
      >
        <Link href="/" style={{ color: "#0f172a", fontSize: 17, fontWeight: 900, textDecoration: "none" }}>
          코딩쏙
        </Link>
        <Link href="/parent/feedback" style={{ color: "#1d4ed8", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
          학부모 포털
        </Link>
      </nav>
      <IntegratedGrowthPrototype mode="homepage" />
    </main>
  );
}
