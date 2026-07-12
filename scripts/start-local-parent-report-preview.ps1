[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$frontendRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = "C:\dev\codingssok-growth-v2-backend-parent-preview"
$dependencyRoot = "C:\dev\codingssok-growth-v2\node_modules"
$stateRoot = Join-Path $env:TEMP "codingssok-growth-v2-parent-report-local"
$pidPath = Join-Path $stateRoot "frontend.pid"
$stdoutPath = Join-Path $stateRoot "frontend.stdout.log"
$stderrPath = Join-Path $stateRoot "frontend.stderr.log"
$parentUrl = "http://127.0.0.1:3016/growth-preview/parent-local"
$teacherUrl = "http://127.0.0.1:3016/growth-preview/teacher-local"
$teacherPassword = $null
$studentPassword = $null
$parentPassword = $null
$anonKey = $null
$apiUrl = $null

function Invoke-CapturedCommand {
    param([string]$WorkingDirectory, [string]$Command, [string]$FailureMessage)
    Push-Location $WorkingDirectory
    try {
        $output = (& cmd.exe /d /c "$Command 2>&1" | Out-String)
        if ($LASTEXITCODE -ne 0) { throw $FailureMessage }
        return $output
    }
    finally { Pop-Location }
}

function Get-SupabaseStatus {
    $raw = Invoke-CapturedCommand $backendRoot "npx.cmd supabase status -o json" "로컬 DB 상태를 읽지 못했습니다."
    $jsonStart = $raw.IndexOf('{'); $jsonEnd = $raw.LastIndexOf('}')
    if ($jsonStart -lt 0 -or $jsonEnd -le $jsonStart) { throw "로컬 DB 연결 정보를 확인하지 못했습니다." }
    return $raw.Substring($jsonStart, $jsonEnd - $jsonStart + 1) | ConvertFrom-Json
}

try {
    if (-not (Test-Path $backendRoot -PathType Container)) {
        throw "백엔드 학부모 미리보기 폴더를 찾지 못했습니다: $backendRoot"
    }
    if (-not (Test-Path (Join-Path $backendRoot "scripts\prepare-local-parent-report-preview.ps1") -PathType Leaf)) {
        throw "가상 학부모 리포트 자료 준비 스크립트를 찾지 못했습니다."
    }
    if (-not (Test-Path (Join-Path $frontendRoot "src\app\growth-preview\parent-local\page.tsx") -PathType Leaf)) {
        throw "3016 학부모 화면 파일을 찾지 못했습니다."
    }
    if (-not (Test-Path (Join-Path $frontendRoot "src\app\growth-preview\teacher-local\page.tsx") -PathType Leaf)) {
        throw "같은 서버에서 사용할 선생님 공개 화면 파일을 찾지 못했습니다."
    }
    if (-not (Test-Path (Join-Path $frontendRoot "node_modules") -PathType Container)) {
        if (-not (Test-Path $dependencyRoot -PathType Container)) {
            throw "기존 화면의 설치된 패키지를 찾지 못했습니다. 새 패키지는 설치하지 않습니다."
        }
        New-Item -ItemType Junction -Path (Join-Path $frontendRoot "node_modules") -Target $dependencyRoot | Out-Null
    }

    & docker version *> $null
    if ($LASTEXITCODE -ne 0) { throw "Docker Client와 Server를 확인해 주세요." }
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw "Docker Desktop을 먼저 실행해 주세요." }

    $portOwner = Get-NetTCPConnection -LocalPort 3016 -State Listen -ErrorAction SilentlyContinue
    if ($null -ne $portOwner) {
        throw "3016번 포트를 다른 프로그램이 사용 중입니다. 해당 프로그램을 먼저 종료해 주세요."
    }

    Write-Host "[1/4] 학부모 리포트용 로컬 연습 DB를 시작합니다."
    [void](Invoke-CapturedCommand $backendRoot "npx.cmd supabase start" "로컬 연습 DB를 시작하지 못했습니다.")

    Write-Host "[2/4] DB를 초기화하고 학부모·학생 A·B 자료를 준비합니다."
    [void](Invoke-CapturedCommand $backendRoot "npx.cmd supabase db reset" "로컬 연습 DB 초기화에 실패했습니다.")
    $status = Get-SupabaseStatus
    $apiUrl = [string]$status.API_URL
    $anonKey = [string]$status.ANON_KEY
    if ($apiUrl -notmatch '^http://(127\.0\.0\.1|localhost):[0-9]+$' -or [string]::IsNullOrWhiteSpace($anonKey)) {
        throw "운영 주소 또는 잘못된 키로는 체험 화면을 시작할 수 없습니다."
    }

    $teacherPassword = ([guid]::NewGuid().ToString("N") + "Aa1!")
    $studentPassword = ([guid]::NewGuid().ToString("N") + "Aa1!")
    $parentPassword = ([guid]::NewGuid().ToString("N") + "Aa1!")
    $env:GROWTH_PREVIEW_TEACHER_PASSWORD = $teacherPassword
    $env:GROWTH_PREVIEW_STUDENT_PASSWORD = $studentPassword
    $env:GROWTH_PREVIEW_PARENT_PASSWORD = $parentPassword
    Push-Location $backendRoot
    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\prepare-local-parent-report-preview.ps1"
        if ($LASTEXITCODE -ne 0) { throw "가상 학부모 리포트 자료 준비에 실패했습니다." }
    }
    finally { Pop-Location }

    $env:GROWTH_PREVIEW_STUDENT_PASSWORD = $null
    $studentPassword = $null

    Write-Host "[3/4] 3016번 학부모·선생님 화면을 시작합니다."
    if (Test-Path $stateRoot) {
        $resolvedState = (Resolve-Path $stateRoot).Path
        $expectedState = [System.IO.Path]::GetFullPath($stateRoot)
        if ($resolvedState -ne $expectedState -or $resolvedState -notlike "$env:TEMP\*") {
            throw "임시 상태 폴더 경로를 확인해 주세요."
        }
    }
    New-Item -ItemType Directory -Force $stateRoot | Out-Null
    Remove-Item -LiteralPath $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue

    $env:GROWTH_PREVIEW_LOCAL_ONLY = "1"
    $env:GROWTH_PREVIEW_SUPABASE_URL = $apiUrl
    $env:GROWTH_PREVIEW_SUPABASE_ANON_KEY = $anonKey
    $env:GROWTH_PREVIEW_PARENT_EMAIL = "parent-preview@example.test"
    $env:GROWTH_PREVIEW_PARENT_PASSWORD = $parentPassword
    $env:GROWTH_PREVIEW_TEACHER_EMAIL = "teacher-preview@example.test"
    $env:GROWTH_PREVIEW_TEACHER_PASSWORD = $teacherPassword

    $process = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/d", "/c", "npx.cmd next dev --webpack -H 127.0.0.1 -p 3016" `
        -WorkingDirectory $frontendRoot -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    Set-Content -LiteralPath $pidPath -Value $process.Id -Encoding Ascii

    $ready = $false
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        Start-Sleep -Milliseconds 500
        if ($process.HasExited) { throw "학부모 리포트 화면 서버가 시작 중 종료되었습니다. 임시 로그를 확인해 주세요." }
        try {
            $parentResponse = Invoke-WebRequest -Uri $parentUrl -UseBasicParsing -TimeoutSec 2
            $teacherResponse = Invoke-WebRequest -Uri $teacherUrl -UseBasicParsing -TimeoutSec 2
            if ($parentResponse.StatusCode -eq 200 -and $teacherResponse.StatusCode -eq 200) {
                $ready = $true; break
            }
        }
        catch { }
    }
    if (-not $ready) { throw "학부모 리포트 화면이 제한 시간 안에 준비되지 않았습니다." }

    Write-Host "[4/4] 준비가 끝났습니다. 브라우저를 엽니다."
    Start-Process $parentUrl
    Write-Host "READY parent_url=$parentUrl teacher_url=$teacherUrl local_db=1 parent=1 teacher=1 children=2 student_a_published=1 student_a_draft_hidden=1 student_b_empty=1 student_b_draft_hidden=1 read_only=1"
}
finally {
    $env:GROWTH_PREVIEW_LOCAL_ONLY = $null
    $env:GROWTH_PREVIEW_SUPABASE_URL = $null
    $env:GROWTH_PREVIEW_SUPABASE_ANON_KEY = $null
    $env:GROWTH_PREVIEW_PARENT_EMAIL = $null
    $env:GROWTH_PREVIEW_PARENT_PASSWORD = $null
    $env:GROWTH_PREVIEW_TEACHER_EMAIL = $null
    $env:GROWTH_PREVIEW_TEACHER_PASSWORD = $null
    $env:GROWTH_PREVIEW_STUDENT_PASSWORD = $null
    $teacherPassword = $null; $studentPassword = $null; $parentPassword = $null
    $anonKey = $null; $apiUrl = $null
}
