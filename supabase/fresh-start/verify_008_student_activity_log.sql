-- Growth 2.0 fresh test verification for 008_student_activity_log.sql.
-- Run only in the fresh Seoul test project after 001 through 008.
-- All fake users and activity rows are created in one transaction and rolled back.

begin;

create temporary table activity_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into activity_verify_ids (label, id)
values
    ('student_user_a', extensions.gen_random_uuid()),
    ('student_user_b', extensions.gen_random_uuid()),
    ('parent_user', extensions.gen_random_uuid()),
    ('teacher_user', extensions.gen_random_uuid()),
    ('other_teacher_user', extensions.gen_random_uuid()),
    ('admin_user', extensions.gen_random_uuid()),
    ('pending_user', extensions.gen_random_uuid()),
    ('student_a', extensions.gen_random_uuid()),
    ('student_b', extensions.gen_random_uuid());

grant select on activity_verify_ids to authenticated, anon, service_role;

do $$
begin
    if to_regclass('public.student_activity_log') is null then
        raise exception '008 student_activity_log table is missing';
    end if;

    if to_regprocedure('private.prepare_student_activity_log()') is null then
        raise exception '008 activity preparation trigger function is missing';
    end if;

    if to_regprocedure('private.finalize_student_activity_log()') is null then
        raise exception '008 activity finalization trigger function is missing';
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
    format('fresh-activity-verify-%s@invalid.local', ids.id),
    crypt('temporary-test-only', gen_salt('bf')),
    now(),
    case ids.label
        when 'pending_user' then jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email')
        )
        else jsonb_build_object(
            'provider', 'email',
            'providers', jsonb_build_array('email'),
            'role', case ids.label
                when 'parent_user' then 'parent'
                when 'teacher_user' then 'teacher'
                when 'other_teacher_user' then 'teacher'
                when 'admin_user' then 'admin'
                else 'student'
            end
        )
    end,
    jsonb_build_object('name', format('Activity Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from activity_verify_ids ids
where ids.label in (
    'student_user_a',
    'student_user_b',
    'parent_user',
    'teacher_user',
    'other_teacher_user',
    'admin_user',
    'pending_user'
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
        (select id from activity_verify_ids where label = 'student_a'),
        (select id from activity_verify_ids where label = 'student_user_a'),
        'Activity Verify Student A',
        'Test School',
        '1',
        'Test Class',
        'active',
        (select id from activity_verify_ids where label = 'admin_user')
    ),
    (
        (select id from activity_verify_ids where label = 'student_b'),
        (select id from activity_verify_ids where label = 'student_user_b'),
        'Activity Verify Student B',
        'Test School',
        '2',
        'Test Class',
        'active',
        (select id from activity_verify_ids where label = 'admin_user')
    );

insert into public.parent_student_links (
    parent_user_id,
    student_id,
    relation,
    status,
    created_by
)
values (
    (select id from activity_verify_ids where label = 'parent_user'),
    (select id from activity_verify_ids where label = 'student_a'),
    'guardian',
    'active',
    (select id from activity_verify_ids where label = 'admin_user')
);

insert into public.teacher_student_assignments (
    teacher_id,
    student_id,
    status,
    assigned_by
)
values (
    (select id from activity_verify_ids where label = 'teacher_user'),
    (select id from activity_verify_ids where label = 'student_a'),
    'active',
    (select id from activity_verify_ids where label = 'admin_user')
);

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from activity_verify_ids where label = 'student_user_a'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_log_id uuid;
    v_visible integer;
    v_student_name text;
    v_started_at timestamptz;
    v_ended_at timestamptz;
    v_duration integer;
begin
    insert into public.student_activity_log (
        user_id,
        student_name,
        course_id,
        course_title,
        unit_id,
        unit_title,
        page_id,
        page_title,
        page_url,
        started_at
    ) values (
        auth.uid(),
        'Forged Student Name',
        'fake-course-a',
        'Fake Course A',
        'fake-unit-a',
        'Fake Unit A',
        'fake-activity-a',
        'Fake Page A',
        '/fake/activity/a',
        now() - interval '7 days'
    )
    returning id into v_log_id;

    select student_name, started_at, ended_at, duration_seconds
    into v_student_name, v_started_at, v_ended_at, v_duration
    from public.student_activity_log
    where id = v_log_id;

    if v_student_name <> 'Activity Verify Student A'
       or v_started_at < now() - interval '1 second'
       or v_ended_at is not null
       or v_duration is not null then
        raise exception 'canonical identity or start-time normalization failed';
    end if;

    update public.student_activity_log
    set ended_at = now() + interval '30 days',
        duration_seconds = 999999
    where id = v_log_id;

    select ended_at, duration_seconds
    into v_ended_at, v_duration
    from public.student_activity_log
    where id = v_log_id;

    if v_ended_at < v_started_at
       or v_ended_at > now() + interval '1 second'
       or v_duration not between 0 and 86400 then
        raise exception 'database-derived activity duration failed';
    end if;

    select count(*) into v_visible
    from public.student_activity_log;

    if v_visible <> 1 then
        raise exception 'student own activity visibility failed: visible %', v_visible;
    end if;

    begin
        insert into public.student_activity_log (
            user_id,
            student_name,
            course_id,
            page_id,
            started_at
        ) values (
            (select id from activity_verify_ids where label = 'student_user_b'),
            'Forged Other Student',
            'fake-course-for-other-student',
            'fake-other-student-write',
            now()
        );
        raise exception 'student write to another student unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        insert into public.student_activity_log (
            user_id,
            student_name,
            event_type,
            page_id,
            started_at
        ) values (
            auth.uid(),
            'Forged Student Name',
            'login',
            'fake-forged-event-type',
            now()
        );
        raise exception 'student event-type override unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        update public.student_activity_log
        set course_title = 'Forged Course Title'
        where id = v_log_id;
        raise exception 'student immutable activity update unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        delete from public.student_activity_log
        where id = v_log_id;
        raise exception 'student activity delete unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from activity_verify_ids where label = 'student_user_b'),
    true
);

do $$
declare
    v_visible integer;
    v_changed integer;
begin
    insert into public.student_activity_log (
        user_id,
        student_name,
        course_id,
        course_title,
        page_id,
        page_title,
        page_url,
        started_at
    ) values (
        auth.uid(),
        'Forged Student Name',
        'fake-course-b',
        'Fake Course B',
        'fake-activity-b',
        'Fake Page B',
        '/fake/activity/b',
        now() - interval '7 days'
    );

    select count(*) into v_visible
    from public.student_activity_log;

    if v_visible <> 1 then
        raise exception 'second student scoped visibility failed: visible %', v_visible;
    end if;

    update public.student_activity_log
    set ended_at = now()
    where page_id = 'fake-activity-a';
    get diagnostics v_changed = row_count;

    if v_changed <> 0 then
        raise exception 'student update to another student unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from activity_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_visible integer;
    v_changed integer;
begin
    select count(*) into v_visible
    from public.student_activity_log;

    if v_visible <> 1 then
        raise exception 'linked parent activity visibility failed: visible %', v_visible;
    end if;

    update public.student_activity_log
    set ended_at = now()
    where page_id = 'fake-activity-a';
    get diagnostics v_changed = row_count;

    if v_changed <> 0 then
        raise exception 'parent activity update unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from activity_verify_ids where label = 'teacher_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.student_activity_log;

    if v_visible <> 1 then
        raise exception 'assigned teacher activity visibility failed: visible %', v_visible;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from activity_verify_ids where label = 'other_teacher_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.student_activity_log;

    if v_visible <> 0 then
        raise exception 'unassigned teacher activity read unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from activity_verify_ids where label = 'pending_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.student_activity_log;

    if v_visible <> 0 then
        raise exception 'pending account activity read unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from activity_verify_ids where label = 'admin_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.student_activity_log;

    if v_visible <> 2 then
        raise exception 'admin activity visibility failed: visible %', v_visible;
    end if;
end;
$$;

reset role;
set local role service_role;

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.student_activity_log
    where page_id like 'fake-activity-%';

    if v_visible <> 2 then
        raise exception 'service activity visibility failed: visible %', v_visible;
    end if;
end;
$$;

reset role;
set local role anon;

do $$
begin
    begin
        perform 1 from public.student_activity_log limit 1;
        raise exception 'anonymous activity read unexpectedly succeeded';
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
        where email like 'fresh-activity-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name like 'Activity Verify Student %'
    ) = 0
    and (
        select count(*)
        from public.student_activity_log
        where page_id like 'fake-activity-%'
    ) = 0
    then 'PASS: Student activity role checks passed and all fake data was rolled back.'
    else 'FAIL: fake student activity verification data remains; stop before continuing.'
end as verification_result;
