-- ═══════════════════════════════════════════════════
-- 코딩쏙 아카데미 — students 테이블에 pin 컬럼 추가
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════

-- 1) pin 컬럼 추가 (4자리 숫자 비밀번호)
ALTER TABLE students ADD COLUMN IF NOT EXISTS pin TEXT;

-- 2) birthday NOT NULL 제약 제거 (이제 선택사항)
ALTER TABLE students ALTER COLUMN birthday DROP NOT NULL;

-- 3) 이름+PIN 인덱스
CREATE INDEX IF NOT EXISTS idx_students_name_pin
  ON students (name, pin);

-- 4) 기존 학생들에게 기본 PIN 설정 (선택)
UPDATE students SET pin = '0000' WHERE pin IS NULL;
