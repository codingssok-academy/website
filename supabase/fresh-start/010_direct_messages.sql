-- Growth 2.0 fresh start: private student-to-staff direct messages.
-- Apply after 001 through 009 in this directory.
-- This file creates schema and access rules only. It never inserts messages or user data.

begin;

create table public.direct_messages (
    id uuid primary key default extensions.gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete restrict,
    receiver_id uuid not null references auth.users(id) on delete restrict,
    sender_name text not null check (
        char_length(btrim(sender_name)) between 1 and 60
        and sender_name !~ '[[:cntrl:]]'
    ),
    sender_role text not null check (
        sender_role in ('student', 'teacher', 'admin')
    ),
    content text not null check (
        char_length(btrim(content)) between 1 and 2000
        and translate(content, E'\n\r\t', '') !~ '[[:cntrl:]]'
    ),
    is_read boolean not null default false,
    read_at timestamptz,
    created_at timestamptz not null default now(),
    constraint direct_messages_different_participants
        check (sender_id <> receiver_id),
    constraint direct_messages_read_timestamp
        check (
            (is_read = false and read_at is null)
            or (is_read = true and read_at is not null)
        )
);

create index direct_messages_student_created_idx
    on public.direct_messages (student_id, created_at desc);

create index direct_messages_sender_created_idx
    on public.direct_messages (sender_id, created_at desc);

create index direct_messages_receiver_unread_idx
    on public.direct_messages (receiver_id, created_at desc)
    where is_read = false;

create or replace function private.prepare_direct_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_actor_id uuid := auth.uid();
    v_actor_role text;
    v_actor_name text;
    v_receiver_role text;
    v_student_id uuid;
begin
    if v_actor_id is null then
        raise exception using
            errcode = '42501',
            message = 'an authenticated academy account is required';
    end if;

    select p.role, coalesce(nullif(btrim(p.display_name), ''), nullif(btrim(p.name), ''))
    into v_actor_role, v_actor_name
    from public.profiles p
    where p.id = v_actor_id
      and p.approval_status = 'approved'
      and p.role in ('student', 'teacher', 'admin')
    limit 1;

    if v_actor_role is null then
        raise exception using
            errcode = '42501',
            message = 'an approved student, teacher, or admin account is required';
    end if;

    if v_actor_role = 'student' then
        select s.id, s.name
        into v_student_id, v_actor_name
        from public.students s
        where s.auth_user_id = v_actor_id
          and s.status = 'active'
        limit 1;

        if v_student_id is null then
            raise exception using
                errcode = '42501',
                message = 'an active linked student is required';
        end if;

        select p.role
        into v_receiver_role
        from public.profiles p
        where p.id = new.receiver_id
          and p.approval_status = 'approved'
          and p.role in ('teacher', 'admin')
        limit 1;

        if v_receiver_role = 'teacher'
           and not exists (
               select 1
               from public.teacher_student_assignments a
               where a.teacher_id = new.receiver_id
                 and a.student_id = v_student_id
                 and a.status = 'active'
           ) then
            raise exception using
                errcode = '42501',
                message = 'the teacher is not assigned to this student';
        elsif v_receiver_role is null then
            raise exception using
                errcode = '42501',
                message = 'the recipient must be an approved assigned teacher or admin';
        end if;
    else
        select s.id
        into v_student_id
        from public.students s
        join public.profiles p on p.id = s.auth_user_id
        where s.auth_user_id = new.receiver_id
          and s.status = 'active'
          and p.role = 'student'
          and p.approval_status = 'approved'
        limit 1;

        if v_student_id is null then
            raise exception using
                errcode = '42501',
                message = 'the recipient must be an active linked student';
        end if;

        if v_actor_role = 'teacher'
           and not exists (
               select 1
               from public.teacher_student_assignments a
               where a.teacher_id = v_actor_id
                 and a.student_id = v_student_id
                 and a.status = 'active'
           ) then
            raise exception using
                errcode = '42501',
                message = 'the teacher is not assigned to this student';
        end if;
    end if;

    -- Never trust sender identity, display name, read state, or time from the browser.
    new.student_id := v_student_id;
    new.sender_id := v_actor_id;
    new.sender_name := coalesce(v_actor_name, case when v_actor_role = 'student' then '학생' else '선생님' end);
    new.sender_role := v_actor_role;
    new.content := btrim(new.content);
    new.is_read := false;
    new.read_at := null;
    new.created_at := now();

    return new;
end;
$$;

create trigger direct_messages_prepare
before insert on public.direct_messages
for each row execute function private.prepare_direct_message();

create or replace function private.prepare_direct_message_read()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.id is distinct from old.id
       or new.student_id is distinct from old.student_id
       or new.sender_id is distinct from old.sender_id
       or new.receiver_id is distinct from old.receiver_id
       or new.sender_name is distinct from old.sender_name
       or new.sender_role is distinct from old.sender_role
       or new.content is distinct from old.content
       or new.created_at is distinct from old.created_at then
        raise exception using
            errcode = '42501',
            message = 'message content and participants cannot be changed';
    end if;

    if old.is_read or not new.is_read then
        raise exception using
            errcode = '42501',
            message = 'only an unread message can be marked as read';
    end if;

    new.is_read := true;
    new.read_at := now();
    return new;
end;
$$;

create trigger direct_messages_prepare_read
before update on public.direct_messages
for each row execute function private.prepare_direct_message_read();

revoke all on function private.prepare_direct_message()
    from public, anon, authenticated;
revoke all on function private.prepare_direct_message_read()
    from public, anon, authenticated;

alter table public.direct_messages enable row level security;

revoke all on public.direct_messages from public, anon, authenticated;

grant select (
    id,
    student_id,
    sender_id,
    receiver_id,
    sender_name,
    sender_role,
    content,
    is_read,
    read_at,
    created_at
) on public.direct_messages to authenticated;

grant insert (
    sender_id,
    receiver_id,
    sender_name,
    content
) on public.direct_messages to authenticated;

grant update (is_read) on public.direct_messages to authenticated;

grant all on public.direct_messages to service_role;

create policy direct_messages_read_scoped
on public.direct_messages
for select
to authenticated
using (
    public.codingssok_is_admin()
    or (
        (sender_id = auth.uid() or receiver_id = auth.uid())
        and (
            exists (
                select 1
                from public.students s
                where s.id = direct_messages.student_id
                  and s.auth_user_id = auth.uid()
                  and s.status = 'active'
            )
            or (
                public.codingssok_current_role() = 'teacher'
                and public.codingssok_can_manage_student(direct_messages.student_id)
            )
        )
    )
);

create policy direct_messages_insert_scoped
on public.direct_messages
for insert
to authenticated
with check (
    sender_id = auth.uid()
    and public.codingssok_current_role() in ('student', 'teacher', 'admin')
);

create policy direct_messages_mark_received_read
on public.direct_messages
for update
to authenticated
using (
    receiver_id = auth.uid()
    and public.codingssok_current_role() in ('student', 'teacher', 'admin')
)
with check (
    receiver_id = auth.uid()
    and is_read = true
    and read_at is not null
);

do $$
begin
    if exists (
        select 1
        from pg_catalog.pg_publication
        where pubname = 'supabase_realtime'
    ) and not exists (
        select 1
        from pg_catalog.pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'direct_messages'
    ) then
        alter publication supabase_realtime add table public.direct_messages (
            id,
            student_id,
            sender_id,
            receiver_id,
            sender_name,
            sender_role,
            content,
            is_read,
            read_at,
            created_at
        );
    end if;
end;
$$;

comment on table public.direct_messages is
    'Private one-to-one messages between an active student and an approved assigned teacher or admin.';
comment on column public.direct_messages.student_id is
    'Academy student identity derived by the database from the authenticated sender or receiver.';
comment on column public.direct_messages.sender_name is
    'Trusted display-name snapshot derived from the academy roster or approved profile, never from browser input.';
comment on column public.direct_messages.content is
    'Private message body. It must never be included in application logs.';
comment on column public.direct_messages.read_at is
    'Set by the database only when the authenticated receiver marks an unread message as read.';

commit;
