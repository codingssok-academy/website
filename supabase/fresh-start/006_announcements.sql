-- Growth 2.0 fresh start: academy-wide announcements.
-- Apply after 001 through 005 in this directory.
-- This file contains schema and access rules only. It never inserts user data.

begin;

create table public.announcements (
    id uuid primary key default extensions.gen_random_uuid(),
    title text not null check (
        char_length(btrim(title)) between 1 and 80
    ),
    content text not null check (
        char_length(btrim(content)) between 1 and 2000
    ),
    author_id uuid not null references auth.users(id) on delete restrict,
    is_pinned boolean not null default false,
    status text not null default 'published'
        check (status in ('draft', 'published', 'archived')),
    published_at timestamptz,
    archived_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint announcements_status_timestamps
        check (
            (status = 'draft' and published_at is null and archived_at is null)
            or (status = 'published' and published_at is not null and archived_at is null)
            or (status = 'archived' and archived_at is not null)
        )
);

create index announcements_published_order_idx
    on public.announcements (is_pinned desc, created_at desc)
    where status = 'published';

create or replace function private.set_announcement_status_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.status = 'draft' then
        new.published_at = null;
        new.archived_at = null;
    elsif new.status = 'published' then
        if tg_op = 'INSERT' or old.status <> 'published' then
            new.published_at = now();
        end if;
        new.archived_at = null;
    elsif new.status = 'archived' then
        if tg_op = 'INSERT' or old.status <> 'archived' then
            new.archived_at = now();
        end if;
    end if;

    return new;
end;
$$;

create trigger announcements_set_status_timestamps
before insert or update of status on public.announcements
for each row execute function private.set_announcement_status_timestamps();

create trigger announcements_touch_updated_at
before update on public.announcements
for each row execute function private.touch_updated_at();

alter table public.announcements enable row level security;

revoke all on public.announcements from public, anon, authenticated;

grant select (
    id,
    title,
    content,
    is_pinned,
    status,
    published_at,
    created_at,
    updated_at
) on public.announcements to authenticated;

grant insert (
    title,
    content,
    author_id,
    is_pinned,
    status
) on public.announcements to authenticated;

grant update (
    title,
    content,
    is_pinned,
    status
) on public.announcements to authenticated;

grant all on public.announcements to service_role;

create policy announcements_read_published_or_admin
on public.announcements
for select
to authenticated
using (
    public.codingssok_is_admin()
    or (
        status = 'published'
        and public.codingssok_current_role() in ('student', 'parent', 'teacher')
    )
);

create policy announcements_insert_admin
on public.announcements
for insert
to authenticated
with check (
    public.codingssok_is_admin()
    and author_id = auth.uid()
);

create policy announcements_update_admin
on public.announcements
for update
to authenticated
using (public.codingssok_is_admin())
with check (public.codingssok_is_admin());

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
          and tablename = 'announcements'
    ) then
        alter publication supabase_realtime add table public.announcements (
            id,
            title,
            content,
            is_pinned,
            created_at
        );
    end if;
end;
$$;

comment on table public.announcements is
    'Academy-wide messages. Students and parents can read only published messages.';
comment on column public.announcements.author_id is
    'Admin author audit field. It is not exposed to student or parent clients.';
comment on column public.announcements.status is
    'Draft and archived messages remain admin-only; published messages are visible to approved academy accounts.';

commit;
