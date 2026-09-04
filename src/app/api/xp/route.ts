import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

const XP_ACTION_TYPES = new Set([
    'lesson_view',
    'quiz_correct',
    'unit_complete',
    'code_run',
    'attendance',
    'challenge_complete',
]);
const MAX_ITEM_ID_LENGTH = 200;

type XpResult = {
    xp: number;
    level: number;
    levelUp: boolean;
    delta: number;
    duplicate: boolean;
    reason?: string;
};

function isXpResult(value: unknown): value is XpResult {
    if (!value || typeof value !== 'object') return false;
    const result = value as Partial<XpResult>;
    return typeof result.xp === 'number'
        && typeof result.level === 'number'
        && typeof result.levelUp === 'boolean'
        && typeof result.delta === 'number'
        && typeof result.duplicate === 'boolean';
}

export async function POST(req: NextRequest) {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. Rate limit: 30 req/min per user
    const { success: rlOk } = await rateLimit(`xp:${user.id}`, { maxRequests: 30, windowMs: 60_000 });
    if (!rlOk) {
        return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
    }

    // 3. Parse + validate body
    let body: { action?: string; type?: string; item_id?: string; reason?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    const { action } = body;
    const actionType = typeof body.type === 'string' ? body.type.trim() : '';
    const itemId = typeof body.item_id === 'string' ? body.item_id.trim() : '';

    if (action !== 'award') {
        return NextResponse.json({ error: '잘못된 action입니다.' }, { status: 400 });
    }

    if (!actionType) {
        return NextResponse.json({ error: 'type이 필요합니다.' }, { status: 400 });
    }

    if (!XP_ACTION_TYPES.has(actionType)) {
        return NextResponse.json({ error: `허용되지 않은 action_type: ${actionType}` }, { status: 400 });
    }

    if (!itemId) {
        return NextResponse.json({ error: 'item_id가 필요합니다.' }, { status: 400 });
    }

    if (itemId.length > MAX_ITEM_ID_LENGTH) {
        return NextResponse.json({ error: 'item_id가 너무 깁니다.' }, { status: 400 });
    }

    // 점수, 중복, 일일 한도, 총 XP, 레벨은 DB에서 하나의 작업으로 처리합니다.
    const { data, error } = await supabase.rpc('growth_api_award_xp', {
        p_action_type: actionType,
        p_item_id: itemId,
    });

    if (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[xp] growth_api_award_xp error:', error.code, error.message);
        }

        if (error.code === '22023') {
            return NextResponse.json({ error: 'XP 지급 요청 내용을 확인해주세요.' }, { status: 400 });
        }

        if (error.code === '42501') {
            return NextResponse.json(
                { error: '활성 상태의 학생 계정만 XP를 받을 수 있습니다.' },
                { status: 403 },
            );
        }

        return NextResponse.json({ error: 'XP 저장 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (!isXpResult(data)) {
        return NextResponse.json({ error: 'XP 저장 결과를 확인하지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
        xp: data.xp,
        level: data.level,
        levelUp: data.levelUp,
        delta: data.delta,
        duplicate: data.duplicate,
        ...(data.reason ? { reason: data.reason } : {}),
    });
}
