import type { Metadata, Viewport } from "next";
import "./globals.css";
import JsonLd from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://codingssok.com"),
  title: {
    default: "코딩쏙 | AI 시대 역량을 '쏙' 채우는 코딩 교육",
    template: "%s | 코딩쏙",
  },
  description: "C·Python 중심 텍스트코딩 강화로 프로젝트 · 공모전 · 자격증까지 대비합니다. IT 현직자가 가르치는 코딩 학원.",
  keywords: ["코딩학원", "코딩교육", "C언어", "Python", "Arduino", "알고리즘", "정보올림피아드", "코딩쏙"],
  authors: [{ name: "CodingSSok Academy" }],
  creator: "CodingSSok Academy",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://codingssok.com",
    siteName: "코딩쏙",
    title: "코딩쏙 | AI 시대 역량을 '쏙' 채우는 코딩 교육",
    description: "C·Python 중심 텍스트코딩 강화. 프로젝트 · 공모전 · 자격증 대비.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "코딩쏙" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "코딩쏙 | AI 시대 코딩 교육",
    description: "C·Python 중심 텍스트코딩 강화.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1B4B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localPreviewOnly = process.env.GROWTH_PREVIEW_LOCAL_ONLY === "1";
  const stagingPreview =
    process.env.VERCEL_TARGET_ENV === "staging" ||
    process.env.NEXT_PUBLIC_GROWTH_PREVIEW_ENV === "staging";

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="naver-site-verification" content="codingssok" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="코딩쏙" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
        {!localPreviewOnly ? (
          <>
            <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@500;700;900&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
            <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
          </>
        ) : null}
      </head>
      <body className="antialiased min-h-screen" suppressHydrationWarning>
        <JsonLd />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-[#0066FF] focus:text-white focus:rounded-lg focus:top-4 focus:left-4"
        >
          본문으로 바로가기
        </a>
        {children}
        {!localPreviewOnly && !stagingPreview ? (
          <script dangerouslySetInnerHTML={{
            __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          ` }} />
        ) : null}
      </body>
    </html>
  );
}
