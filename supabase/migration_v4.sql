-- ============================================================
-- Codingssok Academy v4 — 누락 테이블 추가
-- notes, code_submissions, xp_logs, homework, homework_submissions
-- migration_v3.sql 실행 후에 이 파일을 Supabase SQL Editor에서 실행하세요
-- ============================================================

-- ============================================================
-- 1. notes: 학생 노트/메모
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own notes') THEN
    CREATE POLICY "Users read own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own notes') THEN
    CREATE POLICY "Users insert own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own notes') THEN
    CREATE POLICY "Users update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own notes') THEN
    CREATE POLICY "Users delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id, created_at DESC);

-- ============================================================
-- 2. code_submissions: 코드 제출 기록
-- ============================================================
CREATE TABLE IF NOT EXISTS public.code_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  language text DEFAULT 'c',
  code text NOT NULL DEFAULT '',
  output text DEFAULT '',
  status text DEFAULT 'pending',  -- success, compile_error, runtime_error, error
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.code_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own submissions') THEN
    CREATE POLICY "Users read own submissions" ON public.code_submissions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own submissions') THEN
    CREATE POLICY "Users insert own submissions" ON public.code_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_code_submissions_user ON public.code_submissions(user_id, created_at DESC);

-- ============================================================
-- 3. xp_logs: XP 획득 이력
-- ============================================================
CREATE TABLE IF NOT EXISTS public.xp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount int NOT NULL DEFAULT 0,
  reason text DEFAULT '',
  icon text DEFAULT 'star',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own xp logs') THEN
    CREATE POLICY "Users read own xp logs" ON public.xp_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own xp logs') THEN
    CREATE POLICY "Users insert own xp logs" ON public.xp_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON public.xp_logs(user_id, created_at DESC);

-- ============================================================
-- 4. homework: 숙제 (기본 테이블 — v3에서 ALTER만 있고 CREATE가 없었음)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  due_date date,
  course_id text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own or global homework') THEN
    CREATE POLICY "Users read own or global homework" ON public.homework
      FOR SELECT USING (auth.uid() = assigned_to OR assigned_to IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can create homework') THEN
    CREATE POLICY "Auth users can create homework" ON public.homework
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can delete homework') THEN
    CREATE POLICY "Auth users can delete homework" ON public.homework
      FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_homework_assigned ON public.homework(assigned_to, due_date);

-- ============================================================
-- 5. homework_submissions: 숙제 제출
-- ============================================================
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid REFERENCES public.homework(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text DEFAULT '',
  score int,
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(homework_id, user_id)
);

ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own hw submissions') THEN
    CREATE POLICY "Users read own hw submissions" ON public.homework_submissions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own hw submissions') THEN
    CREATE POLICY "Users insert own hw submissions" ON public.homework_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hw_subs_user ON public.homework_submissions(user_id);

-- ============================================================
-- 완료! 이제 노트 저장, 코드 제출, XP 로그, 숙제 기능이 정상 작동합니다.
-- ============================================================
