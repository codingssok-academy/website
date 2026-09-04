-- Growth 2.0 fresh start: private student result files and metadata.
-- Apply after 001 through 008 in this directory.
-- This file creates an empty private bucket and contains no student files or data.

begin;

create table public.student_files (
    id uuid primary key default extensions.gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    owner_auth_user_id uuid references auth.users(id) on delete set null,
    uploaded_by uuid references auth.users(id) on delete set null,
    uploaded_by_role text not null check (
        uploaded_by_role in ('student', 'teacher', 'admin')
    ),
    original_name text not null check (
        char_length(btrim(original_name)) between 1 and 160
        and original_name !~ '[\\/]'
        and original_name !~ '[[:cntrl:]]'
    ),
    storage_path text not null unique check (
        char_length(storage_path) between 1 and 500
        and split_part(storage_path, '/', 1) = 'students'
        and split_part(storage_path, '/', 2) = student_id::text
        and split_part(storage_path, '/', 3) = uploaded_by_role
        and split_part(storage_path, '/', 4) <> ''
        and split_part(storage_path, '/', 5) = ''
        and position('..' in storage_path) = 0
    ),
    mime_type text check (
        mime_type is null
        or char_length(btrim(mime_type)) between 1 and 160
    ),
    size_bytes bigint not null check (
        size_bytes between 1 and 52428800
    ),
    category text not null default 'result' check (
        char_length(btrim(category)) between 1 and 24
    ),
    note text check (
        note is null or char_length(note) <= 240
    ),
    visibility text not null default 'student_parent' check (
        visibility in ('student_parent', 'staff_only')
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index student_files_student_created_idx
    on public.student_files (student_id, created_at desc);

create index student_files_owner_idx
    on public.student_files (owner_auth_user_id)
    where owner_auth_user_id is not null;

create or replace function private.prepare_student_file()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_student_auth_user_id uuid;
    v_uploader_role text;
begin
    select s.auth_user_id
    into v_student_auth_user_id
    from public.students s
    where s.id = new.student_id
      and s.status = 'active'
    limit 1;

    if v_student_auth_user_id is null then
        raise exception using
            errcode = '42501',
            message = 'an active linked student account is required';
    end if;

    select p.role
    into v_uploader_role
    from public.profiles p
    where p.id = new.uploaded_by
      and p.approval_status = 'approved'
    limit 1;

    if new.uploaded_by = v_student_auth_user_id
       and v_uploader_role = 'student' then
        v_uploader_role := 'student';
    elsif v_uploader_role = 'teacher'
          and exists (
              select 1
              from public.teacher_student_assignments a
              where a.teacher_id = new.uploaded_by
                and a.student_id = new.student_id
                and a.status = 'active'
          ) then
        v_uploader_role := 'teacher';
    elsif v_uploader_role = 'admin' then
        v_uploader_role := 'admin';
    else
        raise exception using
            errcode = '42501',
            message = 'the uploader cannot add a file for this student';
    end if;

    -- Identity and uploader role always come from the academy account links.
    new.owner_auth_user_id := v_student_auth_user_id;
    new.uploaded_by_role := v_uploader_role;
    new.original_name := btrim(new.original_name);
    new.storage_path := btrim(new.storage_path);
    new.mime_type := nullif(btrim(new.mime_type), '');
    new.category := coalesce(nullif(btrim(new.category), ''), 'result');
    new.note := nullif(btrim(new.note), '');

    return new;
end;
$$;

create trigger student_files_prepare
before insert on public.student_files
for each row execute function private.prepare_student_file();

create trigger student_files_touch_updated_at
before update on public.student_files
for each row execute function private.touch_updated_at();

revoke all on function private.prepare_student_file()
    from public, anon, authenticated;

create or replace function public.codingssok_can_read_student_file(
    p_file_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.student_files f
        where f.id = p_file_id
          and (
              public.codingssok_can_manage_student(f.student_id)
              or (
                  f.visibility = 'student_parent'
                  and exists (
                      select 1
                      from public.profiles p
                      where p.id = auth.uid()
                        and p.approval_status = 'approved'
                  )
                  and public.codingssok_can_read_student(f.student_id)
              )
          )
    )
$$;

create or replace function public.codingssok_can_read_student_file_object(
    p_storage_path text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.student_files f
        where f.storage_path = p_storage_path
          and public.codingssok_can_read_student_file(f.id)
    )
$$;

revoke all on function public.codingssok_can_read_student_file(uuid)
    from public, anon;
revoke all on function public.codingssok_can_read_student_file_object(text)
    from public, anon;

grant execute on function public.codingssok_can_read_student_file(uuid)
    to authenticated;
grant execute on function public.codingssok_can_read_student_file_object(text)
    to authenticated;

alter table public.student_files enable row level security;

revoke all on public.student_files from public, anon, authenticated;

grant select (
    id,
    student_id,
    uploaded_by_role,
    original_name,
    mime_type,
    size_bytes,
    category,
    note,
    visibility,
    created_at,
    updated_at
) on public.student_files to authenticated;

grant all on public.student_files to service_role;

create policy student_files_read_scoped
on public.student_files
for select
to authenticated
using (public.codingssok_can_read_student_file(id));

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
) values (
    'student-files',
    'student-files',
    false,
    52428800,
    array[
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif',
        'application/pdf',
        'text/plain',
        'text/markdown',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream',
        'text/x-python',
        'text/x-c',
        'text/x-c++src',
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json'
    ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy student_files_storage_read_scoped
on storage.objects
for select
to authenticated
using (
    bucket_id = 'student-files'
    and public.codingssok_can_read_student_file_object(name)
);

comment on table public.student_files is
    'Private student result-file metadata. Writes and deletion go through the authenticated academy server only.';
comment on column public.student_files.storage_path is
    'Internal private-bucket path. It is not granted to student, parent, or teacher clients.';
comment on column public.student_files.visibility is
    'student_parent is visible to the student and linked parent; staff_only is limited to assigned teachers and admins.';
comment on function public.codingssok_can_read_student_file(uuid) is
    'Checks student-file metadata access for an approved linked student, parent, assigned teacher, or admin.';

commit;
