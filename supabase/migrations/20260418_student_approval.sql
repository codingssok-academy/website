-- 학생 가입 승인 시스템 (코딩쏙)
-- 실행: Supabase SQL Editor에서 전체 복사-붙여넣기 후 Run

-- 1. profiles에 approval_status 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' NOT NULL;

-- 유효값 제약
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'profiles_approval_status_check'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT profiles_approval_status_check
        CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- 2. 기존 유저는 전부 approved로 (이미 사용 중이니까)
UPDATE profiles
SET approval_status = 'approved'
WHERE created_at < now() - INTERVAL '1 minute'
   AND approval_status = 'pending';

-- 3. 교사/관리자는 항상 approved
UPDATE profiles
SET approval_status = 'approved'
WHERE role IN ('teacher', 'admin');

-- 4. 인덱스 (대기 목록 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_profiles_approval
ON profiles(approval_status, created_at DESC)
WHERE approval_status = 'pending';

-- 5. 승인 / 거부 RPC (service_role만)
CREATE OR REPLACE FUNCTION approve_student(p_user_id UUID, p_approver_note TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET approval_status = 'approved', updated_at = now()
    WHERE id = p_user_id AND approval_status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_student(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET approval_status = 'rejected', updated_at = now()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_student(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION reject_student(UUID) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

-- 검증
SELECT approval_status, COUNT(*)
FROM profiles
GROUP BY approval_status
ORDER BY approval_status;
