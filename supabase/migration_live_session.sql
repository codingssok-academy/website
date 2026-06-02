-- Live Session migration
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '라이브 수업',
  code TEXT DEFAULT '',
  language TEXT DEFAULT 'c',
  output TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active sessions
CREATE POLICY "live_read" ON public.live_sessions
  FOR SELECT USING (true);

-- Only authenticated teacher can write their own sessions
CREATE POLICY "live_teacher_write" ON public.live_sessions
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_live_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER live_sessions_updated_at
  BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_live_session_timestamp();

-- Enable Realtime for live_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
