-- migration_v7_presence.sql
-- 실시간 학생 접속/학습 현황 추적 테이블

CREATE TABLE IF NOT EXISTS public.student_presence (
    user_id        UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name   TEXT NOT NULL,
    course_id      TEXT,
    course_title   TEXT,
    unit_id        TEXT,
    unit_title     TEXT,
    page_id        TEXT,
    page_title     TEXT,
    page_url       TEXT,
    is_online      BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMPTZ DEFAULT now(),
    started_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presence_online ON public.student_presence (is_online, last_heartbeat DESC);

ALTER TABLE public.student_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read presence" ON public.student_presence FOR SELECT USING (true);
CREATE POLICY "Anyone can insert presence" ON public.student_presence FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update presence" ON public.student_presence FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete presence" ON public.student_presence FOR DELETE USING (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_presence;
