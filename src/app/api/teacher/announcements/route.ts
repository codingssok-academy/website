import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const ANNOUNCEMENT_FIELDS = "id,title,content,author_id,is_pinned,created_at";
const MAX_TITLE_LENGTH = 80;
const MAX_CONTENT_LENGTH = 2000;

type AnnouncementInput = {
    id?: unknown;
    title?: unknown;
    content?: unknown;
    isPinned?: unknown;
};

function errorResponse(error: string, status: number) {
    return NextResponse.json({ success: false, error }, { status, headers: NO_STORE_HEADERS });
}

async function requireAdministrator() {
    const auth = await requireTeacher();
    if (!auth.ok) return auth;
    if (auth.role !== "admin") {
        return {
            ok: false as const,
            response: errorResponse("전체 메시지는 관리자만 보낼 수 있습니다.", 403),
        };
    }
    return auth;
}

function readMessageInput(body: AnnouncementInput) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const isPinned = body.isPinned === true;

    if (!title || !content) return { ok: false as const, error: "제목과 내용을 모두 입력해주세요." };
    if (title.length > MAX_TITLE_LENGTH) return { ok: false as const, error: `제목은 ${MAX_TITLE_LENGTH}자 이내로 입력해주세요.` };
    if (content.length > MAX_CONTENT_LENGTH) return { ok: false as const, error: `내용은 ${MAX_CONTENT_LENGTH}자 이내로 입력해주세요.` };

    return { ok: true as const, title, content, isPinned };
}

function readId(body: AnnouncementInput) {
    return typeof body.id === "string" ? body.id.trim().slice(0, 100) : "";
}

export async function GET() {
    const auth = await requireAdministrator();
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    if (!admin) return errorResponse("메시지 저장소가 설정되지 않았습니다.", 503);

    const { data, error } = await admin
        .from("announcements")
        .select(ANNOUNCEMENT_FIELDS)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        if (process.env.NODE_ENV === "development") console.error("[teacher announcements GET]", error.message);
        return errorResponse("전체 메시지를 불러오지 못했습니다.", 500);
    }

    return NextResponse.json({ success: true, announcements: data || [] }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
    const auth = await requireAdministrator();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as AnnouncementInput | null;
    if (!body) return errorResponse("요청 내용을 확인해주세요.", 400);

    const input = readMessageInput(body);
    if (!input.ok) return errorResponse(input.error, 400);

    const admin = createAdminClient();
    if (!admin) return errorResponse("메시지 저장소가 설정되지 않았습니다.", 503);

    const { data, error } = await admin
        .from("announcements")
        .insert({
            title: input.title,
            content: input.content,
            author_id: auth.userId,
            is_pinned: input.isPinned,
        })
        .select(ANNOUNCEMENT_FIELDS)
        .single();

    if (error || !data) {
        if (process.env.NODE_ENV === "development") console.error("[teacher announcements POST]", error?.message);
        return errorResponse("전체 메시지를 보내지 못했습니다.", 500);
    }

    return NextResponse.json({ success: true, announcement: data }, { status: 201, headers: NO_STORE_HEADERS });
}

export async function PATCH(request: NextRequest) {
    const auth = await requireAdministrator();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as AnnouncementInput | null;
    if (!body) return errorResponse("요청 내용을 확인해주세요.", 400);

    const id = readId(body);
    if (!id) return errorResponse("수정할 메시지를 찾지 못했습니다.", 400);

    const input = readMessageInput(body);
    if (!input.ok) return errorResponse(input.error, 400);

    const admin = createAdminClient();
    if (!admin) return errorResponse("메시지 저장소가 설정되지 않았습니다.", 503);

    const { data, error } = await admin
        .from("announcements")
        .update({ title: input.title, content: input.content, is_pinned: input.isPinned })
        .eq("id", id)
        .select(ANNOUNCEMENT_FIELDS)
        .single();

    if (error || !data) {
        if (process.env.NODE_ENV === "development") console.error("[teacher announcements PATCH]", error?.message);
        return errorResponse("전체 메시지를 수정하지 못했습니다.", 500);
    }

    return NextResponse.json({ success: true, announcement: data }, { headers: NO_STORE_HEADERS });
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAdministrator();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null) as AnnouncementInput | null;
    const id = body ? readId(body) : "";
    if (!id) return errorResponse("삭제할 메시지를 찾지 못했습니다.", 400);

    const admin = createAdminClient();
    if (!admin) return errorResponse("메시지 저장소가 설정되지 않았습니다.", 503);

    const { error } = await admin.from("announcements").delete().eq("id", id);
    if (error) {
        if (process.env.NODE_ENV === "development") console.error("[teacher announcements DELETE]", error.message);
        return errorResponse("전체 메시지를 삭제하지 못했습니다.", 500);
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
}
