-- Growth 2.0 fresh test verification for 007_learning_progress_xp.sql.
-- Run only in the fresh Seoul test project after 001 through 007.
-- All fake users, progress, and XP rows are created in one transaction and rolled back.

begin;

create temporary table learning_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into learning_verify_ids (label, id)
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

grant select on learning_verify_ids to authenticated, anon, service_role;

do $$
begin
    if to_regclass('public.user_progress') is null then
        raise exception '007 user_progress table is missing';
    end if;

    if to_regclass('public.xp_history') is null then
        raise exception '007 xp_history table is missing';
    end if;

    if to_regclass('public.user_course_progress') is null then
        raise exception '007 user_course_progress table is missing';
    end if;

    if to_regprocedure('public.growth_api_award_xp(text,text)') is null then
        raise exception '007 XP award API is missing';
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
    format('fresh-learning-verify-%s@invalid.local', ids.id),
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
    jsonb_build_object('name', format('Learning Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from learning_verify_ids ids
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
        (select id from learning_verify_ids where label = 'student_a'),
        (select id from learning_verify_ids where label = 'student_user_a'),
        'Learning Verify Student A',
        'Test School',
        '1',
        'Test Class',
        'active',
        (select id from learning_verify_ids where label = 'admin_user')
    ),
    (
        (select id from learning_verify_ids where label = 'student_b'),
        (select id from learning_verify_ids where label = 'student_user_b'),
        'Learning Verify Student B',
        'Test School',
        '2',
        'Test Class',
        'active',
        (select id from learning_verify_ids where label = 'admin_user')
    );

insert into public.parent_student_links (
    parent_user_id,
    student_id,
    relation,
    status,
    created_by
)
values (
    (select id from learning_verify_ids where label = 'parent_user'),
    (select id from learning_verify_ids where label = 'student_a'),
    'guardian',
    'active',
    (select id from learning_verify_ids where label = 'admin_user')
);

insert into public.teacher_student_assignments (
    teacher_id,
    student_id,
    status,
    assigned_by
)
values (
    (select id from learning_verify_ids where label = 'teacher_user'),
    (select id from learning_verify_ids where label = 'student_a'),
    'active',
    (select id from learning_verify_ids where label = 'admin_user')
);

do $$
declare
    v_bad_start integer;
begin
    select count(*) into v_bad_start
    from public.user_progress p
    where p.user_id in (
        (select id from learning_verify_ids where label = 'student_user_a'),
        (select id from learning_verify_ids where label = 'student_user_b'),
        (select id from learning_verify_ids where label = 'pending_user')
    )
      and (p.xp <> 0 or p.level <> 1);

    if v_bad_start <> 0 then
        raise exception 'student XP zero and level one initialization failed';
    end if;
end;
$$;

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from learning_verify_ids where label = 'student_user_a'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_visible integer;
    v_result jsonb;
    v_duplicate jsonb;
    v_xp integer;
    v_level integer;
    v_profile_xp integer;
    v_profile_level integer;
    v_course_progress integer;
    v_course_completed boolean;
    v_course_completed_at timestamptz;
begin
    select count(*) into v_visible
    from public.user_progress;

    if v_visible <> 1 then
        raise exception 'student progress visibility failed: visible %', v_visible;
    end if;

    begin
        update public.user_progress
        set xp = 9999
        where user_id = auth.uid();
        raise exception 'direct student XP update unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        insert into public.xp_history (
            user_id,
            action_type,
            item_id,
            xp_amount
        ) values (
            auth.uid(),
            'unit_complete',
            'direct-fake-award',
            200
        );
        raise exception 'direct student XP history insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    select public.growth_api_award_xp(
        'unit_complete',
        'fake-course:unit-1'
    ) into v_result;

    select public.growth_api_award_xp(
        'unit_complete',
        'fake-course:unit-1'
    ) into v_duplicate;

    if (v_result ->> 'delta')::integer <> 30
       or coalesce((v_result ->> 'duplicate')::boolean, true)
       or (v_duplicate ->> 'delta')::integer <> 0
       or not coalesce((v_duplicate ->> 'duplicate')::boolean, false) then
        raise exception 'XP award deduplication failed: first %, duplicate %',
            v_result, v_duplicate;
    end if;

    perform public.growth_api_award_xp('quiz_correct', 'fake-quiz-1');
    perform public.growth_api_award_xp('quiz_correct', 'fake-quiz-2');
    perform public.growth_api_award_xp('quiz_correct', 'fake-quiz-3');
    perform public.growth_api_award_xp('lesson_view', 'fake-lesson-1');

    select p.xp, p.level into v_xp, v_level
    from public.user_progress p
    where p.user_id = auth.uid();

    select p.total_xp, p.level into v_profile_xp, v_profile_level
    from public.profiles p
    where p.id = auth.uid();

    if v_xp <> 100 or v_level <> 2
       or v_profile_xp <> 100 or v_profile_level <> 2 then
        raise exception 'XP level or profile mirror failed: progress %/%, profile %/%',
            v_xp, v_level, v_profile_xp, v_profile_level;
    end if;

    begin
        perform public.growth_api_award_xp('unknown_action', 'fake-invalid');
        raise exception 'unknown XP action unexpectedly succeeded';
    exception
        when invalid_parameter_value then null;
    end;

    insert into public.user_course_progress (
        user_id,
        course_id,
        progress,
        completed_lessons,
        is_completed
    ) values (
        auth.uid(),
        'fake-course-a',
        50,
        '["fake-unit-1"]'::jsonb,
        false
    );

    update public.user_course_progress
    set is_completed = true
    where user_id = auth.uid()
      and course_id = 'fake-course-a';

    select p.progress, p.is_completed, p.completed_at
    into v_course_progress, v_course_completed, v_course_completed_at
    from public.user_course_progress p
    where p.user_id = auth.uid()
      and p.course_id = 'fake-course-a';

    if v_course_progress <> 100
       or not v_course_completed
       or v_course_completed_at is null then
        raise exception 'student course completion normalization failed';
    end if;

    begin
        insert into public.user_course_progress (
            user_id,
            course_id,
            progress
        ) values (
            (select id from learning_verify_ids where label = 'student_user_b'),
            'fake-other-student-course',
            50
        );
        raise exception 'student write to another student unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from learning_verify_ids where label = 'student_user_b'),
    true
);

do $$
declare
    v_result jsonb;
    v_xp integer;
    v_level integer;
begin
    for v_index in 1..21 loop
        select public.growth_api_award_xp(
            'code_run',
            format('fake-code-run-%s', v_index)
        ) into v_result;

        if v_index <= 20 and (
            (v_result ->> 'delta')::integer <> 5
            or coalesce((v_result ->> 'duplicate')::boolean, true)
        ) then
            raise exception 'code-run XP award failed at %: %', v_index, v_result;
        end if;

        if v_index = 21 and (
            (v_result ->> 'delta')::integer <> 0
            or v_result ->> 'reason' <> 'daily_cap'
        ) then
            raise exception 'code-run daily cap failed: %', v_result;
        end if;
    end loop;

    select p.xp, p.level into v_xp, v_level
    from public.user_progress p
    where p.user_id = auth.uid();

    if v_xp <> 100 or v_level <> 2 then
        raise exception 'code-run capped XP or level failed: %/%', v_xp, v_level;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from learning_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_progress integer;
    v_history integer;
    v_courses integer;
    v_changed integer;
begin
    select count(*) into v_progress from public.user_progress;
    select count(*) into v_history from public.xp_history;
    select count(*) into v_courses from public.user_course_progress;

    if v_progress <> 1 or v_history <> 5 or v_courses <> 1 then
        raise exception 'parent learning visibility failed: progress %, history %, courses %',
            v_progress, v_history, v_courses;
    end if;

    update public.user_course_progress
    set progress = 0
    where course_id = 'fake-course-a';
    get diagnostics v_changed = row_count;

    if v_changed <> 0 then
        raise exception 'parent course progress update unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from learning_verify_ids where label = 'teacher_user'),
    true
);

do $$
declare
    v_progress integer;
    v_history integer;
    v_courses integer;
begin
    select count(*) into v_progress from public.user_progress;
    select count(*) into v_history from public.xp_history;
    select count(*) into v_courses from public.user_course_progress;

    if v_progress <> 1 or v_history <> 5 or v_courses <> 1 then
        raise exception 'assigned teacher learning visibility failed: progress %, history %, courses %',
            v_progress, v_history, v_courses;
    end if;

    begin
        perform public.growth_api_award_xp('lesson_view', 'teacher-must-not-award');
        raise exception 'teacher XP award unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from learning_verify_ids where label = 'other_teacher_user'),
    true
);

do $$
declare
    v_progress integer;
    v_history integer;
    v_courses integer;
begin
    select count(*) into v_progress from public.user_progress;
    select count(*) into v_history from public.xp_history;
    select count(*) into v_courses from public.user_course_progress;

    if v_progress <> 0 or v_history <> 0 or v_courses <> 0 then
        raise exception 'unassigned teacher learning read unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from learning_verify_ids where label = 'pending_user'),
    true
);

do $$
declare
    v_progress integer;
begin
    select count(*) into v_progress from public.user_progress;

    if v_progress <> 0 then
        raise exception 'pending account learning read unexpectedly succeeded';
    end if;

    begin
        perform public.growth_api_award_xp('lesson_view', 'pending-must-not-award');
        raise exception 'pending account XP award unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from learning_verify_ids where label = 'admin_user'),
    true
);

do $$
declare
    v_progress integer;
    v_history integer;
    v_courses integer;
begin
    select count(*) into v_progress from public.user_progress;
    select count(*) into v_history from public.xp_history;
    select count(*) into v_courses from public.user_course_progress;

    if v_progress <> 2 or v_history <> 25 or v_courses <> 1 then
        raise exception 'admin learning visibility failed: progress %, history %, courses %',
            v_progress, v_history, v_courses;
    end if;
end;
$$;

reset role;
set local role service_role;

do $$
declare
    v_progress integer;
    v_history integer;
    v_courses integer;
begin
    select count(*) into v_progress
    from public.user_progress
    where user_id in (
        (select id from learning_verify_ids where label = 'student_user_a'),
        (select id from learning_verify_ids where label = 'student_user_b'),
        (select id from learning_verify_ids where label = 'pending_user')
    );

    select count(*) into v_history
    from public.xp_history
    where item_id like 'fake-%';

    select count(*) into v_courses
    from public.user_course_progress
    where course_id like 'fake-%';

    if v_progress <> 3 or v_history <> 25 or v_courses <> 1 then
        raise exception 'service learning visibility failed: progress %, history %, courses %',
            v_progress, v_history, v_courses;
    end if;
end;
$$;

reset role;
set local role anon;

do $$
begin
    begin
        perform 1 from public.user_progress limit 1;
        raise exception 'anonymous progress read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        perform 1 from public.xp_history limit 1;
        raise exception 'anonymous XP history read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        perform 1 from public.user_course_progress limit 1;
        raise exception 'anonymous course progress read unexpectedly succeeded';
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
        where email like 'fresh-learning-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name like 'Learning Verify Student %'
    ) = 0
    and (
        select count(*)
        from public.xp_history
        where item_id like 'fake-%'
    ) = 0
    and (
        select count(*)
        from public.user_course_progress
        where course_id like 'fake-%'
    ) = 0
    then 'PASS: Learning progress and XP role checks passed and all fake data was rolled back.'
    else 'FAIL: fake learning verification data remains; stop before continuing.'
end as verification_result;
