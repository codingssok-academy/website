# 한글 파일명 수정본 Preview 배포 및 Chrome 검사

검사일: 2026-09-05 (한국 시간)

후속 상태(2026-09-06 기록): 별도로 준비한 가짜 파일에 대해 사용자가 다운로드와 내용 확인 성공을 직접 보고했다. 아래는 최초 원격 검사 당시의 기록이다. 최신 확인 범위와 **후속 시험 자료 정리 보류** 상태는 [직접 다운로드 확인 기록](fresh-file-download-manual-confirmation-2026-09-06.md)을 따른다.

## 결론

사용자의 다음 단계 진행 요청에 따라 검증된 파일명 수정본을 **시험 배포(Preview)** 했다. 배포는 성공했고, 새 배포 주소에서 가짜 학부모 로그인과 공개 파일 목록을 확인했다. 파일 링크를 열었을 때 원격 Chrome 화면에 **`Codex에서 차단한 페이지입니다. ERR_BLOCKED_BY_CLIENT`**가 표시돼, 사용자 디스크 저장·열기 검사는 완료하지 못했다.

이는 이번 원격 도구를 통한 파일 수신이 차단됐다는 직접 증거다. 모든 일반 Chrome 사용자에게 같은 오류가 난다거나 홈페이지 서버의 다운로드가 실패했다고 확대 해석하지 않는다. 한글 파일명은 수정된 주소에서 정상으로 확인됐다. 차단을 우회하거나 보안 설정을 변경하지 않았다.

## 배포 대상과 안전 확인

- 저장소: `codingssok-academy/website`.
- 시험 브랜치: `codex/fresh-auth-foundation`.
- 반영 코드: `3a46931698ca597fe1247b1db52e909af4ea318d`.
- 원격 push 1회, 해당 push에 따른 Vercel 자동 Preview 배포 1회. CLI로 별도 배포하거나 자동 재시도하지 않았다.
- Vercel 프로젝트: `codingssok-website`.
- [배포 상세](https://vercel.com/director-6826s-projects/codingssok-website/Fj4xQ3PMdC8xpEWyN676qesB1EZK).
- [새 시험 학부모 화면](https://codingssok-website-iiao2cxur-director-6826s-projects.vercel.app/parent).
- 브랜치 시험 주소도 같은 수정본으로 연결됨: `codingssok-website-git-codex-fre-cd13c8-director-6826s-projects.vercel.app`.
- Vercel 화면에서 `Ready`, `Environment: Preview`, 코드 `3a46931`, `Assigning Custom Domains: Skipped`를 확인했다. 완료 시각은 15:18:13, 빌드/배포 소요 시간은 3분 12초였다.
- GitHub 커밋 상태에서도 Vercel의 `Deployment has completed`, `success`를 확인했다.

배포 전에 Vercel의 시험 브랜치 전용 `NEXT_PUBLIC_SUPABASE_URL`이 `https://opcdcuedhwyuyhzaubpu.supabase.co`, 인증 모드가 `hashed`임을 읽기 전용으로 확인했다. 비밀키/공개키 설정도 해당 Preview 브랜치 범위에 존재했다. 설정값을 변경하지 않았다.

운영 `main`은 전후 모두 `07d27b3883a6836cc58821f718d6e07a8d02d6d3` 그대로다. 운영 브랜치에 push/merge하거나 운영 배포를 하지 않았고, 운영 DB에 연결하지 않았다. 기존 무관한 미추적 파일도 포함하지 않았다.

## 검사

- 배포 소스가 직전 로컬 빌드·타입·lint·전체 검사 639건을 통과한 코드와 동일함을 확인했다.
- 이번에는 파일 API, 학부모 파일 표시, fresh 접근 관련 7개 파일 **67건**을 다시 실행해 통과했다.
- Vercel에서 새 배포 빌드가 성공했다.
- 새 배포 고유 주소를 사용했다. 이 주소에서는 학생/관리자 로그인을 하지 않고 가짜 학부모 로그인만 했다.
- 연결된 가짜 학생과 공개 파일 `가짜연결작품.txt`(78바이트)가 표시됐다. 선생님 전용 가짜 파일은 목록에 표시되지 않았다.
- `받기` 클릭은 수행됐으나 브라우저 도구의 다운로드 완료 대기는 20초 후 시간 초과했다.
- 화면에 앱 오류가 표시되지 않았고 수집한 콘솔 오류/경고는 없었다.
- 지원되는 파일 링크 다운로드 기능으로 다시 확인하자 시험 Supabase의 서명 파일 주소로 이동한 뒤 위 `ERR_BLOCKED_BY_CLIENT` 화면이 관찰됐다.
- 주소의 download 파라미터는 한 번 인코딩된 원본 한글 이름이었다. 전체 서명 토큰은 기록하지 않는다.
- Windows가 지정한 Downloads 폴더에서도 이번 가짜 파일을 확인하지 못했다.

브라우저 내부 다운로드 페이지 접근 제한을 우회하지 않았고, 확장 프로그램/보안 설정을 변경하지 않았다. 로컬 HTTP에서 확인했던 실제 파일 바이트·응답 헤더 검사를 이번 Preview의 디스크 저장 완료 증거로 대신하지 않는다.

## 가짜 시험 자료 정리

`codingssok-growth-v2-fresh-test` (`opcdcuedhwyuyhzaubpu`)만 사용했다. 검사 전 주요 자료가 0건인 것을 확인한 뒤 가짜 계정 2개, 가짜 학생 1명, 공개/비공개 가짜 파일 2개를 만들었다. 실제 학생 개인정보는 사용하지 않았다.

검사 후 이번에 만든 ID와 저장 경로만 지정해 정리했다. `profiles`, `students`, `student_growth_records`, `student_attendance_records`, `announcements`, `student_files`, `user_progress`, `xp_history`, `student_activity_log`, Auth 사용자가 모두 0건이었다. 생성했던 저장소 파일 2개도 없어졌음을 확인했다. 이들은 재생성 가능한 가짜 자료이며 실제 자료는 삭제하지 않았다.

비밀키는 가짜 시험 자료 생성·정리 프로세스에서만 사용했다. 키를 파일에 저장하지 않았고 클립보드와 프로세스 환경변수를 정리했다. 로컬 서버는 이번에 실행하지 않았다. 학부모 탭은 시험 자료 정리 후 로그인 화면으로 돌려놓았다.

## 별도 주의 사항

원격 push 응답에서 GitHub가 기본 브랜치의 기존 의존성 보안 경고 **89건(높음 37, 중간 43, 낮음 9)**을 알렸다. 이번 파일명 수정으로 새로 발생했다고 확인된 경고는 아니다. 세부 위험도/영향은 별도로 분석하지 않았으며, 승인 범위를 벗어나 패키지를 업데이트하지 않았다. 운영 전환 전 별도 점검이 필요하다.

## 남은 단계

시험 배포는 완료됐다. 실제 사용자 Chrome에서 `받기`를 눌러 파일이 저장되고 열리는지는 미확인이다. 원격 도구의 차단은 우회하지 않고 사용자 직접 확인 단계로 넘긴다. 시험 자료는 이미 정리했으므로 직접 확인 시 가짜 파일을 다시 준비하고 확인 직후 정리해야 한다. 이 기록만 로컬 커밋으로 보관하며 문서 기록을 위해 불필요한 추가 배포를 만들지 않는다.
