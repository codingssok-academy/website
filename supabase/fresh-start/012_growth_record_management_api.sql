-- Growth 2.0 fresh start: teacher/admin API for monthly records and private notes.
-- Apply after 003_growth_records.sql.
-- This migration changes schema and functions only. It never inserts student data.

begin;

alter table private.student_growth_internal_notes
    add column teacher_memo text not null default ''
        check (char_length(teacher_memo) <= 8000),
    add column entry_note text not null default ''
        check (char_length(entry_note) <= 8000),
    add column next_class_potential text not null default ''
        check (char_length(next_class_potential) <= 500);

create or replace function public.growth_api_teacher_list_records()
returns table (
    id uuid,
    student_id uuid,
    period_month date,
    class_snapshot text,
    learned_concepts text,
    strengths text,
    improvements text,
    next_goal text,
    lesson_summary text,
    parent_message text,
    status text,
    published_at timestamptz,
    archived_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    teacher_memo text,
    entry_note text,
    next_class_potential text
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        record.id,
        record.student_id,
        record.period_month,
        record.class_snapshot,
        record.learned_concepts,
        record.strengths,
        record.improvements,
        record.next_goal,
        record.lesson_summary,
        record.parent_message,
        record.status,
        record.published_at,
        record.archived_at,
        record.created_at,
        record.updated_at,
        coalesce(nullif(notes.teacher_memo, ''), notes.note, ''),
        coalesce(notes.entry_note, ''),
        coalesce(notes.next_class_potential, '')
    from public.student_growth_records record
    left join private.student_growth_internal_notes notes
      on notes.record_id = record.id
    where record.status <> 'archived'
      and public.codingssok_is_teacher_or_admin()
      and public.codingssok_can_manage_student(record.student_id)
    order by record.period_month desc, record.updated_at desc, record.created_at desc
$$;

create or replace function public.growth_api_teacher_save_record(
    p_record_id uuid,
    p_student_id uuid,
    p_period_month date,
    p_class_snapshot text,
    p_learned_concepts text,
    p_strengths text,
    p_improvements text,
    p_next_goal text,
    p_lesson_summary text,
    p_parent_message text,
    p_status text,
    p_teacher_memo text,
    p_entry_note text,
    p_next_class_potential text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_actor_id uuid := auth.uid();
    v_record_id uuid;
    v_record_status text;
    v_record_month date;
begin
    if v_actor_id is null
       or not public.codingssok_is_teacher_or_admin()
       or not public.codingssok_can_manage_student(p_student_id) then
        raise exception 'teacher or admin access required' using errcode = '42501';
    end if;

    if p_period_month is null or extract(day from p_period_month) <> 1 then
        raise exception 'period month must be the first day of a month' using errcode = '22023';
    end if;

    if p_status not in ('draft', 'published') then
        raise exception 'unsupported growth record status' using errcode = '22023';
    end if;

    if p_record_id is not null then
        select record.id, record.status, record.period_month
        into v_record_id, v_record_status, v_record_month
        from public.student_growth_records record
        where record.id = p_record_id
          and record.student_id = p_student_id
          and record.status <> 'archived'
        for update;
    end if;

    -- A published record is never changed back into an in-progress draft.
    -- Editing after publication creates or reuses this month's private draft.
    if v_record_id is not null and (
        v_record_month <> p_period_month
        or (v_record_status <> 'draft' and p_status = 'draft')
    ) then
        v_record_id := null;
    end if;

    if v_record_id is null then
        select record.id, record.status, record.period_month
        into v_record_id, v_record_status, v_record_month
        from public.student_growth_records record
        where record.student_id = p_student_id
          and record.period_month = p_period_month
          and record.status = 'draft'
        order by record.updated_at desc
        limit 1
        for update;
    end if;

    if v_record_id is null then
        insert into public.student_growth_records (
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
        ) values (
            p_student_id,
            p_period_month,
            nullif(btrim(coalesce(p_class_snapshot, '')), ''),
            btrim(coalesce(p_learned_concepts, '')),
            btrim(coalesce(p_strengths, '')),
            btrim(coalesce(p_improvements, '')),
            btrim(coalesce(p_next_goal, '')),
            btrim(coalesce(p_lesson_summary, '')),
            btrim(coalesce(p_parent_message, '')),
            p_status,
            v_actor_id,
            v_actor_id
        )
        returning student_growth_records.id into v_record_id;
    else
        update public.student_growth_records record
        set class_snapshot = nullif(btrim(coalesce(p_class_snapshot, '')), ''),
            learned_concepts = btrim(coalesce(p_learned_concepts, '')),
            strengths = btrim(coalesce(p_strengths, '')),
            improvements = btrim(coalesce(p_improvements, '')),
            next_goal = btrim(coalesce(p_next_goal, '')),
            lesson_summary = btrim(coalesce(p_lesson_summary, '')),
            parent_message = btrim(coalesce(p_parent_message, '')),
            status = p_status,
            updated_by = v_actor_id
        where record.id = v_record_id;
    end if;

    insert into private.student_growth_internal_notes (
        record_id,
        note,
        teacher_memo,
        entry_note,
        next_class_potential,
        created_by,
        updated_by
    ) values (
        v_record_id,
        btrim(coalesce(p_teacher_memo, '')),
        btrim(coalesce(p_teacher_memo, '')),
        btrim(coalesce(p_entry_note, '')),
        btrim(coalesce(p_next_class_potential, '')),
        v_actor_id,
        v_actor_id
    )
    on conflict (record_id) do update
    set note = excluded.note,
        teacher_memo = excluded.teacher_memo,
        entry_note = excluded.entry_note,
        next_class_potential = excluded.next_class_potential,
        updated_by = v_actor_id;

    return v_record_id;
end;
$$;

create or replace function public.growth_api_teacher_update_record(
    p_record_id uuid,
    p_student_id uuid,
    p_class_snapshot text,
    p_learned_concepts text,
    p_strengths text,
    p_improvements text,
    p_next_goal text,
    p_lesson_summary text,
    p_parent_message text,
    p_status text,
    p_teacher_memo text,
    p_entry_note text,
    p_next_class_potential text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_actor_id uuid := auth.uid();
    v_period_month date;
begin
    if v_actor_id is null
       or not public.codingssok_is_teacher_or_admin()
       or not public.codingssok_can_manage_student(p_student_id) then
        raise exception 'teacher or admin access required' using errcode = '42501';
    end if;

    if p_status not in ('draft', 'published') then
        raise exception 'unsupported growth record status' using errcode = '22023';
    end if;

    select record.period_month
    into v_period_month
    from public.student_growth_records record
    where record.id = p_record_id
      and record.student_id = p_student_id
      and record.status <> 'archived'
    for update;

    if v_period_month is null then
        raise exception 'growth record not found' using errcode = 'P0002';
    end if;

    if p_status = 'draft' and exists (
        select 1
        from public.student_growth_records other
        where other.student_id = p_student_id
          and other.period_month = v_period_month
          and other.status = 'draft'
          and other.id <> p_record_id
    ) then
        raise exception 'a draft already exists for this month' using errcode = '23505';
    end if;

    update public.student_growth_records record
    set class_snapshot = nullif(btrim(coalesce(p_class_snapshot, '')), ''),
        learned_concepts = btrim(coalesce(p_learned_concepts, '')),
        strengths = btrim(coalesce(p_strengths, '')),
        improvements = btrim(coalesce(p_improvements, '')),
        next_goal = btrim(coalesce(p_next_goal, '')),
        lesson_summary = btrim(coalesce(p_lesson_summary, '')),
        parent_message = btrim(coalesce(p_parent_message, '')),
        status = p_status,
        updated_by = v_actor_id
    where record.id = p_record_id;

    insert into private.student_growth_internal_notes (
        record_id,
        note,
        teacher_memo,
        entry_note,
        next_class_potential,
        created_by,
        updated_by
    ) values (
        p_record_id,
        btrim(coalesce(p_teacher_memo, '')),
        btrim(coalesce(p_teacher_memo, '')),
        btrim(coalesce(p_entry_note, '')),
        btrim(coalesce(p_next_class_potential, '')),
        v_actor_id,
        v_actor_id
    )
    on conflict (record_id) do update
    set note = excluded.note,
        teacher_memo = excluded.teacher_memo,
        entry_note = excluded.entry_note,
        next_class_potential = excluded.next_class_potential,
        updated_by = v_actor_id;

    return p_record_id;
end;
$$;

create or replace function public.growth_api_teacher_archive_records(
    p_student_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_actor_id uuid := auth.uid();
    v_updated_count integer;
begin
    if v_actor_id is null
       or not public.codingssok_is_teacher_or_admin()
       or not public.codingssok_can_manage_student(p_student_id) then
        raise exception 'teacher or admin access required' using errcode = '42501';
    end if;

    update public.student_growth_records record
    set status = 'archived',
        updated_by = v_actor_id
    where record.student_id = p_student_id
      and record.status <> 'archived';

    get diagnostics v_updated_count = row_count;
    return v_updated_count;
end;
$$;

revoke all on function public.growth_api_teacher_list_records()
    from public, anon;
revoke all on function public.growth_api_teacher_save_record(
    uuid, uuid, date, text, text, text, text, text, text, text, text, text, text, text
) from public, anon;
revoke all on function public.growth_api_teacher_update_record(
    uuid, uuid, text, text, text, text, text, text, text, text, text, text, text
) from public, anon;
revoke all on function public.growth_api_teacher_archive_records(uuid)
    from public, anon;

grant execute on function public.growth_api_teacher_list_records()
    to authenticated;
grant execute on function public.growth_api_teacher_save_record(
    uuid, uuid, date, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;
grant execute on function public.growth_api_teacher_update_record(
    uuid, uuid, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;
grant execute on function public.growth_api_teacher_archive_records(uuid)
    to authenticated;

comment on function public.growth_api_teacher_list_records() is
    'Returns Growth 2.0 records and private notes only for students managed by the signed-in teacher/admin.';
comment on function public.growth_api_teacher_save_record(
    uuid, uuid, date, text, text, text, text, text, text, text, text, text, text, text
) is 'Atomically creates or saves a monthly Growth 2.0 record and its private teacher notes.';
comment on function public.growth_api_teacher_update_record(
    uuid, uuid, text, text, text, text, text, text, text, text, text, text, text
) is 'Atomically edits one authorized Growth 2.0 record and its private teacher notes.';
comment on function public.growth_api_teacher_archive_records(uuid) is
    'Recoverably archives a managed student Growth 2.0 records instead of permanently deleting them.';

commit;
