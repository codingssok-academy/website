alter table public.students
  add column if not exists school text;

comment on column public.students.school is '학생 학교명';

notify pgrst, 'reload schema';
