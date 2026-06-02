-- ============================================================
-- v11: 1:1 채팅 (Direct Messages) 테이블
-- 학생 ↔ 선생님 1:1 메시지
-- ============================================================

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read messages (for teacher admin)
CREATE POLICY "Anyone can read DMs" ON public.direct_messages FOR SELECT USING (true);

-- Auth users can send messages
CREATE POLICY "Auth users can send DMs" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Auth users can update (mark as read)
CREATE POLICY "Auth users can update DMs" ON public.direct_messages FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON public.direct_messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON public.direct_messages(receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON public.direct_messages(
  LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at
);
