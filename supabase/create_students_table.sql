-- ═══════════════════════════════════════════════════
-- 코딩쏙 아카데미 — students 테이블 생성
-- Supabase SQL Editor에서 실행
-- ═══════════════════════════════════════════════════

-- 1) 테이블 생성
CREATE TABLE IF NOT EXISTS students (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  birthday   DATE NOT NULL,
  grade      TEXT,          -- 예: '초3', '초4'
  class      TEXT,          -- 예: 'A반', 'B반'
  avatar     TEXT,          -- 프로필 이모지 등
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2) 이름+생일 인덱스 (빠른 로그인 검색)
CREATE INDEX IF NOT EXISTS idx_students_name_birthday
  ON students (name, birthday);

-- 3) RLS 활성화 + 정책 (anon도 읽기/쓰기 가능)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 읽기: 누구나
CREATE POLICY "students_read" ON students
  FOR SELECT USING (true);

-- 쓰기: 누구나 (프로토타입 단계)
CREATE POLICY "students_insert" ON students
  FOR INSERT WITH CHECK (true);

-- 수정: 누구나
CREATE POLICY "students_update" ON students
  FOR UPDATE USING (true);

-- 삭제: 누구나
CREATE POLICY "students_delete" ON students
  FOR DELETE USING (true);

-- 4) updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 5) 샘플 학생 데이터 (샘플 데이터 포함)
INSERT INTO students (name, birthday, grade, class, avatar) VALUES
  ('샘플학생', '2015-03-15', '초4', 'A반', '🧒'),
  ('김민수', '2014-07-20', '초5', 'A반', '👦'),
  ('이서연', '2015-11-03', '초4', 'B반', '👧'),
  ('박지호', '2013-01-28', '초6', 'A반', '🧑'),
  ('최수아', '2016-05-12', '초3', 'B반', '👧')
ON CONFLICT DO NOTHING;
