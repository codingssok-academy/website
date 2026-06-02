/**
 * /api/proxy-image?url=...
 *
 * 네이버 블로그 썸네일 프록시. blogthumb.pstatic.net 은 외부 Referer 차단.
 * 이 라우트가 서버사이드에서 fetch 후 이미지 바이너리를 그대로 전달.
 *
 * 보안:
 *  - 허용 도메인 화이트리스트 (pstatic.net, blogpfthumb 등)
 *  - 응답 Content-Type 검증 (image/* 만)
 *  - 캐시 1시간
 */

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
    "blogthumb.pstatic.net",
    "blogpfthumb.phinf.naver.net",
    "postfiles.pstatic.net",
    "mblogthumb-phinf.pstatic.net",
    "thumb.pstatic.net",
];

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "url parameter required" }, { status: 400 });
    }

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }

    if (!ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
        return NextResponse.json({ error: "domain not allowed" }, { status: 403 });
    }

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
                "Referer": "https://blog.naver.com/",
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
            return NextResponse.json({ error: "not an image" }, { status: 400 });
        }

        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (err) {
        return NextResponse.json({ error: "proxy_failed" }, { status: 502 });
    }
}
