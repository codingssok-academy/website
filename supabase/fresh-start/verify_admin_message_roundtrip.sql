-- Growth 2.0 fresh test: student -> admin -> student message round trip.
-- Run only in the fresh Seoul test project after 001 through 011.
-- Every fake account, student, and message is rolled back before the final result.

begin;

create temporary table admin_message_roundtrip_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into admin_message_roundtrip_ids (label, id)
values
    ('student_user', extensions.gen_random_uuid()),
    ('admin_user', extensions.gen_random_uuid()),
    ('student', extensions.gen_random_uuid());

grant select on admin_message_roundtrip_ids to authenticated, service_role;

do $$
begin
    if to_regclass('public.direct_messages') is null then
        raise exception '010 direct_messages table is missing';
    end if;

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
    format('fresh-admin-roundtrip-%s@invalid.local', ids.id),
    crypt('temporary-test-only', gen_salt('bf')),
    now(),
    jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'role', case when ids.label = 'admin_user' then 'admin' else 'student' end
    ),
    jsonb_build_object(
        'name', case
            when ids.label = 'admin_user' then 'Roundtrip Verify Admin'
            else 'Roundtrip Verify Student'
        end
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
from admin_message_roundtrip_ids ids
where ids.label in ('student_user', 'admin_user');

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
    (select id from admin_message_roundtrip_ids where label = 'student'),
    (select id from admin_message_roundtrip_ids where label = 'student_user'),
    'Roundtrip Verify Student',
    'Test School',
    '1',
    'Test Class',
    'active',
    (select id from admin_message_roundtrip_ids where label = 'admin_user')
);

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from admin_message_roundtrip_ids where label = 'student_user'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_admin_visible integer;
    v_question_id uuid;
    v_student_id uuid;
    v_sender_id uuid;
    v_sender_name text;
    v_sender_role text;
begin
    select count(*)
    into v_admin_visible
    from public.codingssok_student_message_recipients()
    where receiver_id = (
        select id from admin_message_roundtrip_ids where label = 'admin_user'
    )
      and receiver_role = 'admin';

    if v_admin_visible <> 1 then
        raise exception 'student recipient list did not include the approved admin';
    end if;

    insert into public.direct_messages (
        sender_id,
        receiver_id,
        sender_name,
        content
    ) values (
        extensions.gen_random_uuid(),
        (select id from admin_message_roundtrip_ids where label = 'admin_user'),
        'Forged Student Name',
        'Fresh Admin Roundtrip Student Question'
    )
    returning id, student_id, sender_id, sender_name, sender_role
    into v_question_id, v_student_id, v_sender_id, v_sender_name, v_sender_role;

    if v_student_id <> (select id from admin_message_roundtrip_ids where label = 'student')
       or v_sender_id <> auth.uid()
       or v_sender_name <> 'Roundtrip Verify Student'
       or v_sender_role <> 'student' then
        raise exception 'student question identity normalization failed';
    end if;

    if (
        select count(*)
        from public.direct_messages
        where id = v_question_id
          and sender_id = auth.uid()
          and receiver_id = (
              select id from admin_message_roundtrip_ids where label = 'admin_user'
          )
    ) <> 1 then
        raise exception 'student question was not visible to the student';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from admin_message_roundtrip_ids where label = 'admin_user'),
    true
);

do $$
declare
    v_question_id uuid;
    v_reply_id uuid;
    v_sender_id uuid;
    v_sender_name text;
    v_sender_role text;
    v_is_read boolean;
    v_read_at timestamptz;
begin
    select id
    into v_question_id
    from public.direct_messages
    where sender_id = (
        select id from admin_message_roundtrip_ids where label = 'student_user'
    )
      and receiver_id = auth.uid()
      and content = 'Fresh Admin Roundtrip Student Question';

    if v_question_id is null then
        raise exception 'admin could not see the student question';
    end if;

    update public.direct_messages
    set is_read = true
    where id = v_question_id;

    select is_read, read_at
    into v_is_read, v_read_at
    from public.direct_messages
    where id = v_question_id;

    if not v_is_read or v_read_at is null then
        raise exception 'admin read receipt was not stored';
    end if;

    insert into public.direct_messages (
        sender_id,
        receiver_id,
        sender_name,
        content
    ) values (
        extensions.gen_random_uuid(),
        (select id from admin_message_roundtrip_ids where label = 'student_user'),
        'Forged Admin Name',
        'Fresh Admin Roundtrip Admin Reply'
    )
    returning id, sender_id, sender_name, sender_role
    into v_reply_id, v_sender_id, v_sender_name, v_sender_role;

    if v_sender_id <> auth.uid()
       or v_sender_name <> 'Roundtrip Verify Admin'
       or v_sender_role <> 'admin' then
        raise exception 'admin reply identity normalization failed';
    end if;

    if (
        select count(*)
        from public.direct_messages
        where (
            sender_id = auth.uid()
            and receiver_id = (
                select id from admin_message_roundtrip_ids where label = 'student_user'
            )
        ) or (
            receiver_id = auth.uid()
            and sender_id = (
                select id from admin_message_roundtrip_ids where label = 'student_user'
            )
        )
    ) <> 2 then
        raise exception 'admin conversation query did not return exactly the question and reply';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from admin_message_roundtrip_ids where label = 'student_user'),
    true
);

do $$
declare
    v_reply_id uuid;
    v_is_read boolean;
    v_read_at timestamptz;
begin
    select id
    into v_reply_id
    from public.direct_messages
    where sender_id = (
        select id from admin_message_roundtrip_ids where label = 'admin_user'
    )
      and receiver_id = auth.uid()
      and content = 'Fresh Admin Roundtrip Admin Reply';

    if v_reply_id is null then
        raise exception 'student could not see the admin reply';
    end if;

    if (
        select count(*)
        from public.direct_messages
        where sender_id = auth.uid()
           or receiver_id = auth.uid()
    ) <> 2 then
        raise exception 'student conversation query did not return exactly the question and reply';
    end if;

    update public.direct_messages
    set is_read = true
    where id = v_reply_id;

    select is_read, read_at
    into v_is_read, v_read_at
    from public.direct_messages
    where id = v_reply_id;

    if not v_is_read or v_read_at is null then
        raise exception 'student read receipt for admin reply was not stored';
    end if;
end;
$$;

reset role;
rollback;

select case
    when (
        select count(*)
        from auth.users
        where email like 'fresh-admin-roundtrip-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name = 'Roundtrip Verify Student'
    ) = 0
    and (
        select count(*)
        from public.direct_messages
        where content like 'Fresh Admin Roundtrip %'
    ) = 0
    then 'PASS: Student-admin message round trip passed and all fake data was rolled back.'
    else 'FAIL: fake student-admin round-trip data remains; stop before continuing.'
end as verification_result;
