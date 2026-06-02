// 서버 컴포넌트 — Vercel 빌드 시 Supabase가 필요한 dashboard 하위 페이지의
// 정적 프리렌더링을 방지합니다.
export const dynamic = "force-dynamic";

import { StoreThemeApplier } from "@/components/StoreThemeApplier";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <StoreThemeApplier />
            {children}
        </>
    );
}
