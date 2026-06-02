import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeFeedbackData, renderFeedbackPageHtml, type FeedbackPayload } from "@/lib/feedback-renderer";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Teacher/admin only
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const adminClient = createAdminClient();
  const db = adminClient ?? supabase;
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return NextResponse.json({ error: '선생님 권한이 필요합니다.' }, { status: 403 });
  }

  try {
    const raw: FeedbackPayload = await req.json();
    normalizeFeedbackData(raw);
    const html = renderFeedbackPageHtml(raw);
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
