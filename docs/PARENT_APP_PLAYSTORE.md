# 코딩쏙 학부모 포털 Play Store 운영 가이드

학부모 포털 앱은 Android 네이티브 앱이 아니라 TWA(Trusted Web Activity)입니다.  
Play Store 앱이 여는 실제 웹 호스트는 `https://codingssok-parent-app.vercel.app`이고, 앱 시작 경로는 `/parent/feedback`입니다.

## 현재 업로드 대상

- 앱 패키지: `com.codingssok.parent`
- 웹 호스트: `codingssok-parent-app.vercel.app`
- 시작 경로: `/parent/feedback`
- 버전명: `1.0.15`
- 버전코드: `15`
- 업로드 파일:
  `C:\Users\dg020\Desktop\작업\projects\parent-app\app-release-bundle-v1.0.15-code15-parent-feedback-20260612.aab`
- 업로드 파일 SHA256:
  `A660F1CE6E58998C7BFC1672E1E4B4AB9021A75624D80884E12A4F4F08714AC7`

Play Console은 같은 `versionCode`를 다시 업로드할 수 없습니다. 기존에 `14`를 올린 이력이 있으면 반드시 `15` 파일을 사용합니다.

## 웹 배포 전 필수 확인

웹 프로젝트 루트:

```powershell
cd C:\Users\dg020\Desktop\작업\projects\codingssok-website-domain-b81ead7
```

로컬 빌드:

```powershell
npm.cmd run build
```

배포 전 전체 로컬 검증:

```powershell
npm.cmd run check:parent-release-local
```

Play Store 업로드 파일과 TWA 설정 감사:

```powershell
npm.cmd run audit:parent-release
```

이 명령은 다음을 한 번에 확인합니다.

- 웹 manifest의 시작 경로 `/parent/feedback`
- 학부모 전용 service worker 캐시 경로
- 관리자 안내문 복사 URL, 피드백 푸시 URL, parent 404 복귀 링크, sitemap의 `/parent/feedback` 정합성
- parent-app `twa-manifest.json`
- parent-app `app/build.gradle`
- Android generated release resource의 launch URL
- AAB 파일 SHA256

로컬 학부모 앱 스모크 체크:

```powershell
npm.cmd run smoke:parent -- --base http://localhost:3011 --mode local
```

학부모 앱 실제 UI 체크:

```powershell
npm.cmd run check:parent-app-ui
```

관리자 화면 UI 체크:

```powershell
npm.cmd run check:parent-admin-ui
```

실제 학생 인증까지 확인:

```powershell
$env:PARENT_SMOKE_NAME='이다연'
$env:PARENT_SMOKE_PIN='78202'
npm.cmd run smoke:parent -- --base http://localhost:3011 --mode local
```

## Vercel 배포 후 확인

배포 대상은 Play Store 앱이 바라보는 호스트인 `codingssok-parent-app.vercel.app`이어야 합니다.

2026-06-12 현재 production 확인 결과:

- `https://codingssok-parent-app.vercel.app/manifest-parent.json`의 `start_url`은 아직 `/parent`입니다.
- `https://codingssok-parent-app.vercel.app/api/teacher/parent-codes`는 아직 `404`입니다.
- `https://codingssok-parent-app.vercel.app/.well-known/assetlinks.json`은 `com.codingssok.parent` 패키지와 연결되어 있습니다.
- 따라서 현재 로컬 작업본을 Vercel에 배포하기 전에는 Play Store 앱이 최신 학부모 포털/관리자 연동 버전이라고 볼 수 없습니다.

2026-06-13 production smoke 결과:

- 통과: `/parent/feedback` 앱 셸 응답
- 통과: `assetlinks.json`의 패키지명 `com.codingssok.parent`
- 통과: `assetlinks.json`의 SHA256 `6D:BE:EC:91:00:CE:04:ED:47:66:BF:56:39:A5:32:45:A0:26:C7:2F:83:F3:2C:37:30:E7:2C:20:A7:E4:7F:DC`
- 실패: `manifest-parent.json`의 `start_url`이 아직 `/parent`
- 실패: `parent-sw.js`가 아직 `codingssok-parent-v3` 캐시가 아님
- 실패: `/api/teacher/parent-codes`가 아직 `404`

배포 후:

```powershell
npm.cmd run check:parent-release-production
```

실제 인증까지 확인하려면:

```powershell
npm.cmd run check:parent-release-production -- --name 이다연 --pin 78202 --include-ui
```

통과해야 하는 항목:

- `manifest-parent.json`의 `start_url`이 `/parent/feedback`
- parent service worker가 `/parent/feedback`, `/parent/settings`만 학부모 앱 주요 경로로 캐시
- `growth`, `parents-day` 경로가 캐시되지 않음
- `/parent/feedback`이 학부모 앱 셸을 반환
- 운영의 `/api/teacher/parent-codes`가 비로그인 상태에서 공개되지 않음
- 선택 인증 시 학부모 인증 후 피드백 조회가 가능

## 앱 기능 기준

현재 앱에 남겨야 하는 탭:

- 피드백
- 설정

현재 앱에서 제거되어야 하는 항목:

- 홈 탭
- 성장 탭
- 어버이날 탭
- 데이터 초기화 버튼
- 인증 초기화 버튼
- 학생 이름 변경 버튼

## 관리자 연동 기준

관리자 페이지:

```text
/teacher/admin
```

필수 기능:

- 학부모 코드 발급
- 코드 재발급
- 코드 삭제
- 형제/자매 묶기
- 안내문 복사
- 현재 학부모 인증번호 목록 표시

운영 원칙:

- 안내문 복사에 들어가는 접속 주소는 `https://www.codingssok.com/parent/feedback`이어야 합니다.
- `기준표` 상태의 코드는 목록에 보이더라도 아직 학부모 앱 인증에 적용된 코드가 아닙니다.
- 학부모에게 안내문을 보내기 전에 `기준표 전체 활성화` 또는 해당 학생의 `재발급`을 먼저 실행해야 합니다.
- 안내문 복사는 `활성` 상태의 코드에서만 사용합니다.
- 관리자 UI에서 `기준표 · 활성화 필요` 상태의 `복사` 버튼은 비활성화되어야 합니다.
- `기준표 전체 활성화`는 현재 기준표 38명을 DB에 저장해서 학부모 앱 인증이 바로 통과하도록 만드는 초기 운영 작업입니다.

삭제 동작 기준:

- 관리자에서 학부모 코드를 삭제하면 DB의 학생 `pin`이 비워져야 합니다.
- 연결된 `study_progress`의 학부모 PIN도 삭제되어야 합니다.
- 삭제된 학생은 기준표 코드로 자동 부활하면 안 됩니다.
- 앱에서 기존 인증 세션으로 피드백을 열려고 하면 `401` 또는 `403`이 발생해야 합니다.
- 앱은 저장된 학생명, 인증 상태, 대시보드 캐시를 지우고 학부모 인증 화면으로 돌아가야 합니다.

이 동작은 아래 테스트가 보장합니다.

```powershell
npx.cmd vitest run src\lib\__tests__\parent-code-rows.test.ts src\lib\__tests__\parent-client-auth.test.ts
npm.cmd run check:parent-app-ui
npm.cmd run check:parent-admin-ui
```

## 기준 명단

현재 기준표는 38명입니다.

- 공통기초반: 탁규원, 김무성, 김주찬, 전예준, 윤유림, 김성윤, 한효제, 박하준
- 흥미반: 이현구, 오서영, 민다온, 김우현, 박리현
- 만들기반: 강지호, 김은별, 노현승
- 프로젝트반: 김주원, 석정현, 유시호, 한보윤, 한보리, 김기석, 박지용, 임하준, 이다연, 길태웅
- 대회반: 하우빈, 김영호, 박도현, 서민호, 이세라, 엄찬유, 김윤호, 변승완, 김태현, 김민준, 조예준, 이시아

삭제된 예전 명단 학생은 기준표에 다시 나오면 안 됩니다.

- 김시율
- 길태용
- 서예준
- 양하준
- 정윤호

한보윤, 한보리는 자매이므로 같은 학부모 인증번호를 사용합니다.

## AAB 빌드

앱 프로젝트 루트:

```powershell
cd C:\Users\dg020\Desktop\작업\projects\parent-app
```

현재 설정 확인:

```powershell
Select-String -LiteralPath app\build.gradle -Pattern "versionCode|versionName|launchUrl|hostName"
```

기대값:

```text
hostName: 'codingssok-parent-app.vercel.app'
launchUrl: '/parent/feedback'
versionCode 15
versionName "1.0.15"
```

빌드:

```powershell
.\gradlew.bat bundleRelease
```

업로드용으로 복사:

```powershell
Copy-Item -LiteralPath app\build\outputs\bundle\release\app-release.aab -Destination app-release-bundle-v1.0.15-code15-parent-feedback-20260612.aab -Force
```

## Play Console 업로드 순서

1. Google Play Console 접속
2. 코딩쏙 학부모 포털 앱 선택
3. 프로덕션 또는 현재 사용 중인 출시 트랙 선택
4. 새 버전 만들기
5. `app-release-bundle-v1.0.15-code15-parent-feedback-20260612.aab` 업로드
6. 출시 노트 작성
7. 검토 제출

출시 노트 예시:

```text
학부모 포털 접근 보안을 강화했습니다.
피드백과 과제 확인 화면을 정리했습니다.
관리자 학부모 코드 발급, 재발급, 삭제 연동을 개선했습니다.
```

## Play Store 반영 후 실기기 확인

반영된 앱에서 확인할 것:

- 앱 실행 시 바로 학부모 인증 화면 또는 피드백 화면으로 진입
- 인증 후 하단 탭은 `피드백`, `설정`만 표시
- `홈`, `성장`, `어버이날` 탭 없음
- `데이터 초기화`, `인증 초기화`, `이름 변경` 없음
- 이다연 `78202` 인증 가능
- 피드백 20개 표시
- 첫 피드백에 `배운 내용`과 `과제` 표시
- 잘못된 코드 또는 삭제된 코드는 접근 실패

## 완료 판정

완료로 볼 수 있는 조건:

1. Vercel 운영 배포 완료
2. `npm.cmd run smoke:parent -- --base https://codingssok-parent-app.vercel.app --mode production` 통과
3. 실제 학생 인증 스모크 체크 통과
4. Play Console에 versionCode `15` 업로드 완료
5. Play Store 배포판에서 실기기 확인 완료

위 조건이 모두 충족되기 전에는 로컬 준비 완료 상태이지, 운영 완료 상태가 아닙니다.
