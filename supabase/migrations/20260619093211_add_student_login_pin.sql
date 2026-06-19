alter table public.students
  add column if not exists login_pin text;

alter table public.students
  drop constraint if exists students_login_pin_format_check;

alter table public.students
  add constraint students_login_pin_format_check
  check (login_pin is null or login_pin ~ '^\d{4}$');

comment on column public.students.login_pin is
  'Student learning-platform login PIN. Parent access PIN remains public.students.pin.';

notify pgrst, 'reload schema';
