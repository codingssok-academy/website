-- Fix the 004 teacher attendance save function without changing 004.
-- The original broad return also requested hidden audit columns when an
-- authenticated teacher saved a row. Return only parent-safe granted columns.

begin;

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
    v_saved_id uuid;
    v_saved_student_id uuid;
    v_saved_class_date date;
    v_saved_lesson_title text;
    v_saved_status text;
    v_saved_note text;
    v_saved_updated_at timestamptz;
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
        returning
            id,
            student_id,
            class_date,
            lesson_title,
            status,
            note,
            updated_at
        into
            v_saved_id,
            v_saved_student_id,
            v_saved_class_date,
            v_saved_lesson_title,
            v_saved_status,
            v_saved_note,
            v_saved_updated_at;
    else
        update public.student_attendance_records
        set class_date = p_class_date,
            lesson_title = btrim(p_lesson_title),
            status = p_status,
            note = nullif(btrim(coalesce(p_note, '')), ''),
            updated_by = v_actor_id
        where id = p_record_id
          and student_id = p_student_id
        returning
            id,
            student_id,
            class_date,
            lesson_title,
            status,
            note,
            updated_at
        into
            v_saved_id,
            v_saved_student_id,
            v_saved_class_date,
            v_saved_lesson_title,
            v_saved_status,
            v_saved_note,
            v_saved_updated_at;

        if v_saved_id is null then
            raise exception using
                errcode = '22023',
                message = 'attendance record was not found for the student';
        end if;
    end if;

    return jsonb_build_object(
        'saved', true,
        'record', jsonb_build_object(
            'id', v_saved_id,
            'student_id', v_saved_student_id,
            'class_date', v_saved_class_date,
            'lesson_title', v_saved_lesson_title,
            'status', v_saved_status,
            'note', v_saved_note,
            'updated_at', v_saved_updated_at
        )
    );
end;
$$;

revoke all on function public.growth_api_teacher_set_attendance(
    uuid,
    uuid,
    date,
    text,
    text,
    text,
    uuid
) from public, anon;

grant execute on function public.growth_api_teacher_set_attendance(
    uuid,
    uuid,
    date,
    text,
    text,
    text,
    uuid
) to authenticated, service_role;

comment on function public.growth_api_teacher_set_attendance(
    uuid,
    uuid,
    date,
    text,
    text,
    text,
    uuid
) is
    'Creates or updates attendance and returns only granted parent-safe fields, never hidden audit identities.';

commit;
