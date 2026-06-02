/**
 * /api/proxy-pdf?url=...
 * Notion S3 PDF를 프록시하여 iframe 임베드 가능하게
 * X-Frame-Options 헤더를 제거하고 전달
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
        return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    // Notion/AWS S3 URL만 허용
    const allowed = ["amazonaws.com", "notion.so", "notion-static.com", "secure.notion-static.com"];
    try {
        const parsed = new URL(url);
        if (!allowed.some(d => parsed.hostname.endsWith(d))) {
            return NextResponse.json({ error: "domain not allowed" }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }

    try {
        const res = await fetch(url);
        if (!res.ok) {
            return NextResponse.json({ error: "fetch failed" }, { status: res.status });
        }

        const contentType = res.headers.get("content-type") || "application/pdf";
        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch {
        return NextResponse.json({ error: "proxy error" }, { status: 500 });
    }
}
