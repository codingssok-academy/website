-- 학생 약점 추적 테이블 (나바 AI Phase 2)
-- 각 대화에서 추출된 개념을 누적 저장. ask_count가 높을수록 약점.

CREATE TABLE IF NOT EXISTS student_concepts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    ask_count INT DEFAULT 1,
    last_asked_at TIMESTAMPTZ DEFAULT now(),
    first_asked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, concept)
);

CREATE INDEX IF NOT EXISTS idx_student_concepts_user ON student_concepts(user_id, ask_count DESC);
CREATE INDEX IF NOT EXISTS idx_student_concepts_recent ON student_concepts(user_id, last_asked_at DESC);

-- 권한
GRANT SELECT, INSERT, UPDATE ON student_concepts TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE student_concepts_id_seq TO anon, authenticated, service_role;

-- RLS: INSERT/UPDATE는 service_role만 (서버 API에서), SELECT는 본인 + service_role
ALTER TABLE student_concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "concepts_write_service" ON student_concepts;
CREATE POLICY "concepts_write_service" ON student_concepts
    FOR ALL USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "concepts_read_own" ON student_concepts;
CREATE POLICY "concepts_read_own" ON student_concepts
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ask_count 증가를 위한 upsert 헬퍼 함수
CREATE OR REPLACE FUNCTION increment_concept(p_user_id UUID, p_concept TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO student_concepts (user_id, concept, ask_count, last_asked_at)
    VALUES (p_user_id, p_concept, 1, now())
    ON CONFLICT (user_id, concept)
    DO UPDATE SET
        ask_count = student_concepts.ask_count + 1,
        last_asked_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_concept(UUID, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

-- 검증
SELECT 'student_concepts 테이블 생성 완료' AS status;
