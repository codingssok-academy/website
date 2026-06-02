-- ============================================================
-- Codingssok Academy v5 — 숙제 시스템 RLS 정책 업데이트
-- 학부모 포털에서 숙제 데이터를 읽을 수 있도록 SELECT 정책 추가
-- migration_v4.sql 실행 후에 이 파일을 Supabase SQL Editor에서 실행하세요
-- ============================================================

-- homework 테이블: 누구나 읽기 가능 (학부모 포털 지원)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read homework') THEN
    CREATE POLICY "Anyone can read homework" ON public.homework
      FOR SELECT USING (true);
  END IF;
END $$;

-- homework_submissions 테이블: 누구나 읽기 가능 (학부모 포털 지원)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read hw submissions') THEN
    CREATE POLICY "Anyone can read hw submissions" ON public.homework_submissions
      FOR SELECT USING (true);
  END IF;
END $$;

-- homework 테이블: UPDATE 정책 추가 (선생님이 is_active 토글)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can update homework') THEN
    CREATE POLICY "Auth users can update homework" ON public.homework
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- homework_submissions 테이블: UPDATE 정책 추가 (채점)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can update hw submissions') THEN
    CREATE POLICY "Auth users can update hw submissions" ON public.homework_submissions
      FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================
-- 완료! 이제 학부모 포털에서 숙제 데이터를 조회할 수 있습니다.
-- ============================================================
