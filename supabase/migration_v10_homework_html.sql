-- ============================================================
-- v10: homework 테이블에 html_url 컬럼 추가
-- 숙제 HTML 파일 경로를 저장 (예: /homework/cospro-python2-week03.html)
-- ============================================================

-- html_url: HTML 숙제 파일 경로 (null이면 기존 텍스트 방식)
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS html_url text DEFAULT NULL;

-- homework_type: 'text' (기존) 또는 'html' (HTML 파일 기반)
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS homework_type text DEFAULT 'text';

-- created_by: 출제한 선생님 (기존에 이미 있을 수 있음)
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 기존 RLS에 UPDATE 정책 추가 (숙제 수정용)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can update homework') THEN
    CREATE POLICY "Auth users can update homework" ON public.homework
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- homework_submissions에 UPDATE 정책 (채점용)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can update hw submissions') THEN
    CREATE POLICY "Auth users can update hw submissions" ON public.homework_submissions
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 모든 사용자가 숙제를 읽을 수 있도록 (부모 포털용)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read homework') THEN
    CREATE POLICY "Anyone can read homework" ON public.homework
      FOR SELECT USING (true);
  END IF;
END $$;

-- 모든 사용자가 제출물을 읽을 수 있도록 (부모 포털용)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read hw submissions') THEN
    CREATE POLICY "Anyone can read hw submissions" ON public.homework_submissions
      FOR SELECT USING (true);
  END IF;
END $$;
