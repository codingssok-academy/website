-- ============================================================
-- 코딩쏙 아카데미 — v5 ~ v9 통합 마이그레이션
-- Supabase SQL Editor에서 한번에 실행하세요
-- ============================================================


-- ████████████████████████████████████████████████
-- v5: 숙제 시스템 RLS 정책 업데이트
-- ████████████████████████████████████████████████

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read homework') THEN
    CREATE POLICY "Anyone can read homework" ON public.homework
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read hw submissions') THEN
    CREATE POLICY "Anyone can read hw submissions" ON public.homework_submissions
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can update homework') THEN
    CREATE POLICY "Auth users can update homework" ON public.homework
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can update hw submissions') THEN
    CREATE POLICY "Auth users can update hw submissions" ON public.homework_submissions
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;


-- ████████████████████████████████████████████████
-- v6: 상담 신청 테이블
-- ████████████████████████████████████████████████

CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT,
    phone TEXT NOT NULL,
    course TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
    ON contact_submissions (created_at DESC);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can submit contact form') THEN
    CREATE POLICY "Anyone can submit contact form"
      ON contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read contact submissions') THEN
    CREATE POLICY "Authenticated users can read contact submissions"
      ON contact_submissions FOR SELECT TO authenticated USING (true);
  END IF;
END $$;


-- ████████████████████████████████████████████████
-- v7: 실시간 학생 접속 현황
-- ████████████████████████████████████████████████

CREATE TABLE IF NOT EXISTS public.student_presence (
    user_id        UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name   TEXT NOT NULL,
    course_id      TEXT,
    course_title   TEXT,
    unit_id        TEXT,
    unit_title     TEXT,
    page_id        TEXT,
    page_title     TEXT,
    page_url       TEXT,
    is_online      BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMPTZ DEFAULT now(),
    started_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_online ON public.student_presence (is_online, last_heartbeat DESC);

ALTER TABLE public.student_presence ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read presence') THEN
    CREATE POLICY "Anyone can read presence" ON public.student_presence FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert presence') THEN
    CREATE POLICY "Anyone can insert presence" ON public.student_presence FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update presence') THEN
    CREATE POLICY "Anyone can update presence" ON public.student_presence FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete presence') THEN
    CREATE POLICY "Anyone can delete presence" ON public.student_presence FOR DELETE USING (true);
  END IF;
END $$;

-- Realtime 활성화 (이미 있으면 무시)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.student_presence;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ████████████████████████████████████████████████
-- v8: 게이미피케이션 시스템
-- ████████████████████████████████████████████████

-- user_progress에 tier 컬럼 추가
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'tier') THEN
    ALTER TABLE public.user_progress ADD COLUMN tier TEXT DEFAULT 'Iron';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'placement_done') THEN
    ALTER TABLE public.user_progress ADD COLUMN placement_done BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'total_problems') THEN
    ALTER TABLE public.user_progress ADD COLUMN total_problems INTEGER DEFAULT 0;
  END IF;
END $$;

-- 티어 달성 보상 기록
CREATE TABLE IF NOT EXISTS public.tier_rewards_claimed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    xp_bonus INTEGER NOT NULL DEFAULT 0,
    badge_id TEXT,
    title_unlocked TEXT,
    theme_unlocked TEXT,
    claimed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, tier)
);
CREATE INDEX IF NOT EXISTS idx_tier_rewards_user ON public.tier_rewards_claimed (user_id);
ALTER TABLE public.tier_rewards_claimed ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own tier rewards') THEN
    CREATE POLICY "Users can read own tier rewards" ON public.tier_rewards_claimed
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own tier rewards') THEN
    CREATE POLICY "Users can insert own tier rewards" ON public.tier_rewards_claimed
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 일일 미션 완료 기록
CREATE TABLE IF NOT EXISTS public.daily_mission_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL,
    mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    claimed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, mission_id, mission_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_mission_user_date ON public.daily_mission_claims (user_id, mission_date);
ALTER TABLE public.daily_mission_claims ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own mission claims') THEN
    CREATE POLICY "Users can read own mission claims" ON public.daily_mission_claims
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own mission claims') THEN
    CREATE POLICY "Users can insert own mission claims" ON public.daily_mission_claims
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 주간 리더보드 보너스
CREATE TABLE IF NOT EXISTS public.leaderboard_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    rank INTEGER NOT NULL,
    xp_bonus INTEGER NOT NULL DEFAULT 0,
    claimed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_week ON public.leaderboard_rewards (week_start, rank);
ALTER TABLE public.leaderboard_rewards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own lb rewards') THEN
    CREATE POLICY "Users can read own lb rewards" ON public.leaderboard_rewards
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can insert lb rewards') THEN
    CREATE POLICY "Auth users can insert lb rewards" ON public.leaderboard_rewards
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 친구 챌린지
CREATE TABLE IF NOT EXISTS public.friend_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    problem_title TEXT NOT NULL,
    challenger_time_ms INTEGER,
    opponent_time_ms INTEGER,
    challenger_solved BOOLEAN DEFAULT false,
    opponent_solved BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired')),
    winner_id UUID REFERENCES public.profiles(id),
    xp_reward INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON public.friend_challenges (challenger_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent ON public.friend_challenges (opponent_id, status);
ALTER TABLE public.friend_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own challenges') THEN
    CREATE POLICY "Users can read own challenges" ON public.friend_challenges
      FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can create challenges') THEN
    CREATE POLICY "Auth users can create challenges" ON public.friend_challenges
      FOR INSERT WITH CHECK (auth.uid() = challenger_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can update challenges') THEN
    CREATE POLICY "Participants can update challenges" ON public.friend_challenges
      FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
  END IF;
END $$;


-- ████████████████████████████████████████████████
-- v9: 게이미피케이션 동기화 컬럼
-- ████████████████████████████████████████████████

ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS streak_data JSONB DEFAULT '{}';
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS hints_count INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS xp_boost_data JSONB DEFAULT '{}';
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS profile_effects JSONB DEFAULT '[]';
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS total_code_runs INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS gamification_synced_at TIMESTAMPTZ;


-- ============================================================
-- 완료! v5~v9 마이그레이션이 모두 적용되었습니다.
-- ============================================================
