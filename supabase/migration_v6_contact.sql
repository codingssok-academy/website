-- migration_v6_contact.sql
-- 상담 신청 (contact form) 데이터 저장 테이블

CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT,
    phone TEXT NOT NULL,
    course TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 최신순 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
    ON contact_submissions (created_at DESC);

-- RLS 활성화: 익명 사용자는 INSERT만 허용, SELECT/UPDATE/DELETE 불가
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- 누구나 상담 신청 가능 (anon insert)
CREATE POLICY "Anyone can submit contact form"
    ON contact_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 관리자(authenticated)만 조회 가능
CREATE POLICY "Authenticated users can read contact submissions"
    ON contact_submissions
    FOR SELECT
    TO authenticated
    USING (true);
