-- ============================================================
-- v12: students <-> auth.users bridge
-- Add this in Supabase SQL Editor before relying on per-student
-- homework and auth-backed direct messaging.
-- ============================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_auth_user_id
  ON public.students(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_created_at
  ON public.students(created_at DESC);
