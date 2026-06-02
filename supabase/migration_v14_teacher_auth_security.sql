-- v14: tighten teacher-side auth and chat policies

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

DROP POLICY IF EXISTS "teacher_feedback_insert" ON public.teacher_feedback;
CREATE POLICY "teacher_feedback_insert" ON public.teacher_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = teacher_id
    AND public.is_teacher_or_admin(auth.uid())
  );

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'teacher_feedback' AND policyname = 'teacher_feedback_update'
  ) THEN
    CREATE POLICY "teacher_feedback_update" ON public.teacher_feedback
      FOR UPDATE TO authenticated
      USING (public.is_teacher_or_admin(auth.uid()));
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can read DMs" ON public.direct_messages;
DROP POLICY IF EXISTS "Auth users can send DMs" ON public.direct_messages;
DROP POLICY IF EXISTS "Auth users can update DMs" ON public.direct_messages;

CREATE POLICY "direct_messages_select" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR public.is_teacher_or_admin(auth.uid())
  );

CREATE POLICY "direct_messages_insert" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
  );

CREATE POLICY "direct_messages_update" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = receiver_id
    OR public.is_teacher_or_admin(auth.uid())
  );

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_student_links' AND policyname = 'parent_student_links_teacher_manage'
  ) THEN
    CREATE POLICY "parent_student_links_teacher_manage" ON public.parent_student_links
      FOR ALL TO authenticated
      USING (public.is_teacher_or_admin(auth.uid()))
      WITH CHECK (public.is_teacher_or_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'feedback_delivery_logs' AND policyname = 'feedback_delivery_logs_teacher_manage'
  ) THEN
    CREATE POLICY "feedback_delivery_logs_teacher_manage" ON public.feedback_delivery_logs
      FOR ALL TO authenticated
      USING (public.is_teacher_or_admin(auth.uid()))
      WITH CHECK (public.is_teacher_or_admin(auth.uid()));
  END IF;
END $$;
