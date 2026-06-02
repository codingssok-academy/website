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
