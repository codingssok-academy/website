-- chat_messages 테이블
-- 채팅 페이지(src/app/dashboard/learning/chat/page.tsx) 기준 컬럼 구조
--
-- 컬럼:
--   id           : uuid, PK, 자동 생성
--   user_id      : uuid, NOT NULL — auth.users FK (RLS 강제)
--   display_name : text, NOT NULL — 유저 표시 이름
--   avatar_url   : text, NULL — 프로필 이미지 URL
--   content      : text, NOT NULL — 메시지 본문
--   channel      : text, NOT NULL — 채팅방 ID (general | help | random)
--   created_at   : timestamptz, 자동 설정

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id           uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text             NOT NULL,
    avatar_url   text,
    content      text             NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
    channel      text             NOT NULL DEFAULT 'general' CHECK (channel IN ('general', 'help', 'random')),
    created_at   timestamptz      NOT NULL DEFAULT now()
);

-- 채널 + 시간순 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS chat_messages_channel_created_at_idx
    ON public.chat_messages (channel, created_at ASC);

-- 유저별 메시지 조회 인덱스
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx
    ON public.chat_messages (user_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- authenticated 유저는 모든 채널 메시지 읽기 가능
CREATE POLICY "chat_messages_select"
    ON public.chat_messages
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT 시 user_id는 반드시 현재 로그인 유저와 일치해야 함
CREATE POLICY "chat_messages_insert"
    ON public.chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 본인 메시지만 삭제 가능 (선택적)
CREATE POLICY "chat_messages_delete_own"
    ON public.chat_messages
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
