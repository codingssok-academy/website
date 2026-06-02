import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { normalizeFeedbackData, type FeedbackPayload } from "@/lib/feedback-renderer";
import { env } from "@/lib/env";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 인증: 선생님/관리자만 피드백 발행 가능
    const authSupabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    );
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    const { data: profile } = await authSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
      return NextResponse.json({ error: '선생님 권한이 필요합니다.' }, { status: 403 });
    }

    const raw: FeedbackPayload = await req.json();
    const data = normalizeFeedbackData(raw);

    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { error } = await supabase
      .from("feedback_pages")
      .upsert(
        {
          slug: data.slug,
          student_name: data.name,
          date: data.date,
          learn: data.learn,
          activities: data.activities,
          reaction: data.reaction,
          progress: data.progress,
          homework: data.homework,
          next_plan: data.next,
          extra: data.extra,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );

    if (error) throw new Error(error.message);

    const url = `/feedback/${data.slug}`;
    return NextResponse.json({ url, slug: data.slug });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
