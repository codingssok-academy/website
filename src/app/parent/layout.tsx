import type { Metadata, Viewport } from "next";
import ParentSwRegister from "./ParentSwRegister";
import ParentShell from "./ParentShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: {
        default: "코딩쏙학원 학부모포털",
        template: "%s | 코딩쏙학원 학부모포털",
    },
    description: "자녀의 코딩 학습 진행 상황, 출석, 과제, 성적을 한눈에 확인하는 학부모 전용 포털.",
    manifest: "/manifest-parent.json",
    openGraph: {
        title: "코딩쏙학원 학부모포털",
        description: "자녀의 코딩 학습 현황을 한눈에",
        type: "website",
        locale: "ko_KR",
    },
    robots: { index: false, follow: false },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "코딩쏙학원 학부모포털",
    },
    other: {
        "mobile-web-app-capable": "yes",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#2563eb",
};

export default function ParentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <link rel="manifest" href="/parent-manifest.json" />
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
            />
            <link rel="apple-touch-icon" href="/icon-192.png" />
            <ParentShell>{children}</ParentShell>
            <ParentSwRegister />
        </>
    );
}
