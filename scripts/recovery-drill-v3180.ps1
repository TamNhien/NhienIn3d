$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $Root

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

function Invoke-PsqlScalar([string]$Sql) {
  $raw = $Sql | docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -X -qAt -v ON_ERROR_STOP=1'
  if ($LASTEXITCODE -ne 0) { throw "PostgreSQL recovery query failed." }
  $lines = @($raw | ForEach-Object { ([string]$_).Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($lines.Count -eq 0) { return "" }
  return [string]$lines[$lines.Count - 1]
}

try {
  Write-Host "[Recovery drill v3.18.0] Isolated logical restore + RPO/RTO readiness..." -ForegroundColor Cyan
  $rpoTarget = [Math]::Max(1, [int](Get-ProjectEnv "SYSTEM_DB_RECOVERY_RPO_TARGET_MINUTES" "60"))
  $rtoTarget = [Math]::Max(1, [int](Get-ProjectEnv "SYSTEM_DB_RECOVERY_RTO_TARGET_MINUTES" "30"))
  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  & (Join-Path $PSScriptRoot "e2e-runtime-v320.ps1") -KhongKiemTraApi
  if ($LASTEXITCODE -ne 0) { throw "Logical restore drill failed." }
  $stopwatch.Stop()

  $walLevel = Invoke-PsqlScalar "SELECT current_setting('wal_level');"
  $archiveMode = Invoke-PsqlScalar "SELECT current_setting('archive_mode');"
  $archiveCommand = Invoke-PsqlScalar "SELECT CASE WHEN current_setting('archive_command') <> '' AND current_setting('archive_command') <> '(disabled)' THEN 'YES' ELSE 'NO' END;"
  $archivedBefore = 0
  $walArchiveTested = $false
  $walArchivePass = $false
  if ($archiveMode -eq "on" -and $archiveCommand -eq "YES") {
    $walArchiveTested = $true
    $beforeRaw = Invoke-PsqlScalar "SELECT archived_count::text FROM pg_stat_archiver;"
    if ($beforeRaw -match '^\d+$') { $archivedBefore = [int64]$beforeRaw }
    [void](Invoke-PsqlScalar "SELECT pg_switch_wal()::text;")
    for ($i = 0; $i -lt 15; $i++) {
      Start-Sleep -Seconds 1
      $afterRaw = Invoke-PsqlScalar "SELECT archived_count::text FROM pg_stat_archiver;"
      if ($afterRaw -match '^\d+$' -and [int64]$afterRaw -gt $archivedBefore) { $walArchivePass = $true; break }
    }
  }

  $pitrReady = ($archiveMode -eq "on" -and ($walLevel -eq "replica" -or $walLevel -eq "logical") -and $archiveCommand -eq "YES" -and (-not $walArchiveTested -or $walArchivePass))
  $report = [ordered]@{
    version = "3.18.0"
    completed_at = (Get-Date).ToUniversalTime().ToString("o")
    logical_restore_pass = $true
    rto_seconds = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 2)
    rto_target_minutes = $rtoTarget
    rto_met = $stopwatch.Elapsed.TotalSeconds -le ($rtoTarget * 60)
    rpo_target_minutes = $rpoTarget
    wal_level = $walLevel
    archive_mode = $archiveMode
    archive_command_configured = $archiveCommand -eq "YES"
    wal_archive_tested = $walArchiveTested
    wal_archive_pass = $walArchivePass
    pitr_ready = $pitrReady
    pitr_restore_exercised = $false
    note = if ($pitrReady) { "WAL archive readiness verified; target-time PITR restore is not auto-exercised by this safe drill." } else { "Logical restore verified. Enable docker-compose.pitr.yml to test WAL archive readiness; target-time PITR restore is not auto-exercised." }
  }
  $backupDir = Join-Path $Root "backups"
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  $path = Join-Path $backupDir "recovery-drill-v3180-latest.json"
  $report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $path -Encoding UTF8
  Write-Host "Recovery drill v3.18.0 PASS" -ForegroundColor Green
  Write-Host "Logical restore : PASS"
  Write-Host "RTO             : $($report.rto_seconds)s / target $rtoTarget min"
  Write-Host "WAL archive     : $(if ($walArchiveTested) { if ($walArchivePass) { 'PASS' } else { 'FAIL readiness' } } else { 'OFF (optional)' })"
  Write-Host "PITR readiness  : $pitrReady"
  Write-Host "Report          : $path"
} finally {
  Pop-Location
}
