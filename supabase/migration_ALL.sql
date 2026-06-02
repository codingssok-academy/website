-- 코딩쏙 통합 마이그레이션 — Supabase Dashboard SQL Editor에서 전체 실행


-- ═══ [migration.sql] ═══
-- ============================================================
-- Codingssok Academy — Learning Dashboard Tables
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. courses: 코스/수업자료
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text default '📘',
  color text default '#3b82f6',
  category text,
  difficulty text default 'Beginner',
  total_lessons int default 0,
  html_path text,
  xp_reward int default 100,
  is_published boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 2. user_progress: 유저별 XP/레벨/스트릭
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  xp int default 0,
  level int default 1,
  streak int default 0,
  best_streak int default 0,
  last_active_date date default current_date,
  total_problems int default 0,
  accuracy numeric(5,2) default 0,
  avg_solve_time_minutes numeric(5,1) default 0,
  rank int default 999,
  tier text default 'Bronze',
  updated_at timestamptz default now(),
  unique(user_id)
);

-- 3. user_course_progress: 유저별 코스 수강 이력
create table if not exists public.user_course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  completed_lessons int default 0,
  is_completed boolean default false,
  total_study_seconds int default 0,
  last_accessed_at timestamptz default now(),
  unique(user_id, course_id)
);

-- 4. challenges: 데일리 챌린지/문제
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  difficulty text default 'Medium',
  category text default 'Algorithms',
  xp_reward int default 100,
  time_limit_minutes int default 30,
  code_template text,
  test_cases jsonb default '[]'::jsonb,
  scheduled_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. user_challenges: 유저별 챌린지 제출 이력
create table if not exists public.user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  status text default 'pending',  -- pending, completed, failed
  submitted_code text,
  xp_earned int default 0,
  completed_at timestamptz,
  unique(user_id, challenge_id)
);

-- 6. user_badges: 유저 배지/업적
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_name text not null,
  badge_icon text default 'military_tech',
  badge_bg text default '#fef9c3',
  badge_color text default '#a16207',
  earned_at timestamptz default now()
);

-- 7. user_goals: 유저 목표
create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  icon text default 'flag',
  target int not null,
  current int default 0,
  unit text default 'problems',
  deadline date,
  color text default '#3b82f6',
  light_bg text default '#eff6ff',
  border_color text default '#bfdbfe',
  is_completed boolean default false,
  created_at timestamptz default now()
);

-- 8. activity_log: 유저 활동 기록
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  xp_earned int default 0,
  icon text default 'check_circle',
  icon_bg text default '#dcfce7',
  icon_color text default '#15803d',
  created_at timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security) Policies
-- ============================================================

-- courses: 인증된 유저 누구나 읽기 가능
alter table public.courses enable row level security;
create policy "Anyone can read courses" on public.courses for select using (true);

-- user_progress: 자기 데이터만
alter table public.user_progress enable row level security;
create policy "Users read own progress" on public.user_progress for select using (auth.uid() = user_id);
create policy "Users insert own progress" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "Users update own progress" on public.user_progress for update using (auth.uid() = user_id);

-- Leaderboard용: 모든 유저가 다른 유저 progress 읽기 (XP/rank만)
create policy "Anyone can read leaderboard" on public.user_progress for select using (true);

-- user_course_progress
alter table public.user_course_progress enable row level security;
create policy "Users read own course progress" on public.user_course_progress for select using (auth.uid() = user_id);
create policy "Users upsert own course progress" on public.user_course_progress for insert with check (auth.uid() = user_id);
create policy "Users update own course progress" on public.user_course_progress for update using (auth.uid() = user_id);

-- challenges: 인증된 유저 누구나 읽기
alter table public.challenges enable row level security;
create policy "Anyone can read challenges" on public.challenges for select using (true);

-- user_challenges
alter table public.user_challenges enable row level security;
create policy "Users read own challenges" on public.user_challenges for select using (auth.uid() = user_id);
create policy "Users insert own challenges" on public.user_challenges for insert with check (auth.uid() = user_id);
create policy "Users update own challenges" on public.user_challenges for update using (auth.uid() = user_id);

-- user_badges
alter table public.user_badges enable row level security;
create policy "Users read own badges" on public.user_badges for select using (auth.uid() = user_id);
create policy "Users insert own badges" on public.user_badges for insert with check (auth.uid() = user_id);

-- user_goals
alter table public.user_goals enable row level security;
create policy "Users read own goals" on public.user_goals for select using (auth.uid() = user_id);
create policy "Users insert own goals" on public.user_goals for insert with check (auth.uid() = user_id);
create policy "Users update own goals" on public.user_goals for update using (auth.uid() = user_id);
create policy "Users delete own goals" on public.user_goals for delete using (auth.uid() = user_id);

-- activity_log
alter table public.activity_log enable row level security;
create policy "Users read own activity" on public.activity_log for select using (auth.uid() = user_id);
create policy "Users insert own activity" on public.activity_log for insert with check (auth.uid() = user_id);

-- ============================================================
-- Leaderboard 뷰 (랭킹 자동 계산)
-- ============================================================
create or replace view public.leaderboard_view as
select
  up.user_id,
  p.name,
  p.email,
  up.xp,
  up.level,
  up.streak,
  up.tier,
  row_number() over (order by up.xp desc) as rank
from public.user_progress up
left join public.profiles p on p.id = up.user_id
order by up.xp desc;


-- ═══ [migration_v2.sql] ═══
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


-- ═══ [migration_v3.sql] ═══
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


-- ═══ [migration_v4.sql] ═══
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


-- ═══ [migration_v5.sql] ═══
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


-- ═══ [migration_v6.sql] ═══
-- ===================================================
-- migration_v6.sql — 수업자료 테이블
-- ===================================================

CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'link', -- 'pdf', 'image', 'video', 'link'
  course_id TEXT DEFAULT '',               -- 연결된 코스 ID (선택)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책: teacher만 INSERT/UPDATE/DELETE, 학생은 SELECT만
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 유저가 읽기 가능
CREATE POLICY "study_materials_select" ON public.study_materials
  FOR SELECT TO authenticated
  USING (true);

-- teacher/admin만 INSERT 가능
CREATE POLICY "study_materials_insert" ON public.study_materials
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

-- teacher/admin만 UPDATE 가능
CREATE POLICY "study_materials_update" ON public.study_materials
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

-- teacher/admin만 DELETE 가능
CREATE POLICY "study_materials_delete" ON public.study_materials
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );


-- ═══ [migration_parent.sql] ═══
-- ===================================================
-- migration_parent.sql — 학부모 포털 테이블
-- daily_reports, class_schedules, teacher_feedback, attendance
-- ===================================================

-- 1. daily_reports — 선생님이 작성하는 오늘 수업 내용 요약
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'good',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_reports_select" ON public.daily_reports
  FOR SELECT USING (true);

CREATE POLICY "daily_reports_insert" ON public.daily_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "daily_reports_update" ON public.daily_reports
  FOR UPDATE USING (true);

-- 2. class_schedules — 수업 일정
CREATE TABLE IF NOT EXISTS public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  teacher_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_schedules_select" ON public.class_schedules
  FOR SELECT USING (true);

CREATE POLICY "class_schedules_insert" ON public.class_schedules
  FOR INSERT WITH CHECK (true);

-- 3. teacher_feedback — 선생님 피드백/코멘트
CREATE TABLE IF NOT EXISTS public.teacher_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  teacher_name TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teacher_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_feedback_select" ON public.teacher_feedback
  FOR SELECT USING (true);

CREATE POLICY "teacher_feedback_insert" ON public.teacher_feedback
  FOR INSERT WITH CHECK (true);

-- 4. attendance — 출석 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present',
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);

-- 기존 컬럼 추가 (이미 있으면 무시됨)
DO $$ BEGIN
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ;
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS note TEXT;
END $$;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
CREATE POLICY "attendance_insert" ON public.attendance
  FOR INSERT WITH CHECK (true);


-- ═══ [add_pin_column.sql] ═══
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


-- ═══ [migration_chat.sql] ═══
-- chat_messages 테이블
-- 채팅 페이지(src/app/dashboard/learning/chat/page.tsx) 기준 컬럼 구조
--
-- 컬럼:
--   id           : uuid, PK, 자동 생성
--   user_id      : uuid, NOT NULL — auth.users FK (RLS 강제)
--   display_name : text, NOT NULL — 유저 표시 이름
--   avatar_url   : text, NULL — 프로필 이미지 URL
--   content      : text, NOT NULL — 메시지 본문
--   channel      : text, NOT NULL — 채팅방 ID (general | help | random)
--   created_at   : timestamptz, 자동 설정

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id           uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text             NOT NULL,
    avatar_url   text,
    content      text             NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
    channel      text             NOT NULL DEFAULT 'general' CHECK (channel IN ('general', 'help', 'random')),
    created_at   timestamptz      NOT NULL DEFAULT now()
);

-- 채널 + 시간순 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS chat_messages_channel_created_at_idx
    ON public.chat_messages (channel, created_at ASC);

-- 유저별 메시지 조회 인덱스
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx
    ON public.chat_messages (user_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- authenticated 유저는 모든 채널 메시지 읽기 가능
CREATE POLICY "chat_messages_select"
    ON public.chat_messages
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT 시 user_id는 반드시 현재 로그인 유저와 일치해야 함
CREATE POLICY "chat_messages_insert"
    ON public.chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 본인 메시지만 삭제 가능 (선택적)
CREATE POLICY "chat_messages_delete_own"
    ON public.chat_messages
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ═══ [migration_golf.sql] ═══
-- ============================================================
-- 코드 골프 Migration
-- golf_submissions 테이블 + golf_leaderboard 뷰
-- ============================================================

-- 코드 골프 제출 기록
CREATE TABLE IF NOT EXISTS public.golf_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  code TEXT NOT NULL,
  char_count INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'wrong'
  stdout TEXT DEFAULT '',
  stderr TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.golf_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'golf_select_own' AND tablename = 'golf_submissions') THEN
    CREATE POLICY "golf_select_own" ON public.golf_submissions
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'golf_insert_own' AND tablename = 'golf_submissions') THEN
    CREATE POLICY "golf_insert_own" ON public.golf_submissions
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 리더보드 뷰: 문제별 최단 코드 제출
CREATE OR REPLACE VIEW public.golf_leaderboard AS
SELECT DISTINCT ON (problem_id, user_id)
  gs.problem_id,
  gs.user_id,
  COALESCE(p.display_name, p.name, p.email) AS display_name,
  gs.char_count,
  gs.submitted_at
FROM public.golf_submissions gs
JOIN public.profiles p ON p.id = gs.user_id
WHERE gs.status = 'accepted'
ORDER BY problem_id, user_id, char_count ASC;

-- 전체 골프 랭킹 뷰: 유저별 총 풀이 수 + 평균 글자 수
CREATE OR REPLACE VIEW public.golf_ranking AS
SELECT
  user_id,
  COALESCE(p.display_name, p.name, p.email) AS display_name,
  COUNT(DISTINCT problem_id) AS solved_count,
  ROUND(AVG(char_count)) AS avg_chars
FROM (
  SELECT DISTINCT ON (problem_id, user_id)
    gs.user_id,
    gs.problem_id,
    gs.char_count
  FROM public.golf_submissions gs
  WHERE gs.status = 'accepted'
  ORDER BY problem_id, user_id, char_count ASC
) best
JOIN public.profiles p ON p.id = best.user_id
GROUP BY user_id, p.display_name, p.name, p.email
ORDER BY solved_count DESC, avg_chars ASC;
