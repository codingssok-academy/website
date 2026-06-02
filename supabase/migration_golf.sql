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
