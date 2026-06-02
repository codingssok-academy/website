-- ============================================================
-- Codingssok Academy v8 — 게이미피케이션 시스템 마이그레이션
-- 티어 보상, 일일 미션 기록, 리더보드 보너스 테이블
-- migration_v7 이후 실행
-- ============================================================

-- ──────────────────────────────────────
-- 1. user_progress 테이블에 tier 관련 컬럼 추가
-- ──────────────────────────────────────
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

-- ──────────────────────────────────────
-- 2. 티어 달성 보상 기록 테이블
-- ──────────────────────────────────────
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

-- ──────────────────────────────────────
-- 3. 일일 미션 완료 기록 (서버측 검증용)
-- ──────────────────────────────────────
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

-- ──────────────────────────────────────
-- 4. 주간 리더보드 보너스 기록
-- ──────────────────────────────────────
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

-- ──────────────────────────────────────
-- 5. 친구 챌린지 테이블
-- ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friend_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    problem_title TEXT NOT NULL,
    challenger_time_ms INTEGER,        -- 풀이 시간 (밀리초)
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

-- ============================================================
-- 완료! 게이미피케이션 테이블이 추가되었습니다.
-- tier_rewards_claimed: 티어 달성 보상 기록
-- daily_mission_claims: 일일 미션 서버측 기록
-- leaderboard_rewards:  주간 리더보드 보너스
-- friend_challenges:    친구 챌린지 대결
-- ============================================================
