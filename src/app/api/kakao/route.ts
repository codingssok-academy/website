import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const KAKAO_API_ENDPOINT = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

interface KakaoSendBody {
    templateCode: string;
    recipientName: string;
    recipientPhone: string;
    message: string;
    subject?: string;
}

async function requireTeacherAuth(): Promise<NextResponse | null> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const db = adminClient ?? supabase;
    const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
        return NextResponse.json({ success: false, message: '선생님 권한이 필요합니다.' }, { status: 403 });
    }

    return null;
}

export async function POST(req: NextRequest) {
    const authError = await requireTeacherAuth();
    if (authError) return authError;

    const apiKey = process.env.KAKAO_API_KEY;
    const senderKey = process.env.KAKAO_SENDER_KEY;
    const fromNumber = process.env.KAKAO_FROM_NUMBER;

    if (!apiKey || !senderKey || !fromNumber) {
        return NextResponse.json(
            { success: false, message: '카카오 알림 서비스가 설정되지 않았습니다.' },
            { status: 503 },
        );
    }

    let body: KakaoSendBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { success: false, message: '요청 본문을 파싱할 수 없습니다.' },
            { status: 400 },
        );
    }

    const { templateCode, recipientName, recipientPhone, message, subject } = body;

    if (!templateCode || !recipientName || !recipientPhone || !message) {
        return NextResponse.json(
            { success: false, message: '필수 파라미터가 누락되었습니다. (templateCode, recipientName, recipientPhone, message)' },
            { status: 400 },
        );
    }

    const params = new URLSearchParams({
        apikey: apiKey,
        userid: 'codingssok',
        senderkey: senderKey,
        tpl_code: templateCode,
        sender: fromNumber,
        receiver_1: recipientPhone,
        recvname_1: recipientName,
        subject_1: subject ?? templateCode,
        message_1: message,
    });

    let kakaoRes: Response;
    try {
        kakaoRes = await fetch(KAKAO_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
    } catch {
        return NextResponse.json(
            { success: false, message: '카카오 알림톡 서버에 연결할 수 없습니다.' },
            { status: 502 },
        );
    }

    if (!kakaoRes.ok) {
        return NextResponse.json(
            { success: false, message: `카카오 알림톡 서버 오류 (${kakaoRes.status})` },
            { status: 502 },
        );
    }

    const result = await kakaoRes.json();

    // aligo API: result_code === "1" → 성공
    const success = result?.result_code === '1' || result?.result_code === 1;
    return NextResponse.json({
        success,
        message: success
            ? `${recipientName}님에게 알림을 발송했습니다.`
            : (result?.message ?? '알림톡 발송에 실패했습니다.'),
        raw: result,
    });
}
