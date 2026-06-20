create table if not exists public.student_files (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    owner_auth_user_id uuid references auth.users(id) on delete set null,
    uploaded_by uuid references auth.users(id) on delete set null,
    uploaded_by_role text not null default 'student' check (uploaded_by_role in ('student', 'teacher', 'admin')),
    original_name text not null,
    storage_path text not null unique,
    mime_type text,
    size_bytes bigint not null default 0 check (size_bytes >= 0),
    category text not null default 'result',
    note text,
    created_at timestamptz not null default now()
);

create index if not exists student_files_student_id_created_at_idx
    on public.student_files (student_id, created_at desc);

create index if not exists student_files_owner_auth_user_id_idx
    on public.student_files (owner_auth_user_id);

alter table public.student_files enable row level security;

drop policy if exists "student_files_select_own" on public.student_files;
create policy "student_files_select_own"
    on public.student_files
    for select
    to authenticated
    using (owner_auth_user_id = auth.uid());

drop policy if exists "student_files_teacher_select" on public.student_files;
create policy "student_files_teacher_select"
    on public.student_files
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('teacher', 'admin')
        )
        or exists (
            select 1
            from public.students s
            where s.auth_user_id = auth.uid()
              and s.status <> 'deactivated'
              and (s.class = 'admin' or replace(s.name, ' ', '') in ('구자현', '장민'))
        )
    );

insert into storage.buckets (id, name, public, file_size_limit)
values ('student-files', 'student-files', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;
