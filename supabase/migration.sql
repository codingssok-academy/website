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
