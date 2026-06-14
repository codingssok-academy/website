create table if not exists public.student_growth_management (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  student_name text not null,
  current_class text,
  temperament text,
  skill_level text,
  strengths text,
  weaknesses text,
  current_goal text,
  next_class_potential text,
  class_progress text,
  parent_feedback_draft text,
  teacher_memo text,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

create index if not exists idx_student_growth_management_student
  on public.student_growth_management(student_id);

create index if not exists idx_student_growth_management_updated
  on public.student_growth_management(updated_at desc);

create or replace function public.set_student_growth_management_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_student_growth_management_updated_at on public.student_growth_management;
create trigger set_student_growth_management_updated_at
before update on public.student_growth_management
for each row execute function public.set_student_growth_management_updated_at();

alter table public.student_growth_management enable row level security;

grant select, insert, update, delete on public.student_growth_management to authenticated;

drop policy if exists "student_growth_management_teacher_read" on public.student_growth_management;
create policy "student_growth_management_teacher_read"
on public.student_growth_management for select
using (public.is_teacher_or_admin());

drop policy if exists "student_growth_management_teacher_write" on public.student_growth_management;
create policy "student_growth_management_teacher_write"
on public.student_growth_management for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());
