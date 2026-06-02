import type { NextConfig } from "next";
import path from "path";

/**
 * ================================================
 * 🎯 Skills Applied:
 * - vercel-react-best-practices: 이미지 최적화
 * - security-review: 보안 헤더
 * - cache-components: 캐싱 설정
 * ================================================
 */

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // 이미지 최적화 (vercel-react-best-practices)
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [40, 60, 75, 85],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  // 보안 헤더 (security-review)
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://fonts.googleapis.com https://cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
          "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
          "worker-src 'self' blob:",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://*.supabase.co https://godbolt.org wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net",
          "frame-src 'self'",
          "media-src 'self' blob: data:",
          "object-src 'none'",
          "base-uri 'self'",
        ].join('; '),
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // 교재 HTML에 CORP 헤더 추가 (iframe 로딩 허용)
      {
        source: '/learn/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];
  },

  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Strict Mode
  reactStrictMode: true,

  // Turbopack root 설정 (경고 제거)
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
