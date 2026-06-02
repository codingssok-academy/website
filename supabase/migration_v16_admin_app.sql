-- v16: 관리자 앱 — announcements RLS 정책 강화
-- teacher/admin만 INSERT/UPDATE/DELETE 가능하게 변경

-- 1) 기존 정책 제거
DROP POLICY IF EXISTS "Auth users can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Auth users can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers can create announcements" ON public.announcements;

-- 2) UPDATE 정책 추가
CREATE POLICY "Teachers can update announcements"
ON public.announcements FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- 3) DELETE 정책 (teacher/admin 전용)
CREATE POLICY "Teachers can delete announcements"
ON public.announcements FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- 4) INSERT 정책 (teacher/admin 전용)
CREATE POLICY "Teachers can create announcements"
ON public.announcements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);
