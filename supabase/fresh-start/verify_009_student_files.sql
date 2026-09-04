-- Growth 2.0 fresh test verification for 009_student_files.sql.
-- Run only in the fresh Seoul test project after 001 through 009.
-- No real file is uploaded. All fake users and metadata rows are rolled back.

begin;

create temporary table file_verify_ids (
    label text primary key,
    id uuid not null
) on commit drop;

insert into file_verify_ids (label, id)
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

grant select on file_verify_ids to authenticated, anon, service_role;

do $$
declare
    v_bucket_public boolean;
    v_file_size_limit bigint;
    v_allowed_mime_types text[];
begin
    if to_regclass('public.student_files') is null then
        raise exception '009 student_files table is missing';
    end if;

    if to_regprocedure('private.prepare_student_file()') is null then
        raise exception '009 student-file preparation trigger function is missing';
    end if;

    if to_regprocedure('public.codingssok_can_read_student_file(uuid)') is null then
        raise exception '009 student-file access function is missing';
    end if;

    select b.public, b.file_size_limit, b.allowed_mime_types
    into v_bucket_public, v_file_size_limit, v_allowed_mime_types
    from storage.buckets b
    where b.id = 'student-files';

    if not found then
        raise exception '009 private student-files bucket is missing';
    end if;

    if v_bucket_public
       or v_file_size_limit <> 52428800
       or not ('application/octet-stream' = any(v_allowed_mime_types)) then
        raise exception 'private bucket settings failed';
    end if;

    if not exists (
        select 1
        from pg_policies p
        where p.schemaname = 'storage'
          and p.tablename = 'objects'
          and p.policyname = 'student_files_storage_read_scoped'
          and p.cmd = 'SELECT'
    ) then
        raise exception 'scoped student-file storage read policy is missing';
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
    format('fresh-file-verify-%s@invalid.local', ids.id),
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
    jsonb_build_object('name', format('File Verify %s', ids.label)),
    now(),
    now(),
    '',
    '',
    '',
    ''
from file_verify_ids ids
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
        (select id from file_verify_ids where label = 'student_a'),
        (select id from file_verify_ids where label = 'student_user_a'),
        'File Verify Student A',
        'Test School',
        '1',
        'Test Class',
        'active',
        (select id from file_verify_ids where label = 'admin_user')
    ),
    (
        (select id from file_verify_ids where label = 'student_b'),
        (select id from file_verify_ids where label = 'student_user_b'),
        'File Verify Student B',
        'Test School',
        '2',
        'Test Class',
        'active',
        (select id from file_verify_ids where label = 'admin_user')
    );

insert into public.parent_student_links (
    parent_user_id,
    student_id,
    relation,
    status,
    created_by
)
values (
    (select id from file_verify_ids where label = 'parent_user'),
    (select id from file_verify_ids where label = 'student_a'),
    'guardian',
    'active',
    (select id from file_verify_ids where label = 'admin_user')
);

insert into public.teacher_student_assignments (
    teacher_id,
    student_id,
    status,
    assigned_by
)
values (
    (select id from file_verify_ids where label = 'teacher_user'),
    (select id from file_verify_ids where label = 'student_a'),
    'active',
    (select id from file_verify_ids where label = 'admin_user')
);

insert into public.student_files (
    student_id,
    owner_auth_user_id,
    uploaded_by,
    uploaded_by_role,
    original_name,
    storage_path,
    mime_type,
    size_bytes,
    category,
    note,
    visibility
)
values
    (
        (select id from file_verify_ids where label = 'student_a'),
        (select id from file_verify_ids where label = 'student_user_b'),
        (select id from file_verify_ids where label = 'student_user_a'),
        'admin',
        'fake-student-result.ent',
        format(
            'students/%s/student/fake-student-result.ent',
            (select id from file_verify_ids where label = 'student_a')
        ),
        'application/octet-stream',
        1024,
        'result',
        'Fake parent-safe student result',
        'student_parent'
    ),
    (
        (select id from file_verify_ids where label = 'student_a'),
        null,
        (select id from file_verify_ids where label = 'teacher_user'),
        'student',
        'fake-teacher-feedback.pdf',
        format(
            'students/%s/teacher/fake-teacher-feedback.pdf',
            (select id from file_verify_ids where label = 'student_a')
        ),
        'application/pdf',
        2048,
        'feedback',
        'Fake parent-safe teacher file',
        'student_parent'
    ),
    (
        (select id from file_verify_ids where label = 'student_a'),
        null,
        (select id from file_verify_ids where label = 'admin_user'),
        'student',
        'fake-staff-note.zip',
        format(
            'students/%s/admin/fake-staff-note.zip',
            (select id from file_verify_ids where label = 'student_a')
        ),
        'application/zip',
        4096,
        'internal',
        'Fake staff-only file',
        'staff_only'
    ),
    (
        (select id from file_verify_ids where label = 'student_b'),
        null,
        (select id from file_verify_ids where label = 'student_user_b'),
        'teacher',
        'fake-other-student.sb3',
        format(
            'students/%s/student/fake-other-student.sb3',
            (select id from file_verify_ids where label = 'student_b')
        ),
        'application/octet-stream',
        1024,
        'result',
        null,
        'student_parent'
    );

do $$
declare
    v_owner uuid;
    v_role text;
begin
    select f.owner_auth_user_id, f.uploaded_by_role
    into v_owner, v_role
    from public.student_files f
    where f.original_name = 'fake-student-result.ent';

    if v_owner <> (select id from file_verify_ids where label = 'student_user_a')
       or v_role <> 'student' then
        raise exception 'student-file owner or uploader-role normalization failed';
    end if;

    select f.uploaded_by_role into v_role
    from public.student_files f
    where f.original_name = 'fake-teacher-feedback.pdf';

    if v_role <> 'teacher' then
        raise exception 'assigned teacher uploader-role normalization failed';
    end if;

    begin
        insert into public.student_files (
            student_id, uploaded_by, uploaded_by_role,
            original_name, storage_path, size_bytes
        ) values (
            (select id from file_verify_ids where label = 'student_a'),
            (select id from file_verify_ids where label = 'other_teacher_user'),
            'teacher',
            'fake-unassigned-teacher.pdf',
            format(
                'students/%s/teacher/fake-unassigned-teacher.pdf',
                (select id from file_verify_ids where label = 'student_a')
            ),
            1024
        );
        raise exception 'unassigned teacher file insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        insert into public.student_files (
            student_id, uploaded_by, uploaded_by_role,
            original_name, storage_path, size_bytes
        ) values (
            (select id from file_verify_ids where label = 'student_a'),
            (select id from file_verify_ids where label = 'student_user_a'),
            'student',
            'fake-wrong-path.ent',
            'students/not-the-student/student/fake-wrong-path.ent',
            1024
        );
        raise exception 'mismatched student storage path unexpectedly succeeded';
    exception
        when check_violation then null;
    end;

    begin
        insert into public.student_files (
            student_id, uploaded_by, uploaded_by_role,
            original_name, storage_path, size_bytes
        ) values (
            (select id from file_verify_ids where label = 'student_a'),
            (select id from file_verify_ids where label = 'student_user_a'),
            'student',
            'fake-oversized.ent',
            format(
                'students/%s/student/fake-oversized.ent',
                (select id from file_verify_ids where label = 'student_a')
            ),
            52428801
        );
        raise exception 'oversized student file metadata unexpectedly succeeded';
    exception
        when check_violation then null;
    end;

    begin
        insert into public.student_files (
            student_id, uploaded_by, uploaded_by_role,
            original_name, storage_path, size_bytes
        ) values (
            (select id from file_verify_ids where label = 'student_a'),
            (select id from file_verify_ids where label = 'student_user_a'),
            'student',
            '../fake-unsafe.ent',
            format(
                'students/%s/student/fake-unsafe.ent',
                (select id from file_verify_ids where label = 'student_a')
            ),
            1024
        );
        raise exception 'unsafe original filename unexpectedly succeeded';
    exception
        when check_violation then null;
    end;
end;
$$;

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    (select id::text from file_verify_ids where label = 'student_user_a'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
    v_visible integer;
    v_can_read_parent_file boolean;
    v_can_read_staff_file boolean;
begin
    select count(*) into v_visible from public.student_files;

    if v_visible <> 2 then
        raise exception 'student file visibility failed: visible %', v_visible;
    end if;

    select public.codingssok_can_read_student_file_object(
        format(
            'students/%s/student/fake-student-result.ent',
            (select id from file_verify_ids where label = 'student_a')
        )
    ) into v_can_read_parent_file;

    select public.codingssok_can_read_student_file_object(
        format(
            'students/%s/admin/fake-staff-note.zip',
            (select id from file_verify_ids where label = 'student_a')
        )
    ) into v_can_read_staff_file;

    if not v_can_read_parent_file or v_can_read_staff_file then
        raise exception 'student private-object access check failed';
    end if;

    begin
        perform storage_path from public.student_files limit 1;
        raise exception 'student internal storage-path read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        insert into public.student_files (
            student_id, uploaded_by, uploaded_by_role,
            original_name, storage_path, size_bytes
        ) values (
            (select id from file_verify_ids where label = 'student_a'),
            auth.uid(),
            'student',
            'fake-direct-write.ent',
            format(
                'students/%s/student/fake-direct-write.ent',
                (select id from file_verify_ids where label = 'student_a')
            ),
            1024
        );
        raise exception 'direct student file insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        update public.student_files
        set note = 'Forged note'
        where original_name = 'fake-student-result.ent';
        raise exception 'direct student file update unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        delete from public.student_files
        where original_name = 'fake-student-result.ent';
        raise exception 'direct student file delete unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from file_verify_ids where label = 'student_user_b'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible from public.student_files;
    if v_visible <> 1 then
        raise exception 'other student file visibility failed: visible %', v_visible;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from file_verify_ids where label = 'parent_user'),
    true
);

do $$
declare
    v_visible integer;
    v_staff_visible integer;
begin
    select count(*) into v_visible from public.student_files;
    select count(*) into v_staff_visible
    from public.student_files where visibility = 'staff_only';

    if v_visible <> 2 or v_staff_visible <> 0 then
        raise exception 'linked parent file visibility failed: visible %, staff %',
            v_visible, v_staff_visible;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from file_verify_ids where label = 'teacher_user'),
    true
);

do $$
declare
    v_visible integer;
    v_can_read_staff_file boolean;
begin
    select count(*) into v_visible from public.student_files;
    select public.codingssok_can_read_student_file_object(
        format(
            'students/%s/admin/fake-staff-note.zip',
            (select id from file_verify_ids where label = 'student_a')
        )
    ) into v_can_read_staff_file;

    if v_visible <> 3 or not v_can_read_staff_file then
        raise exception 'assigned teacher file visibility failed: visible %, staff %',
            v_visible, v_can_read_staff_file;
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from file_verify_ids where label = 'other_teacher_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible from public.student_files;
    if v_visible <> 0 then
        raise exception 'unassigned teacher file read unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from file_verify_ids where label = 'pending_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible from public.student_files;
    if v_visible <> 0 then
        raise exception 'pending account file read unexpectedly succeeded';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from file_verify_ids where label = 'admin_user'),
    true
);

do $$
declare
    v_visible integer;
begin
    select count(*) into v_visible from public.student_files;
    if v_visible <> 4 then
        raise exception 'admin file visibility failed: visible %', v_visible;
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
    from public.student_files
    where original_name like 'fake-%';

    if v_visible <> 4 then
        raise exception 'service file visibility failed: visible %', v_visible;
    end if;
end;
$$;

reset role;
set local role anon;

do $$
begin
    begin
        perform 1 from public.student_files limit 1;
        raise exception 'anonymous file metadata read unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    begin
        perform public.codingssok_can_read_student_file(
            (select id from file_verify_ids where label = 'student_a')
        );
        raise exception 'anonymous file access function unexpectedly succeeded';
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
        where email like 'fresh-file-verify-%@invalid.local'
    ) = 0
    and (
        select count(*)
        from public.students
        where name like 'File Verify Student %'
    ) = 0
    and (
        select count(*)
        from public.student_files
        where original_name like 'fake-%'
    ) = 0
    then 'PASS: Student file role checks passed and all fake metadata was rolled back.'
    else 'FAIL: fake student-file verification data remains; stop before continuing.'
end as verification_result;
