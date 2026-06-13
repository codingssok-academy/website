/**
 * /api/reviews
 * academy_reviews 테이블에서 공개 리뷰 페치 (모두 SELECT 가능)
 *
 * 응답: [{ platform, rating, author, content, reply, review_date }, ...]
 * 캐시: 5분
 */

import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({ reviews: [], source: "no-supabase" });
        }

        const sb = createClient();
        const { data, error } = await sb
            .from("academy_reviews")
            .select("id, platform, rating, author, content, reply, review_date")
            .order("display_order", { ascending: false })
            .order("review_date", { ascending: false })
            .limit(20);

        if (error) {
            console.error("[reviews] db error:", error);
            return NextResponse.json({ reviews: [], error: "db_unavailable" });
        }

        return NextResponse.json({ reviews: data || [] });
    } catch (err) {
        console.error("[reviews] exception:", err);
        return NextResponse.json({ reviews: [], error: "internal_error" }, { status: 500 });
    }
}
