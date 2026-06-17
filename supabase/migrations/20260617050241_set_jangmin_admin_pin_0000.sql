do $$
declare
  jm_student_id uuid := 'cd9271ed-65b3-40ad-8f22-65eb0899fc61';
  jm_auth_user_id uuid := '15b6cdb8-ab2f-43e9-a10f-f441ffb24b81';
  jm_pin text := '0000';
begin
  update public.students
  set
    name = '장민',
    class = 'admin',
    pin = jm_pin,
    auth_user_id = jm_auth_user_id,
    status = 'approved',
    updated_at = now()
  where id = jm_student_id;

  update auth.users
  set
    encrypted_password = crypt('cs_student_cd9271ed65b340ad8f2265eb0899fc61_0000', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('name', '장민', 'role', 'admin'),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'admin'),
    updated_at = now()
  where id = jm_auth_user_id;

  insert into public.profiles (id, name, email, display_name, role, approval_status, updated_at)
  values (
    jm_auth_user_id,
    '장민',
    'student_cd9271ed-65b3-40ad-8f22-65eb0899fc61@codingssok.local',
    '장민',
    'admin',
    'approved',
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    display_name = excluded.display_name,
    role = excluded.role,
    approval_status = excluded.approval_status,
    updated_at = now();
end $$;
