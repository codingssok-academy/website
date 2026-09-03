-- Growth 2.0 fresh test verification for 003_growth_records.sql.
-- Run only in the fresh Seoul test project after 001, 002, and 003.
-- All fake users and records are created inside one transaction and rolled back.

begin;

create temporary table growth_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into growth_verify_ids (label, id)
values
    ('student_user_a', extensions.gen_random_uuid()),
    ('student_user_b', extensions.gen_random_uuid()),
    ('parent_user', extensions.gen_random_uuid()),
    ('teacher_user', extensions.gen_random_uuid()),
    ('other_teacher_user', extensions.gen_random_uuid()),
    ('admin_user', extensions.gen_random_uuid()),
    ('student_a', extensions.gen_random_uuid()),
    ('student_b', extensions.gen_random_uuid()),
    ('record_a_draft', extensions.gen_random_uuid()),
    ('record_a_published', extensions.gen_random_uuid()),
    ('record_b_draft', extensions.gen_random_uuid()),
    ('record_b_published', extensions.gen_random_uuid());

grant select on growth_verify_ids to authenticated, anon;

do $$
declare
    v_public_table regclass;
    v_private_table regclass;
begin
    v_public_table := to_regclass('public.student_growth_records');
    v_private_table := to_regclass('private.student_growth_internal_notes');

    if v_public_table is null or v_private_table is null then
        raise exception '003 growth record tables are missing';
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
    format('fresh-growth-verify-%s@invalid.local', ids.id),
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
    jsonb_build_object('name', format('Fresh Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from growth_verify_ids ids
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
        (select id from growth_verify_ids where label = 'student_a'),
        (select id from growth_verify_ids where label = 'student_user_a'),
        'Fresh Verify Student A',
        'Test School',
        '1',
        'Test Class',
        'active',
        (select id from growth_verify_ids where label = 'admin_user')
    ),
    (
        (select id from growth_verify_ids where label = 'student_b'),
        (select id from growth_verify_ids where label = 'student_user_b'),
        'Fresh Verify Student B',
        'Test School',
        '2',
        'Test Class',
        'active',
        (select id from growth_verify_ids where label = 'admin_user')
    );

insert into public.parent_student_links (
    parent_user_id,
    student_id,
    relation,
    status,
    created_by
)
values (
    (select id from growth_verify_ids where label = 'parent_user'),
    (select id from growth_verify_ids where label = 'student_a'),
    'guardian',
    'active',
    (select id from growth_verify_ids where label = 'admin_user')
);

insert into public.teacher_student_assignments (
    teacher_id,
    student_id,
    status,
    assigned_by
)
values (
    (select id from growth_verify_ids where label = 'teacher_user'),
    (select id from growth_verify_ids where label = 'student_a'),
    'active',
    (select id from growth_verify_ids where label = 'admin_user')
);

insert into public.student_growth_records (
    id,
    student_id,
    period_month,
    learned_concepts,
    strengths,
    improvements,
    next_goal,
    lesson_summary,
    parent_message,
    status,
    created_by,
    updated_by
)
values
    (
        (select id from growth_verify_ids where label = 'record_a_draft'),
        (select id from growth_verify_ids where label = 'student_a'),
        date_trunc('month', current_date)::date,
        'Fake draft concept A',
        'Fake draft strength A',
        'Fake draft improvement A',
        'Fake draft goal A',
        'Fake draft summary A',
        'Fake draft message A',
        'draft',
        (select id from growth_verify_ids where label = 'teacher_user'),
        (select id from growth_verify_ids where label = 'teacher_user')
    ),
    (
        (select id from growth_verify_ids where label = 'record_a_published'),
        (select id from growth_verify_ids where label = 'student_a'),
        date_trunc('month', current_date)::date,
        'Fake published concept A',
        'Fake published strength A',
        'Fake published improvement A',
        'Fake published goal A',
        'Fake published summary A',
        'Fake published message A',
        'published',
        (select id from growth_verify_ids where label = 'teacher_user'),
        (select id from growth_verify_ids where label = 'teacher_user')
    ),
    (
        (select id from growth_verify_ids where label = 'record_b_draft'),
        (select id from growth_verify_ids where label = 'student_b'),
        date_trunc('month', current_date)::date,
        'Fake draft concept B',
        'Fake draft strength B',
        'Fake draft improvement B',
        'Fake draft goal B',
        'Fake draft summary B',
        'Fake draft message B',
        'draft',
        (select id from growth_verify_ids where label = 'admin_user'),
        (select id from growth_verify_ids where label = 'admin_user')
    ),
    (
        (select id from growth_verify_ids where label = 'record_b_published'),
        (select id from growth_verify_ids where label = 'student_b'),
        date_trunc('month', current_date)::date,
        'Fake published concept B',
        'Fake published strength B',
        'Fake published improvement B',
        'Fake published goal B',
        'Fake published summary B',
        'Fake published message B',
        'published',
        (select id from growth_verify_ids where label = 'admin_user'),
        (select id from growth_verify_ids where label = 'admin_user')
    );

insert into private.student_growth_internal_notes (
    record_id,
    note,
    created_by,
    updated_by
)
values (
    (select id from growth_verify_ids where label = 'record_a_draft'),
    'Fake private teacher note',
    (select id from growth_verify_ids where label = 'teacher_user'),
    (select id from growth_verify_ids where label = 'teacher_user')
);

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_verify_ids where label = 'student_user_a'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_total integer;
    v_drafts integer;
    v_updated integer;
begin
    select count(*), count(*) filter (where status = 'draft')
    into v_total, v_drafts
    from public.student_growth_records;

    if v_total <> 1 or v_drafts <> 0 then
        raise exception 'student visibility failed: total %, drafts %', v_total, v_drafts;
    end if;

    update public.student_growth_records
    set strengths = 'Student must not edit', updated_by = auth.uid()
    where student_id = (
        select id from growth_verify_ids where label = 'student_a'
    );
    get diagnostics v_updated = row_count;

    if v_updated <> 0 then
        raise exception 'student update unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_total integer;
    v_drafts integer;
begin
    select count(*), count(*) filter (where status = 'draft')
    into v_total, v_drafts
    from public.student_growth_records;

    if v_total <> 1 or v_drafts <> 0 then
        raise exception 'parent visibility failed: total %, drafts %', v_total, v_drafts;
    end if;

    begin
        insert into public.student_growth_records (
            student_id,
            period_month,
            learned_concepts,
            status,
            created_by,
            updated_by
        ) values (
            (select id from growth_verify_ids where label = 'student_a'),
            (date_trunc('month', current_date) + interval '2 months')::date,
            'Parent must not create',
            'draft',
            auth.uid(),
            auth.uid()
        );
        raise exception 'parent insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_verify_ids where label = 'teacher_user'),
    true
);

do $$
declare
    v_assigned integer;
    v_unassigned integer;
begin
    select count(*) into v_assigned
    from public.student_growth_records
    where student_id = (
        select id from growth_verify_ids where label = 'student_a'
    );

    select count(*) into v_unassigned
    from public.student_growth_records
    where student_id = (
        select id from growth_verify_ids where label = 'student_b'
    );

    if v_assigned <> 2 or v_unassigned <> 0 then
        raise exception 'teacher scope failed: assigned %, unassigned %',
            v_assigned, v_unassigned;
    end if;

    begin
        perform created_by from public.student_growth_records limit 1;
        raise exception 'authenticated audit-column read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        perform note from private.student_growth_internal_notes limit 1;
        raise exception 'private note read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

insert into public.student_growth_records (
    student_id,
    period_month,
    learned_concepts,
    strengths,
    improvements,
    next_goal,
    lesson_summary,
    parent_message,
    status,
    created_by,
    updated_by
)
values (
    (select id from growth_verify_ids where label = 'student_a'),
    (date_trunc('month', current_date) + interval '1 month')::date,
    'Fake teacher-created concept',
    'Fake teacher-created strength',
    'Fake teacher-created improvement',
    'Fake teacher-created goal',
    'Fake teacher-created summary',
    'Fake teacher-created message',
    'draft',
    auth.uid(),
    auth.uid()
);

do $$
begin
    begin
        insert into public.student_growth_records (
            student_id,
            period_month,
            learned_concepts,
            status,
            created_by,
            updated_by
        ) values (
            (select id from growth_verify_ids where label = 'student_b'),
            (date_trunc('month', current_date) + interval '1 month')::date,
            'Teacher must not create for unassigned student',
            'draft',
            auth.uid(),
            auth.uid()
        );
        raise exception 'unassigned teacher insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_verify_ids where label = 'other_teacher_user'),
    true
);

do $$
declare
    v_total integer;
begin
    select count(*) into v_total
    from public.student_growth_records;

    if v_total <> 0 then
        raise exception 'unassigned teacher read failed: visible %', v_total;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from growth_verify_ids where label = 'admin_user'),
    true
);

do $$
declare
    v_total integer;
begin
    select count(*) into v_total
    from public.student_growth_records;

    if v_total <> 5 then
        raise exception 'admin visibility failed: visible %', v_total;
    end if;
end;
$$;

reset role;
set local role anon;

do $$
begin
    begin
        perform 1 from public.student_growth_records limit 1;
        raise exception 'anonymous read unexpectedly succeeded';
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
        where email like 'fresh-growth-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name like 'Fresh Verify Student %'
    ) = 0
    then 'PASS: Growth 2.0 role checks passed and all fake data was rolled back.'
    else 'FAIL: fake verification data remains; stop and inspect before continuing.'
end as verification_result;
