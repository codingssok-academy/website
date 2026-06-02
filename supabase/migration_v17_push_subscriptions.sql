-- v17: Push Notification Subscriptions
-- 학부모 앱 Web Push 구독 관리

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    keys_p256dh TEXT NOT NULL DEFAULT '',
    keys_auth TEXT NOT NULL DEFAULT '',
    parent_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 학생별 구독 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_student_id ON push_subscriptions(student_id);

-- endpoint 유니크 + upsert용
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role만 접근 (서버 API에서 admin client 사용)
CREATE POLICY "push_subscriptions_service_role"
    ON push_subscriptions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
