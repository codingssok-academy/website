$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$serverDirectory = Join-Path $workspace ".next\server"
$targetUrl = "https://opcdcuedhwyuyhzaubpu.supabase.co"

$publishableKey = $null
Get-ChildItem -LiteralPath $serverDirectory -Recurse -File -Filter "*.js" | ForEach-Object {
    if ($publishableKey) { return }
    $content = Get-Content -Raw -LiteralPath $_.FullName
    $match = [regex]::Match($content, "sb_publishable_[A-Za-z0-9_-]+")
    if ($match.Success) { $publishableKey = $match.Value }
}

if (-not $publishableKey) {
    throw "Fresh-test publishable key was not found in the production build."
}

$env:NEXT_PUBLIC_SUPABASE_URL = $targetUrl
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $publishableKey
$env:SUPABASE_ACCESS_CODE_MODE = "hashed"

Set-Location -LiteralPath $workspace
& node ".\node_modules\next\dist\bin\next" start -p 3011
