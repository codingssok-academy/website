-- Growth 2.0 fresh test verification for 006_announcements.sql.
-- Run only in the fresh Seoul test project after 001 through 006.
-- All fake users and announcements are created in one transaction and rolled back.

begin;

create temporary table announcement_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into announcement_verify_ids (label, id)
values
    ('student_user', extensions.gen_random_uuid()),
    ('parent_user', extensions.gen_random_uuid()),
    ('teacher_user', extensions.gen_random_uuid()),
    ('admin_user', extensions.gen_random_uuid()),
    ('pending_user', extensions.gen_random_uuid()),
    ('published_message', extensions.gen_random_uuid()),
    ('draft_message', extensions.gen_random_uuid()),
    ('archived_message', extensions.gen_random_uuid());

grant select on announcement_verify_ids to authenticated, anon, service_role;

do $$
begin
    if to_regclass('public.announcements') is null then
        raise exception '006 announcements table is missing';
    end if;

    if not exists (
        select 1
        from pg_catalog.pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'announcements'
    ) then
        raise exception 'announcements realtime publication is missing';
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
    format('fresh-announcement-verify-%s@invalid.local', ids.id),
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
            'role', replace(ids.label, '_user', '')
        )
    end,
    jsonb_build_object('name', format('Announcement Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from announcement_verify_ids ids
where ids.label in (
    'student_user',
    'parent_user',
    'teacher_user',
    'admin_user',
    'pending_user'
);

insert into public.announcements (
    id,
    title,
    content,
    author_id,
    is_pinned,
    status
)
values
    (
        (select id from announcement_verify_ids where label = 'published_message'),
        'Fresh Announcement Verify Published',
        'Fake published message for permission verification.',
        (select id from announcement_verify_ids where label = 'admin_user'),
        true,
        'published'
    ),
    (
        (select id from announcement_verify_ids where label = 'draft_message'),
        'Fresh Announcement Verify Draft',
        'Fake draft message for permission verification.',
        (select id from announcement_verify_ids where label = 'admin_user'),
        false,
        'draft'
    ),
    (
        (select id from announcement_verify_ids where label = 'archived_message'),
        'Fresh Announcement Verify Archived',
        'Fake archived message for permission verification.',
        (select id from announcement_verify_ids where label = 'admin_user'),
        false,
        'archived'
    );

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from announcement_verify_ids where label = 'student_user'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_visible integer;
    v_changed integer;
begin
    select count(*) into v_visible
    from public.announcements;

    if v_visible <> 1 then
        raise exception 'student announcement visibility failed: visible %', v_visible;
    end if;

    begin
        perform author_id from public.announcements limit 1;
        raise exception 'announcement author id unexpectedly visible to student';
    exception
        when insufficient_privilege then null;
    end;

    update public.announcements
    set title = 'Student must not update announcements'
    where id = (
        select id from announcement_verify_ids where label = 'published_message'
    );
    get diagnostics v_changed = row_count;

    if v_changed <> 0 then
        raise exception 'student announcement update unexpectedly succeeded';
    end if;

    begin
        insert into public.announcements (
            title,
            content,
            author_id
        ) values (
            'Student must not create announcements',
            'This fake message must be blocked.',
            auth.uid()
        );
        raise exception 'student announcement insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from announcement_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.announcements;

    if v_visible <> 1 then
        raise exception 'parent announcement visibility failed: visible %', v_visible;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from announcement_verify_ids where label = 'teacher_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.announcements;

    if v_visible <> 1 then
        raise exception 'teacher announcement visibility failed: visible %', v_visible;
    end if;

    begin
        insert into public.announcements (
            title,
            content,
            author_id
        ) values (
            'Teacher must not create announcements',
            'This fake message must be blocked.',
            auth.uid()
        );
        raise exception 'teacher announcement insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from announcement_verify_ids where label = 'pending_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible
    from public.announcements;

    if v_visible <> 0 then
        raise exception 'pending account announcement read unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from announcement_verify_ids where label = 'admin_user'),
    true
);

do $$
declare
    v_visible integer;
    v_changed integer;
    v_admin_message uuid;
begin
    select count(*) into v_visible
    from public.announcements;

    if v_visible <> 3 then
        raise exception 'admin announcement visibility failed: visible %', v_visible;
    end if;

    insert into public.announcements (
        title,
        content,
        author_id,
        is_pinned
    ) values (
        'Fresh Announcement Verify Admin Created',
        'Fake admin-created message for permission verification.',
        auth.uid(),
        false
    ) returning id into v_admin_message;

    update public.announcements
    set is_pinned = true
    where id = v_admin_message;
    get diagnostics v_changed = row_count;

    if v_changed <> 1 then
        raise exception 'admin announcement update failed';
    end if;

    begin
        insert into public.announcements (
            title,
            content,
            author_id
        ) values (
            'Admin mismatched author must be blocked',
            'This fake message must be blocked.',
            (select id from announcement_verify_ids where label = 'teacher_user')
        );
        raise exception 'admin mismatched announcement author unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        delete from public.announcements
        where id = v_admin_message;
        raise exception 'authenticated admin delete unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

reset role;
set local role service_role;

do $$
declare
    v_visible integer;
    v_author uuid;
begin
    select count(*) into v_visible
    from public.announcements;

    if v_visible <> 4 then
        raise exception 'service announcement visibility failed: visible %', v_visible;
    end if;

    select author_id into v_author
    from public.announcements
    where id = (
        select id from announcement_verify_ids where label = 'published_message'
    );

    if v_author is distinct from (
        select id from announcement_verify_ids where label = 'admin_user'
    ) then
        raise exception 'service announcement author audit read failed';
    end if;
end;
$$;

reset role;
set local role anon;

do $$
begin
    begin
        perform 1 from public.announcements limit 1;
        raise exception 'anonymous announcement read unexpectedly succeeded';
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
        where email like 'fresh-announcement-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.announcements
        where title like 'Fresh Announcement Verify %'
    ) = 0
    then 'PASS: Announcement role checks passed and all fake data was rolled back.'
    else 'FAIL: fake announcement verification data remains; stop before continuing.'
end as verification_result;
