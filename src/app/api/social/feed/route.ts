/**
 * /api/social/feed
 * 네이버 블로그 RSS + 인스타그램(수동/Graph API) 통합 페치
 *
 * GET /api/social/feed?platform=naver|instagram|all&limit=10
 *
 * 캐싱: 1시간 (revalidate=3600)
 */

import { NextRequest, NextResponse } from "next/server";
import { SOCIAL_CONFIG, INSTAGRAM_MANUAL_POSTS, type SocialPost } from "@/data/social-content";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

type SocialPostRow = {
    guid: string;
    platform: string;
    title: string | null;
    excerpt: string | null;
    image_url: string | null;
    link: string;
    published_at: string;
};

type InstagramApiPost = {
    id: string;
    caption?: string;
    media_url?: string;
    permalink: string;
    timestamp: string;
};

/**
 * DB에서 social_posts 테이블 읽기 (scripts/import-naver-blog.mjs 가 주입한 실데이터).
 * RSS 런타임 fetch가 실패하거나 환경 제약 있을 때 안정적인 fallback.
 */
async function fetchFromDB(platform: string, limit: number): Promise<SocialPost[]> {
    if (!isSupabaseConfigured()) return [];

    try {
        const supabase = createClient();
        let q = supabase
            .from("social_posts")
            .select("guid, platform, title, excerpt, image_url, link, published_at")
            .order("published_at", { ascending: false })
            .limit(limit);
        if (platform !== "all") {
            const dbPlatform = platform === "naver" ? "naver-blog" : platform;
            q = q.eq("platform", dbPlatform);
        }
        const { data, error } = await q;
        if (error) {
            if (process.env.NODE_ENV === "development") console.warn("[social/feed] DB fallback:", error.message);
            return [];
        }
        return ((data || []) as SocialPostRow[]).map((r) => ({
            id: `db-${r.guid}`,
            platform: r.platform === "instagram" ? "instagram" : "naver-blog",
            title: r.title || undefined,
            excerpt: r.excerpt || undefined,
            imageUrl: r.image_url || undefined,
            link: r.link,
            publishedAt: r.published_at,
        }));
    } catch (e) {
        if (process.env.NODE_ENV === "development") console.warn("[social/feed] DB exception:", e);
        return [];
    }
}

export const revalidate = 3600;

/**
 * 네이버 블로그 RSS를 다중 엔드포인트로 시도.
 * 네이버는 일부 환경(User-Agent 기본값)에서 403을 반환하므로
 * 브라우저 같은 헤더로 요청한다.
 */
async function fetchNaverBlogRSS(blogId: string, limit: number): Promise<SocialPost[]> {
    if (!blogId) return [];

    // 시도할 RSS 엔드포인트 (fallback)
    const urls = [
        `https://rss.blog.naver.com/${encodeURIComponent(blogId)}.xml`,
        `https://rss.blog.naver.com/${encodeURIComponent(blogId)}`,
        `https://blog.rss.naver.com/${encodeURIComponent(blogId)}.xml`,
    ];

    // User-Agent를 브라우저처럼 설정 (네이버가 기본 fetch UA 차단할 수 있음)
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*;q=0.9",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
    };

    for (const url of urls) {
        try {
            const res = await fetch(url, { headers, next: { revalidate: 3600 } });
            if (!res.ok) {
                if (process.env.NODE_ENV === "development") {
                    console.warn(`[social/feed] naver ${url} → ${res.status}`);
                }
                continue;
            }
            const xml = await res.text();
            if (!xml || !xml.includes("<item")) continue;

            const items: SocialPost[] = [];
            const itemRegex = /<item>([\s\S]*?)<\/item>/g;
            const matches = Array.from(xml.matchAll(itemRegex)).slice(0, limit);
            for (const m of matches) {
                const block = m[1];
                const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] || "";
                const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
                const pub = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
                const desc = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] || "";
                const imgMatch = desc.match(/<img[^>]*src=["']([^"']+)["']/);
                items.push({
                    id: `naver-${link}`,
                    platform: "naver-blog",
                    title: title.trim(),
                    excerpt: desc.replace(/<[^>]+>/g, "").trim().slice(0, 120),
                    imageUrl: imgMatch?.[1],
                    link: link.trim(),
                    publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
                });
            }
            if (items.length > 0) {
                console.log(`[social/feed] naver ${url} → ${items.length}건`);
                return items;
            }
        } catch (e) {
            if (process.env.NODE_ENV === "development") console.warn(`[social/feed] naver ${url} exception:`, e);
        }
    }
    return [];
}

async function fetchInstagram(limit: number): Promise<SocialPost[]> {
    // Graph API 토큰이 있으면 실제 페치, 없으면 수동 데이터 반환
    if (SOCIAL_CONFIG.instagramApiToken) {
        try {
            const url = `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp&limit=${limit}&access_token=${SOCIAL_CONFIG.instagramApiToken}`;
            const res = await fetch(url, { next: { revalidate: 3600 } });
            if (!res.ok) return INSTAGRAM_MANUAL_POSTS.slice(0, limit);
            const data = await res.json() as { data?: InstagramApiPost[] };
            return (data.data || []).map((p) => ({
                id: `ig-${p.id}`,
                platform: "instagram" as const,
                excerpt: p.caption?.slice(0, 120),
                imageUrl: p.media_url,
                link: p.permalink,
                publishedAt: p.timestamp,
            }));
        } catch {
            return INSTAGRAM_MANUAL_POSTS.slice(0, limit);
        }
    }
    return INSTAGRAM_MANUAL_POSTS.slice(0, limit);
}

export async function GET(req: NextRequest) {
    const start = Date.now();
    try {
        const platform = req.nextUrl.searchParams.get("platform") || "all";
        const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "10", 10), 50);

        // ── 전략 ──
        // 1. DB 우선 (social_posts 테이블 — scripts/import-naver-blog.mjs 로 주입된 실데이터)
        // 2. DB 가 비어있으면 RSS 런타임 fetch 로 fallback
        // 3. 인스타그램은 Graph API 또는 수동 큐레이션
        const dbPosts = await fetchFromDB(platform, limit);

        const tasks: Promise<SocialPost[]>[] = [];
        if (dbPosts.length === 0 && (platform === "all" || platform === "naver")) {
            tasks.push(fetchNaverBlogRSS(SOCIAL_CONFIG.naverBlogId, limit));
        }
        if (platform === "all" || platform === "instagram") {
            tasks.push(fetchInstagram(limit));
        }
        const results = await Promise.all(tasks);
        const merged = [...dbPosts, ...results.flat()]
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, limit);

        console.log(`[social/feed] platform=${platform} db=${dbPosts.length} count=${merged.length} ms=${Date.now() - start}`);
        return NextResponse.json({ posts: merged, count: merged.length, source: dbPosts.length > 0 ? "db" : "rss" });
    } catch (err) {
        console.error("[social/feed] error:", err, `ms=${Date.now() - start}`);
        return NextResponse.json({ posts: [], count: 0, error: "feed_failed" }, { status: 500 });
    }
}
