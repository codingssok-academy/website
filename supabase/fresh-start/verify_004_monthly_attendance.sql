-- Growth 2.0 fresh test verification for 004_monthly_attendance.sql.
-- Run only in the fresh Seoul test project after 001 through 004.
-- All fake users and attendance rows are created in one transaction and rolled back.

begin;

create temporary table attendance_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into attendance_verify_ids (label, id)
values
    ('student_user_a', extensions.gen_random_uuid()),
    ('student_user_b', extensions.gen_random_uuid()),
    ('parent_user', extensions.gen_random_uuid()),
    ('teacher_user', extensions.gen_random_uuid()),
    ('other_teacher_user', extensions.gen_random_uuid()),
    ('admin_user', extensions.gen_random_uuid()),
    ('student_a', extensions.gen_random_uuid()),
    ('student_b', extensions.gen_random_uuid()),
    ('record_a_scheduled', extensions.gen_random_uuid()),
    ('record_a_present', extensions.gen_random_uuid()),
    ('record_a_absent', extensions.gen_random_uuid()),
    ('record_a_makeup', extensions.gen_random_uuid()),
    ('record_b_present', extensions.gen_random_uuid());

grant select on attendance_verify_ids to authenticated, anon, service_role;

do $$
begin
    if to_regclass('public.student_attendance_records') is null then
        raise exception '004 attendance table is missing';
    end if;

    if to_regprocedure('public.growth_api_monthly_attendance(uuid,date)') is null then
        raise exception 'monthly attendance API is missing';
    end if;

    if to_regprocedure(
        'public.growth_api_teacher_set_attendance(uuid,uuid,date,text,text,text,uuid)'
    ) is null then
        raise exception 'teacher attendance API is missing';
    end if;
end;
$$;

insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
select
    ids.id,
    extensions.gen_random_uuid(),
    'authenticated',
    'authenticated',
    format('fresh-attendance-verify-%s@invalid.local', ids.id),
    crypt('temporary-test-only', gen_salt('bf')),
    now(),
    jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'role', case ids.label
            when 'parent_user' then 'parent'
            when 'teacher_user' then 'teacher'
            when 'other_teacher_user' then 'teacher'
            when 'admin_user' then 'admin'
            else 'student'
        end
    ),
    jsonb_build_object('name', format('Attendance Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from attendance_verify_ids ids
where ids.label in (
    'student_user_a',
    'student_user_b',
    'parent_user',
    'teacher_user',
    'other_teacher_user',
    'admin_user'
);

insert into public.students (
    id,
    auth_user_id,
    name,
    school,
    grade,
    class,
    status,
    created_by
)
values
    (
        (select id from attendance_verify_ids where label = 'student_a'),
        (select id from attendance_verify_ids where label = 'student_user_a'),
        'Attendance Verify Student A',
        'Test School',
        '1',
        'Test Class',
        'active',
        (select id from attendance_verify_ids where label = 'admin_user')
    ),
    (
        (select id from attendance_verify_ids where label = 'student_b'),
        (select id from attendance_verify_ids where label = 'student_user_b'),
        'Attendance Verify Student B',
        'Test School',
        '2',
        'Test Class',
        'active',
        (select id from attendance_verify_ids where label = 'admin_user')
    );

insert into public.parent_student_links (
    parent_user_id,
    student_id,
    relation,
    status,
    created_by
)
values (
    (select id from attendance_verify_ids where label = 'parent_user'),
    (select id from attendance_verify_ids where label = 'student_a'),
    'guardian',
    'active',
    (select id from attendance_verify_ids where label = 'admin_user')
);

insert into public.teacher_student_assignments (
    teacher_id,
    student_id,
    status,
    assigned_by
)
values (
    (select id from attendance_verify_ids where label = 'teacher_user'),
    (select id from attendance_verify_ids where label = 'student_a'),
    'active',
    (select id from attendance_verify_ids where label = 'admin_user')
);

insert into public.student_attendance_records (
    id,
    student_id,
    class_date,
    lesson_title,
    status,
    note,
    created_by,
    updated_by
)
values
    (
        (select id from attendance_verify_ids where label = 'record_a_scheduled'),
        (select id from attendance_verify_ids where label = 'student_a'),
        date_trunc('month', current_date)::date + 4,
        'Fake scheduled class',
        'scheduled',
        'Fake parent-safe schedule note',
        (select id from attendance_verify_ids where label = 'teacher_user'),
        (select id from attendance_verify_ids where label = 'teacher_user')
    ),
    (
        (select id from attendance_verify_ids where label = 'record_a_present'),
        (select id from attendance_verify_ids where label = 'student_a'),
        date_trunc('month', current_date)::date + 11,
        'Fake present class',
        'present',
        null,
        (select id from attendance_verify_ids where label = 'teacher_user'),
        (select id from attendance_verify_ids where label = 'teacher_user')
    ),
    (
        (select id from attendance_verify_ids where label = 'record_a_absent'),
        (select id from attendance_verify_ids where label = 'student_a'),
        date_trunc('month', current_date)::date + 18,
        'Fake absent class',
        'absent',
        'Fake parent-safe absence note',
        (select id from attendance_verify_ids where label = 'teacher_user'),
        (select id from attendance_verify_ids where label = 'teacher_user')
    ),
    (
        (select id from attendance_verify_ids where label = 'record_a_makeup'),
        (select id from attendance_verify_ids where label = 'student_a'),
        date_trunc('month', current_date)::date + 25,
        'Fake makeup class',
        'makeup',
        null,
        (select id from attendance_verify_ids where label = 'teacher_user'),
        (select id from attendance_verify_ids where label = 'teacher_user')
    ),
    (
        (select id from attendance_verify_ids where label = 'record_b_present'),
        (select id from attendance_verify_ids where label = 'student_b'),
        date_trunc('month', current_date)::date + 11,
        'Fake other student class',
        'present',
        null,
        (select id from attendance_verify_ids where label = 'admin_user'),
        (select id from attendance_verify_ids where label = 'admin_user')
    );

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from attendance_verify_ids where label = 'student_user_a'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_total integer;
    v_updated integer;
    v_payload jsonb;
begin
    select count(*) into v_total
    from public.student_attendance_records;

    if v_total <> 4 then
        raise exception 'student attendance visibility failed: visible %', v_total;
    end if;

    select public.growth_api_monthly_attendance(
        (select id from attendance_verify_ids where label = 'student_a'),
        date_trunc('month', current_date)::date
    ) into v_payload;

    if (v_payload #>> '{data,summary,scheduled}')::integer <> 3
       or (v_payload #>> '{data,summary,present}')::integer <> 1
       or (v_payload #>> '{data,summary,absent}')::integer <> 1
       or (v_payload #>> '{data,summary,makeup}')::integer <> 1
       or (v_payload #>> '{data,summary,upcoming}')::integer <> 1
       or (v_payload #>> '{data,summary,completed}')::integer <> 2
       or jsonb_array_length(v_payload #> '{data,records}') <> 4 then
        raise exception 'student monthly attendance summary failed: %', v_payload;
    end if;

    update public.student_attendance_records
    set status = 'present', updated_by = auth.uid()
    where student_id = (
        select id from attendance_verify_ids where label = 'student_a'
    );
    get diagnostics v_updated = row_count;

    if v_updated <> 0 then
        raise exception 'student attendance update unexpectedly succeeded';
    end if;

    begin
        perform public.growth_api_monthly_attendance(
            (select id from attendance_verify_ids where label = 'student_b'),
            date_trunc('month', current_date)::date
        );
        raise exception 'student read of another student unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from attendance_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_total integer;
    v_payload jsonb;
begin
    select count(*) into v_total
    from public.student_attendance_records;

    if v_total <> 4 then
        raise exception 'parent attendance visibility failed: visible %', v_total;
    end if;

    select public.growth_api_monthly_attendance(
        (select id from attendance_verify_ids where label = 'student_a'),
        date_trunc('month', current_date)::date
    ) into v_payload;

    if jsonb_array_length(v_payload #> '{data,records}') <> 4 then
        raise exception 'parent monthly attendance API failed: %', v_payload;
    end if;

    begin
        insert into public.student_attendance_records (
            student_id,
            class_date,
            lesson_title,
            status,
            created_by,
            updated_by
        ) values (
            (select id from attendance_verify_ids where label = 'student_a'),
            date_trunc('month', current_date)::date + 27,
            'Parent must not create attendance',
            'present',
            auth.uid(),
            auth.uid()
        );
        raise exception 'parent attendance insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from attendance_verify_ids where label = 'teacher_user'),
    true
);

do $$
declare
    v_assigned integer;
    v_unassigned integer;
    v_saved jsonb;
begin
    select count(*) into v_assigned
    from public.student_attendance_records
    where student_id = (
        select id from attendance_verify_ids where label = 'student_a'
    );

    select count(*) into v_unassigned
    from public.student_attendance_records
    where student_id = (
        select id from attendance_verify_ids where label = 'student_b'
    );

    if v_assigned <> 4 or v_unassigned <> 0 then
        raise exception 'teacher attendance scope failed: assigned %, unassigned %',
            v_assigned, v_unassigned;
    end if;

    select public.growth_api_teacher_set_attendance(
        (select id from attendance_verify_ids where label = 'student_a'),
        null::uuid,
        date_trunc('month', current_date)::date + 27,
        'present',
        'Fake teacher-created class',
        'Fake parent-safe teacher note'
    ) into v_saved;

    if coalesce((v_saved ->> 'saved')::boolean, false) is not true then
        raise exception 'assigned teacher save API failed: %', v_saved;
    end if;

    begin
        perform created_by from public.student_attendance_records limit 1;
        raise exception 'attendance audit-column read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        perform public.growth_api_teacher_set_attendance(
            (select id from attendance_verify_ids where label = 'student_b'),
            null::uuid,
            date_trunc('month', current_date)::date + 27,
            'present',
            'Teacher must not create for unassigned student',
            null::text
        );
        raise exception 'unassigned teacher attendance write unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from attendance_verify_ids where label = 'other_teacher_user'),
    true
);

do $$
declare
    v_total integer;
begin
    select count(*) into v_total
    from public.student_attendance_records;

    if v_total <> 0 then
        raise exception 'unassigned teacher attendance read failed: visible %', v_total;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from attendance_verify_ids where label = 'admin_user'),
    true
);

do $$
declare
    v_total integer;
begin
    select count(*) into v_total
    from public.student_attendance_records;

    if v_total <> 6 then
        raise exception 'admin attendance visibility failed: visible %', v_total;
    end if;
end;
$$;

reset role;
set local role service_role;

do $$
declare
    v_saved jsonb;
begin
    begin
        perform public.growth_api_teacher_set_attendance(
            (select id from attendance_verify_ids where label = 'student_b'),
            null::uuid,
            (date_trunc('month', current_date) + interval '1 month')::date,
            'scheduled',
            'Server call missing actor',
            null::text
        );
        raise exception 'server attendance write without actor unexpectedly succeeded';
    exception
        when invalid_parameter_value then null;
    end;

    select public.growth_api_teacher_set_attendance(
        (select id from attendance_verify_ids where label = 'student_b'),
        null::uuid,
        (date_trunc('month', current_date) + interval '1 month')::date,
        'scheduled',
        'Fake server-created class',
        null::text,
        (select id from attendance_verify_ids where label = 'admin_user')
    ) into v_saved;

    if coalesce((v_saved ->> 'saved')::boolean, false) is not true then
        raise exception 'server attendance write with actor failed: %', v_saved;
    end if;
end;
$$;

reset role;
set local role anon;

do $$
begin
    begin
        perform 1 from public.student_attendance_records limit 1;
        raise exception 'anonymous attendance read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

reset role;
rollback;

select case
    when (
        select count(*)
        from auth.users
        where email like 'fresh-attendance-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name like 'Attendance Verify Student %'
    ) = 0
    and (
        select count(*)
        from public.student_attendance_records
        where lesson_title like 'Fake %'
    ) = 0
    then 'PASS: Monthly attendance role checks passed and all fake data was rolled back.'
    else 'FAIL: fake attendance verification data remains; stop before continuing.'
end as verification_result;
