-- Verification for 012_growth_record_management_api.sql.
-- Run only in the fresh Seoul test project after 012.
-- All fake users and records are created inside one transaction and rolled back.

begin;

create temporary table growth_api_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into growth_api_verify_ids (label, id)
values
    ('student_user', extensions.gen_random_uuid()),
    ('parent_user', extensions.gen_random_uuid()),
    ('teacher_user', extensions.gen_random_uuid()),
    ('other_teacher_user', extensions.gen_random_uuid()),
    ('student', extensions.gen_random_uuid());

grant select, insert, update on growth_api_verify_ids to authenticated;

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
    format('fresh-growth-api-verify-%s@invalid.local', ids.id),
    extensions.crypt('temporary-test-only', extensions.gen_salt('bf')),
    now(),
    jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'role', case ids.label
            when 'parent_user' then 'parent'
            when 'teacher_user' then 'teacher'
            when 'other_teacher_user' then 'teacher'
            else 'student'
        end
    ),
    jsonb_build_object('name', format('Fresh Growth API Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from growth_api_verify_ids ids
where ids.label in ('student_user', 'parent_user', 'teacher_user', 'other_teacher_user');

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
    (select id from growth_api_verify_ids where label = 'student'),
    (select id from growth_api_verify_ids where label = 'student_user'),
    'Fresh Growth API Fake Student',
    'Fake School',
    '1',
    'Fake Class',
    'active',
    (select id from growth_api_verify_ids where label = 'teacher_user')
);

insert into public.teacher_student_assignments (
    teacher_id,
    student_id,
    status,
    assigned_by
)
values (
    (select id from growth_api_verify_ids where label = 'teacher_user'),
    (select id from growth_api_verify_ids where label = 'student'),
    'active',
    (select id from growth_api_verify_ids where label = 'teacher_user')
);

insert into public.parent_student_links (
    parent_user_id,
    student_id,
    relation,
    status,
    created_by
)
values (
    (select id from growth_api_verify_ids where label = 'parent_user'),
    (select id from growth_api_verify_ids where label = 'student'),
    'guardian',
    'active',
    (select id from growth_api_verify_ids where label = 'teacher_user')
);

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_api_verify_ids where label = 'teacher_user'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into growth_api_verify_ids (label, id)
select
    'record',
    public.growth_api_teacher_save_record(
        null::uuid,
        (select id from growth_api_verify_ids where label = 'student'),
        date_trunc('month', current_date)::date,
        'Fake Class',
        'Fake private draft concepts',
        'Fake private draft strengths',
        'Fake private draft improvements',
        'Fake private draft goal',
        'Fake private draft summary',
        'Fake private draft parent message',
        'draft',
        'Fake teacher-only memo',
        'Fake monthly entry note',
        'Fake move possibility'
    );

do $$
declare
    v_total integer;
    v_teacher_memo text;
    v_entry_note text;
begin
    select count(*), max(records.teacher_memo), max(records.entry_note)
    into v_total, v_teacher_memo, v_entry_note
    from public.growth_api_teacher_list_records() records;

    if v_total <> 1
       or v_teacher_memo <> 'Fake teacher-only memo'
       or v_entry_note <> 'Fake monthly entry note' then
        raise exception 'teacher draft/private-note check failed';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_api_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_teacher_api_rows integer;
    v_public_rows integer;
begin
    select count(*) into v_teacher_api_rows
    from public.growth_api_teacher_list_records();

    select count(*) into v_public_rows
    from public.student_growth_records;

    if v_teacher_api_rows <> 0 or v_public_rows <> 0 then
        raise exception 'parent saw draft or teacher-only API rows';
    end if;

    begin
        perform public.growth_api_teacher_save_record(
            null::uuid,
            (select id from growth_api_verify_ids where label = 'student'),
            date_trunc('month', current_date)::date,
            '', '', '', '', '', '', '', 'draft', '', '', ''
        );
        raise exception 'parent save unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        perform note from private.student_growth_internal_notes limit 1;
        raise exception 'parent private-note read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_api_verify_ids where label = 'other_teacher_user'),
    true
);

do $$
declare
    v_total integer;
begin
    select count(*) into v_total
    from public.growth_api_teacher_list_records();

    if v_total <> 0 then
        raise exception 'unassigned teacher saw a managed record';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_api_verify_ids where label = 'teacher_user'),
    true
);

select public.growth_api_teacher_save_record(
    (select id from growth_api_verify_ids where label = 'record'),
    (select id from growth_api_verify_ids where label = 'student'),
    date_trunc('month', current_date)::date,
    'Fake Class',
    'Fake published concepts',
    'Fake published strengths',
    'Fake published improvements',
    'Fake published goal',
    'Fake published summary',
    'Fake published parent message',
    'published',
    'Fake teacher-only memo',
    'Fake monthly entry note',
    'Fake move possibility'
);

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_api_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_public_rows integer;
begin
    select count(*) into v_public_rows
    from public.student_growth_records
    where status = 'published'
      and learned_concepts = 'Fake published concepts';

    if v_public_rows <> 1 then
        raise exception 'parent did not see the published safe record';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_api_verify_ids where label = 'teacher_user'),
    true
);

select public.growth_api_teacher_archive_records(
    (select id from growth_api_verify_ids where label = 'student')
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.growth_api_teacher_list_records();

    if v_visible <> 0 then
        raise exception 'archived record remained in the teacher list';
    end if;
end;
$$;

reset role;
rollback;

select case
    when (
        select count(*)
        from auth.users
        where email like 'fresh-growth-api-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name = 'Fresh Growth API Fake Student'
    ) = 0
    and (
        select count(*)
        from public.student_growth_records
        where learned_concepts like 'Fake % concepts'
    ) = 0
    then 'PASS: Growth record management API checks passed and all fake data was rolled back.'
    else 'FAIL: fake verification data remains; stop and inspect before continuing.'
end as verification_result;
