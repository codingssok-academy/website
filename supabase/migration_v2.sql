-- ============================================================
-- Codingssok Academy v2 — 대규모 업그레이드 Migration
-- LoL식 티어 시스템 + 소셜 기능 + 데일리미션 + 업적
-- migration.sql 실행 후에 이 파일을 실행하세요
-- ============================================================

-- ── profiles 테이블 확장 (이름/사진/역할) ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

-- ── user_progress 확장 (티어 포인트) ──
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS tier_points int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS placement_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotion_available boolean DEFAULT false;

-- tier 기본값 변경 (Iron)
ALTER TABLE public.user_progress ALTER COLUMN tier SET DEFAULT 'Iron';

-- ============================================================
-- 1. tiers: 티어 정의
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tiers (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  name_ko text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  gradient text NOT NULL,
  min_points int DEFAULT 0,
  sort_order int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. tier_exams: 배치고사/승급심사 문제
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tier_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL,          -- 어떤 티어 승급용인지
  exam_type text DEFAULT 'promotion', -- 'placement' (배치) / 'promotion' (승급)
  question text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,  -- 객관식 보기
  correct_answer text NOT NULL,
  explanation text,
  difficulty text DEFAULT 'Medium',
  category text DEFAULT 'C언어',
  points int DEFAULT 10,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. user_tier_history: 유저 티어 변동 이력
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_tier_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_tier text,
  to_tier text NOT NULL,
  exam_score int,
  exam_total int,
  change_type text DEFAULT 'promotion', -- 'placement', 'promotion', 'demotion'
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. daily_missions: 데일리 미션 정의
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT 'task_alt',
  xp_reward int DEFAULT 50,
  mission_type text DEFAULT 'daily', -- 'daily', 'weekly'
  condition_type text NOT NULL,      -- 'solve_problems', 'study_minutes', 'submit_code', 'login', 'complete_lesson'
  condition_value int DEFAULT 1,     -- 몇 번/몇 분 해야 하는지
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. user_daily_missions: 유저별 미션 진행
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id uuid REFERENCES public.daily_missions(id) ON DELETE CASCADE NOT NULL,
  progress int DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  assigned_date date DEFAULT CURRENT_DATE,
  UNIQUE(user_id, mission_id, assigned_date)
);

-- ============================================================
-- 6. achievements: 업적 정의
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT 'military_tech',
  icon_bg text DEFAULT '#fef9c3',
  icon_color text DEFAULT '#a16207',
  category text DEFAULT 'general',  -- 'general', 'streak', 'social', 'coding', 'tier'
  condition_type text NOT NULL,     -- 'streak_days', 'total_xp', 'problems_solved', 'tier_reached', 'followers', 'first_code'
  condition_value int DEFAULT 1,
  xp_reward int DEFAULT 100,
  rarity text DEFAULT 'common',     -- 'common', 'rare', 'epic', 'legendary'
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. user_achievements: 유저별 업적 달성
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- 8. follows: 팔로워/팔로잉
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- ============================================================
-- 9. chat_messages: 실시간 채팅
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  content text NOT NULL,
  channel text DEFAULT 'general',   -- 'general', 'help', 'random', etc.
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 10. attendance: 출석체크
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_date date DEFAULT CURRENT_DATE,
  xp_earned int DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, check_date)
);

-- ============================================================
-- RLS Policies (v2)
-- ============================================================

-- tiers: 누구나 읽기
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read tiers') THEN
    CREATE POLICY "Anyone can read tiers" ON public.tiers FOR SELECT USING (true);
  END IF;
END $$;

-- tier_exams: 누구나 읽기
ALTER TABLE public.tier_exams ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read tier_exams') THEN
    CREATE POLICY "Anyone can read tier_exams" ON public.tier_exams FOR SELECT USING (true);
  END IF;
END $$;

-- user_tier_history: 자기 데이터
ALTER TABLE public.user_tier_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own tier history') THEN
    CREATE POLICY "Users read own tier history" ON public.user_tier_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own tier history') THEN
    CREATE POLICY "Users insert own tier history" ON public.user_tier_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- daily_missions: 누구나 읽기
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read missions') THEN
    CREATE POLICY "Anyone can read missions" ON public.daily_missions FOR SELECT USING (true);
  END IF;
END $$;

-- user_daily_missions: 자기 데이터
ALTER TABLE public.user_daily_missions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own missions') THEN
    CREATE POLICY "Users read own missions" ON public.user_daily_missions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own missions') THEN
    CREATE POLICY "Users insert own missions" ON public.user_daily_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own missions') THEN
    CREATE POLICY "Users update own missions" ON public.user_daily_missions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- achievements: 누구나 읽기
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read achievements') THEN
    CREATE POLICY "Anyone can read achievements" ON public.achievements FOR SELECT USING (true);
  END IF;
END $$;

-- user_achievements: 자기 데이터 + 다른 유저 업적 조회
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read user achievements') THEN
    CREATE POLICY "Anyone can read user achievements" ON public.user_achievements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own achievements') THEN
    CREATE POLICY "Users insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- follows: 누구나 읽기 + 자기가 팔로우 관리
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read follows') THEN
    CREATE POLICY "Anyone can read follows" ON public.follows FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own follows') THEN
    CREATE POLICY "Users insert own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users delete own follows') THEN
    CREATE POLICY "Users delete own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;

-- chat_messages: 누구나 읽기/쓰기
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read chat') THEN
    CREATE POLICY "Anyone can read chat" ON public.chat_messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can send chat') THEN
    CREATE POLICY "Auth users can send chat" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- attendance: 자기 데이터
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own attendance') THEN
    CREATE POLICY "Users read own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users insert own attendance') THEN
    CREATE POLICY "Users insert own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- profiles: 누구나 읽기 + 자기 수정
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read profiles') THEN
    CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own profile') THEN
    CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- ============================================================
-- Leaderboard v2 뷰 (티어 포함)
-- ============================================================
CREATE OR REPLACE VIEW public.leaderboard_v2 AS
SELECT
  up.user_id,
  COALESCE(p.display_name, p.name, p.email) AS display_name,
  p.avatar_url,
  p.role,
  up.xp,
  up.level,
  up.streak,
  up.tier,
  up.tier_points,
  up.total_problems,
  up.accuracy,
  ROW_NUMBER() OVER (ORDER BY up.xp DESC) AS rank
FROM public.user_progress up
LEFT JOIN public.profiles p ON p.id = up.user_id
ORDER BY up.xp DESC;

-- ============================================================
-- 팔로우 카운트 뷰
-- ============================================================
CREATE OR REPLACE VIEW public.follow_counts AS
SELECT
  u.id AS user_id,
  COALESCE(f1.follower_count, 0) AS follower_count,
  COALESCE(f2.following_count, 0) AS following_count
FROM auth.users u
LEFT JOIN (SELECT following_id, COUNT(*) AS follower_count FROM public.follows GROUP BY following_id) f1 ON u.id = f1.following_id
LEFT JOIN (SELECT follower_id, COUNT(*) AS following_count FROM public.follows GROUP BY follower_id) f2 ON u.id = f2.follower_id;
