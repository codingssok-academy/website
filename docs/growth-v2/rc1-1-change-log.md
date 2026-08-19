# Growth 2.0 통합 데모 RC1.1 정리 기록

## 이번 단계의 목적

RC1.1은 기존 RC1의 저장·공개 기능을 바꾸지 않고, 원장님과 학부모가 화면을 더 쉽게 이해하도록 이름과 안내 문구를 정리한 단계입니다.

## 화면에서 달라진 점

- `테스트 학생 A 학생의`처럼 겹치던 호칭을 `테스트 학생 A의`로 정리했습니다.
- 학생과 학부모 화면에서 버전 번호, API, DB처럼 이해하기 어려운 표시를 숨기거나 쉬운 말로 바꿨습니다.
- 선생님 화면의 저장·공개 결과와 이전 평가 보관 안내를 쉬운 문장으로 바꿨습니다.
- 공개 확인창에 학생에게 보이는 항목과 학부모에게 보이는 항목을 나누어 표시합니다.
- 현재 화면이 로컬 연습 환경인지 온라인 시험 환경인지 상단과 로그인 화면에서 분명히 알 수 있습니다.
- 데모 전용 화면 이동 메뉴는 설정값이 `1`일 때만 표시합니다.

## 로컬 데모 실행

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\dev\codingssok-growth-v2-demo-rc1-1\scripts\start-growth2-integrated-demo-rc1-1.ps1"
```

실행 도구는 아래 값을 사용합니다.

```text
NEXT_PUBLIC_GROWTH_PREVIEW_ENV=local
NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV=1
```

로컬 자료의 주간 날짜가 한국 시간 기준으로 어긋나지 않도록 실행할 때 로컬 데이터베이스 시간도 `Asia/Seoul`로 맞춥니다. 이 설정은 종료할 때 함께 삭제되는 RC1.1 로컬 환경에만 적용됩니다.

화면 주소는 다음과 같습니다.

- 학생: `http://127.0.0.1:3019/growth-preview/student-local`
- 학부모: `http://127.0.0.1:3019/growth-preview/parent-local`
- 선생님: `http://127.0.0.1:3019/growth-preview/teacher-local`
- 기존 데모: `http://127.0.0.1:3019/growth-preview`

## 로컬 데모 종료

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\dev\codingssok-growth-v2-demo-rc1-1\scripts\stop-growth2-integrated-demo-rc1-1.ps1"
```

종료 도구는 RC1.1 화면과 이 데모가 사용한 로컬 자료만 정리합니다.

## 앞으로 만들 온라인 시험 환경의 표시 설정

온라인 시험용 웹사이트를 만들 때는 아래 값을 사용하도록 준비했습니다.

```text
NEXT_PUBLIC_GROWTH_PREVIEW_ENV=staging
NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV=0
```

이 경우 화면에는 `Growth 2.0 시험 환경` 안내가 표시되고, 데모 전용 화면 이동 링크는 숨겨집니다. 이번 단계에서는 실제 온라인 시험용 웹사이트나 Supabase 프로젝트를 만들지 않았습니다.

## 바꾸지 않은 기능

- 선생님 평가 초안 저장
- 평가 공개와 학생·학부모 공개 범위
- 이전 공개 평가 보관
- 직접 입력한 학습 개념
- 학생 미션과 XP 처리
- 백엔드 RC1, 기존 UI RC1, 온라인 시험 계획 폴더

운영 홈페이지, 실제 계정, 실제 학생 자료, 배포 설정도 변경하지 않았습니다.
