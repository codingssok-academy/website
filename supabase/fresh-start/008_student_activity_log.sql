-- Growth 2.0 fresh start: private student learning activity history.
-- Apply after 001 through 007 in this directory.
-- This file contains schema and access rules only. It never inserts student data.

begin;

create table public.student_activity_log (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    student_name text not null check (
        char_length(btrim(student_name)) between 1 and 60
    ),
    event_type text not null default 'page_view' check (
        event_type in ('page_view', 'login', 'signup', 'local-preview-login')
    ),
    course_id text check (
        course_id is null
        or char_length(btrim(course_id)) between 1 and 120
    ),
    course_title text check (
        course_title is null
        or char_length(btrim(course_title)) between 1 and 160
    ),
    unit_id text check (
        unit_id is null
        or char_length(btrim(unit_id)) between 1 and 160
    ),
    unit_title text check (
        unit_title is null
        or char_length(btrim(unit_title)) between 1 and 160
    ),
    page_id text check (
        page_id is null
        or char_length(btrim(page_id)) between 1 and 160
    ),
    page_title text check (
        page_title is null
        or char_length(btrim(page_title)) between 1 and 200
    ),
    page_url text check (
        page_url is null
        or (
            char_length(page_url) between 1 and 500
            and left(page_url, 1) = '/'
        )
    ),
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    duration_seconds integer check (
        duration_seconds is null
        or duration_seconds between 0 and 86400
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint student_activity_log_time_order
        check (ended_at is null or ended_at >= started_at)
);

create index student_activity_log_user_started_idx
    on public.student_activity_log (user_id, started_at desc);

create index student_activity_log_course_started_idx
    on public.student_activity_log (course_id, started_at desc)
    where course_id is not null;

create or replace function private.prepare_student_activity_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_student_name text;
begin
    select s.name
    into v_student_name
    from public.students s
    join public.profiles p on p.id = new.user_id
    where s.auth_user_id = new.user_id
      and s.status = 'active'
      and p.role = 'student'
      and p.approval_status = 'approved'
    limit 1;

    if v_student_name is null then
        raise exception using
            errcode = '42501',
            message = 'active student account is required';
    end if;

    -- Never trust a browser-supplied name or start time.
    new.student_name := v_student_name;
    new.event_type := coalesce(nullif(btrim(new.event_type), ''), 'page_view');
    new.course_id := nullif(btrim(new.course_id), '');
    new.course_title := nullif(btrim(new.course_title), '');
    new.unit_id := nullif(btrim(new.unit_id), '');
    new.unit_title := nullif(btrim(new.unit_title), '');
    new.page_id := nullif(btrim(new.page_id), '');
    new.page_title := nullif(btrim(new.page_title), '');
    new.page_url := nullif(btrim(new.page_url), '');
    new.started_at := now();
    new.ended_at := null;
    new.duration_seconds := null;

    return new;
end;
$$;

create or replace function private.finalize_student_activity_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_finished_at timestamptz;
begin
    -- The database supplies the finish time and derives a bounded duration.
    v_finished_at := greatest(old.started_at, now());
    new.ended_at := v_finished_at;
    new.duration_seconds := least(
        floor(extract(epoch from (v_finished_at - old.started_at)))::integer,
        86400
    );

    return new;
end;
$$;

create trigger student_activity_log_prepare
before insert on public.student_activity_log
for each row execute function private.prepare_student_activity_log();

create trigger student_activity_log_finalize
before update of ended_at, duration_seconds on public.student_activity_log
for each row execute function private.finalize_student_activity_log();

create trigger student_activity_log_touch_updated_at
before update on public.student_activity_log
for each row execute function private.touch_updated_at();

revoke all on function private.prepare_student_activity_log()
    from public, anon, authenticated;
revoke all on function private.finalize_student_activity_log()
    from public, anon, authenticated;

alter table public.student_activity_log enable row level security;

revoke all on public.student_activity_log from public, anon, authenticated;

grant select (
    id,
    user_id,
    student_name,
    event_type,
    course_id,
    course_title,
    unit_id,
    unit_title,
    page_id,
    page_title,
    page_url,
    started_at,
    ended_at,
    duration_seconds,
    created_at,
    updated_at
) on public.student_activity_log to authenticated;

grant insert (
    user_id,
    student_name,
    course_id,
    course_title,
    unit_id,
    unit_title,
    page_id,
    page_title,
    page_url,
    started_at
) on public.student_activity_log to authenticated;

grant update (
    ended_at,
    duration_seconds
) on public.student_activity_log to authenticated;

grant all on public.student_activity_log to service_role;

create policy student_activity_log_read_scoped
on public.student_activity_log
for select
to authenticated
using (public.codingssok_can_read_student_user(user_id));

create policy student_activity_log_insert_self
on public.student_activity_log
for insert
to authenticated
with check (public.codingssok_is_active_student_user(user_id));

create policy student_activity_log_update_self
on public.student_activity_log
for update
to authenticated
using (public.codingssok_is_active_student_user(user_id))
with check (public.codingssok_is_active_student_user(user_id));

comment on table public.student_activity_log is
    'Private student learning visits and database-derived durations. Readable only by the student and linked academy roles.';
comment on column public.student_activity_log.student_name is
    'Canonical active-student name supplied by the database, never trusted from the browser.';
comment on column public.student_activity_log.duration_seconds is
    'Elapsed learning-page time derived and bounded by the database when the visit ends.';

commit;
