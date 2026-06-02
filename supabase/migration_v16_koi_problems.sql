-- migration_v16_koi_problems.sql
-- KOI 문제 풀기 기능을 위한 code_submissions 테이블 컬럼 추가

-- problem_id: KOI 문제 ID (예: "koi-2024-r1-e-1")
ALTER TABLE public.code_submissions
  ADD COLUMN IF NOT EXISTS problem_id text DEFAULT NULL;

-- result: 채점 결과 ("정답" | "부분 정답" | "오답")
ALTER TABLE public.code_submissions
  ADD COLUMN IF NOT EXISTS result text DEFAULT NULL;

-- score: 획득 점수
ALTER TABLE public.code_submissions
  ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;

-- stdout: 실행 결과 출력 (기존 output 컬럼과 별도로 추가)
ALTER TABLE public.code_submissions
  ADD COLUMN IF NOT EXISTS stdout text DEFAULT '';

-- 인덱스: problem_id 기반 조회 최적화
CREATE INDEX IF NOT EXISTS idx_code_submissions_problem
  ON public.code_submissions(user_id, problem_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_code_submissions_result
  ON public.code_submissions(problem_id, result)
  WHERE problem_id IS NOT NULL;
