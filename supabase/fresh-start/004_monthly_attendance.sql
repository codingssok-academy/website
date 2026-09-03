-- Growth 2.0 fresh start: calendar-month attendance records.
-- Apply after 001_identity_access.sql, 002_access_code_admin.sql,
-- and 003_growth_records.sql.
-- This file contains schema and access rules only. It never inserts student data.

begin;

create table public.student_attendance_records (
    id uuid primary key default extensions.gen_random_uuid(),
    student_id uuid not null references public.students(id) on delete cascade,
    class_date date not null,
    lesson_title text not null check (
        char_length(btrim(lesson_title)) between 1 and 120
    ),
    status text not null default 'scheduled'
        check (status in ('scheduled', 'present', 'absent', 'makeup')),
    note text check (note is null or char_length(note) <= 300),
    created_by uuid not null references auth.users(id) on delete restrict,
    updated_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index student_attendance_records_session_unique_idx
    on public.student_attendance_records (
        student_id,
        class_date,
        lower(btrim(lesson_title))
    );

create index student_attendance_records_student_month_idx
    on public.student_attendance_records (
        student_id,
        class_date desc,
        created_at desc
    );

create index student_attendance_records_status_idx
    on public.student_attendance_records (student_id, status, class_date desc);

create trigger student_attendance_records_touch_updated_at
before update on public.student_attendance_records
for each row execute function private.touch_updated_at();

alter table public.student_attendance_records enable row level security;

revoke all on public.student_attendance_records from public, anon, authenticated;

grant select (
    id,
    student_id,
    class_date,
    lesson_title,
    status,
    note,
    created_at,
    updated_at
) on public.student_attendance_records to authenticated;

grant insert (
    student_id,
    class_date,
    lesson_title,
    status,
    note,
    created_by,
    updated_by
) on public.student_attendance_records to authenticated;

grant update (
    class_date,
    lesson_title,
    status,
    note,
    updated_by
) on public.student_attendance_records to authenticated;

grant all on public.student_attendance_records to service_role;

create policy student_attendance_records_read_scoped
on public.student_attendance_records
for select
to authenticated
using (public.codingssok_can_read_student(student_id));

create policy student_attendance_records_insert_managed
on public.student_attendance_records
for insert
to authenticated
with check (
    public.codingssok_can_manage_student(student_id)
    and created_by = auth.uid()
    and updated_by = auth.uid()
);

create policy student_attendance_records_update_managed
on public.student_attendance_records
for update
to authenticated
using (public.codingssok_can_manage_student(student_id))
with check (
    public.codingssok_can_manage_student(student_id)
    and updated_by = auth.uid()
);

create or replace function public.growth_api_monthly_attendance(
    p_student_id uuid,
    p_month date
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
    v_month_end date;
    v_result jsonb;
begin
    if p_student_id is null then
        raise exception using
            errcode = '22023',
            message = 'student_id is required';
    end if;

    if p_month is null or extract(day from p_month) <> 1 then
        raise exception using
            errcode = '22023',
            message = 'month must be the first day of a calendar month';
    end if;

    if current_user <> 'service_role'
       and not public.codingssok_can_read_student(p_student_id) then
        raise exception using
            errcode = '42501',
            message = 'attendance access denied';
    end if;

    v_month_end := (p_month + interval '1 month - 1 day')::date;

    select jsonb_build_object(
        'api_version', '1.0',
        'period', jsonb_build_object(
            'month', to_char(p_month, 'YYYY-MM'),
            'month_start', p_month,
            'month_end', v_month_end
        ),
        'data', jsonb_build_object(
            'student', jsonb_build_object(
                'id', s.id,
                'display_name', s.name
            ),
            'summary', (
                select jsonb_build_object(
                    'scheduled', count(*) filter (
                        where a.status in ('scheduled', 'present', 'absent')
                    ),
                    'present', count(*) filter (where a.status = 'present'),
                    'absent', count(*) filter (where a.status = 'absent'),
                    'makeup', count(*) filter (where a.status = 'makeup'),
                    'upcoming', count(*) filter (where a.status = 'scheduled'),
                    'completed',
                        count(*) filter (where a.status = 'present')
                        + count(*) filter (where a.status = 'makeup')
                )
                from public.student_attendance_records a
                where a.student_id = p_student_id
                  and a.class_date between p_month and v_month_end
            ),
            'records', (
                select coalesce(
                    jsonb_agg(
                        jsonb_build_object(
                            'id', a.id,
                            'class_date', a.class_date,
                            'lesson_title', a.lesson_title,
                            'status', a.status,
                            'note', a.note,
                            'updated_at', a.updated_at
                        ) order by a.class_date, a.lesson_title, a.created_at
                    ),
                    '[]'::jsonb
                )
                from public.student_attendance_records a
                where a.student_id = p_student_id
                  and a.class_date between p_month and v_month_end
            )
        )
    )
    into v_result
    from public.students s
    where s.id = p_student_id;

    if v_result is null then
        raise exception using
            errcode = '22023',
            message = 'student was not found';
    end if;

    return v_result;
end;
$$;

create or replace function public.growth_api_teacher_set_attendance(
    p_student_id uuid,
    p_record_id uuid,
    p_class_date date,
    p_status text,
    p_lesson_title text,
    p_note text,
    p_actor_id uuid default null
)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
    v_actor_id uuid;
    v_record public.student_attendance_records%rowtype;
begin
    if p_student_id is null or p_class_date is null then
        raise exception using
            errcode = '22023',
            message = 'student_id and class_date are required';
    end if;

    if p_status not in ('scheduled', 'present', 'absent', 'makeup') then
        raise exception using
            errcode = '22023',
            message = 'attendance status is invalid';
    end if;

    if char_length(btrim(coalesce(p_lesson_title, ''))) not between 1 and 120 then
        raise exception using
            errcode = '22023',
            message = 'lesson title length is invalid';
    end if;

    if p_note is not null and char_length(p_note) > 300 then
        raise exception using
            errcode = '22023',
            message = 'attendance note is too long';
    end if;

    if current_user = 'service_role' then
        v_actor_id := p_actor_id;

        if v_actor_id is null then
            raise exception using
                errcode = '22023',
                message = 'actor_id is required for server attendance writes';
        end if;

        if not (
            exists (
                select 1
                from public.profiles p
                where p.id = v_actor_id
                  and p.role = 'admin'
                  and p.approval_status = 'approved'
            )
            or exists (
                select 1
                from public.profiles p
                join public.teacher_student_assignments a
                  on a.teacher_id = p.id
                where p.id = v_actor_id
                  and p.role = 'teacher'
                  and p.approval_status = 'approved'
                  and a.student_id = p_student_id
                  and a.status = 'active'
            )
        ) then
            raise exception using
                errcode = '42501',
                message = 'attendance write access denied';
        end if;
    else
        v_actor_id := auth.uid();

        if v_actor_id is null
           or (p_actor_id is not null and p_actor_id <> v_actor_id)
           or not public.codingssok_can_manage_student(p_student_id) then
            raise exception using
                errcode = '42501',
                message = 'attendance write access denied';
        end if;
    end if;

    if p_record_id is null then
        insert into public.student_attendance_records (
            student_id,
            class_date,
            lesson_title,
            status,
            note,
            created_by,
            updated_by
        ) values (
            p_student_id,
            p_class_date,
            btrim(p_lesson_title),
            p_status,
            nullif(btrim(coalesce(p_note, '')), ''),
            v_actor_id,
            v_actor_id
        )
        returning * into v_record;
    else
        update public.student_attendance_records
        set class_date = p_class_date,
            lesson_title = btrim(p_lesson_title),
            status = p_status,
            note = nullif(btrim(coalesce(p_note, '')), ''),
            updated_by = v_actor_id
        where id = p_record_id
          and student_id = p_student_id
        returning * into v_record;

        if v_record.id is null then
            raise exception using
                errcode = '22023',
                message = 'attendance record was not found for the student';
        end if;
    end if;

    return jsonb_build_object(
        'saved', true,
        'record', jsonb_build_object(
            'id', v_record.id,
            'student_id', v_record.student_id,
            'class_date', v_record.class_date,
            'lesson_title', v_record.lesson_title,
            'status', v_record.status,
            'note', v_record.note,
            'updated_at', v_record.updated_at
        )
    );
end;
$$;

revoke all on function public.growth_api_monthly_attendance(uuid, date)
    from public, anon;
revoke all on function public.growth_api_teacher_set_attendance(
    uuid,
    uuid,
    date,
    text,
    text,
    text,
    uuid
) from public, anon;

grant execute on function public.growth_api_monthly_attendance(uuid, date)
    to authenticated, service_role;
grant execute on function public.growth_api_teacher_set_attendance(
    uuid,
    uuid,
    date,
    text,
    text,
    text,
    uuid
) to authenticated, service_role;

comment on table public.student_attendance_records is
    'Calendar-month class attendance for Growth 2.0. Students and linked parents can read only their scoped records.';
comment on column public.student_attendance_records.note is
    'Short parent-safe attendance note. Never store private teacher observations here.';
comment on function public.growth_api_monthly_attendance(uuid, date) is
    'Returns one authorized student calendar month using the Growth 2.0 attendance response shape.';
comment on function public.growth_api_teacher_set_attendance(
    uuid,
    uuid,
    date,
    text,
    text,
    text,
    uuid
) is
    'Creates or updates attendance after verifying the signed-in or server-supplied teacher/admin actor.';

commit;
