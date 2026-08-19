# Growth 2.0 화면과 데이터 연결표

> 이 문서는 현재 미리보기 화면의 각 항목이 나중에 어느 장부에서 와야 하는지 정리한 설계표입니다.

## 1. 학생 화면 `/growth-preview`

| 화면 항목 | 입력 화면 또는 작업 | 읽는 화면 | 원본 테이블 | 계산/저장 | 공개 전 표시 | 수정 가능 역할 |
|---|---|---|---|---|---|---|
| 학생 이름 | 관리자 계정 연결 | 학생·학부모·선생님 | `growth_users`, `growth_students` | 저장값 | 해당 없음 | 관리자 |
| 현재 레벨 | XP 지급 결과 | 학생 | `growth_xp_transactions` + 서버 레벨 규칙 | 계산값 | 해당 없음 | 직접 수정 불가 |
| 총 경험치 | 미션 완료 등 안전한 서버 작업 | 학생 | `growth_xp_transactions` | 합계 계산 | 해당 없음 | 안전한 서버 작업만 지급 |
| 다음 레벨까지 XP | XP 합계와 레벨 규칙 | 학생 | XP 합계 + 서버 레벨 규칙 | 계산값 | 해당 없음 | 직접 수정 불가 |
| 연속 학습일 | 활동 발생 | 학생 | `growth_activity_events` | 날짜 계산 | 해당 없음 | 안전한 서버 작업 |
| 오늘 미션 | 관리자 미션 관리 | 학생 | `growth_missions` | 저장값 | 해당 없음 | 관리자 |
| 학생별 미션 상태 | 미션 완료 요청 | 학생 | `growth_student_missions` | 저장값 | 해당 없음 | 안전한 서버 작업 |
| 미션 XP | 관리자 미션 관리 | 학생 | `growth_missions.xp_reward` | 저장값 | 해당 없음 | 관리자 |
| 주간 목표 진행률 | 선생님 평가 공개 시 확정 | 학생·학부모 | `growth_weekly_evaluations.weekly_goal_progress_pct` | 공개 스냅샷 | 안 보임 | 초안은 선생님, 공개는 승인 역할 |
| 과제 완료율 | 선생님 평가 공개 시 확정 | 학생·학부모 | `growth_weekly_evaluations.assignment_completion_pct` | 공개 스냅샷 | 안 보임 | 초안은 선생님, 공개는 승인 역할 |
| 배운 개념 | 선생님 평가 작성 | 학생·학부모·선생님 | `growth_weekly_evaluation_concepts` | 저장값 | 안 보임 | 담당 선생님(초안) |
| 선생님 긍정 피드백 | 선생님 평가 작성 | 학생 | `growth_weekly_evaluations.strength` | 저장값 | 안 보임 | 담당 선생님(초안) |
| 다음 수업 목표 | 선생님 평가 작성 | 학생·학부모 | `growth_weekly_evaluations.next_goal` | 저장값 | 안 보임 | 담당 선생님(초안) |
| 프로젝트 이름 | 선생님·관리자 프로젝트 생성 | 세 화면 | `growth_projects` | 저장값 | 해당 없음 | 담당 선생님·관리자 |
| 프로젝트 진행률 | 프로젝트 업데이트 작성 | 학생·학부모·선생님 | 최신 `growth_project_updates.progress_pct` | 최신값 | 초안 업데이트는 정책에 따라 제한 | 담당 선생님 |
| 프로젝트 최근 작업 | 프로젝트 업데이트 작성 | 학생·학부모·선생님 | 최신 `growth_project_updates.recent_work` | 저장값 | 공개 기준 전에는 제한 가능 | 담당 선생님 |
| 성장 타임라인 | 미션·평가·프로젝트·배지 처리 | 학생·학부모 | `growth_activity_events` | 저장값 | 공개 대상 이벤트만 표시 | 안전한 서버 작업 |
| 획득 배지 | 배지 조건 처리 | 학생 | `growth_student_badges`, `growth_badges` | 저장값 | 해당 없음 | 안전한 서버 작업 |

학생에게는 `improvement` 원문을 기본적으로 보여 주지 않고, 잘한 점과 다음 목표 중심으로 표시하는 안을 추천합니다.

## 2. 학부모 화면 `/growth-preview/parent`

| 화면 항목 | 입력 화면 또는 작업 | 읽는 화면 | 원본 테이블 | 계산/저장 | 공개 전 표시 | 수정 가능 역할 |
|---|---|---|---|---|---|---|
| 연결 자녀 | 관리자 연결 관리 | 학부모 | `growth_parent_student_links` | 저장값 | 해당 없음 | 관리자 |
| 출석 | 공개 시 확정 | 학부모·선생님 | `growth_weekly_evaluations.attendance_*` | 공개 스냅샷 | 안 보임 | 담당 선생님 초안, 공개는 승인 역할 |
| 과제 완료율 | 공개 시 확정 | 학부모·학생 | `growth_weekly_evaluations.assignment_completion_pct` | 공개 스냅샷 | 안 보임 | 동일 |
| 주간 목표 진행률 | 공개 시 확정 | 학부모·학생 | `growth_weekly_evaluations.weekly_goal_progress_pct` | 공개 스냅샷 | 안 보임 | 동일 |
| 프로젝트 진행률 | 프로젝트 최신값을 공개 시 확정 | 학부모 | `growth_weekly_evaluations.project_progress_pct` | 공개 스냅샷 | 안 보임 | 동일 |
| 잘한 점 | 선생님 평가 | 학생·학부모 | `growth_weekly_evaluations.strength` | 저장값 | 안 보임 | 담당 선생님 초안 |
| 보완할 점 | 선생님 평가 | 학부모 | `growth_weekly_evaluations.improvement` | 저장값 | 안 보임 | 담당 선생님 초안 |
| 다음 수업 목표 | 선생님 평가 | 학생·학부모 | `growth_weekly_evaluations.next_goal` | 저장값 | 안 보임 | 담당 선생님 초안 |
| 배운 개념과 설명 | 선생님 평가 | 학생·학부모 | `growth_weekly_evaluation_concepts` | 저장값 | 안 보임 | 담당 선생님 초안 |
| 프로젝트 최근·다음 작업 | 프로젝트 업데이트 | 학부모·선생님 | 최신 `growth_project_updates` | 저장값 | 공개 정책 적용 | 담당 선생님 |
| 이번 주 성장 기록 | 여러 안전한 서버 작업 | 학부모 | `growth_activity_events` | 저장값 | 공개 대상만 표시 | 직접 수정 불가 |
| 학부모 대화 제안 | 평가 공개 시 선택 또는 서버 문구 규칙 | 학부모 | `growth_weekly_evaluations.parent_conversation_prompt` | 공개 스냅샷 | 안 보임 | 담당 선생님 초안 |

학부모 화면은 반드시 활성 상태의 `growth_parent_student_links`로 연결된 자녀만 읽습니다.

## 3. 선생님 화면 `/growth-preview/teacher`

| 화면 항목 | 입력 화면 | 읽는 화면 | 원본 테이블 | 계산/저장 | 공개 전 표시 | 수정 가능 역할 |
|---|---|---|---|---|---|---|
| 담당 학생 목록 | 관리자 배정 | 선생님 | `growth_teacher_student_assignments` | 저장값 | 해당 없음 | 관리자 |
| 대상 주 | 선생님 평가 | 선생님·공개 후 학생·학부모 | `growth_weekly_evaluations.week_start/end` | 저장값 | 선생님만 | 담당 선생님 |
| 이해도 | 선생님 평가 | 선생님 | `growth_weekly_evaluations.understanding` | 저장값 | 선생님만 | 담당 선생님 초안 |
| 참여 모습 | 선생님 평가 | 선생님 | `growth_weekly_evaluations.participation` | 저장값 | 선생님만 | 담당 선생님 초안 |
| 과제 상태 | 선생님 평가 | 선생님 | `growth_weekly_evaluations.homework_status` | 저장값 | 선생님만 | 담당 선생님 초안 |
| 배운 개념 | 선생님 평가 | 세 화면 | `growth_weekly_evaluation_concepts` | 저장값 | 학생·학부모에게 안 보임 | 담당 선생님 초안 |
| 잘한 점 | 선생님 평가 | 세 화면 | `growth_weekly_evaluations.strength` | 저장값 | 학생·학부모에게 안 보임 | 담당 선생님 초안 |
| 보완할 점 | 선생님 평가 | 학부모·선생님 | `growth_weekly_evaluations.improvement` | 저장값 | 학생·학부모에게 안 보임 | 담당 선생님 초안 |
| 다음 수업 목표 | 선생님 평가 | 세 화면 | `growth_weekly_evaluations.next_goal` | 저장값 | 학생·학부모에게 안 보임 | 담당 선생님 초안 |
| 프로젝트 최근 작업 | 선생님 평가·프로젝트 기록 | 세 화면 | `growth_project_updates.recent_work` | 저장값 | 공개 정책 적용 | 담당 선생님 |
| 프로젝트 다음 작업 | 선생님 평가·프로젝트 기록 | 학부모·선생님 | `growth_project_updates.next_work` | 저장값 | 공개 정책 적용 | 담당 선생님 |
| 초안 저장 | 선생님 화면 | 선생님 | 평가 `status=draft` | 저장값 | 학생·학부모에게 안 보임 | 담당 선생님 |
| 공개 | 선생님 공개 버튼 | 학생·학부모 | 평가 `status=published` | 상태 변경 | 공개 후 보임 | 승인된 역할 |
| 수정 이력 | 새 버전 작성 | 선생님·관리자 | 평가 `version`, `revision_of_id` | 저장값 | 현재 공개본만 표시 | 담당 선생님·관리자 |

## 4. 같은 내용을 여러 번 저장하지 않는 규칙

- 학생 피드백과 학부모 평가를 별도 표로 복사하지 않습니다.
- 학생 총 XP 칸을 직접 저장하지 않습니다.
- 미션 완료 여부를 미션 표와 타임라인 표 양쪽에서 상태값으로 관리하지 않습니다.
- 프로젝트의 현재 진행률은 최신 업데이트에서 읽습니다.
- 주간 리포트 숫자만 “공개 당시 값 보존”이라는 명확한 이유로 평가 공개본에 스냅샷을 둡니다.

## 5. 공개 여부 표시 규칙

- `draft`: 선생님만 조회
- `published`: 학생 본인, 연결 학부모, 담당 선생님, 관리자 조회
- `archived`: 선생님과 관리자만 이력 조회
- 학생·학부모 API는 반드시 `published`만 반환
- 화면에서 숨기는 것만으로 끝내지 않고 DB RLS에서도 차단
