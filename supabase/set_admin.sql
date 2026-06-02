-- ============================================================
-- 관리자 계정 설정 — Lv99 챌린저
-- louispetergu@naver.com → admin + Lv99 + Challenger
-- ============================================================

-- 1. profiles 테이블에서 role을 admin으로 변경
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'louispetergu@naver.com' LIMIT 1
);

-- 2. user_progress에서 Lv99, 챌린저, XP 최대로 설정
UPDATE public.user_progress
SET 
  level = 99,
  xp = 980100,
  tier = 'Challenger',
  placement_done = true,
  streak = 365,
  best_streak = 365,
  total_problems = 9999,
  last_active_date = CURRENT_DATE,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'louispetergu@naver.com' LIMIT 1
);

-- 만약 user_progress가 없으면 새로 생성
INSERT INTO public.user_progress (user_id, level, xp, tier, placement_done, streak, best_streak, total_problems, last_active_date)
SELECT 
  id, 99, 980100, 'Challenger', true, 365, 365, 9999, CURRENT_DATE
FROM auth.users 
WHERE email = 'louispetergu@naver.com'
ON CONFLICT (user_id) DO UPDATE SET
  level = 99,
  xp = 980100,
  tier = 'Challenger',
  placement_done = true,
  streak = 365,
  best_streak = 365,
  total_problems = 9999;

-- 확인 쿼리
SELECT p.id, p.name, p.email, p.role, up.level, up.xp, up.tier
FROM public.profiles p
LEFT JOIN public.user_progress up ON up.user_id = p.id
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'louispetergu@naver.com' LIMIT 1);
