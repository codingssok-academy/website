-- 나바쌤 AI 대화 기록 테이블
-- 실행: Supabase SQL Editor에서 전체 복사-붙여넣기 후 Run

CREATE TABLE IF NOT EXISTS tutor_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    context_key TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tutor_conv_user ON tutor_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_conv_session ON tutor_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conv_context ON tutor_conversations(context_key);

-- 권한
GRANT SELECT, INSERT ON tutor_conversations TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE tutor_conversations_id_seq TO anon, authenticated, service_role;

-- RLS: anon INSERT 허용, SELECT는 service_role만 (학생 프라이버시)
ALTER TABLE tutor_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tutor_conv_insert_any" ON tutor_conversations;
CREATE POLICY "tutor_conv_insert_any" ON tutor_conversations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "tutor_conv_read_service" ON tutor_conversations;
CREATE POLICY "tutor_conv_read_service" ON tutor_conversations
    FOR SELECT USING (auth.role() = 'service_role');

-- PostgREST schema 캐시 갱신
NOTIFY pgrst, 'reload schema';
