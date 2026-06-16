create table if not exists public.student_growth_management (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  student_name text not null,
  current_class text,
  temperament text,
  skill_level text,
  strengths text,
  weaknesses text,
  current_goal text,
  next_class_potential text,
  class_progress text,
  parent_feedback_draft text,
  teacher_memo text,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

create table if not exists public.student_growth_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  student_name text not null,
  current_class text,
  temperament text,
  skill_level text,
  strengths text,
  weaknesses text,
  current_goal text,
  next_class_potential text,
  class_progress text,
  parent_feedback_draft text,
  teacher_memo text,
  entry_note text,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_growth_management_student
  on public.student_growth_management(student_id);

create index if not exists idx_student_growth_management_updated
  on public.student_growth_management(updated_at desc);

create index if not exists idx_student_growth_entries_student
  on public.student_growth_entries(student_id, created_at desc);

create index if not exists idx_student_growth_entries_created
  on public.student_growth_entries(created_at desc);

create or replace function public.set_student_growth_management_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_student_growth_management_updated_at on public.student_growth_management;
create trigger set_student_growth_management_updated_at
before update on public.student_growth_management
for each row execute function public.set_student_growth_management_updated_at();

alter table public.student_growth_management enable row level security;
alter table public.student_growth_entries enable row level security;

grant select, insert, update, delete on public.student_growth_management to authenticated;
grant select, insert, update, delete on public.student_growth_entries to authenticated;

drop policy if exists "student_growth_management_teacher_read" on public.student_growth_management;
create policy "student_growth_management_teacher_read"
on public.student_growth_management for select
using (public.is_teacher_or_admin());

drop policy if exists "student_growth_management_teacher_write" on public.student_growth_management;
create policy "student_growth_management_teacher_write"
on public.student_growth_management for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

drop policy if exists "student_growth_entries_teacher_read" on public.student_growth_entries;
create policy "student_growth_entries_teacher_read"
on public.student_growth_entries for select
using (public.is_teacher_or_admin());

drop policy if exists "student_growth_entries_teacher_write" on public.student_growth_entries;
create policy "student_growth_entries_teacher_write"
on public.student_growth_entries for all
using (public.is_teacher_or_admin())
with check (public.is_teacher_or_admin());

with seed (
  student_name,
  current_class,
  temperament,
  skill_level,
  strengths,
  weaknesses,
  current_goal,
  next_class_potential,
  class_progress,
  parent_feedback_draft,
  teacher_memo
) as (
  values
  ($$탁규원$$, $$공통기초반$$, $$최근 피드백 3건 기준. BIKO와 컴퓨팅 사고력 기출문제를 블록코딩으로 구현하는 흐름에 진입한 단계입니다.$$, $$1단계$$, $$문제의 규칙을 따라가며 구현 활동에 참여하는 힘이 생기고 있습니다.$$, $$문제 조건을 말로 정리한 뒤 블록으로 옮기는 반복 훈련이 필요합니다.$$, $$문제 읽기, 조건 찾기, 블록코딩 구현 순서를 안정화합니다.$$, $$관찰 필요$$, $$컴퓨팅 사고력 기출문제와 BIKO 레벨 1 구현을 중심으로 진행 중입니다.$$, $$문제 이해와 구현을 연결하는 훈련을 시작했습니다. 조건을 찾고 블록코딩으로 옮기는 연습을 꾸준히 이어가겠습니다.$$, $$최근 피드백 3건. 마지막 기록 2026년 6월 12일.$$),
  ($$김무성$$, $$공통기초반$$, $$최근 피드백 9건 기준. 컴퓨팅 사고력 기출문제 풀이와 블록 구현을 반복하고 있습니다.$$, $$1단계$$, $$반복 수업을 통해 문제 풀이 흐름을 따라오는 안정성이 좋아지고 있습니다.$$, $$문제를 읽는 속도보다 조건을 빠뜨리지 않는 습관이 더 필요합니다.$$, $$조건 찾기와 작은 예시 실험을 먼저 하고 구현으로 넘어갑니다.$$, $$관찰 필요$$, $$컴퓨팅 사고력 연습문제와 기출문제 풀이를 중심으로 진행 중입니다.$$, $$기출문제를 통해 문제 읽기와 구현 연결을 연습하고 있습니다. 조건을 놓치지 않는 습관을 우선 잡겠습니다.$$, $$최근 피드백 9건. 마지막 기록 2026년 6월 13일.$$),
  ($$김주찬$$, $$공통기초반$$, $$최근 피드백 11건 기준. CT 기출문제와 BIKO 문제를 꾸준히 접하고 있습니다.$$, $$1단계$$, $$문제 해결 과정을 반복하면 이해가 빠르게 쌓이는 편입니다.$$, $$풀이 과정을 말로 설명하고 코드 흐름으로 바꾸는 훈련이 필요합니다.$$, $$문제에서 구하는 것, 조건, 해결 순서를 분리해서 정리합니다.$$, $$관찰 필요$$, $$컴퓨팅 사고력 기출문제와 블록코딩 구현을 병행합니다.$$, $$문제 풀이 경험이 쌓이고 있습니다. 정답보다 풀이 순서와 조건 정리를 더 중점적으로 지도하겠습니다.$$, $$최근 피드백 11건. 마지막 기록 2026년 6월 9일.$$),
  ($$전예준$$, $$공통기초반$$, $$최근 피드백 6건 기준. COS 기출과 컴퓨팅 사고력 문제를 함께 다루고 있습니다.$$, $$1단계$$, $$숙제 검사와 기출 복습을 통해 수업 흐름을 따라오고 있습니다.$$, $$개념을 이해한 뒤 직접 구현으로 연결하는 시간이 더 필요합니다.$$, $$컴퓨팅 사고력 기출문제를 읽고 블록 구현으로 재현합니다.$$, $$관찰 필요$$, $$COS 자격증 기초와 사고력 문제 풀이를 함께 진행합니다.$$, $$기초 문제 풀이와 사고력 구현을 함께 훈련하고 있습니다. 문제를 코드 흐름으로 바꾸는 연습을 이어가겠습니다.$$, $$최근 피드백 6건. 마지막 기록 2026년 6월 13일.$$),
  ($$윤유림$$, $$공통기초반$$, $$초기 관리 대상. 피드백 export 본문이 없어 현재 반 기준으로 관찰 항목을 생성했습니다.$$, $$입문$$, $$기초 수업 참여 상태를 먼저 관찰할 학생입니다.$$, $$문제 읽기, 조건 찾기, 반복 구조 이해도를 확인해야 합니다.$$, $$문제 읽기와 순서 정리 습관을 먼저 만듭니다.$$, $$관찰 필요$$, $$공통기초반 초기 관찰 단계입니다.$$, $$현재 반에서 기초 사고력과 수업 태도를 먼저 확인하겠습니다. 이후 강점과 보완점을 구체화하겠습니다.$$, $$export 피드백 본문 없음. 현재 38명 명단 기준 초기 생성.$$),
  ($$김성윤$$, $$공통기초반$$, $$초기 관리 대상. 피드백 export 본문이 없어 현재 반 기준으로 관찰 항목을 생성했습니다.$$, $$입문$$, $$기초 수업 참여 상태를 먼저 관찰할 학생입니다.$$, $$문제 읽기와 조건 정리 과정을 확인해야 합니다.$$, $$문제의 요구사항과 조건을 분리해서 말로 설명합니다.$$, $$관찰 필요$$, $$공통기초반 초기 관찰 단계입니다.$$, $$기초 사고력과 수업 몰입도를 먼저 확인하고, 다음 기록부터 구체적인 성장 방향을 남기겠습니다.$$, $$export 피드백 본문 없음. 현재 38명 명단 기준 초기 생성.$$),
  ($$한효제$$, $$공통기초반$$, $$초기 관리 대상. 피드백 export 본문이 없어 현재 반 기준으로 관찰 항목을 생성했습니다.$$, $$입문$$, $$기초 개념을 차근차근 확인할 수 있는 단계입니다.$$, $$문제 이해와 순서 정리 능력을 관찰해야 합니다.$$, $$조건, 반복, 순서를 구분하는 기초 사고력을 잡습니다.$$, $$관찰 필요$$, $$공통기초반 초기 관찰 단계입니다.$$, $$문제 읽기와 조건 찾기부터 안정적으로 잡아가겠습니다. 수업 기록이 쌓이면 세부 피드백을 보강하겠습니다.$$, $$export 피드백 본문 없음. 현재 38명 명단 기준 초기 생성.$$),
  ($$박하준$$, $$공통기초반$$, $$초기 관리 대상. 피드백 export 본문이 없어 현재 반 기준으로 관찰 항목을 생성했습니다.$$, $$입문$$, $$기초 수업 루틴을 만들기 좋은 단계입니다.$$, $$문제 조건을 놓치지 않는 읽기 습관을 확인해야 합니다.$$, $$문제 읽기, 조건 표시, 해결 순서 말하기를 반복합니다.$$, $$관찰 필요$$, $$공통기초반 초기 관찰 단계입니다.$$, $$수업 초반에는 문제를 정확히 읽고 조건을 찾는 습관을 만드는 데 집중하겠습니다.$$, $$export 피드백 본문 없음. 현재 38명 명단 기준 초기 생성.$$),
  ($$이현구$$, $$흥미반$$, $$최근 피드백 10건 기준. 그래프 이론, 조건문, 사고력 문제를 프로젝트와 연결하고 있습니다.$$, $$2단계$$, $$실생활 예시를 그래프로 바꾸는 활동에 참여하며 개념 연결력이 보입니다.$$, $$조건문 복습과 사고력 기출문제의 코드 구현을 꾸준히 이어가야 합니다.$$, $$흥미 기반 문제를 코드로 구현하며 조건문 활용을 안정화합니다.$$, $$만들기반 전환 관찰$$, $$그래프 이론, 파이썬 조건문, 사고력 문제 구현을 병행합니다.$$, $$흥미 있는 예시를 통해 개념을 이해하고 있습니다. 문제를 코드로 구현하는 연습을 계속 늘리겠습니다.$$, $$최근 피드백 10건. 마지막 기록 2026년 6월 10일.$$),
  ($$오서영$$, $$흥미반$$, $$최근 피드백 9건 기준. 창의형 성향과 높은 집중력이 보이나 번아웃 관찰이 필요합니다.$$, $$2단계$$, $$마지막 문제까지 스스로 해결하려는 끈기와 파이썬 핵심 개념 이해가 좋습니다.$$, $$흥미와 몰입을 유지할 수 있게 과제 난이도와 속도 조절이 필요합니다.$$, $$파이썬 핵심 개념과 사고력 문제를 결과물 중심으로 연결합니다.$$, $$만들기반 전환 관찰$$, $$파이썬 종합 문제와 그래프 이론 활동을 진행했습니다.$$, $$집중력과 문제 해결 태도가 좋습니다. 흥미가 떨어지지 않도록 결과물 중심 활동을 섞어 지도하겠습니다.$$, $$최근 피드백 9건. CSV 주의 플래그 번아웃.$$),
  ($$민다온$$, $$흥미반$$, $$최근 피드백 11건 기준. 집중형 성향이나 흥미저하 관찰이 필요합니다.$$, $$2단계$$, $$엔트리 화면 구성과 조작에 대한 감각이 좋고 주도적으로 참여합니다.$$, $$타자, 어휘, 문제 읽기 같은 기초 루틴을 함께 보강해야 합니다.$$, $$엔트리 결과물 제작과 기초 조작 능력을 안정화합니다.$$, $$만들기반 전환 관찰$$, $$엔트리 프로젝트와 컴퓨터 타자 연습을 병행합니다.$$, $$화면 구성 감각과 참여도가 좋습니다. 기초 조작과 문제 읽기 습관을 함께 끌어올리겠습니다.$$, $$최근 피드백 11건. CSV 주의 플래그 흥미저하.$$),
  ($$김우현$$, $$흥미반$$, $$최근 피드백 14건 기준. 조용한 편이며 사고력 기출문제와 블록 구현을 꾸준히 진행 중입니다.$$, $$2단계$$, $$반복 학습을 통해 문제 풀이 흐름을 안정적으로 따라옵니다.$$, $$사이트 가입, 과제 수행, 문제 조건 정리를 놓치지 않는 관리가 필요합니다.$$, $$컴퓨팅 사고력 기출문제를 블록코딩으로 구현합니다.$$, $$만들기반 전환 관찰$$, $$CT 기출문제와 프로그래밍 문법 연결을 진행 중입니다.$$, $$차분하게 문제 풀이 흐름을 따라가고 있습니다. 조건 정리와 과제 루틴을 더 명확히 잡겠습니다.$$, $$최근 피드백 14건. 마지막 기록 2026년 6월 13일.$$),
  ($$박리현$$, $$흥미반$$, $$최근 피드백 13건 기준. 주도형 성향이며 BIKO와 파이썬 기초문법을 같이 진행 중입니다.$$, $$2단계$$, $$문제 풀이와 블록 구현 활동을 꾸준히 소화하고 있습니다.$$, $$문제를 충분히 읽고 구현 전에 풀이 과정을 정리하는 연습이 필요합니다.$$, $$BIKO 기출문제를 읽고 블록코딩과 파이썬 기초로 연결합니다.$$, $$만들기반 전환 관찰$$, $$CT 기출문제, 타자, 어휘, 파이썬 기초문법을 병행합니다.$$, $$문제 해결 경험이 쌓이고 있습니다. 읽기와 구현 사이의 정리 과정을 더 강화하겠습니다.$$, $$최근 피드백 13건. 마지막 기록 2026년 6월 12일.$$),
  ($$강지호$$, $$만들기반$$, $$최근 피드백 10건 기준. 주도형이고 활발합니다. 미션형 과제에 반응이 좋으며 비교나 질타는 피해야 합니다.$$, $$2단계$$, $$하드웨어 제어 프로젝트처럼 손으로 만드는 활동에 참여도가 좋습니다.$$, $$집중이 흔들릴 수 있어 짧은 미션과 구체적 조건으로 관리해야 합니다.$$, $$엔트리와 하드웨어 프로젝트를 통해 조건, 입력, 출력 흐름을 익힙니다.$$, $$프로젝트반 이동 후보$$, $$아두이노 온습도 제어 프로젝트와 작품 설명 활동을 진행했습니다.$$, $$만들기 활동에서 흥미와 참여도가 좋습니다. 짧은 목표를 주고 완성 경험을 반복시키겠습니다.$$, $$최근 피드백 10건. 관심사 포켓몬스터, 로블록스. 주의 플래그 ADHD.$$),
  ($$김은별$$, $$만들기반$$, $$최근 피드백 8건 기준. 만들기 활동과 하드웨어 제어 프로젝트를 진행 중입니다.$$, $$2단계$$, $$아두이노 하드웨어 제어 활동을 따라오며 결과물 제작 경험을 쌓고 있습니다.$$, $$주의 집중을 유지하며 작품 설명까지 완성하는 루틴이 필요합니다.$$, $$하드웨어 프로젝트를 완성하고 만든 작품을 말로 설명합니다.$$, $$프로젝트반 이동 후보$$, $$블록코딩으로 아두이노 온습도 제어 프로젝트를 진행했습니다.$$, $$제작 활동을 통해 코딩 흐름을 익히고 있습니다. 결과물 설명까지 연결해 표현력을 키우겠습니다.$$, $$최근 피드백 8건. CSV 주의 플래그 ADHD.$$),
  ($$노현승$$, $$만들기반$$, $$최근 피드백 4건 기준. 주도형이나 학습 의지와 흥미 관리가 필요합니다.$$, $$2단계$$, $$지도 방향을 긍정적으로 수용하고 작은 목표를 따라갈 수 있습니다.$$, $$단기 결과보다 작은 목표를 꾸준히 실천하는 습관 형성이 필요합니다.$$, $$사고력 문제 풀이 과정과 작은 목표 실천을 반복합니다.$$, $$관찰 필요$$, $$사고력 문제 분석과 집중력 향상 훈련을 진행했습니다.$$, $$문제를 맞히는 것보다 풀이 과정을 정리하는 훈련을 하고 있습니다. 작은 성공 경험을 반복시키겠습니다.$$, $$최근 피드백 4건. CSV 주의 플래그 흥미저하.$$),
  ($$김주원$$, $$프로젝트반$$, $$최근 피드백 22건 기준. 조용한 편이며 BIKO와 CT 기출문제를 꾸준히 누적하고 있습니다.$$, $$3단계$$, $$오랜 피드백 누적만큼 수업 참여와 문제 풀이 경험이 안정적으로 쌓였습니다.$$, $$프로젝트반에서는 풀이 기록을 결과물과 GitHub 기록으로 연결해야 합니다.$$, $$사고력 문제 풀이를 프로젝트 기록과 포트폴리오로 연결합니다.$$, $$프로젝트 고도화$$, $$BIKO, CT 기출문제, 블록코딩 구현 과제를 진행 중입니다.$$, $$문제 풀이 경험이 충분히 쌓이고 있습니다. 이제 풀이 기록과 결과물 정리를 함께 관리하겠습니다.$$, $$최근 피드백 22건. 마지막 기록 2026년 6월 12일.$$),
  ($$석정현$$, $$프로젝트반$$, $$최근 피드백 11건 기준. 집중형이며 대회형 사고력 문제를 꾸준히 진행했습니다.$$, $$3단계$$, $$집중해서 사고력 문제를 따라가고 구현 과제를 수행할 수 있습니다.$$, $$문제 풀이를 프로젝트 기록으로 정리하는 단계 전환이 필요합니다.$$, $$사고력 풀이와 구현 과정을 결과물 기록으로 남깁니다.$$, $$프로젝트 고도화$$, $$CT 기출문제와 블록코딩 구현을 병행했습니다.$$, $$집중형 학습 태도가 강점입니다. 풀이 과정과 결과물을 기록으로 남기는 방향으로 확장하겠습니다.$$, $$최근 피드백 11건. 마지막 기록 2026년 6월 12일.$$),
  ($$유시호$$, $$프로젝트반$$, $$최근 피드백 12건 기준. 조용한 편이며 파이썬 중급과 C++ 전환 고민이 있었습니다.$$, $$3단계$$, $$파이썬 중급 문법 이해가 올라가고 있습니다.$$, $$집중력 저하가 관찰되어 목표를 짧게 나누고 결과물을 명확히 해야 합니다.$$, $$파이썬과 C++ 방향을 정리하고 프로젝트 결과물로 연결합니다.$$, $$관찰 필요$$, $$파이썬 중급 문법과 사고력 문제 구현을 진행했습니다.$$, $$문법 이해가 올라가고 있으나 집중 관리가 필요합니다. 다음 목표를 작게 나누어 성취감을 만들겠습니다.$$, $$최근 피드백 12건. 마지막 기록 2026년 6월 5일.$$),
  ($$한보윤$$, $$프로젝트반$$, $$최근 피드백 14건 기준. 주도형이며 파이썬 계산기 프로젝트와 콘텐츠 구성 능력이 강점입니다.$$, $$3단계$$, $$변수, 입력, 계산 로직을 이해하고 스스로 프로젝트를 완성하는 힘이 좋습니다.$$, $$프로젝트 기능 확장과 코드 검증 루틴을 더 체계화해야 합니다.$$, $$파이썬 프로젝트를 기능 확장, 오류 수정, 설명 자료까지 완성합니다.$$, $$프로젝트 고도화$$, $$파이썬 기초 문법과 나만의 계산기 프로젝트를 진행했습니다.$$, $$프로젝트를 즐겁게 완성하고 논리적 구성 능력이 좋습니다. 기능 추가와 코드 검증까지 확장하겠습니다.$$, $$최근 피드백 14건. 마지막 상세 기록 2026년 4월 10일.$$),
  ($$한보리$$, $$프로젝트반$$, $$최근 피드백 16건 기준. 조용한 편이며 프로젝트반에서 꾸준히 기록이 쌓이고 있습니다.$$, $$3단계$$, $$수업 누적 기록이 많고 꾸준한 참여 흐름이 있습니다.$$, $$프로젝트 목표와 산출물을 명확히 정해 결과물 중심으로 관리해야 합니다.$$, $$프로젝트 결과물을 만들고 설명, 기록, 개선까지 이어갑니다.$$, $$프로젝트 고도화$$, $$피드백 누적을 기반으로 프로젝트반 성장관리를 시작합니다.$$, $$꾸준히 수업을 이어오고 있습니다. 결과물과 설명 자료를 함께 남기는 방식으로 성장 기록을 구체화하겠습니다.$$, $$최근 피드백 16건. 마지막 기록 2026년 6월 12일.$$),
  ($$김기석$$, $$프로젝트반$$, $$최근 피드백 13건 기준. 창의형 성향이며 프로젝트반에서 결과물 중심 관리가 필요합니다.$$, $$3단계$$, $$창의적인 접근과 구현 활동에 강점이 있습니다.$$, $$아이디어를 실제 결과물과 기록으로 마무리하는 루틴이 필요합니다.$$, $$아이디어를 기능 목록, 구현, GitHub 기록으로 연결합니다.$$, $$프로젝트 고도화$$, $$프로젝트반 초기 성장관리 항목으로 편성했습니다.$$, $$창의적인 접근을 결과물로 마무리하는 방향이 중요합니다. 기능 구현과 기록을 함께 관리하겠습니다.$$, $$최근 피드백 13건. 마지막 기록 2026년 6월 13일.$$),
  ($$박지용$$, $$프로젝트반$$, $$최근 피드백 13건 기준. 조용한 편이며 집중 관리가 필요할 수 있습니다.$$, $$3단계$$, $$꾸준히 피드백이 누적되어 프로젝트반 활동 기반이 있습니다.$$, $$집중 흐름이 흔들릴 수 있어 과제 범위와 마감 기준을 작게 나누어야 합니다.$$, $$프로젝트 목표를 작게 나누고 산출물 단위로 완성합니다.$$, $$관찰 필요$$, $$프로젝트반 성장관리와 과제 루틴을 정비합니다.$$, $$꾸준한 활동 기반이 있습니다. 과제를 작게 쪼개 완성 경험을 늘리는 방향으로 지도하겠습니다.$$, $$최근 피드백 13건. CSV 주의 플래그 ADHD.$$),
  ($$임하준$$, $$프로젝트반$$, $$최근 피드백 14건 기준. 조용한 편이며 흥미 유지 관리가 필요합니다.$$, $$3단계$$, $$수업 누적 기록이 많고 조용히 따라오는 안정성이 있습니다.$$, $$흥미저하를 막기 위해 결과물이 눈에 보이는 프로젝트 목표가 필요합니다.$$, $$작은 프로젝트를 완성하고 개선 과정을 기록합니다.$$, $$프로젝트 고도화$$, $$프로젝트반 성장관리와 흥미 유지 과제를 병행합니다.$$, $$차분히 따라오는 기반이 있습니다. 눈에 보이는 결과물을 중심으로 흥미와 성취감을 유지하겠습니다.$$, $$최근 피드백 14건. CSV 주의 플래그 흥미저하.$$),
  ($$이다연$$, $$프로젝트반$$, $$최근 피드백 21건 기준. AI 협업 프로젝트와 Play Store 배포 단계까지 경험했습니다.$$, $$4단계$$, $$AI 명령, 앱 제작, 배포 파일 생성까지 고급 프로젝트 흐름을 경험했습니다.$$, $$AI 사용 주의사항, 명령어 정리, 배포 검증 루틴을 체계화해야 합니다.$$, $$AI 협업 프로젝트를 배포, 검증, 설명 자료까지 완성합니다.$$, $$프로젝트 고도화$$, $$AI 협업 프로젝트 마무리와 aab 배포 파일 생성까지 진행했습니다.$$, $$AI 협업 프로젝트 경험이 뚜렷합니다. 배포 검증과 명령어 사용 원칙까지 정리해 포트폴리오화하겠습니다.$$, $$최근 피드백 21건. 마지막 기록 2026년 6월 13일.$$),
  ($$길태웅$$, $$프로젝트반$$, $$최근 피드백 6건 기준. 학교 내신 대비 C언어와 BIKO 기반 문법 학습을 진행했습니다.$$, $$3단계$$, $$C언어 반복문과 문법 선행 학습을 수행하고 있습니다.$$, $$문법 학습을 문제 풀이와 결과물 기록으로 연결해야 합니다.$$, $$C언어 반복문, 조건문, 문제 풀이를 학교 내신과 프로젝트 기록으로 연결합니다.$$, $$프로젝트 고도화$$, $$C언어 반복문과 프로그래머스 레벨 0 해설 학습을 진행했습니다.$$, $$C언어 문법 학습을 진행 중입니다. 내신 대비와 문제풀이 기록을 함께 관리하겠습니다.$$, $$최근 피드백 6건. 마지막 기록 2026년 6월 12일.$$),
  ($$하우빈$$, $$대회반$$, $$최근 피드백 7건 기준. 창의형이며 파이썬 사고력 문제와 문법 결합 문제에서 몰입도가 좋습니다.$$, $$4단계$$, $$문제 조건에 맞게 코드를 설계하고 사고력을 확장하는 능력이 우수합니다.$$, $$남은 기출문제를 꾸준히 풀고 풀이 기록을 누적해야 합니다.$$, $$기출문제 풀이 기록과 알고리즘 구현력을 대회 준비로 연결합니다.$$, $$대회 심화 유지$$, $$파이썬 사고력과 문법 결합 문제를 진행했습니다.$$, $$사고력과 문법을 결합한 문제에서 강점이 보입니다. 기출 풀이 기록을 누적해 실력 증명 자료로 남기겠습니다.$$, $$최근 피드백 7건. 마지막 기록 2026년 5월 19일.$$),
  ($$김영호$$, $$대회반$$, $$최근 피드백 2건 기준. 워드프로세서 재준비와 오답노트 중심 관리가 필요합니다.$$, $$3단계$$, $$틀린 문제를 다시 이해하려는 태도와 차분한 문제 풀이가 좋습니다.$$, $$시험 결과로 자신감이 떨어질 수 있어 짧은 성공 경험을 쌓아야 합니다.$$, $$오답노트와 실기 실수 원인 분석을 꾸준히 수행합니다.$$, $$상담 필요$$, $$워드 필기와 실기 재준비 방향을 점검했습니다.$$, $$오답을 다시 이해하려는 태도가 좋습니다. 기능별 작은 성공 경험을 쌓아 자신감을 회복시키겠습니다.$$, $$최근 피드백 2건. 마지막 기록 2026년 6월 13일.$$),
  ($$박도현$$, $$대회반$$, $$최근 피드백 10건 기준. 워드프로세서 필기와 실기를 병행하며 집중력이 좋습니다.$$, $$3단계$$, $$집중할 때 끝까지 문제를 해결하려는 태도와 오답 정리 능력이 좋습니다.$$, $$피곤함과 번아웃, 흥미저하를 관리하며 반복 학습 루틴을 유지해야 합니다.$$, $$워드프로세서 필기 오답노트와 실기 기능 연습을 병행합니다.$$, $$관찰 필요$$, $$워드프로세서 필기, 실기, 기출 Q&A를 진행했습니다.$$, $$기출과 오답 정리를 통해 성장하고 있습니다. 반복 학습과 실기 기능 연습을 안정적으로 이어가겠습니다.$$, $$최근 피드백 10건. CSV 주의 플래그 번아웃, 흥미저하.$$),
  ($$서민호$$, $$대회반$$, $$최근 피드백 2건 기준. 워드프로세서 CBT와 실기 실수 점검을 진행했습니다.$$, $$3단계$$, $$시험 형태 문제를 차분히 풀고 수업에 성실히 참여합니다.$$, $$최근 시험 결과로 자신감 관리와 실수 원인 분석이 필요합니다.$$, $$오답노트 정리와 실기 반복 실수 원인을 확인합니다.$$, $$상담 필요$$, $$워드프로세서 재준비 방향을 점검했습니다.$$, $$차분하게 문제 풀이를 따라옵니다. 실수 원인을 찾고 짧은 성공 경험을 쌓는 방향으로 지도하겠습니다.$$, $$최근 피드백 2건. 마지막 기록 2026년 6월 13일.$$),
  ($$이세라$$, $$대회반$$, $$최근 피드백 4건 기준. AI Codex 협업과 C++ 사고력 기출 구현을 진행했습니다.$$, $$4단계$$, $$새로운 개발 환경과 AI 활용 프로세스를 빠르게 파악했습니다.$$, $$자격증 학습 흥미저하가 있어 목표와 산출물을 명확히 해야 합니다.$$, $$C++ 사고력 기출문제와 AI 활용 프로젝트를 병행합니다.$$, $$대회 심화 유지$$, $$AI Codex 환경설정, C++, BIKO 코드 구현을 진행했습니다.$$, $$AI 활용과 C++ 학습을 빠르게 받아들이고 있습니다. 목표를 명확히 잡아 꾸준한 과제로 연결하겠습니다.$$, $$최근 피드백 4건. CSV 주의 플래그 흥미저하.$$),
  ($$엄찬유$$, $$대회반$$, $$최근 피드백 16건 기준. 집중형이며 C++ 반복문과 기출문제에서 높은 몰입도가 보입니다.$$, $$4단계$$, $$C++ 반복문 제어 흐름 이해와 문제 풀이 몰입도가 좋습니다.$$, $$동기부여를 유지하고 시험 기간 계획을 실행 가능한 수준으로 관리해야 합니다.$$, $$C++ 기출문제와 학습계획표 실천을 함께 관리합니다.$$, $$대회 심화 유지$$, $$C++ 반복문, 기출문제, AI 학습계획표를 진행했습니다.$$, $$C++ 문제 풀이 몰입도가 좋습니다. 실행 가능한 계획을 세워 꾸준히 실천하도록 관리하겠습니다.$$, $$최근 피드백 16건. 관심사 동기부여 필요.$$),
  ($$김윤호$$, $$대회반$$, $$최근 피드백 18건 기준. 주도형이며 C++ 사고력 기출형 과제와 블록 구현을 진행했습니다.$$, $$4단계$$, $$문제 풀이 경험이 많고 구현 언어 C++로 연결하는 단계에 있습니다.$$, $$풀이 기록을 외부 OJ와 학원 플랫폼 기록으로 남기는 관리가 필요합니다.$$, $$C++ 사고력 기출형 과제를 풀고 풀이 과정을 기록합니다.$$, $$대회 심화 유지$$, $$컴퓨팅 사고력 기출문제와 C++ 코드 구현을 진행했습니다.$$, $$C++로 사고력 문제를 구현하는 흐름에 있습니다. 풀이 기록을 누적해 대회 준비 자료로 만들겠습니다.$$, $$최근 피드백 18건. 마지막 기록 2026년 6월 13일.$$),
  ($$변승완$$, $$대회반$$, $$최근 피드백 20건 기준. 집중형이며 C++ pair까지 알고리즘 학습을 진행했습니다.$$, $$4단계$$, $$높은 집중력과 주도적으로 문법을 구성하고 에러를 해결하려는 태도가 좋습니다.$$, $$반복문부터 pair까지 기출문제를 꾸준히 복습하고 기록해야 합니다.$$, $$C++ 문법과 알고리즘 기출문제를 OJ 풀이 기록으로 남깁니다.$$, $$대회 심화 유지$$, $$C++ pair, 반복문, 사고력 기출형 과제를 진행했습니다.$$, $$집중력과 문제 해결 태도가 좋습니다. C++ 기출 풀이 기록을 꾸준히 남기도록 관리하겠습니다.$$, $$최근 피드백 20건. 마지막 기록 2026년 6월 10일.$$),
  ($$김태현$$, $$대회반$$, $$최근 피드백 13건 기준. 집중형이며 C++ 반복 학습과 CT 기출문제를 진행했습니다.$$, $$4단계$$, $$흐트러짐 없는 집중력과 과제 소화력이 좋습니다.$$, $$컴퓨팅 사고력 코드 구현 과제를 꾸준히 누적해야 합니다.$$, $$CT 기출문제를 C++ 또는 블록 구현으로 재현합니다.$$, $$대회 심화 유지$$, $$C++ 반복 학습과 BIKO 기출문제 구현을 진행했습니다.$$, $$집중력과 과제 수행력이 강점입니다. 기출문제 코드 구현을 누적해 실력 증명 자료로 만들겠습니다.$$, $$최근 피드백 13건. 마지막 기록 2026년 6월 9일.$$),
  ($$김민준$$, $$대회반$$, $$최근 피드백 5건 기준. 파이썬 기초와 엔트리 COS 3급 기출을 진행했습니다.$$, $$3단계$$, $$끝까지 집중력을 유지하고 변수, 신호, 조건문 배치 성취도가 좋습니다.$$, $$사고력 기출문제를 코드 구현으로 연결하는 반복이 필요합니다.$$, $$COS 3급 기출과 사고력 문제 코드 구현을 병행합니다.$$, $$대회 심화 유지$$, $$파이썬 기초 문법, 엔트리 COS, CT 기출문제를 진행했습니다.$$, $$기출문제 요구 조건을 구현하는 성취도가 좋습니다. 사고력 문제를 코드로 바꾸는 연습을 이어가겠습니다.$$, $$최근 피드백 5건. 마지막 기록 2026년 6월 6일.$$),
  ($$조예준$$, $$대회반$$, $$최근 피드백 12건 기준. 조용한 편이며 C++ 문법과 사고력 기출문제를 진행했습니다.$$, $$4단계$$, $$꾸준히 기출문제를 접하고 구현 흐름을 따라가고 있습니다.$$, $$문제 조건 정리와 코드 구현 과정을 더 명확히 기록해야 합니다.$$, $$C++ 문법 기출과 사고력 코드 구현을 반복합니다.$$, $$대회 심화 유지$$, $$C++ 문법 기출문제와 CT 기출 구현을 진행했습니다.$$, $$기출문제 풀이 경험을 쌓고 있습니다. 풀이 과정과 구현 결과를 함께 기록하도록 지도하겠습니다.$$, $$최근 피드백 12건. 마지막 기록 2026년 6월 13일.$$),
  ($$이시아$$, $$대회반$$, $$최근 피드백 6건 기준. 조용한 편이며 BIKO 사고력 기출문제를 분석하고 구현하고 있습니다.$$, $$4단계$$, $$문제 분석 설명을 듣고 정답 이유와 구현 방식으로 연결하는 단계입니다.$$, $$정답 이유를 말로 설명하고 블록코딩으로 재현하는 과제가 필요합니다.$$, $$BIKO 사고력 문제의 정답 이유와 구현 과정을 정리합니다.$$, $$대회 심화 유지$$, $$BIKO 컴퓨팅 사고력 기출문제 풀이와 분석을 진행했습니다.$$, $$문제 분석과 구현을 연결하고 있습니다. 정답 이유를 설명하고 재현하는 과제를 통해 사고력을 강화하겠습니다.$$, $$최근 피드백 6건. 마지막 기록 2026년 6월 11일.$$)
),
matched as (
  select
    students.id as student_id,
    seed.*
  from seed
  join public.students
    on replace(trim(public.students.name), ' ', '') = replace(trim(seed.student_name), ' ', '')
  where coalesce(public.students.status, '') <> 'deactivated'
    and coalesce(public.students.class, '') <> 'admin'
)
insert into public.student_growth_management (
  student_id,
  student_name,
  current_class,
  temperament,
  skill_level,
  strengths,
  weaknesses,
  current_goal,
  next_class_potential,
  class_progress,
  parent_feedback_draft,
  teacher_memo,
  status
)
select
  student_id,
  student_name,
  current_class,
  temperament,
  skill_level,
  strengths,
  weaknesses,
  current_goal,
  next_class_potential,
  class_progress,
  parent_feedback_draft,
  teacher_memo,
  'active'
from matched
on conflict (student_id) do update set
  student_name = excluded.student_name,
  current_class = excluded.current_class,
  temperament = excluded.temperament,
  skill_level = excluded.skill_level,
  strengths = excluded.strengths,
  weaknesses = excluded.weaknesses,
  current_goal = excluded.current_goal,
  next_class_potential = excluded.next_class_potential,
  class_progress = excluded.class_progress,
  parent_feedback_draft = excluded.parent_feedback_draft,
  teacher_memo = excluded.teacher_memo,
  status = 'active';

with matched as (
  select
    management.student_id,
    management.student_name,
    management.current_class,
    management.temperament,
    management.skill_level,
    management.strengths,
    management.weaknesses,
    management.current_goal,
    management.next_class_potential,
    management.class_progress,
    management.parent_feedback_draft,
    management.teacher_memo
  from public.student_growth_management management
  where replace(trim(management.student_name), ' ', '') in (
    $$탁규원$$, $$김무성$$, $$김주찬$$, $$전예준$$, $$윤유림$$, $$김성윤$$, $$한효제$$, $$박하준$$,
    $$이현구$$, $$오서영$$, $$민다온$$, $$김우현$$, $$박리현$$,
    $$강지호$$, $$김은별$$, $$노현승$$,
    $$김주원$$, $$석정현$$, $$유시호$$, $$한보윤$$, $$한보리$$, $$김기석$$, $$박지용$$, $$임하준$$, $$이다연$$, $$길태웅$$,
    $$하우빈$$, $$김영호$$, $$박도현$$, $$서민호$$, $$이세라$$, $$엄찬유$$, $$김윤호$$, $$변승완$$, $$김태현$$, $$김민준$$, $$조예준$$, $$이시아$$
  )
)
insert into public.student_growth_entries (
  student_id,
  student_name,
  current_class,
  temperament,
  skill_level,
  strengths,
  weaknesses,
  current_goal,
  next_class_potential,
  class_progress,
  parent_feedback_draft,
  teacher_memo,
  entry_note,
  status
)
select
  student_id,
  student_name,
  current_class,
  temperament,
  skill_level,
  strengths,
  weaknesses,
  current_goal,
  next_class_potential,
  class_progress,
  parent_feedback_draft,
  teacher_memo,
  $$초기 성장관리 데이터 정리$$,
  'active'
from matched
where not exists (
  select 1
  from public.student_growth_entries existing
  where existing.student_id = matched.student_id
    and existing.entry_note = $$초기 성장관리 데이터 정리$$
);
