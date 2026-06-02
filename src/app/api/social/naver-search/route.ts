/**
 * /api/social/naver-search
 *
 * 네이버 검색 API를 통해 "코딩쏙" 관련 블로그 글/카페 글 검색.
 * - 네이버 개발자센터(https://developers.naver.com)에서 앱 등록 필요
 * - 환경변수 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 필요
 * - 일일 25,000회 무료 호출 가능
 *
 * 피드백 L5-7: "코딩쏙 인스타그램, 블로그 내용들, 이미지 전부 싹 다 학습해서"
 *
 * Vercel 배포 환경에서만 정상 동작 (로컬 개발 환경의 WebFetch는 네이버 차단).
 */

import { NextRequest, NextResponse } from "next/server";

export const revalidate = 1800; // 30분

interface NaverBlogItem {
    title: string;
    link: string;
    description: string;
    bloggername: string;
    bloggerlink: string;
    postdate: string; // "20240115" 형식
}

function stripHtml(s: string): string {
    return s.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function parseDate(postdate: string): string {
    if (postdate.length !== 8) return new Date().toISOString();
    return `${postdate.slice(0, 4)}-${postdate.slice(4, 6)}-${postdate.slice(6, 8)}T00:00:00Z`;
}

export async function GET(req: NextRequest) {
    const start = Date.now();
    try {
        const query = req.nextUrl.searchParams.get("q") || "코딩쏙";
        const display = Math.min(parseInt(req.nextUrl.searchParams.get("display") || "10", 10), 30);
        const sort = req.nextUrl.searchParams.get("sort") || "date"; // date | sim

        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return NextResponse.json({
                items: [],
                error: "credentials_missing",
                message: "NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수가 필요합니다. https://developers.naver.com 에서 앱 등록 후 Vercel env에 추가하세요.",
                docs: "https://developers.naver.com/docs/serviceapi/search/blog/blog.md",
            }, { status: 200 });
        }

        const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;
        const res = await fetch(url, {
            headers: {
                "X-Naver-Client-Id": clientId,
                "X-Naver-Client-Secret": clientSecret,
                "User-Agent": "Mozilla/5.0 CodingssokBot/1.0",
            },
            next: { revalidate: 1800 },
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(`[naver-search] ${res.status}:`, text.slice(0, 200));
            return NextResponse.json({
                items: [],
                error: `naver_api_${res.status}`,
                message: res.status === 401
                    ? "API 키가 잘못되었거나 만료됨"
                    : res.status === 429
                    ? "일일 호출 한도 초과 (25,000회/일)"
                    : "네이버 API 오류",
            }, { status: 200 });
        }

        const data = await res.json();
        const items = (data.items || []).map((it: NaverBlogItem) => ({
            title: stripHtml(it.title),
            link: it.link,
            excerpt: stripHtml(it.description).slice(0, 150),
            blogger: it.bloggername,
            bloggerLink: it.bloggerlink,
            publishedAt: parseDate(it.postdate),
            platform: "naver-blog" as const,
        }));

        console.log(`[naver-search] q="${query}" → ${items.length}건 ms=${Date.now() - start}`);

        return NextResponse.json({
            items,
            total: data.total || 0,
            query,
        });
    } catch (err) {
        console.error("[naver-search] exception:", err);
        return NextResponse.json({
            items: [],
            error: "internal_error",
            message: err instanceof Error ? err.message : String(err),
        }, { status: 500 });
    }
}
