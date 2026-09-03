alter table public.student_growth_management
  add column if not exists artifact_title text,
  add column if not exists artifact_url text,
  add column if not exists artifact_file_id uuid references public.student_files(id) on delete set null;

alter table public.student_growth_entries
  add column if not exists artifact_title text,
  add column if not exists artifact_url text,
  add column if not exists artifact_file_id uuid references public.student_files(id) on delete set null;

create index if not exists idx_student_growth_management_artifact_file
  on public.student_growth_management(artifact_file_id)
  where artifact_file_id is not null;

create index if not exists idx_student_growth_entries_artifact_file
  on public.student_growth_entries(artifact_file_id)
  where artifact_file_id is not null;

comment on column public.student_growth_management.artifact_title is
  '학부모에게 공개할 이번 수업 결과물 제목';
comment on column public.student_growth_management.artifact_url is
  '엔트리 등 외부 결과물의 http/https 공유 주소';
comment on column public.student_growth_management.artifact_file_id is
  '학생 비공개 파일함에서 선택한 결과물';

comment on column public.student_growth_entries.artifact_title is
  '누적 성장 기록에 보관한 결과물 제목';
comment on column public.student_growth_entries.artifact_url is
  '누적 성장 기록에 보관한 외부 결과물 공유 주소';
comment on column public.student_growth_entries.artifact_file_id is
  '누적 성장 기록에 보관한 학생 파일';
