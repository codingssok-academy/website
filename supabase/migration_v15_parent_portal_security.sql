-- v15: secure parent portal data access and parent session attempts

CREATE OR REPLACE FUNCTION public.is_teacher_or_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = uid
      AND role IN ('teacher', 'admin')
  );
$$;

CREATE TABLE IF NOT EXISTS public.parent_access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parent_access_attempts_ip_time
  ON public.parent_access_attempts(ip_hash, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_parent_access_attempts_query_time
  ON public.parent_access_attempts(query_hash, attempted_at DESC);

ALTER TABLE public.parent_access_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parent_access_attempts_teacher_manage" ON public.parent_access_attempts;
CREATE POLICY "parent_access_attempts_teacher_manage" ON public.parent_access_attempts
  FOR ALL TO authenticated
  USING (public.is_teacher_or_admin(auth.uid()))
  WITH CHECK (public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "daily_reports_select" ON public.daily_reports;
DROP POLICY IF EXISTS "daily_reports_insert" ON public.daily_reports;
DROP POLICY IF EXISTS "daily_reports_update" ON public.daily_reports;
DROP POLICY IF EXISTS "daily_reports_student_select" ON public.daily_reports;
DROP POLICY IF EXISTS "daily_reports_teacher_manage" ON public.daily_reports;

CREATE POLICY "daily_reports_student_select" ON public.daily_reports
  FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR public.is_teacher_or_admin(auth.uid())
  );

CREATE POLICY "daily_reports_teacher_manage" ON public.daily_reports
  FOR ALL TO authenticated
  USING (public.is_teacher_or_admin(auth.uid()))
  WITH CHECK (public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "class_schedules_select" ON public.class_schedules;
DROP POLICY IF EXISTS "class_schedules_insert" ON public.class_schedules;
DROP POLICY IF EXISTS "class_schedules_student_select" ON public.class_schedules;
DROP POLICY IF EXISTS "class_schedules_teacher_manage" ON public.class_schedules;

CREATE POLICY "class_schedules_student_select" ON public.class_schedules
  FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR public.is_teacher_or_admin(auth.uid())
  );

CREATE POLICY "class_schedules_teacher_manage" ON public.class_schedules
  FOR ALL TO authenticated
  USING (public.is_teacher_or_admin(auth.uid()))
  WITH CHECK (public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "teacher_feedback_select" ON public.teacher_feedback;
DROP POLICY IF EXISTS "teacher_feedback_select_secure" ON public.teacher_feedback;

CREATE POLICY "teacher_feedback_select_secure" ON public.teacher_feedback
  FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR auth.uid() = teacher_id
    OR public.is_teacher_or_admin(auth.uid())
  );

DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_access_secure" ON public.attendance;

CREATE POLICY "attendance_access_secure" ON public.attendance
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_teacher_or_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_teacher_or_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can read presence" ON public.student_presence;
DROP POLICY IF EXISTS "Anyone can insert presence" ON public.student_presence;
DROP POLICY IF EXISTS "Anyone can update presence" ON public.student_presence;
DROP POLICY IF EXISTS "Anyone can delete presence" ON public.student_presence;
DROP POLICY IF EXISTS "student_presence_access_secure" ON public.student_presence;

CREATE POLICY "student_presence_access_secure" ON public.student_presence
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_teacher_or_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_teacher_or_admin(auth.uid())
  );

DROP POLICY IF EXISTS "parent_feedback_select" ON public.parent_feedback;
DROP POLICY IF EXISTS "parent_feedback_insert" ON public.parent_feedback;
DROP POLICY IF EXISTS "parent_feedback_select_secure" ON public.parent_feedback;
DROP POLICY IF EXISTS "parent_feedback_teacher_manage" ON public.parent_feedback;

CREATE POLICY "parent_feedback_select_secure" ON public.parent_feedback
  FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR public.is_teacher_or_admin(auth.uid())
  );

CREATE POLICY "parent_feedback_teacher_manage" ON public.parent_feedback
  FOR ALL TO authenticated
  USING (public.is_teacher_or_admin(auth.uid()))
  WITH CHECK (public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read homework" ON public.homework;
DROP POLICY IF EXISTS "Auth users can create homework" ON public.homework;
DROP POLICY IF EXISTS "Auth users can update homework" ON public.homework;
DROP POLICY IF EXISTS "Auth users can delete homework" ON public.homework;
DROP POLICY IF EXISTS "homework_teacher_manage" ON public.homework;

CREATE POLICY "homework_teacher_manage" ON public.homework
  FOR ALL TO authenticated
  USING (public.is_teacher_or_admin(auth.uid()))
  WITH CHECK (public.is_teacher_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read hw submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "Auth users can update hw submissions" ON public.homework_submissions;
DROP POLICY IF EXISTS "homework_submissions_teacher_manage" ON public.homework_submissions;

CREATE POLICY "homework_submissions_teacher_manage" ON public.homework_submissions
  FOR ALL TO authenticated
  USING (public.is_teacher_or_admin(auth.uid()))
  WITH CHECK (public.is_teacher_or_admin(auth.uid()));
