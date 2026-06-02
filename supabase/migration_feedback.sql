CREATE TABLE IF NOT EXISTS public.feedback_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  date TEXT DEFAULT '',
  learn TEXT DEFAULT '',
  activities TEXT DEFAULT '',
  reaction TEXT DEFAULT '',
  progress TEXT DEFAULT '',
  homework TEXT DEFAULT '',
  next_plan TEXT DEFAULT '',
  extra TEXT DEFAULT '',
  detail_photo_url TEXT DEFAULT '',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback_pages ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 (공개 피드백 URL)
CREATE POLICY "feedback_public_read" ON public.feedback_pages
  FOR SELECT USING (true);

-- teacher/admin만 생성
CREATE POLICY "feedback_teacher_insert" ON public.feedback_pages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));

-- teacher/admin만 수정
CREATE POLICY "feedback_teacher_update" ON public.feedback_pages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));

-- teacher/admin만 삭제
CREATE POLICY "feedback_teacher_delete" ON public.feedback_pages
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));

CREATE INDEX IF NOT EXISTS idx_feedback_slug ON public.feedback_pages(slug);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback_pages(created_at DESC);
