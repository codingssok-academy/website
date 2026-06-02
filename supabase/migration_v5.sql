-- ============================================================
-- Codingssok Academy v5 — FK 관계 수정 + PostgREST 조인 지원
-- migration_v4.sql 실행 이후에 이 파일을 실행하세요
-- ============================================================

-- ── 1. profiles 테이블에 email 컬럼 추가 (없는 경우) ──
-- Supabase auth trigger로 생성된 profiles에 email이 없으면 500 에러 발생
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;

-- auth.users에서 email 동기화
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- ── 2. user_progress → profiles FK 추가 ──
-- PostgREST에서 profiles!inner() 조인을 하려면 직접 FK가 필요
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_progress_user_id_profiles_fkey'
    AND table_name = 'user_progress'
  ) THEN
    ALTER TABLE public.user_progress
    ADD CONSTRAINT user_progress_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── 3. follows → profiles FK 이름 보정 ──
-- PostgREST가 자동 감지하는 FK 이름: follows_follower_id_fkey, follows_following_id_fkey
-- 기존 FK가 auth.users만 참조하면 profiles 조인 불가

-- follower_id → profiles FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'follows_follower_id_profiles_fkey'
    AND table_name = 'follows'
  ) THEN
    ALTER TABLE public.follows
    ADD CONSTRAINT follows_follower_id_profiles_fkey
    FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- following_id → profiles FK
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'follows_following_id_profiles_fkey'
    AND table_name = 'follows'
  ) THEN
    ALTER TABLE public.follows
    ADD CONSTRAINT follows_following_id_profiles_fkey
    FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── 4. profiles에 대한 누구나 읽기 정책 보장 ──
-- (migration_v2에서 생성되었을 수 있으나 안전하게 재확인)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone' AND tablename = 'profiles') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

-- ── 5. user_progress 전체 읽기 정책 (리더보드용) ──
-- 기존에 "Anyone can read leaderboard"가 있을 수 있으나 확인
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leaderboard public read' AND tablename = 'user_progress') THEN
    CREATE POLICY "Leaderboard public read" ON public.user_progress FOR SELECT USING (true);
  END IF;
END $$;

-- ── 6. attendance 테이블 생성 ──
-- xp-engine의 checkAttendance()에서 사용
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date date NOT NULL DEFAULT current_date,
  xp_earned int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, check_date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own attendance' AND tablename = 'attendance') THEN
    CREATE POLICY "Users read own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own attendance' AND tablename = 'attendance') THEN
    CREATE POLICY "Users insert own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 7. profiles 테이블 보장 (없으면 생성) ──
-- Supabase auth trigger로 보통 자동 생성되지만 없는 경우를 대비
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  email text,
  name text,
  bio text,
  role text DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- profiles RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 사용자가 자신의 프로필을 업데이트할 수 있도록
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ── 8. 신규 유저 가입 시 자동 profiles 생성 트리거 ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 있으면 대체
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
