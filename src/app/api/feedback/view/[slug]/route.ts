import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { renderFeedbackPageHtml, type FeedbackPayload } from "@/lib/feedback-renderer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { slug } = await params;

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data, error } = await supabase
    .from("feedback_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>피드백 없음</title></head><body style="font-family:sans-serif;padding:40px;text-align:center"><h1>피드백을 찾을 수 없습니다.</h1><p>${slug}</p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const payload: FeedbackPayload = {
    name: data.student_name,
    slug: data.slug,
    date: data.date ?? "",
    learn: data.learn ?? "",
    activities: data.activities ?? "",
    reaction: data.reaction ?? "",
    progress: data.progress ?? "",
    homework: data.homework ?? "",
    next: data.next_plan ?? "",
    extra: data.extra ?? "",
  };

  const html = renderFeedbackPageHtml(payload, {
    logoSrc: "/images/icon-logo-green.svg",
    detailPhotoSrc: data.detail_photo_url || undefined,
  });

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
