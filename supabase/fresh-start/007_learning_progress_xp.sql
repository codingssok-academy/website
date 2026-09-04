-- Growth 2.0 fresh start: student learning progress, XP, and levels.
-- Apply after 001 through 006 in this directory.
-- This file contains schema and access rules only. It never inserts student data.

begin;

alter table public.profiles
    add column total_xp integer not null default 0
        check (total_xp >= 0),
    add column level integer not null default 1
        check (level >= 1),
    add column rank text not null default 'Iron'
        check (rank in ('Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'));

create table public.user_progress (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null unique references public.profiles(id) on delete cascade,
    xp integer not null default 0 check (xp >= 0),
    level integer not null default 1 check (level >= 1),
    streak integer not null default 0 check (streak >= 0),
    best_streak integer not null default 0 check (best_streak >= 0),
    last_active_date date,
    total_problems integer not null default 0 check (total_problems >= 0),
    accuracy numeric(5, 2) not null default 0
        check (accuracy between 0 and 100),
    avg_solve_time_minutes numeric(8, 1) not null default 0
        check (avg_solve_time_minutes >= 0),
    rank integer not null default 999 check (rank >= 1),
    tier text not null default 'Iron'
        check (tier in ('Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')),
    placement_done boolean not null default false,
    tier_points integer not null default 0 check (tier_points >= 0),
    total_code_runs integer not null default 0 check (total_code_runs >= 0),
    streak_data jsonb not null default '{}'::jsonb
        check (jsonb_typeof(streak_data) = 'object'),
    hints_count integer not null default 0 check (hints_count >= 0),
    xp_boost_data jsonb not null default '{}'::jsonb
        check (jsonb_typeof(xp_boost_data) = 'object'),
    profile_effects jsonb not null default '[]'::jsonb
        check (jsonb_typeof(profile_effects) = 'array'),
    gamification_synced_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.xp_history (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    action_type text not null check (
        action_type in (
            'lesson_view',
            'quiz_correct',
            'unit_complete',
            'code_run',
            'attendance',
            'challenge_complete'
        )
    ),
    item_id text not null check (
        char_length(btrim(item_id)) between 1 and 200
    ),
    xp_amount integer not null check (xp_amount between 1 and 200),
    created_at timestamptz not null default now(),
    unique (user_id, action_type, item_id)
);

create index xp_history_user_created_idx
    on public.xp_history (user_id, created_at desc);

create table public.user_course_progress (
    id uuid primary key default extensions.gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    course_id text not null check (
        char_length(btrim(course_id)) between 1 and 120
    ),
    progress integer not null default 0 check (progress between 0 and 100),
    completed_lessons jsonb not null default '[]'::jsonb
        check (jsonb_typeof(completed_lessons) = 'array'),
    is_completed boolean not null default false,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    last_accessed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, course_id)
);

create index user_course_progress_user_updated_idx
    on public.user_course_progress (user_id, updated_at desc);

create or replace function private.normalize_user_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.level := floor(sqrt(new.xp::numeric / 100))::integer + 1;
    new.best_streak := greatest(new.best_streak, new.streak);
    return new;
end;
$$;

create or replace function private.mirror_user_progress_to_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.profiles
    set total_xp = new.xp,
        level = new.level,
        rank = new.tier
    where id = new.user_id;

    return new;
end;
$$;

create or replace function private.ensure_student_user_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.role = 'student' then
        insert into public.user_progress (user_id)
        values (new.id)
        on conflict (user_id) do nothing;
    end if;

    return new;
end;
$$;

create or replace function private.normalize_course_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' and new.is_completed then
        new.progress := 100;
    elsif tg_op = 'UPDATE'
          and new.is_completed is distinct from old.is_completed
          and new.is_completed then
        new.progress := 100;
    else
        new.is_completed := new.progress = 100;
    end if;

    if new.is_completed then
        new.completed_at := coalesce(new.completed_at, now());
    else
        new.completed_at := null;
    end if;

    new.last_accessed_at := now();
    return new;
end;
$$;

create trigger user_progress_normalize
before insert or update of xp, streak, best_streak on public.user_progress
for each row execute function private.normalize_user_progress();

create trigger user_progress_touch_updated_at
before update on public.user_progress
for each row execute function private.touch_updated_at();

create trigger user_progress_mirror_profile
after insert or update of xp, level, tier on public.user_progress
for each row execute function private.mirror_user_progress_to_profile();

create trigger profiles_ensure_student_user_progress
after insert or update of role on public.profiles
for each row execute function private.ensure_student_user_progress();

create trigger user_course_progress_normalize
before insert or update of progress, is_completed on public.user_course_progress
for each row execute function private.normalize_course_progress();

create trigger user_course_progress_touch_updated_at
before update on public.user_course_progress
for each row execute function private.touch_updated_at();

revoke all on function private.normalize_user_progress()
    from public, anon, authenticated;
revoke all on function private.mirror_user_progress_to_profile()
    from public, anon, authenticated;
revoke all on function private.ensure_student_user_progress()
    from public, anon, authenticated;
revoke all on function private.normalize_course_progress()
    from public, anon, authenticated;

create or replace function public.codingssok_can_read_student_user(
    p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.students s
        where s.auth_user_id = p_user_id
          and public.codingssok_can_read_student(s.id)
    )
$$;

create or replace function public.codingssok_is_active_student_user(
    p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select
        p_user_id = auth.uid()
        and exists (
            select 1
            from public.profiles p
            join public.students s on s.auth_user_id = p.id
            where p.id = p_user_id
              and p.role = 'student'
              and p.approval_status = 'approved'
              and s.status = 'active'
        )
$$;

revoke all on function public.codingssok_can_read_student_user(uuid)
    from public, anon;
revoke all on function public.codingssok_is_active_student_user(uuid)
    from public, anon;

grant execute on function public.codingssok_can_read_student_user(uuid)
    to authenticated;
grant execute on function public.codingssok_is_active_student_user(uuid)
    to authenticated;

alter table public.user_progress enable row level security;
alter table public.xp_history enable row level security;
alter table public.user_course_progress enable row level security;

revoke all on public.user_progress from public, anon, authenticated;
revoke all on public.xp_history from public, anon, authenticated;
revoke all on public.user_course_progress from public, anon, authenticated;

grant select on public.user_progress to authenticated;

grant select (
    id,
    user_id,
    action_type,
    item_id,
    xp_amount,
    created_at
) on public.xp_history to authenticated;

grant select (
    id,
    user_id,
    course_id,
    progress,
    completed_lessons,
    is_completed,
    started_at,
    completed_at,
    last_accessed_at,
    created_at,
    updated_at
) on public.user_course_progress to authenticated;

grant insert (
    user_id,
    course_id,
    progress,
    completed_lessons,
    is_completed,
    last_accessed_at
) on public.user_course_progress to authenticated;

grant update (
    progress,
    completed_lessons,
    is_completed,
    last_accessed_at
) on public.user_course_progress to authenticated;

grant all on public.user_progress to service_role;
grant all on public.xp_history to service_role;
grant all on public.user_course_progress to service_role;

create policy user_progress_read_scoped
on public.user_progress
for select
to authenticated
using (public.codingssok_can_read_student_user(user_id));

create policy xp_history_read_scoped
on public.xp_history
for select
to authenticated
using (public.codingssok_can_read_student_user(user_id));

create policy user_course_progress_read_scoped
on public.user_course_progress
for select
to authenticated
using (public.codingssok_can_read_student_user(user_id));

create policy user_course_progress_insert_self
on public.user_course_progress
for insert
to authenticated
with check (public.codingssok_is_active_student_user(user_id));

create policy user_course_progress_update_self
on public.user_course_progress
for update
to authenticated
using (public.codingssok_is_active_student_user(user_id))
with check (public.codingssok_is_active_student_user(user_id));

create or replace function public.growth_api_award_xp(
    p_action_type text,
    p_item_id text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
    v_user_id uuid;
    v_amount integer;
    v_history_id uuid;
    v_old_xp integer;
    v_old_level integer;
    v_new_xp integer;
    v_new_level integer;
    v_code_runs integer;
begin
    v_user_id := auth.uid();

    if auth.role() <> 'authenticated'
       or v_user_id is null
       or not public.codingssok_is_active_student_user(v_user_id) then
        raise exception using
            errcode = '42501',
            message = 'active student login is required';
    end if;

    if p_item_id is null
       or char_length(btrim(p_item_id)) not between 1 and 200 then
        raise exception using
            errcode = '22023',
            message = 'XP item id is invalid';
    end if;

    v_amount := case p_action_type
        when 'lesson_view' then 10
        when 'quiz_correct' then 20
        when 'unit_complete' then 30
        when 'code_run' then 5
        when 'attendance' then 15
        when 'challenge_complete' then case split_part(p_item_id, ':', 1)
            when 'Easy' then 50
            when 'Medium' then 100
            when 'Hard' then 200
            else null
        end
        else null
    end;

    if v_amount is null then
        raise exception using
            errcode = '22023',
            message = 'XP action type is invalid';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_user_id::text, 0)
    );

    select p.xp, p.level
    into v_old_xp, v_old_level
    from public.user_progress p
    where p.user_id = v_user_id;

    v_old_xp := coalesce(v_old_xp, 0);
    v_old_level := coalesce(v_old_level, 1);

    if p_action_type = 'code_run' then
        select count(*) into v_code_runs
        from public.xp_history h
        where h.user_id = v_user_id
          and h.action_type = 'code_run'
          and (h.created_at at time zone 'Asia/Seoul')::date =
              (now() at time zone 'Asia/Seoul')::date;

        if v_code_runs >= 20 then
            return jsonb_build_object(
                'xp', v_old_xp,
                'level', v_old_level,
                'levelUp', false,
                'delta', 0,
                'duplicate', true,
                'reason', 'daily_cap'
            );
        end if;
    end if;

    insert into public.xp_history (
        user_id,
        action_type,
        item_id,
        xp_amount
    ) values (
        v_user_id,
        p_action_type,
        btrim(p_item_id),
        v_amount
    )
    on conflict (user_id, action_type, item_id) do nothing
    returning id into v_history_id;

    if v_history_id is null then
        return jsonb_build_object(
            'xp', v_old_xp,
            'level', v_old_level,
            'levelUp', false,
            'delta', 0,
            'duplicate', true
        );
    end if;

    insert into public.user_progress (
        user_id,
        xp,
        last_active_date
    ) values (
        v_user_id,
        v_amount,
        (now() at time zone 'Asia/Seoul')::date
    )
    on conflict (user_id) do update
    set xp = public.user_progress.xp + excluded.xp,
        last_active_date = excluded.last_active_date
    returning xp, level into v_new_xp, v_new_level;

    return jsonb_build_object(
        'xp', v_new_xp,
        'level', v_new_level,
        'levelUp', v_new_level > v_old_level,
        'delta', v_amount,
        'duplicate', false
    );
end;
$$;

revoke all on function public.growth_api_award_xp(text, text)
    from public, anon;
grant execute on function public.growth_api_award_xp(text, text)
    to authenticated;

comment on table public.user_progress is
    'Canonical student XP, level, streak, and gamification summary. XP starts at zero and level starts at one.';
comment on table public.xp_history is
    'Append-only XP awards. Students cannot insert arbitrary amounts directly.';
comment on table public.user_course_progress is
    'Per-course completion state written only by the active student and readable by linked academy roles.';
comment on function public.growth_api_award_xp(text, text) is
    'Awards a fixed, deduplicated XP amount to the signed-in active student and updates the level atomically.';

commit;
