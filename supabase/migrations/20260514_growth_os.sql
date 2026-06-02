-- Growth OS core tables
-- Run this in Supabase before enabling the live admin assignment workflow.

create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  birthday date,
  grade text,
  class text,
  school text,
  avatar text,
  pin text,
  phone text,
  parent_name text,
  parent_phone text,
  status text not null default 'approved',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students add column if not exists profile_id uuid references public.profiles(id) on delete set null;
alter table public.students add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.students add column if not exists birthday date;
alter table public.students alter column birthday drop not null;
alter table public.students add column if not exists grade text;
alter table public.students add column if not exists class text;
alter table public.students add column if not exists school text;
alter table public.students add column if not exists avatar text;
alter table public.students add column if not exists pin text;
alter table public.students add column if not exists phone text;
alter table public.students add column if not exists parent_name text;
alter table public.students add column if not exists parent_phone text;
alter table public.students add column if not exists status text not null default 'approved';
alter table public.students alter column status set default 'approved';
alter table public.students add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.students add column if not exists created_at timestamptz not null default now();
alter table public.students add column if not exists updated_at timestamptz not null default now();

create table if not exists public.student_diagnostic_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  total_score integer not null default 0,
  max_score integer not null default 0,
  percent integer not null default 0,
  recommended_track text not null default 'common',
  start_stage text,
  area_scores jsonb not null default '{}'::jsonb,
  track_counts jsonb not null default '{}'::jsonb,
  answered_count integer not null default 0,
  raw_answers jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  goal text,
  mission text,
  code text,
  execution_result text,
  error_fix_count integer not null default 0,
  feedback text,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  lesson_record_id uuid references public.lesson_records(id) on delete set null,
  title text not null,
  includes text,
  representative text,
  artifacts jsonb not null default '{}'::jsonb,
  is_featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.parent_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  summary text not null,
  strength text,
  improvement text,
  next_goal text,
  status text not null default 'draft',
  shared_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.next_lesson_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  topic text not null,
  next_step text,
  method text,
  track text,
  reason text,
  status text not null default 'planned',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.track_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  assigned_track text not null,
  recommended_track text,
  confidence integer not null default 0,
  status text not null default 'assigned',
  reason text,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

create table if not exists public.student_login_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  student_name text not null,
  event_type text not null default 'login',
  status text not null default 'success',
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_diagnostic_results_student_created
  on public.student_diagnostic_results(student_id, created_at desc);
create index if not exists idx_students_created
  on public.students(created_at desc);
create index if not exists idx_students_profile
  on public.students(profile_id);
create index if not exists idx_students_auth_user
  on public.students(auth_user_id);
create index if not exists idx_students_name_pin
  on public.students(name, pin);
create index if not exists idx_lesson_records_student_created
  on public.lesson_records(student_id, created_at desc);
create index if not exists idx_portfolio_records_student_created
  on public.portfolio_records(student_id, created_at desc);
create index if not exists idx_parent_reports_student_created
  on public.parent_reports(student_id, created_at desc);
create index if not exists idx_next_lesson_plans_student_created
  on public.next_lesson_plans(student_id, created_at desc);
create index if not exists idx_track_assignments_track
  on public.track_assignments(assigned_track, updated_at desc);
create index if not exists idx_student_login_events_student_created
  on public.student_login_events(student_id, created_at desc);
create index if not exists idx_student_login_events_auth_created
  on public.student_login_events(auth_user_id, created_at desc);
create index if not exists idx_student_login_events_type_created
  on public.student_login_events(event_type, created_at desc);

create or replace function public.set_growth_os_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_lesson_records_updated_at on public.lesson_records;
create trigger set_lesson_records_updated_at
before update on public.lesson_records
for each row execute function public.set_growth_os_updated_at();

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row execute function public.set_growth_os_updated_at();

drop trigger if exists set_parent_reports_updated_at on public.parent_reports;
create trigger set_parent_reports_updated_at
before update on public.parent_reports
for each row execute function public.set_growth_os_updated_at();

drop trigger if exists set_next_lesson_plans_updated_at on public.next_lesson_plans;
create trigger set_next_lesson_plans_updated_at
before update on public.next_lesson_plans
for each row execute function public.set_growth_os_updated_at();

drop trigger if exists set_track_assignments_updated_at on public.track_assignments;
create trigger set_track_assignments_updated_at
before update on public.track_assignments
for each row execute function public.set_growth_os_updated_at();

alter table public.students enable row level security;
alter table public.student_diagnostic_results enable row level security;
alter table public.lesson_records enable row level security;
alter table public.portfolio_records enable row level security;
alter table public.parent_reports enable row level security;
alter table public.next_lesson_plans enable row level security;
alter table public.track_assignments enable row level security;
alter table public.student_login_events enable row level security;

grant select, insert, update, delete on public.student_diagnostic_results to authenticated;
grant select, insert, update, delete on public.lesson_records to authenticated;
grant select, insert, update, delete on public.portfolio_records to authenticated;
grant select, insert, update, delete on public.parent_reports to authenticated;
grant select, insert, update, delete on public.next_lesson_plans to authenticated;
grant select, insert, update, delete on public.track_assignments to authenticated;
grant select, insert on public.student_login_events to authenticated;

create or replace function public.is_teacher_or_admin()
returns boolean as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('teacher', 'admin')
  );
$$ language sql stable security invoker;

drop policy if exists "growth_os_teacher_read_students" on public.students;
create policy "growth_os_teacher_read_students"
on public.students for select
using (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_write_students" on public.students;
create policy "growth_os_teacher_write_students"
on public.students for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_read_diagnostic" on public.student_diagnostic_results;
create policy "growth_os_teacher_read_diagnostic"
on public.student_diagnostic_results for select
using (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_write_diagnostic" on public.student_diagnostic_results;
create policy "growth_os_teacher_write_diagnostic"
on public.student_diagnostic_results for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_read_lessons" on public.lesson_records;
create policy "growth_os_teacher_read_lessons"
on public.lesson_records for select
using (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_write_lessons" on public.lesson_records;
create policy "growth_os_teacher_write_lessons"
on public.lesson_records for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_read_portfolio" on public.portfolio_records;
create policy "growth_os_teacher_read_portfolio"
on public.portfolio_records for select
using (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_write_portfolio" on public.portfolio_records;
create policy "growth_os_teacher_write_portfolio"
on public.portfolio_records for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_read_reports" on public.parent_reports;
create policy "growth_os_teacher_read_reports"
on public.parent_reports for select
using (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_write_reports" on public.parent_reports;
create policy "growth_os_teacher_write_reports"
on public.parent_reports for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_read_plans" on public.next_lesson_plans;
create policy "growth_os_teacher_read_plans"
on public.next_lesson_plans for select
using (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_write_plans" on public.next_lesson_plans;
create policy "growth_os_teacher_write_plans"
on public.next_lesson_plans for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_read_assignments" on public.track_assignments;
create policy "growth_os_teacher_read_assignments"
on public.track_assignments for select
using (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_write_assignments" on public.track_assignments;
create policy "growth_os_teacher_write_assignments"
on public.track_assignments for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_read_login_events" on public.student_login_events;
create policy "growth_os_teacher_read_login_events"
on public.student_login_events for select
using (public.is_teacher_or_admin());

drop policy if exists "growth_os_teacher_write_login_events" on public.student_login_events;
create policy "growth_os_teacher_write_login_events"
on public.student_login_events for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "growth_os_student_read_diagnostic" on public.student_diagnostic_results;
create policy "growth_os_student_read_diagnostic"
on public.student_diagnostic_results for select
using (
  exists (
    select 1 from public.students
    where students.id = student_diagnostic_results.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_write_diagnostic" on public.student_diagnostic_results;
create policy "growth_os_student_write_diagnostic"
on public.student_diagnostic_results for insert
with check (
  exists (
    select 1 from public.students
    where students.id = student_diagnostic_results.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_read_lessons" on public.lesson_records;
create policy "growth_os_student_read_lessons"
on public.lesson_records for select
using (
  exists (
    select 1 from public.students
    where students.id = lesson_records.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_write_lessons" on public.lesson_records;
create policy "growth_os_student_write_lessons"
on public.lesson_records for insert
with check (
  exists (
    select 1 from public.students
    where students.id = lesson_records.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_read_portfolio" on public.portfolio_records;
create policy "growth_os_student_read_portfolio"
on public.portfolio_records for select
using (
  exists (
    select 1 from public.students
    where students.id = portfolio_records.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_write_portfolio" on public.portfolio_records;
create policy "growth_os_student_write_portfolio"
on public.portfolio_records for insert
with check (
  exists (
    select 1 from public.students
    where students.id = portfolio_records.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_read_reports" on public.parent_reports;
create policy "growth_os_student_read_reports"
on public.parent_reports for select
using (
  exists (
    select 1 from public.students
    where students.id = parent_reports.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_read_plans" on public.next_lesson_plans;
create policy "growth_os_student_read_plans"
on public.next_lesson_plans for select
using (
  exists (
    select 1 from public.students
    where students.id = next_lesson_plans.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_write_plans" on public.next_lesson_plans;
create policy "growth_os_student_write_plans"
on public.next_lesson_plans for insert
with check (
  exists (
    select 1 from public.students
    where students.id = next_lesson_plans.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_read_assignments" on public.track_assignments;
create policy "growth_os_student_read_assignments"
on public.track_assignments for select
using (
  exists (
    select 1 from public.students
    where students.id = track_assignments.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_read_login_events" on public.student_login_events;
create policy "growth_os_student_read_login_events"
on public.student_login_events for select
using (
  auth_user_id = auth.uid()
  or exists (
    select 1 from public.students
    where students.id = student_login_events.student_id
      and students.auth_user_id = auth.uid()
  )
);

drop policy if exists "growth_os_student_write_login_events" on public.student_login_events;
create policy "growth_os_student_write_login_events"
on public.student_login_events for insert
with check (
  auth_user_id = auth.uid()
  or exists (
    select 1 from public.students
    where students.id = student_login_events.student_id
      and students.auth_user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
