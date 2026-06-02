-- ============================================================
-- Codingssok Academy v3 — Phase 8~9 추가 테이블
-- store_purchases, announcements, user_course_progress
-- migration_v2.sql 실행 후에 이 파일을 실행하세요
-- ============================================================

-- ============================================================
-- 1. store_purchases: XP 상점 구매 기록
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id text NOT NULL,
  item_name text NOT NULL,
  xp_cost int NOT NULL DEFAULT 0,
  purchased_at timestamptz DEFAULT now()
);

ALTER TABLE public.store_purchases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own purchases') THEN
    CREATE POLICY "Users read own purchases" ON public.store_purchases FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own purchases') THEN
    CREATE POLICY "Users insert own purchases" ON public.store_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 2. announcements: 공지사항
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read announcements') THEN
    CREATE POLICY "Anyone can read announcements" ON public.announcements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can create announcements') THEN
    CREATE POLICY "Auth users can create announcements" ON public.announcements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can delete announcements') THEN
    CREATE POLICY "Auth users can delete announcements" ON public.announcements FOR DELETE USING (auth.uid() = author_id);
  END IF;
END $$;

-- ============================================================
-- 3. user_course_progress: 코스별 진행률
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id text NOT NULL,
  progress int DEFAULT 0,        -- 0~100 percent
  completed_lessons jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own course progress') THEN
    CREATE POLICY "Users read own course progress" ON public.user_course_progress FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own course progress') THEN
    CREATE POLICY "Users insert own course progress" ON public.user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own course progress') THEN
    CREATE POLICY "Users update own course progress" ON public.user_course_progress FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 4. courses 테이블에 카테고리/난이도 컬럼 추가 (없으면)
-- ============================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS category text DEFAULT '기초',
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS total_lessons int DEFAULT 10,
  ADD COLUMN IF NOT EXISTS xp_reward int DEFAULT 500;

-- ============================================================
-- 5. homework 테이블 확장 (전체 유저 대상 지원)
-- ============================================================
ALTER TABLE public.homework
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 관리자가 만든 숙제는 assigned_to 없이 전체 대상
-- RLS: 인증 유저는 자기 숙제 + 전체 숙제 조회 가능
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read assigned or global homework') THEN
    CREATE POLICY "Users read assigned or global homework" ON public.homework
      FOR SELECT USING (auth.uid() = assigned_to OR assigned_to IS NULL);
  END IF;
END $$;

-- 관리자가 숙제 삭제
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can delete homework') THEN
    CREATE POLICY "Admin can delete homework" ON public.homework
      FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 관리자가 숙제 생성
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can insert homework') THEN
    CREATE POLICY "Admin can insert homework" ON public.homework
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================
-- 6. 인덱스 최적화
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_store_purchases_user ON public.store_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

-- chat_messages, attendance는 migration_v2에서 생성 — 없으면 건너뛰기
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON public.chat_messages(channel, created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance(user_id, check_date);
  END IF;
END $$;
