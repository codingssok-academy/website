-- 학생 학습 기록 영구 저장 테이블
-- useActivityLog 훅에서 사용
-- 모든 학습 페이지 방문 + 체류 시간을 누적 기록 (presence와 분리)

create table if not exists public.student_activity_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    student_name text,
    course_id text,
    course_title text,
    unit_id text,
    unit_title text,
    page_id text,
    page_title text,
    page_url text,
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    duration_seconds int,
    created_at timestamptz not null default now()
);

create index if not exists student_activity_log_user_started_idx
    on public.student_activity_log(user_id, started_at desc);

create index if not exists student_activity_log_course_idx
    on public.student_activity_log(course_id, started_at desc);

-- RLS: 본인 기록만 INSERT/SELECT/UPDATE, 교사/관리자는 모두 조회
alter table public.student_activity_log enable row level security;

drop policy if exists "student_activity_log_self_insert" on public.student_activity_log;
create policy "student_activity_log_self_insert"
    on public.student_activity_log for insert
    with check (auth.uid() = user_id);

drop policy if exists "student_activity_log_self_update" on public.student_activity_log;
create policy "student_activity_log_self_update"
    on public.student_activity_log for update
    using (auth.uid() = user_id);

drop policy if exists "student_activity_log_self_select" on public.student_activity_log;
create policy "student_activity_log_self_select"
    on public.student_activity_log for select
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
              and profiles.role in ('teacher', 'admin')
        )
    );
