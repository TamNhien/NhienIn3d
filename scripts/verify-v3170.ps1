param(
  [switch]$Full,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $Root

function Run-Step([string]$Name, [scriptblock]$Action) {
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  & $Action
  if ($LASTEXITCODE -ne 0) { throw "$Name thất bại (exit $LASTEXITCODE)." }
}

try {
  Write-Host "[NhienIn3d v3.17.0] Verification" -ForegroundColor Cyan
  if (-not $SkipInstall) { Run-Step "npm install" { npm install } }
  Run-Step "Security gate" { npm run security:mysql2 }
  Run-Step "npm audit" { npm audit }
  Run-Step "Tests" { npm test }
  Run-Step "Typecheck" { npm run typecheck }
  Run-Step "Build" { npm run build }

  if ($Full) {
    Write-Host "`n=== Backup database ===" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot "backup-db.ps1")
    Run-Step "Docker build" { docker compose build --no-cache migrate api web }
    Run-Step "Docker up" { docker compose up -d --force-recreate --remove-orphans }
    Run-Step "Docker ps" { docker compose ps }
    Write-Host "`n=== Migration status ===" -ForegroundColor Cyan
    docker compose logs migrate --tail 120
    if ($LASTEXITCODE -ne 0) { throw "Không đọc được migrate logs." }
    Write-Host "`n=== Runtime E2E ===" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot "e2e-runtime-v3170.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Runtime E2E v3.17.0 thất bại." }
    Write-Host "`n=== Recovery drill RPO/RTO ===" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot "recovery-drill-v3170.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Recovery drill v3.17.0 thất bại." }
    Run-Step "Playwright Chromium" { npx playwright install chromium }
    Run-Step "Browser E2E" { npm run e2e:browser }
  }

  Write-Host "`nNhienIn3d v3.17.0 verification PASS ✅" -ForegroundColor Green
  if (-not $Full) { Write-Host "Muốn kiểm tra cả Docker + Runtime + Browser: npm run verify:full" -ForegroundColor DarkGray }
} finally {
  Pop-Location
}
