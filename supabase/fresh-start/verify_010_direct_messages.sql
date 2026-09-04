-- Growth 2.0 fresh test verification for 010_direct_messages.sql.
-- Run only in the fresh Seoul test project after 001 through 010.
-- All fake users, links, and messages are created in one transaction and rolled back.

begin;

create temporary table message_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into message_verify_ids (label, id)
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

grant select on message_verify_ids to authenticated, anon, service_role;

do $$
begin
    if to_regclass('public.direct_messages') is null then
        raise exception '010 direct_messages table is missing';
    end if;

    if to_regprocedure('private.prepare_direct_message()') is null
       or to_regprocedure('private.prepare_direct_message_read()') is null then
        raise exception '010 direct-message protection functions are missing';
    end if;

    if not exists (
        select 1
        from pg_catalog.pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'direct_messages'
    ) then
        raise exception 'direct_messages realtime publication is missing';
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
    format('fresh-message-verify-%s@invalid.local', ids.id),
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
    jsonb_build_object('name', format('Message Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from message_verify_ids ids
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
        (select id from message_verify_ids where label = 'student_a'),
        (select id from message_verify_ids where label = 'student_user_a'),
        'Message Verify Student A',
        'Test School',
        '1',
        'Test Class',
        'active',
        (select id from message_verify_ids where label = 'admin_user')
    ),
    (
        (select id from message_verify_ids where label = 'student_b'),
        (select id from message_verify_ids where label = 'student_user_b'),
        'Message Verify Student B',
        'Test School',
        '2',
        'Test Class',
        'active',
        (select id from message_verify_ids where label = 'admin_user')
    );

insert into public.parent_student_links (
    parent_user_id,
    student_id,
    relation,
    status,
    created_by
)
values (
    (select id from message_verify_ids where label = 'parent_user'),
    (select id from message_verify_ids where label = 'student_a'),
    'guardian',
    'active',
    (select id from message_verify_ids where label = 'admin_user')
);

insert into public.teacher_student_assignments (
    teacher_id,
    student_id,
    status,
    assigned_by
)
values (
    (select id from message_verify_ids where label = 'teacher_user'),
    (select id from message_verify_ids where label = 'student_a'),
    'active',
    (select id from message_verify_ids where label = 'admin_user')
);

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from message_verify_ids where label = 'student_user_a'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_message_id uuid;
    v_student_id uuid;
    v_sender_id uuid;
    v_sender_name text;
    v_sender_role text;
    v_is_read boolean;
    v_changed integer;
begin
    insert into public.direct_messages (
        sender_id,
        receiver_id,
        sender_name,
        content
    ) values (
        (select id from message_verify_ids where label = 'student_user_b'),
        (select id from message_verify_ids where label = 'teacher_user'),
        'Forged Student Name',
        'Fresh Message Verify Student To Teacher'
    ) returning id, student_id, sender_id, sender_name, sender_role, is_read
      into v_message_id, v_student_id, v_sender_id, v_sender_name, v_sender_role, v_is_read;

    if v_student_id <> (select id from message_verify_ids where label = 'student_a')
       or v_sender_id <> auth.uid()
       or v_sender_name <> 'Message Verify Student A'
       or v_sender_role <> 'student'
       or v_is_read then
        raise exception 'student sender identity normalization failed';
    end if;

    update public.direct_messages
    set is_read = true
    where id = v_message_id;
    get diagnostics v_changed = row_count;

    if v_changed <> 0 then
        raise exception 'message sender unexpectedly marked own message as read';
    end if;

    begin
        update public.direct_messages
        set content = 'Student must not edit a sent message'
        where id = v_message_id;
        raise exception 'student message content update unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        delete from public.direct_messages where id = v_message_id;
        raise exception 'student message delete unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        insert into public.direct_messages (
            sender_id, receiver_id, sender_name, content
        ) values (
            auth.uid(),
            (select id from message_verify_ids where label = 'other_teacher_user'),
            'Message Verify Student A',
            'Fresh Message Verify Must Block Unassigned Teacher'
        );
        raise exception 'student message to unassigned teacher unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        insert into public.direct_messages (
            sender_id, receiver_id, sender_name, content
        ) values (
            auth.uid(),
            (select id from message_verify_ids where label = 'student_user_b'),
            'Message Verify Student A',
            'Fresh Message Verify Must Block Student Recipient'
        );
        raise exception 'student-to-student direct message unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from message_verify_ids where label = 'teacher_user'),
    true
);

do $$
declare
    v_visible integer;
    v_reply_id uuid;
    v_sender_id uuid;
    v_sender_name text;
    v_sender_role text;
    v_is_read boolean;
    v_read_at timestamptz;
begin
    select count(*) into v_visible from public.direct_messages;
    if v_visible <> 1 then
        raise exception 'assigned teacher message visibility failed: visible %', v_visible;
    end if;

    insert into public.direct_messages (
        sender_id,
        receiver_id,
        sender_name,
        content
    ) values (
        (select id from message_verify_ids where label = 'admin_user'),
        (select id from message_verify_ids where label = 'student_user_a'),
        'Forged Teacher Name',
        'Fresh Message Verify Teacher Reply'
    ) returning id, sender_id, sender_name, sender_role
      into v_reply_id, v_sender_id, v_sender_name, v_sender_role;

    if v_sender_id <> auth.uid()
       or v_sender_name <> 'Message Verify teacher_user'
       or v_sender_role <> 'teacher' then
        raise exception 'teacher sender identity normalization failed';
    end if;

    update public.direct_messages
    set is_read = true
    where content = 'Fresh Message Verify Student To Teacher';

    select is_read, read_at
    into v_is_read, v_read_at
    from public.direct_messages
    where content = 'Fresh Message Verify Student To Teacher';

    if not v_is_read or v_read_at is null then
        raise exception 'assigned teacher read receipt failed';
    end if;

    begin
        insert into public.direct_messages (
            sender_id, receiver_id, sender_name, content
        ) values (
            auth.uid(),
            (select id from message_verify_ids where label = 'student_user_b'),
            'Message Verify teacher_user',
            'Fresh Message Verify Must Block Unassigned Student'
        );
        raise exception 'teacher reply to unassigned student unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from message_verify_ids where label = 'other_teacher_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible from public.direct_messages;
    if v_visible <> 0 then
        raise exception 'unassigned teacher message read unexpectedly succeeded';
    end if;

    begin
        insert into public.direct_messages (
            sender_id, receiver_id, sender_name, content
        ) values (
            auth.uid(),
            (select id from message_verify_ids where label = 'student_user_a'),
            'Message Verify other_teacher_user',
            'Fresh Message Verify Must Block Other Teacher'
        );
        raise exception 'unassigned teacher message insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from message_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible from public.direct_messages;
    if v_visible <> 0 then
        raise exception 'parent message read unexpectedly succeeded';
    end if;

    begin
        insert into public.direct_messages (
            sender_id, receiver_id, sender_name, content
        ) values (
            auth.uid(),
            (select id from message_verify_ids where label = 'teacher_user'),
            'Message Verify parent_user',
            'Fresh Message Verify Must Block Parent'
        );
        raise exception 'parent direct message unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from message_verify_ids where label = 'pending_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible from public.direct_messages;
    if v_visible <> 0 then
        raise exception 'pending account message read unexpectedly succeeded';
    end if;

    begin
        insert into public.direct_messages (
            sender_id, receiver_id, sender_name, content
        ) values (
            auth.uid(),
            (select id from message_verify_ids where label = 'teacher_user'),
            'Message Verify pending_user',
            'Fresh Message Verify Must Block Pending Account'
        );
        raise exception 'pending account direct message unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from message_verify_ids where label = 'admin_user'),
    true
);

do $$
declare
    v_visible integer;
    v_admin_message uuid;
    v_sender_id uuid;
    v_sender_role text;
    v_changed integer;
begin
    select count(*) into v_visible from public.direct_messages;
    if v_visible <> 2 then
        raise exception 'admin message visibility failed: visible %', v_visible;
    end if;

    insert into public.direct_messages (
        sender_id,
        receiver_id,
        sender_name,
        content
    ) values (
        (select id from message_verify_ids where label = 'teacher_user'),
        (select id from message_verify_ids where label = 'student_user_b'),
        'Forged Admin Name',
        'Fresh Message Verify Admin Reply'
    ) returning id, sender_id, sender_role
      into v_admin_message, v_sender_id, v_sender_role;

    if v_sender_id <> auth.uid() or v_sender_role <> 'admin' then
        raise exception 'admin sender identity normalization failed';
    end if;

    update public.direct_messages
    set is_read = true
    where id = v_admin_message;
    get diagnostics v_changed = row_count;

    if v_changed <> 0 then
        raise exception 'admin sender unexpectedly marked own message as read';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from message_verify_ids where label = 'student_user_b'),
    true
);

do $$
declare
    v_visible integer;
    v_is_read boolean;
    v_read_at timestamptz;
begin
    select count(*) into v_visible from public.direct_messages;
    if v_visible <> 1 then
        raise exception 'second student message visibility failed: visible %', v_visible;
    end if;

    update public.direct_messages
    set is_read = true
    where content = 'Fresh Message Verify Admin Reply';

    select is_read, read_at
    into v_is_read, v_read_at
    from public.direct_messages
    where content = 'Fresh Message Verify Admin Reply';

    if not v_is_read or v_read_at is null then
        raise exception 'student read receipt failed';
    end if;
end;
$$;

reset role;
set local role service_role;

do $$
declare
    v_visible integer;
    v_spoofed integer;
begin
    select count(*) into v_visible
    from public.direct_messages
    where content like 'Fresh Message Verify %';

    select count(*) into v_spoofed
    from public.direct_messages
    where sender_name like 'Forged %';

    if v_visible <> 3 or v_spoofed <> 0 then
        raise exception 'service message audit failed: visible %, spoofed %',
            v_visible, v_spoofed;
    end if;
end;
$$;

reset role;
set local role anon;

do $$
begin
    begin
        perform 1 from public.direct_messages limit 1;
        raise exception 'anonymous direct-message read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        insert into public.direct_messages (
            sender_id, receiver_id, sender_name, content
        ) values (
            extensions.gen_random_uuid(),
            extensions.gen_random_uuid(),
            'Anonymous',
            'Fresh Message Verify Must Block Anonymous'
        );
        raise exception 'anonymous direct-message insert unexpectedly succeeded';
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
        where email like 'fresh-message-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name like 'Message Verify Student %'
    ) = 0
    and (
        select count(*)
        from public.direct_messages
        where content like 'Fresh Message Verify %'
    ) = 0
    then 'PASS: Direct-message role checks passed and all fake data was rolled back.'
    else 'FAIL: fake direct-message verification data remains; stop before continuing.'
end as verification_result;
