-- v13: parent engagement and feedback delivery foundation

ALTER TABLE public.student_presence
  ADD COLUMN IF NOT EXISTS session_origin TEXT DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS learning_context TEXT DEFAULT 'hybrid',
  ADD COLUMN IF NOT EXISTS activity_state TEXT DEFAULT 'attentive',
  ADD COLUMN IF NOT EXISTS activity_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_event TEXT,
  ADD COLUMN IF NOT EXISTS current_focus_label TEXT;

CREATE TABLE IF NOT EXISTS public.parent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_name TEXT NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  course_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.parent_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_feedback' AND policyname = 'parent_feedback_select'
  ) THEN
    CREATE POLICY "parent_feedback_select" ON public.parent_feedback
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_feedback' AND policyname = 'parent_feedback_insert'
  ) THEN
    CREATE POLICY "parent_feedback_insert" ON public.parent_feedback
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_name TEXT NOT NULL,
  relation TEXT DEFAULT 'parent',
  parent_phone TEXT,
  kakao_recipient_key TEXT,
  channel_user_key TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  receive_live_updates BOOLEAN DEFAULT true,
  receive_feedback_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_student
  ON public.parent_student_links(student_id);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.teacher_feedback
  ADD COLUMN IF NOT EXISTS course_id TEXT,
  ADD COLUMN IF NOT EXISTS focus_score SMALLINT,
  ADD COLUMN IF NOT EXISTS engagement_score SMALLINT,
  ADD COLUMN IF NOT EXISTS understanding_score SMALLINT,
  ADD COLUMN IF NOT EXISTS homework_summary TEXT,
  ADD COLUMN IF NOT EXISTS next_plan TEXT,
  ADD COLUMN IF NOT EXISTS notify_parent BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_channel TEXT DEFAULT 'kakao',
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.feedback_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.teacher_feedback(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_link_id UUID REFERENCES public.parent_student_links(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT,
  response_body JSONB,
  error_message TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_delivery_logs_feedback
  ON public.feedback_delivery_logs(feedback_id, attempted_at DESC);

ALTER TABLE public.feedback_delivery_logs ENABLE ROW LEVEL SECURITY;
