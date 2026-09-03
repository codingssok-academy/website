-- CodingSSok fresh database foundation: identity and student access.
-- Target: a new, empty Supabase project only.
-- This file intentionally contains no real names, emails, UUIDs, PINs, or seed data.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null check (char_length(btrim(name)) between 1 and 60),
    display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
    email text,
    birth_date date,
    role text not null default 'student'
        check (role in ('student', 'parent', 'teacher', 'admin')),
    approval_status text not null default 'pending'
        check (approval_status in ('pending', 'approved', 'rejected', 'deactivated')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index profiles_email_unique_idx
    on public.profiles (lower(email))
    where email is not null;

create table public.students (
    id uuid primary key default extensions.gen_random_uuid(),
    profile_id uuid unique references public.profiles(id) on delete set null,
    auth_user_id uuid unique references auth.users(id) on delete set null,
    name text not null check (char_length(btrim(name)) between 1 and 60),
    birthday date,
    school text check (school is null or char_length(school) <= 80),
    grade text check (grade is null or char_length(grade) <= 20),
    class text check (class is null or char_length(class) <= 60),
    avatar text check (avatar is null or char_length(avatar) <= 500),
    status text not null default 'pending'
        check (status in ('pending', 'active', 'deactivated')),
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint students_profile_auth_match
        check (profile_id is null or auth_user_id is null or profile_id = auth_user_id)
);

create index students_name_lookup_idx
    on public.students (lower(regexp_replace(name, '\s+', '', 'g')));

create index students_status_idx
    on public.students (status);

create table public.parent_student_links (
    id uuid primary key default extensions.gen_random_uuid(),
    parent_user_id uuid not null references auth.users(id) on delete cascade,
    student_id uuid not null references public.students(id) on delete cascade,
    relation text not null default 'guardian'
        check (relation in ('mother', 'father', 'guardian', 'other')),
    status text not null default 'active'
        check (status in ('pending', 'active', 'inactive')),
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (parent_user_id, student_id)
);

create index parent_student_links_student_idx
    on public.parent_student_links (student_id)
    where status = 'active';

create table public.teacher_student_assignments (
    id uuid primary key default extensions.gen_random_uuid(),
    teacher_id uuid not null references auth.users(id) on delete cascade,
    student_id uuid not null references public.students(id) on delete cascade,
    status text not null default 'active'
        check (status in ('active', 'inactive')),
    assigned_by uuid references auth.users(id) on delete set null,
    assigned_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (teacher_id, student_id)
);

create index teacher_student_assignments_student_idx
    on public.teacher_student_assignments (student_id)
    where status = 'active';

create table private.student_access_credentials (
    student_id uuid not null references public.students(id) on delete cascade,
    purpose text not null
        check (purpose in ('student_login', 'parent_access')),
    secret_hash text not null,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (student_id, purpose)
);

revoke all on private.student_access_credentials from public, anon, authenticated;
grant all on private.student_access_credentials to service_role;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function private.touch_updated_at();

create trigger students_touch_updated_at
before update on public.students
for each row execute function private.touch_updated_at();

create trigger parent_student_links_touch_updated_at
before update on public.parent_student_links
for each row execute function private.touch_updated_at();

create trigger teacher_student_assignments_touch_updated_at
before update on public.teacher_student_assignments
for each row execute function private.touch_updated_at();

create trigger student_access_credentials_touch_updated_at
before update on private.student_access_credentials
for each row execute function private.touch_updated_at();

create or replace function public.codingssok_current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce(
        (
            select p.role
            from public.profiles p
            where p.id = auth.uid()
              and p.approval_status = 'approved'
            limit 1
        ),
        'anonymous'
    )
$$;

create or replace function public.codingssok_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select public.codingssok_current_role() = 'admin'
$$;

create or replace function public.codingssok_is_teacher_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select public.codingssok_current_role() in ('teacher', 'admin')
$$;

create or replace function public.codingssok_can_read_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select
        public.codingssok_is_admin()
        or exists (
            select 1
            from public.students s
            where s.id = p_student_id
              and s.auth_user_id = auth.uid()
              and s.status = 'active'
        )
        or exists (
            select 1
            from public.parent_student_links l
            where l.student_id = p_student_id
              and l.parent_user_id = auth.uid()
              and l.status = 'active'
        )
        or exists (
            select 1
            from public.teacher_student_assignments a
            where a.student_id = p_student_id
              and a.teacher_id = auth.uid()
              and a.status = 'active'
        )
$$;

create or replace function public.codingssok_can_manage_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select
        public.codingssok_is_admin()
        or exists (
            select 1
            from public.teacher_student_assignments a
            where a.student_id = p_student_id
              and a.teacher_id = auth.uid()
              and a.status = 'active'
        )
$$;

revoke all on function public.codingssok_current_role() from public, anon;
revoke all on function public.codingssok_is_admin() from public, anon;
revoke all on function public.codingssok_is_teacher_or_admin() from public, anon;
revoke all on function public.codingssok_can_read_student(uuid) from public, anon;
revoke all on function public.codingssok_can_manage_student(uuid) from public, anon;

grant execute on function public.codingssok_current_role() to authenticated;
grant execute on function public.codingssok_is_admin() to authenticated;
grant execute on function public.codingssok_is_teacher_or_admin() to authenticated;
grant execute on function public.codingssok_can_read_student(uuid) to authenticated;
grant execute on function public.codingssok_can_manage_student(uuid) to authenticated;

create or replace function public.codingssok_issue_student_access_code(
    p_student_id uuid,
    p_purpose text,
    p_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if auth.role() <> 'service_role' then
        raise exception 'service role required';
    end if;

    if p_purpose = 'student_login' and p_code !~ '^\d{4}$' then
        raise exception 'student login code must be four digits';
    elsif p_purpose = 'parent_access' and p_code !~ '^\d{5}$' then
        raise exception 'parent access code must be five digits';
    elsif p_purpose not in ('student_login', 'parent_access') then
        raise exception 'unsupported access-code purpose';
    end if;

    if not exists (
        select 1
        from public.students s
        where s.id = p_student_id
          and s.status <> 'deactivated'
    ) then
        raise exception 'active student not found';
    end if;

    insert into private.student_access_credentials (
        student_id,
        purpose,
        secret_hash,
        created_by
    ) values (
        p_student_id,
        p_purpose,
        extensions.crypt(p_code, extensions.gen_salt('bf', 10)),
        auth.uid()
    )
    on conflict (student_id, purpose) do update
    set secret_hash = excluded.secret_hash,
        created_by = auth.uid(),
        updated_at = now();
end;
$$;

create or replace function public.codingssok_verify_student_access_code(
    p_student_name text,
    p_purpose text,
    p_code text
)
returns table (
    student_id uuid,
    auth_user_id uuid,
    student_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    if auth.role() <> 'service_role' then
        raise exception 'service role required';
    end if;

    if p_student_name is null
       or char_length(btrim(p_student_name)) < 1
       or p_purpose not in ('student_login', 'parent_access')
       or p_code !~ '^\d{4,5}$' then
        return;
    end if;

    return query
    select s.id, s.auth_user_id, s.status
    from public.students s
    join private.student_access_credentials c
      on c.student_id = s.id
     and c.purpose = p_purpose
    where lower(regexp_replace(s.name, '\s+', '', 'g')) =
          lower(regexp_replace(p_student_name, '\s+', '', 'g'))
      and s.status = 'active'
      and c.secret_hash = extensions.crypt(p_code, c.secret_hash)
    order by s.created_at asc
    limit 5;
end;
$$;

revoke all on function public.codingssok_issue_student_access_code(uuid, text, text)
    from public, anon, authenticated;
revoke all on function public.codingssok_verify_student_access_code(text, text, text)
    from public, anon, authenticated;

grant execute on function public.codingssok_issue_student_access_code(uuid, text, text)
    to service_role;
grant execute on function public.codingssok_verify_student_access_code(text, text, text)
    to service_role;

create or replace function public.handle_fresh_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_name text;
    v_role text;
    v_status text;
begin
    v_name := left(
        coalesce(
            nullif(btrim(new.raw_user_meta_data->>'name'), ''),
            nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
            'student'
        ),
        60
    );

    v_role := case
        when new.raw_app_meta_data->>'role' in ('student', 'parent', 'teacher', 'admin')
            then new.raw_app_meta_data->>'role'
        else 'student'
    end;

    v_status := case
        when new.raw_app_meta_data->>'role' in ('student', 'parent', 'teacher', 'admin')
            then 'approved'
        else 'pending'
    end;

    insert into public.profiles (
        id,
        name,
        display_name,
        email,
        role,
        approval_status
    ) values (
        new.id,
        v_name,
        v_name,
        new.email,
        v_role,
        v_status
    )
    on conflict (id) do update
    set name = excluded.name,
        display_name = excluded.display_name,
        email = excluded.email,
        updated_at = now();

    return new;
end;
$$;

drop trigger if exists on_auth_user_created_fresh on auth.users;
create trigger on_auth_user_created_fresh
after insert on auth.users
for each row execute function public.handle_fresh_user_profile();

revoke all on function public.handle_fresh_user_profile() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.teacher_student_assignments enable row level security;
alter table private.student_access_credentials enable row level security;

revoke all on public.profiles from public, anon, authenticated;
revoke all on public.students from public, anon, authenticated;
revoke all on public.parent_student_links from public, anon, authenticated;
revoke all on public.teacher_student_assignments from public, anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.students to authenticated;
grant select on public.parent_student_links to authenticated;
grant select on public.teacher_student_assignments to authenticated;

grant all on public.profiles to service_role;
grant all on public.students to service_role;
grant all on public.parent_student_links to service_role;
grant all on public.teacher_student_assignments to service_role;

create policy profiles_read_scoped
on public.profiles
for select
to authenticated
using (
    id = auth.uid()
    or public.codingssok_is_admin()
    or exists (
        select 1
        from public.students s
        join public.parent_student_links l on l.student_id = s.id
        where s.auth_user_id = profiles.id
          and l.parent_user_id = auth.uid()
          and l.status = 'active'
    )
    or exists (
        select 1
        from public.students s
        join public.teacher_student_assignments a on a.student_id = s.id
        where s.auth_user_id = profiles.id
          and a.teacher_id = auth.uid()
          and a.status = 'active'
    )
);

create policy students_read_scoped
on public.students
for select
to authenticated
using (public.codingssok_can_read_student(id));

create policy parent_student_links_read_scoped
on public.parent_student_links
for select
to authenticated
using (
    parent_user_id = auth.uid()
    or public.codingssok_is_admin()
);

create policy teacher_student_assignments_read_scoped
on public.teacher_student_assignments
for select
to authenticated
using (
    teacher_id = auth.uid()
    or public.codingssok_is_admin()
);

comment on table public.profiles is 'Authenticated account role and approval state.';
comment on table public.students is 'Academy student roster. Access codes are stored separately as hashes.';
comment on table public.parent_student_links is 'Explicit parent-account to student relationship.';
comment on table public.teacher_student_assignments is 'Explicit teacher-account to student assignment.';
comment on table private.student_access_credentials is 'Server-only hashed student login and parent access codes.';

commit;
