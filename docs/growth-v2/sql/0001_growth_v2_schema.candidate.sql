-- Growth 2.0 independent test backend candidate schema
-- DOCUMENTATION ONLY: do not run against production or existing codingssok DB.
-- Target: a brand-new, separate Supabase project with Supabase Auth available.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;

-- Identity and relationships ---------------------------------------------------

create table public.growth_users (
  id uuid primary key references auth.users(id) on delete restrict,
  role text not null check (role in ('student', 'parent', 'teacher', 'admin')),
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict
);

create index growth_users_role_active_idx on public.growth_users(role, is_active);

create table public.growth_students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.growth_users(id) on delete restrict,
  is_active boolean not null default true,
  enrolled_at date not null default current_date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  check (archived_at is null or is_active = false)
);

create table public.growth_parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.growth_users(id) on delete restrict,
  student_id uuid not null references public.growth_students(id) on delete restrict,
  relationship_label text check (
    relationship_label is null or char_length(trim(relationship_label)) <= 40
  ),
  is_active boolean not null default true,
  valid_from date not null default current_date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  check (valid_until is null or valid_until >= valid_from)
);

create unique index growth_parent_student_links_active_idx
  on public.growth_parent_student_links(parent_user_id, student_id)
  where is_active;
create index growth_parent_student_links_student_idx
  on public.growth_parent_student_links(student_id, is_active);

create table public.growth_teacher_student_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references public.growth_users(id) on delete restrict,
  student_id uuid not null references public.growth_students(id) on delete restrict,
  is_active boolean not null default true,
  valid_from date not null default current_date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  check (valid_until is null or valid_until >= valid_from)
);

create unique index growth_teacher_student_assignments_active_idx
  on public.growth_teacher_student_assignments(teacher_user_id, student_id)
  where is_active;
create index growth_teacher_student_assignments_student_idx
  on public.growth_teacher_student_assignments(student_id, is_active);

-- Weekly evaluations -----------------------------------------------------------

create table public.growth_weekly_evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.growth_students(id) on delete restrict,
  teacher_user_id uuid not null references public.growth_users(id) on delete restrict,
  week_start date not null,
  week_end date not null,
  version integer not null default 1 check (version > 0),
  revision_of_id uuid references public.growth_weekly_evaluations(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  understanding text not null check (
    understanding in ('needs_help', 'understands_basics', 'solves_independently', 'applies_elsewhere')
  ),
  participation text not null check (
    participation in ('listened', 'asked_questions', 'tried_independently', 'explained_to_friend')
  ),
  homework_status text not null check (
    homework_status in ('not_submitted', 'partly_complete', 'complete', 'extra_challenge')
  ),
  strength text not null check (char_length(trim(strength)) between 10 and 200),
  improvement text not null check (char_length(trim(improvement)) between 10 and 200),
  next_goal text not null check (char_length(trim(next_goal)) between 10 and 200),
  parent_conversation_prompt text check (
    parent_conversation_prompt is null
    or char_length(trim(parent_conversation_prompt)) between 10 and 300
  ),
  attendance_attended integer check (attendance_attended >= 0),
  attendance_scheduled integer check (attendance_scheduled >= 0),
  assignment_completion_pct integer check (assignment_completion_pct between 0 and 100),
  weekly_goal_progress_pct integer check (weekly_goal_progress_pct between 0 and 100),
  project_progress_pct integer check (project_progress_pct between 0 and 100),
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (student_id, week_start, version),
  check (week_end = week_start + 6),
  check (
    attendance_attended is null
    or attendance_scheduled is null
    or attendance_attended <= attendance_scheduled
  ),
  check (
    (status = 'draft' and published_at is null and published_by is null and archived_at is null)
    or (status = 'published' and published_at is not null and published_by is not null and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create unique index growth_weekly_evaluations_one_draft_idx
  on public.growth_weekly_evaluations(student_id, week_start)
  where status = 'draft';
create unique index growth_weekly_evaluations_one_published_idx
  on public.growth_weekly_evaluations(student_id, week_start)
  where status = 'published';
create index growth_weekly_evaluations_teacher_idx
  on public.growth_weekly_evaluations(teacher_user_id, week_start desc);

create table public.growth_weekly_evaluation_concepts (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.growth_weekly_evaluations(id) on delete restrict,
  concept_key text not null check (char_length(trim(concept_key)) between 1 and 80),
  label text not null check (char_length(trim(label)) between 1 and 80),
  description text check (description is null or char_length(trim(description)) <= 300),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (evaluation_id, concept_key)
);

create index growth_weekly_evaluation_concepts_evaluation_idx
  on public.growth_weekly_evaluation_concepts(evaluation_id, sort_order);

-- Projects and project updates -------------------------------------------------

create table public.growth_projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.growth_students(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text check (description is null or char_length(trim(description)) <= 500),
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  check (archived_at is null or is_active = false)
);

create index growth_projects_student_idx on public.growth_projects(student_id, is_active);

create table public.growth_project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.growth_projects(id) on delete restrict,
  author_user_id uuid not null references public.growth_users(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  recent_work text not null check (char_length(trim(recent_work)) between 1 and 200),
  next_work text not null check (char_length(trim(next_work)) between 1 and 200),
  progress_pct integer not null check (progress_pct between 0 and 100),
  event_key text not null check (char_length(trim(event_key)) between 1 and 120),
  occurred_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (project_id, event_key),
  check (
    (status = 'draft' and published_at is null and archived_at is null)
    or (status = 'published' and published_at is not null and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create index growth_project_updates_latest_idx
  on public.growth_project_updates(project_id, occurred_at desc)
  where status = 'published';

-- TODO(0002): Decide whether evaluation and project publication must be atomic.

-- Missions, XP ledger, timeline events, and badges ----------------------------

create table public.growth_missions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(trim(code)) between 1 and 80),
  title text not null check (char_length(trim(title)) between 1 and 120),
  detail text not null check (char_length(trim(detail)) between 1 and 300),
  xp_reward integer not null check (xp_reward > 0),
  is_active boolean not null default true,
  available_from timestamptz,
  available_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  check (available_until is null or available_from is null or available_until >= available_from)
);

create table public.growth_student_missions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.growth_students(id) on delete restrict,
  mission_id uuid not null references public.growth_missions(id) on delete restrict,
  assignment_key text not null check (char_length(trim(assignment_key)) between 1 and 120),
  status text not null default 'assigned' check (status in ('assigned', 'completed', 'cancelled')),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  completion_idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (student_id, mission_id, assignment_key),
  check (
    (status = 'completed' and completed_at is not null and completion_idempotency_key is not null)
    or (status <> 'completed' and completed_at is null and completion_idempotency_key is null)
  )
);

create unique index growth_student_missions_completion_key_idx
  on public.growth_student_missions(student_id, completion_idempotency_key)
  where completion_idempotency_key is not null;
create index growth_student_missions_student_status_idx
  on public.growth_student_missions(student_id, status, assigned_at desc);

create table public.growth_xp_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.growth_students(id) on delete restrict,
  amount integer not null check (amount > 0),
  reason text not null check (char_length(trim(reason)) between 1 and 160),
  source_type text not null check (
    source_type in ('mission_completion', 'badge_award', 'admin_bonus')
  ),
  source_id uuid not null,
  idempotency_key text not null check (char_length(trim(idempotency_key)) between 1 and 160),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (student_id, idempotency_key),
  unique (student_id, source_type, source_id, reason)
);

create index growth_xp_transactions_student_time_idx
  on public.growth_xp_transactions(student_id, occurred_at desc);

create table public.growth_activity_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.growth_students(id) on delete restrict,
  event_type text not null check (event_type in ('mission', 'feedback', 'project', 'badge')),
  source_type text not null check (
    source_type in ('student_mission', 'weekly_evaluation', 'project_update', 'student_badge')
  ),
  source_id uuid not null,
  event_key text not null check (char_length(trim(event_key)) between 1 and 160),
  title text not null check (char_length(trim(title)) between 1 and 160),
  detail text check (detail is null or char_length(trim(detail)) <= 300),
  xp_transaction_id uuid references public.growth_xp_transactions(id) on delete restrict,
  is_visible_to_student boolean not null default true,
  is_visible_to_parent boolean not null default true,
  occurred_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (student_id, event_key)
);

create index growth_activity_events_student_time_idx
  on public.growth_activity_events(student_id, occurred_at desc)
  where archived_at is null;

create table public.growth_badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(trim(code)) between 1 and 80),
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text not null check (char_length(trim(description)) between 1 and 200),
  icon_key text not null check (char_length(trim(icon_key)) between 1 and 40),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict
);

create table public.growth_student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.growth_students(id) on delete restrict,
  badge_id uuid not null references public.growth_badges(id) on delete restrict,
  award_key text not null check (char_length(trim(award_key)) between 1 and 160),
  source_event_id uuid references public.growth_activity_events(id) on delete restrict,
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  unique (student_id, badge_id),
  unique (student_id, award_key)
);

create index growth_student_badges_student_time_idx
  on public.growth_student_badges(student_id, awarded_at desc);

-- Audit and immutable-publication helpers -------------------------------------

create or replace function private.growth_set_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, pg_catalog.now());
    new.created_by := coalesce(actor_id, new.created_by);
  end if;

  new.updated_at := pg_catalog.now();
  new.updated_by := coalesce(actor_id, new.updated_by);
  return new;
end;
$$;

revoke all on function private.growth_set_audit_fields() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'growth_users', 'growth_students', 'growth_parent_student_links',
    'growth_teacher_student_assignments', 'growth_weekly_evaluations',
    'growth_weekly_evaluation_concepts', 'growth_projects',
    'growth_project_updates', 'growth_missions', 'growth_student_missions',
    'growth_xp_transactions', 'growth_activity_events', 'growth_badges',
    'growth_student_badges'
  ] loop
    execute pg_catalog.format(
      'create trigger %I before insert or update on public.%I for each row execute function private.growth_set_audit_fields()',
      table_name || '_audit_trigger',
      table_name
    );
  end loop;
end;
$$;

create or replace function private.growth_protect_published_evaluation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' and (
    new.student_id is distinct from old.student_id
    or new.teacher_user_id is distinct from old.teacher_user_id
    or new.week_start is distinct from old.week_start
    or new.week_end is distinct from old.week_end
    or new.version is distinct from old.version
    or new.revision_of_id is distinct from old.revision_of_id
    or new.understanding is distinct from old.understanding
    or new.participation is distinct from old.participation
    or new.homework_status is distinct from old.homework_status
    or new.strength is distinct from old.strength
    or new.improvement is distinct from old.improvement
    or new.next_goal is distinct from old.next_goal
    or new.parent_conversation_prompt is distinct from old.parent_conversation_prompt
    or new.attendance_attended is distinct from old.attendance_attended
    or new.attendance_scheduled is distinct from old.attendance_scheduled
    or new.assignment_completion_pct is distinct from old.assignment_completion_pct
    or new.weekly_goal_progress_pct is distinct from old.weekly_goal_progress_pct
    or new.project_progress_pct is distinct from old.project_progress_pct
  ) then
    raise exception using
      errcode = '23514',
      message = 'Published evaluations are immutable; create a new revision.';
  end if;

  return new;
end;
$$;

revoke all on function private.growth_protect_published_evaluation()
  from public, anon, authenticated;

create trigger growth_weekly_evaluations_protect_published_trigger
before update on public.growth_weekly_evaluations
for each row execute function private.growth_protect_published_evaluation();

-- RLS helper functions ---------------------------------------------------------
-- SECURITY DEFINER helpers stay in an unexposed schema and fix search_path.

create or replace function private.growth_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.growth_users u
    where u.id = auth.uid() and u.role = 'admin' and u.is_active
  );
$$;

create or replace function private.growth_is_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.growth_students s
    join public.growth_users u on u.id = s.user_id
    where s.id = p_student_id
      and s.user_id = auth.uid()
      and s.is_active and u.is_active and u.role = 'student'
  );
$$;

create or replace function private.growth_is_parent_of(p_student_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.growth_parent_student_links l
    join public.growth_users u on u.id = l.parent_user_id
    where l.parent_user_id = auth.uid()
      and l.student_id = p_student_id
      and l.is_active
      and l.valid_from <= current_date
      and (l.valid_until is null or l.valid_until >= current_date)
      and u.is_active and u.role = 'parent'
  );
$$;

create or replace function private.growth_is_teacher_of(p_student_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.growth_teacher_student_assignments a
    join public.growth_users u on u.id = a.teacher_user_id
    where a.teacher_user_id = auth.uid()
      and a.student_id = p_student_id
      and a.is_active
      and a.valid_from <= current_date
      and (a.valid_until is null or a.valid_until >= current_date)
      and u.is_active and u.role = 'teacher'
  );
$$;

create or replace function private.growth_can_view_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.growth_is_admin()
    or private.growth_is_student(p_student_id)
    or private.growth_is_parent_of(p_student_id)
    or private.growth_is_teacher_of(p_student_id);
$$;

create or replace function private.growth_can_view_user(p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_user_id = auth.uid()
    or private.growth_is_admin()
    or exists (
      select 1 from public.growth_students s
      where s.user_id = p_user_id and private.growth_can_view_student(s.id)
    );
$$;

create or replace function private.growth_can_read_evaluation(p_evaluation_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.growth_weekly_evaluations e
    where e.id = p_evaluation_id
      and (
        private.growth_is_admin()
        or private.growth_is_teacher_of(e.student_id)
        or (
          e.status = 'published'
          and (private.growth_is_student(e.student_id) or private.growth_is_parent_of(e.student_id))
        )
      )
  );
$$;

create or replace function private.growth_can_edit_draft(p_evaluation_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.growth_weekly_evaluations e
    where e.id = p_evaluation_id
      and e.status = 'draft'
      and (
        private.growth_is_admin()
        or (e.teacher_user_id = auth.uid() and private.growth_is_teacher_of(e.student_id))
      )
  );
$$;

create or replace function private.growth_can_edit_project(p_project_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.growth_projects p
    where p.id = p_project_id
      and (private.growth_is_admin() or private.growth_is_teacher_of(p.student_id))
  );
$$;

revoke all on function private.growth_is_admin() from public, anon;
revoke all on function private.growth_is_student(uuid) from public, anon;
revoke all on function private.growth_is_parent_of(uuid) from public, anon;
revoke all on function private.growth_is_teacher_of(uuid) from public, anon;
revoke all on function private.growth_can_view_student(uuid) from public, anon;
revoke all on function private.growth_can_view_user(uuid) from public, anon;
revoke all on function private.growth_can_read_evaluation(uuid) from public, anon;
revoke all on function private.growth_can_edit_draft(uuid) from public, anon;
revoke all on function private.growth_can_edit_project(uuid) from public, anon;

grant usage on schema private to authenticated, service_role;
grant execute on function private.growth_is_admin() to authenticated, service_role;
grant execute on function private.growth_is_student(uuid) to authenticated, service_role;
grant execute on function private.growth_is_parent_of(uuid) to authenticated, service_role;
grant execute on function private.growth_is_teacher_of(uuid) to authenticated, service_role;
grant execute on function private.growth_can_view_student(uuid) to authenticated, service_role;
grant execute on function private.growth_can_view_user(uuid) to authenticated, service_role;
grant execute on function private.growth_can_read_evaluation(uuid) to authenticated, service_role;
grant execute on function private.growth_can_edit_draft(uuid) to authenticated, service_role;
grant execute on function private.growth_can_edit_project(uuid) to authenticated, service_role;

-- Enable RLS on every Growth table --------------------------------------------

alter table public.growth_users enable row level security;
alter table public.growth_students enable row level security;
alter table public.growth_parent_student_links enable row level security;
alter table public.growth_teacher_student_assignments enable row level security;
alter table public.growth_weekly_evaluations enable row level security;
alter table public.growth_weekly_evaluation_concepts enable row level security;
alter table public.growth_projects enable row level security;
alter table public.growth_project_updates enable row level security;
alter table public.growth_missions enable row level security;
alter table public.growth_student_missions enable row level security;
alter table public.growth_xp_transactions enable row level security;
alter table public.growth_activity_events enable row level security;
alter table public.growth_badges enable row level security;
alter table public.growth_student_badges enable row level security;

-- RLS policies: identity and relationships ------------------------------------

create policy growth_users_select on public.growth_users
  for select to authenticated using (private.growth_can_view_user(id));
create policy growth_users_admin_insert on public.growth_users
  for insert to authenticated with check (private.growth_is_admin());
create policy growth_users_admin_update on public.growth_users
  for update to authenticated
  using (private.growth_is_admin()) with check (private.growth_is_admin());

create policy growth_students_select on public.growth_students
  for select to authenticated using (private.growth_can_view_student(id));
create policy growth_students_admin_insert on public.growth_students
  for insert to authenticated with check (private.growth_is_admin());
create policy growth_students_admin_update on public.growth_students
  for update to authenticated
  using (private.growth_is_admin()) with check (private.growth_is_admin());

create policy growth_parent_links_select on public.growth_parent_student_links
  for select to authenticated
  using (parent_user_id = auth.uid() or private.growth_is_admin());
create policy growth_parent_links_admin_insert on public.growth_parent_student_links
  for insert to authenticated with check (private.growth_is_admin());
create policy growth_parent_links_admin_update on public.growth_parent_student_links
  for update to authenticated
  using (private.growth_is_admin()) with check (private.growth_is_admin());

create policy growth_teacher_assignments_select on public.growth_teacher_student_assignments
  for select to authenticated
  using (teacher_user_id = auth.uid() or private.growth_is_admin());
create policy growth_teacher_assignments_admin_insert
  on public.growth_teacher_student_assignments
  for insert to authenticated with check (private.growth_is_admin());
create policy growth_teacher_assignments_admin_update
  on public.growth_teacher_student_assignments
  for update to authenticated
  using (private.growth_is_admin()) with check (private.growth_is_admin());

-- RLS policies: weekly evaluations --------------------------------------------

create policy growth_weekly_evaluations_select on public.growth_weekly_evaluations
  for select to authenticated using (private.growth_can_read_evaluation(id));

create policy growth_weekly_evaluations_insert on public.growth_weekly_evaluations
  for insert to authenticated
  with check (
    private.growth_is_admin()
    or (
      status = 'draft'
      and teacher_user_id = auth.uid()
      and private.growth_is_teacher_of(student_id)
    )
  );

create policy growth_weekly_evaluations_update on public.growth_weekly_evaluations
  for update to authenticated
  using (
    private.growth_is_admin()
    or (
      status = 'draft'
      and teacher_user_id = auth.uid()
      and private.growth_is_teacher_of(student_id)
    )
  )
  with check (
    private.growth_is_admin()
    or (
      status = 'draft'
      and teacher_user_id = auth.uid()
      and private.growth_is_teacher_of(student_id)
    )
  );

create policy growth_weekly_concepts_select
  on public.growth_weekly_evaluation_concepts
  for select to authenticated using (private.growth_can_read_evaluation(evaluation_id));
create policy growth_weekly_concepts_insert
  on public.growth_weekly_evaluation_concepts
  for insert to authenticated with check (private.growth_can_edit_draft(evaluation_id));
create policy growth_weekly_concepts_update
  on public.growth_weekly_evaluation_concepts
  for update to authenticated
  using (private.growth_can_edit_draft(evaluation_id))
  with check (private.growth_can_edit_draft(evaluation_id));
create policy growth_weekly_concepts_delete
  on public.growth_weekly_evaluation_concepts
  for delete to authenticated using (private.growth_can_edit_draft(evaluation_id));

-- RLS policies: projects -------------------------------------------------------

create policy growth_projects_select on public.growth_projects
  for select to authenticated using (private.growth_can_view_student(student_id));
create policy growth_projects_insert on public.growth_projects
  for insert to authenticated
  with check (private.growth_is_admin() or private.growth_is_teacher_of(student_id));
create policy growth_projects_update on public.growth_projects
  for update to authenticated
  using (private.growth_is_admin() or private.growth_is_teacher_of(student_id))
  with check (private.growth_is_admin() or private.growth_is_teacher_of(student_id));

create policy growth_project_updates_select on public.growth_project_updates
  for select to authenticated
  using (
    private.growth_is_admin()
    or exists (
      select 1 from public.growth_projects p
      where p.id = project_id
        and (
          private.growth_is_teacher_of(p.student_id)
          or (
            status = 'published'
            and (
              private.growth_is_student(p.student_id)
              or private.growth_is_parent_of(p.student_id)
            )
          )
        )
    )
  );

create policy growth_project_updates_insert on public.growth_project_updates
  for insert to authenticated
  with check (
    private.growth_can_edit_project(project_id)
    and author_user_id = auth.uid()
    and status = 'draft'
  );

create policy growth_project_updates_update on public.growth_project_updates
  for update to authenticated
  using (status = 'draft' and private.growth_can_edit_project(project_id))
  with check (status = 'draft' and private.growth_can_edit_project(project_id));

-- RLS policies: missions, XP, timeline, and badges ----------------------------

create policy growth_missions_select on public.growth_missions
  for select to authenticated using (is_active or private.growth_is_admin());
create policy growth_missions_admin_insert on public.growth_missions
  for insert to authenticated with check (private.growth_is_admin());
create policy growth_missions_admin_update on public.growth_missions
  for update to authenticated
  using (private.growth_is_admin()) with check (private.growth_is_admin());

create policy growth_student_missions_select on public.growth_student_missions
  for select to authenticated using (private.growth_can_view_student(student_id));
create policy growth_student_missions_admin_insert on public.growth_student_missions
  for insert to authenticated with check (private.growth_is_admin());
create policy growth_student_missions_admin_update on public.growth_student_missions
  for update to authenticated
  using (private.growth_is_admin()) with check (private.growth_is_admin());

create policy growth_xp_transactions_select on public.growth_xp_transactions
  for select to authenticated using (private.growth_can_view_student(student_id));

create policy growth_activity_events_select on public.growth_activity_events
  for select to authenticated
  using (
    private.growth_is_admin()
    or private.growth_is_teacher_of(student_id)
    or (private.growth_is_student(student_id) and is_visible_to_student and archived_at is null)
    or (private.growth_is_parent_of(student_id) and is_visible_to_parent and archived_at is null)
  );

create policy growth_badges_select on public.growth_badges
  for select to authenticated using (is_active or private.growth_is_admin());
create policy growth_badges_admin_insert on public.growth_badges
  for insert to authenticated with check (private.growth_is_admin());
create policy growth_badges_admin_update on public.growth_badges
  for update to authenticated
  using (private.growth_is_admin()) with check (private.growth_is_admin());

create policy growth_student_badges_select on public.growth_student_badges
  for select to authenticated using (private.growth_can_view_student(student_id));

-- Safe publication RPC candidate ----------------------------------------------

create or replace function public.growth_publish_weekly_evaluation(
  p_evaluation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target public.growth_weekly_evaluations%rowtype;
  actor_is_admin boolean;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select * into target
  from public.growth_weekly_evaluations
  where id = p_evaluation_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Evaluation not found.';
  end if;

  select private.growth_is_admin() into actor_is_admin;

  if target.status <> 'draft' then
    raise exception using errcode = '23514', message = 'Only a draft can be published.';
  end if;

  if not actor_is_admin and not (
    target.teacher_user_id = actor_id
    and private.growth_is_teacher_of(target.student_id)
  ) then
    raise exception using errcode = '42501', message = 'Not allowed to publish this evaluation.';
  end if;

  if target.attendance_attended is null
    or target.attendance_scheduled is null
    or target.assignment_completion_pct is null
    or target.weekly_goal_progress_pct is null
    or target.project_progress_pct is null then
    raise exception using
      errcode = '23502',
      message = 'Report snapshots are required before publication.';
  end if;

  update public.growth_weekly_evaluations
  set status = 'archived',
      archived_at = pg_catalog.now(),
      updated_by = actor_id
  where student_id = target.student_id
    and week_start = target.week_start
    and status = 'published';

  update public.growth_weekly_evaluations
  set status = 'published',
      published_at = pg_catalog.now(),
      published_by = actor_id,
      updated_by = actor_id
  where id = target.id;

  insert into public.growth_activity_events (
    student_id,
    event_type,
    source_type,
    source_id,
    event_key,
    title,
    is_visible_to_student,
    is_visible_to_parent,
    occurred_at,
    created_by,
    updated_by
  ) values (
    target.student_id,
    'feedback',
    'weekly_evaluation',
    target.id,
    'weekly_evaluation:' || target.id::text,
    '선생님 피드백이 공개되었어요',
    true,
    true,
    pg_catalog.now(),
    actor_id,
    actor_id
  ) on conflict (student_id, event_key) do nothing;

  return target.id;
end;
$$;

revoke all on function public.growth_publish_weekly_evaluation(uuid)
  from public, anon;
grant execute on function public.growth_publish_weekly_evaluation(uuid)
  to authenticated, service_role;

-- Least-privilege grants -------------------------------------------------------

revoke all on table
  public.growth_users,
  public.growth_students,
  public.growth_parent_student_links,
  public.growth_teacher_student_assignments,
  public.growth_weekly_evaluations,
  public.growth_weekly_evaluation_concepts,
  public.growth_projects,
  public.growth_project_updates,
  public.growth_missions,
  public.growth_student_missions,
  public.growth_xp_transactions,
  public.growth_activity_events,
  public.growth_badges,
  public.growth_student_badges
from public, anon;

grant select, insert, update on table
  public.growth_users,
  public.growth_students,
  public.growth_parent_student_links,
  public.growth_teacher_student_assignments,
  public.growth_weekly_evaluations,
  public.growth_projects,
  public.growth_project_updates,
  public.growth_missions,
  public.growth_student_missions,
  public.growth_badges
to authenticated;

grant select, insert, update, delete on table
  public.growth_weekly_evaluation_concepts
to authenticated;

grant select on table
  public.growth_xp_transactions,
  public.growth_activity_events,
  public.growth_student_badges
to authenticated;

grant all on table
  public.growth_users,
  public.growth_students,
  public.growth_parent_student_links,
  public.growth_teacher_student_assignments,
  public.growth_weekly_evaluations,
  public.growth_weekly_evaluation_concepts,
  public.growth_projects,
  public.growth_project_updates,
  public.growth_missions,
  public.growth_student_missions,
  public.growth_xp_transactions,
  public.growth_activity_events,
  public.growth_badges,
  public.growth_student_badges
to service_role;

-- TODO(0002): Add one transactional mission-completion RPC only after its exact
-- response and XP correction rules are approved. Until then, student clients
-- have no INSERT/UPDATE grants on XP or activity event tables.

commit;
