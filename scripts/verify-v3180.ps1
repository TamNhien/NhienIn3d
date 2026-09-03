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

function Get-ProjectEnv([string]$Name, [string]$DefaultValue) {
  $fromProcess = [Environment]::GetEnvironmentVariable($Name)
  if (-not [string]::IsNullOrWhiteSpace($fromProcess)) { return $fromProcess.Trim() }
  $envFile = Join-Path $Root ".env"
  if (Test-Path $envFile) {
    foreach ($line in Get-Content -LiteralPath $envFile -Encoding UTF8) {
      $trim = $line.Trim()
      if (-not $trim -or $trim.StartsWith("#") -or -not $trim.Contains("=")) { continue }
      $parts = $trim.Split("=", 2)
      if ($parts[0].Trim() -eq $Name) { return $parts[1].Trim().Trim('"').Trim("'") }
    }
  }
  return $DefaultValue
}

try {
  Write-Host "[NhienIn3d v3.18.0] Verification" -ForegroundColor Cyan
  if (-not $SkipInstall) { Run-Step "npm install" { npm install } }
  Run-Step "Security gate" { npm run security:mysql2 }
  Run-Step "npm audit" { npm audit }
  Run-Step "Tests" { npm test }
  Run-Step "Typecheck" { npm run typecheck }
  Run-Step "Build" { npm run build }

  if ($Full) {
    Write-Host "`n=== Backup database ===" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot "backup-db.ps1")
    $pitrEnabled = @("1","true","yes","on") -contains (Get-ProjectEnv "SYSTEM_DB_PITR_DRILL_ENABLED" "false").ToLowerInvariant()
    if ($pitrEnabled) {
      Run-Step "Docker build" { docker compose -f docker-compose.yml -f docker-compose.pitr.yml build --no-cache migrate api web }
      Run-Step "Docker up" { docker compose -f docker-compose.yml -f docker-compose.pitr.yml up -d --force-recreate --remove-orphans }
      Run-Step "Docker ps" { docker compose -f docker-compose.yml -f docker-compose.pitr.yml ps }
    } else {
      Run-Step "Docker build" { docker compose build --no-cache migrate api web }
      Run-Step "Docker up" { docker compose up -d --force-recreate --remove-orphans }
      Run-Step "Docker ps" { docker compose ps }
    }
    Write-Host "`n=== Migration status ===" -ForegroundColor Cyan
    docker compose logs migrate --tail 120
    if ($LASTEXITCODE -ne 0) { throw "Không đọc được migrate logs." }
    Write-Host "`n=== Runtime E2E ===" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot "e2e-runtime-v3180.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Runtime E2E v3.18.0 thất bại." }
    Write-Host "`n=== Recovery drill RPO/RTO ===" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot "recovery-drill-v3180.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Recovery drill v3.18.0 thất bại." }
    Write-Host "`n=== Target-time PITR drill (opt-in) ===" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot "recovery-pitr-drill-v3180.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Target-time PITR drill v3.18.0 thất bại." }
    Run-Step "Playwright Chromium" { npx playwright install chromium }
    Run-Step "Browser E2E" { npm run e2e:browser }
  }

  Write-Host "`nNhienIn3d v3.18.0 verification PASS ✅" -ForegroundColor Green
  if (-not $Full) { Write-Host "Muốn kiểm tra cả Docker + Runtime + Browser: npm run verify:full" -ForegroundColor DarkGray }
} finally {
  Pop-Location
}
