-- ===================================================
-- migration_parent.sql — 학부모 포털 테이블
-- daily_reports, class_schedules, teacher_feedback, attendance
-- ===================================================

-- 1. daily_reports — 선생님이 작성하는 오늘 수업 내용 요약
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'good',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_reports_select" ON public.daily_reports
  FOR SELECT USING (true);

CREATE POLICY "daily_reports_insert" ON public.daily_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "daily_reports_update" ON public.daily_reports
  FOR UPDATE USING (true);

-- 2. class_schedules — 수업 일정
CREATE TABLE IF NOT EXISTS public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  teacher_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_schedules_select" ON public.class_schedules
  FOR SELECT USING (true);

CREATE POLICY "class_schedules_insert" ON public.class_schedules
  FOR INSERT WITH CHECK (true);

-- 3. teacher_feedback — 선생님 피드백/코멘트
CREATE TABLE IF NOT EXISTS public.teacher_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  teacher_name TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teacher_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_feedback_select" ON public.teacher_feedback
  FOR SELECT USING (true);

CREATE POLICY "teacher_feedback_insert" ON public.teacher_feedback
  FOR INSERT WITH CHECK (true);

-- 4. attendance — 출석 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present',
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);

-- 기존 컬럼 추가 (이미 있으면 무시됨)
DO $$ BEGIN
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ;
  ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS note TEXT;
END $$;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
CREATE POLICY "attendance_insert" ON public.attendance
  FOR INSERT WITH CHECK (true);
