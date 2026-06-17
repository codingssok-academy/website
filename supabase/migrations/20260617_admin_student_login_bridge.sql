do $$
declare
  gu_student_id uuid := '30229dae-914a-4d1b-9211-cf7ff8da92b5';
  gu_auth_user_id uuid := '13a67bfd-61d0-4283-876f-7fa448d2b73e';
  jm_student_id uuid := 'cd9271ed-65b3-40ad-8f22-65eb0899fc61';
  jm_auth_user_id uuid := '15b6cdb8-ab2f-43e9-a10f-f441ffb24b81';
  admin_pin text := '9821';
begin
  insert into public.students (id, name, class, pin, auth_user_id, status, created_at, updated_at)
  values
    (gu_student_id, '구자현', 'admin', admin_pin, gu_auth_user_id, 'approved', now(), now()),
    (jm_student_id, '장민', 'admin', admin_pin, jm_auth_user_id, 'approved', now(), now())
  on conflict (id) do update set
    name = excluded.name,
    class = excluded.class,
    pin = excluded.pin,
    auth_user_id = excluded.auth_user_id,
    status = excluded.status,
    updated_at = now();

  update auth.users
  set
    encrypted_password = crypt('cs_student_30229dae914a4d1b9211cf7ff8da92b5_9821', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('name', '구자현', 'role', 'admin'),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'admin'),
    updated_at = now()
  where id = gu_auth_user_id;

  update auth.users
  set
    encrypted_password = crypt('cs_student_cd9271ed65b340ad8f2265eb0899fc61_9821', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('name', '장민', 'role', 'admin'),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'admin'),
    updated_at = now()
  where id = jm_auth_user_id;

  insert into public.profiles (id, name, email, display_name, role, approval_status, updated_at)
  values
    (gu_auth_user_id, '구자현', 'student_30229dae-914a-4d1b-9211-cf7ff8da92b5@codingssok.local', '구자현', 'admin', 'approved', now()),
    (jm_auth_user_id, '장민', 'student_cd9271ed-65b3-40ad-8f22-65eb0899fc61@codingssok.local', '장민', 'admin', 'approved', now())
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    display_name = excluded.display_name,
    role = excluded.role,
    approval_status = excluded.approval_status,
    updated_at = now();
end $$;
