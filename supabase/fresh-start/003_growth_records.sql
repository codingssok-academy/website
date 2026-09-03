-- Growth 2.0 fresh start: monthly, publishable student growth records.
-- Apply after 001_identity_access.sql and 002_access_code_admin.sql.
-- This file contains schema and access rules only. It never inserts student data.

begin;

create table public.student_growth_records (
    id uuid primary key default extensions.gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    period_month date not null default date_trunc('month', current_date)::date,
    class_snapshot text check (
        class_snapshot is null or char_length(class_snapshot) <= 80
    ),
    learned_concepts text not null default '' check (
        char_length(learned_concepts) <= 8000
    ),
    strengths text not null default '' check (
        char_length(strengths) <= 8000
    ),
    improvements text not null default '' check (
        char_length(improvements) <= 8000
    ),
    next_goal text not null default '' check (
        char_length(next_goal) <= 8000
    ),
    lesson_summary text not null default '' check (
        char_length(lesson_summary) <= 8000
    ),
    parent_message text not null default '' check (
        char_length(parent_message) <= 8000
    ),
    status text not null default 'draft'
        check (status in ('draft', 'published', 'archived')),
    created_by uuid not null references auth.users(id) on delete restrict,
    updated_by uuid not null references auth.users(id) on delete restrict,
    published_at timestamptz,
    archived_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint student_growth_records_month_start
        check (extract(day from period_month) = 1),
    constraint student_growth_records_status_timestamps
        check (
            (status = 'draft' and published_at is null and archived_at is null)
            or (status = 'published' and published_at is not null and archived_at is null)
            or (status = 'archived' and archived_at is not null)
        )
);

create index student_growth_records_student_month_idx
    on public.student_growth_records (student_id, period_month desc, created_at desc);

create index student_growth_records_published_idx
    on public.student_growth_records (student_id, published_at desc)
    where status = 'published';

create unique index student_growth_records_one_draft_per_month_idx
    on public.student_growth_records (student_id, period_month)
    where status = 'draft';

create table private.student_growth_internal_notes (
    record_id uuid primary key
        references public.student_growth_records(id) on delete cascade,
    note text not null default '' check (char_length(note) <= 12000),
    created_by uuid not null references auth.users(id) on delete restrict,
    updated_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function private.set_growth_record_status_timestamps()
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

create trigger student_growth_records_set_status_timestamps
before insert or update of status on public.student_growth_records
for each row execute function private.set_growth_record_status_timestamps();

create trigger student_growth_records_touch_updated_at
before update on public.student_growth_records
for each row execute function private.touch_updated_at();

create trigger student_growth_internal_notes_touch_updated_at
before update on private.student_growth_internal_notes
for each row execute function private.touch_updated_at();

alter table public.student_growth_records enable row level security;
alter table private.student_growth_internal_notes enable row level security;

revoke all on public.student_growth_records from public, anon, authenticated;
revoke all on private.student_growth_internal_notes from public, anon, authenticated;

grant select (
    id,
    student_id,
    period_month,
    class_snapshot,
    learned_concepts,
    strengths,
    improvements,
    next_goal,
    lesson_summary,
    parent_message,
    status,
    published_at,
    archived_at,
    created_at,
    updated_at
) on public.student_growth_records to authenticated;

grant insert (
    student_id,
    period_month,
    class_snapshot,
    learned_concepts,
    strengths,
    improvements,
    next_goal,
    lesson_summary,
    parent_message,
    status,
    created_by,
    updated_by
) on public.student_growth_records to authenticated;

grant update (
    period_month,
    class_snapshot,
    learned_concepts,
    strengths,
    improvements,
    next_goal,
    lesson_summary,
    parent_message,
    status,
    updated_by
) on public.student_growth_records to authenticated;

grant all on public.student_growth_records to service_role;
grant all on private.student_growth_internal_notes to service_role;

create policy student_growth_records_read_scoped
on public.student_growth_records
for select
to authenticated
using (
    public.codingssok_can_manage_student(student_id)
    or (
        status = 'published'
        and public.codingssok_can_read_student(student_id)
    )
);

create policy student_growth_records_insert_managed
on public.student_growth_records
for insert
to authenticated
with check (
    public.codingssok_can_manage_student(student_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
);

create policy student_growth_records_update_managed
on public.student_growth_records
for update
to authenticated
using (public.codingssok_can_manage_student(student_id))
with check (
    public.codingssok_can_manage_student(student_id)
    and updated_by = auth.uid()
);

comment on table public.student_growth_records is
    'Monthly Growth 2.0 records. Only published parent-safe fields are visible to students and linked parents.';
comment on column public.student_growth_records.period_month is
    'First day of the billing month represented by this record.';
comment on column public.student_growth_records.learned_concepts is
    'Teacher-authored concepts and lesson content safe to share after publication.';
comment on table private.student_growth_internal_notes is
    'Server-only teacher notes. Never expose this table to student or parent clients.';

commit;
