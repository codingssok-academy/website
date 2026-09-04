-- Growth 2.0 fresh test verification for 011_student_message_recipients.sql.
-- All fake accounts and assignments are rolled back at the end.

begin;

create temporary table recipient_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into recipient_verify_ids (label, id)
values
    ('student_user', extensions.gen_random_uuid()),
    ('parent_user', extensions.gen_random_uuid()),
    ('teacher_user', extensions.gen_random_uuid()),
    ('other_teacher_user', extensions.gen_random_uuid()),
    ('admin_user', extensions.gen_random_uuid()),
    ('pending_user', extensions.gen_random_uuid()),
    ('student', extensions.gen_random_uuid());

grant select on recipient_verify_ids to authenticated, anon, service_role;

do $$
begin
    if to_regprocedure('public.codingssok_student_message_recipients()') is null then
        raise exception '011 student message recipient function is missing';
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
    format('fresh-recipient-verify-%s@invalid.local', ids.id),
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
    jsonb_build_object('name', format('Recipient Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from recipient_verify_ids ids
where ids.label <> 'student';

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
values (
    (select id from recipient_verify_ids where label = 'student'),
    (select id from recipient_verify_ids where label = 'student_user'),
    'Recipient Verify Student',
    'Test School',
    '1',
    'Test Class',
    'active',
    (select id from recipient_verify_ids where label = 'admin_user')
);

insert into public.parent_student_links (
    parent_user_id,
    student_id,
    relation,
    status,
    created_by
)
values (
    (select id from recipient_verify_ids where label = 'parent_user'),
    (select id from recipient_verify_ids where label = 'student'),
    'guardian',
    'active',
    (select id from recipient_verify_ids where label = 'admin_user')
);

insert into public.teacher_student_assignments (
    teacher_id,
    student_id,
    status,
    assigned_by
)
values (
    (select id from recipient_verify_ids where label = 'teacher_user'),
    (select id from recipient_verify_ids where label = 'student'),
    'active',
    (select id from recipient_verify_ids where label = 'admin_user')
);

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from recipient_verify_ids where label = 'student_user'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_visible integer;
    v_teacher integer;
    v_admin integer;
    v_other_teacher integer;
begin
    select
        count(*),
        count(*) filter (
            where receiver_id = (select id from recipient_verify_ids where label = 'teacher_user')
              and receiver_role = 'teacher'
        ),
        count(*) filter (
            where receiver_id = (select id from recipient_verify_ids where label = 'admin_user')
              and receiver_role = 'admin'
        ),
        count(*) filter (
            where receiver_id = (select id from recipient_verify_ids where label = 'other_teacher_user')
        )
    into v_visible, v_teacher, v_admin, v_other_teacher
    from public.codingssok_student_message_recipients();

    if v_visible <> 2 or v_teacher <> 1 or v_admin <> 1 or v_other_teacher <> 0 then
        raise exception
            'student recipient scope failed: visible %, teacher %, admin %, other teacher %',
            v_visible, v_teacher, v_admin, v_other_teacher;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from recipient_verify_ids where label = 'parent_user'),
    true
);

do $$
begin
    if (select count(*) from public.codingssok_student_message_recipients()) <> 0 then
        raise exception 'parent unexpectedly received student message recipients';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from recipient_verify_ids where label = 'teacher_user'),
    true
);

do $$
begin
    if (select count(*) from public.codingssok_student_message_recipients()) <> 0 then
        raise exception 'teacher unexpectedly received student message recipients';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from recipient_verify_ids where label = 'pending_user'),
    true
);

do $$
begin
    if (select count(*) from public.codingssok_student_message_recipients()) <> 0 then
        raise exception 'pending account unexpectedly received student message recipients';
    end if;
end;
$$;

reset role;
set local role anon;

do $$
begin
    begin
        perform 1 from public.codingssok_student_message_recipients();
        raise exception 'anonymous recipient discovery unexpectedly succeeded';
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
        where email like 'fresh-recipient-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name = 'Recipient Verify Student'
    ) = 0
    then 'PASS: Student message recipient checks passed and all fake data was rolled back.'
    else 'FAIL: fake recipient verification data remains; stop before continuing.'
end as verification_result;
