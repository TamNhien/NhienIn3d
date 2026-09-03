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

function Invoke-PsqlScalar([string]$Database, [string]$Sql) {
  $raw = $Sql | docker compose exec -T postgres sh -lc ('psql -U "$POSTGRES_USER" -d "{0}" -X -qAt -v ON_ERROR_STOP=1' -f $Database)
  if ($LASTEXITCODE -ne 0) { throw "PITR drill PostgreSQL query failed." }
  $lines = @($raw | ForEach-Object { ([string]$_).Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($lines.Count -eq 0) { return "" }
  return [string]$lines[$lines.Count - 1]
}

function Wait-ArchiveAdvance([int64]$Before) {
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    $afterRaw = Invoke-PsqlScalar (Get-ProjectEnv "POSTGRES_DB" "nhienin3d") "SELECT archived_count::text FROM pg_stat_archiver;"
    if ($afterRaw -match '^\d+$' -and [int64]$afterRaw -gt $Before) { return $true }
  }
  return $false
}

$restoreVolume = ""
$walVolume = ""
$restoreContainer = ""
$sourceDb = ""
try {
  $enabled = (Get-ProjectEnv "SYSTEM_DB_PITR_DRILL_ENABLED" "false").ToLowerInvariant()
  if (@("1","true","yes","on") -notcontains $enabled) {
    Write-Host "[PITR drill v3.18.0] SKIP - SYSTEM_DB_PITR_DRILL_ENABLED=false" -ForegroundColor DarkGray
    exit 0
  }

  $dbUser = Get-ProjectEnv "POSTGRES_USER" "nhienin3d_app"
  $dbPass = Get-ProjectEnv "POSTGRES_PASSWORD" ""
  $mainDb = Get-ProjectEnv "POSTGRES_DB" "nhienin3d"
  if ([string]::IsNullOrWhiteSpace($dbPass)) { throw "Thiếu POSTGRES_PASSWORD." }

  $walLevel = Invoke-PsqlScalar $mainDb "SELECT current_setting('wal_level');"
  $archiveMode = Invoke-PsqlScalar $mainDb "SELECT current_setting('archive_mode');"
  $archiveCommand = Invoke-PsqlScalar $mainDb "SELECT CASE WHEN current_setting('archive_command') <> '' AND current_setting('archive_command') <> '(disabled)' THEN 'YES' ELSE 'NO' END;"
  if ($archiveMode -ne "on" -or ($walLevel -ne "replica" -and $walLevel -ne "logical") -or $archiveCommand -ne "YES") {
    throw "PITR drill yêu cầu docker-compose.pitr.yml (archive_mode=on + archive_command)."
  }

  $stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")
  $sourceDb = "nhienin3d_pitr_$stamp"
  $restoreVolume = "nhienin3d-pitr-restore-$stamp"
  $walVolume = "nhienin3d-pitr-wal-$stamp"
  $restoreContainer = "nhienin3d-pitr-restore-$stamp"

  Write-Host "[PITR drill v3.18.0] Tạo database cô lập + base backup..." -ForegroundColor Cyan
  "DROP DATABASE IF EXISTS $sourceDb; CREATE DATABASE $sourceDb;" | docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1' | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không tạo được PITR source database." }
  "CREATE TABLE pitr_probe(id integer PRIMARY KEY, value text NOT NULL); INSERT INTO pitr_probe(id,value) VALUES(1,'BASE');" | docker compose exec -T postgres sh -lc ('psql -U "$POSTGRES_USER" -d "{0}" -v ON_ERROR_STOP=1' -f $sourceDb) | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không seed được PITR source sentinel." }

  docker volume create $restoreVolume | Out-Null
  $env:PGPASSWORD = $dbPass
  docker run --rm --network container:nhienin3d-postgres --env PGPASSWORD -e PGUSER=$dbUser -v "${restoreVolume}:/var/lib/postgresql" postgres:18.6-bookworm sh -lc 'mkdir -p /var/lib/postgresql/data && chown -R postgres:postgres /var/lib/postgresql && gosu postgres pg_basebackup -h 127.0.0.1 -p 5432 -U "$PGUSER" -D /var/lib/postgresql/data -Fp -Xs -c fast'
  if ($LASTEXITCODE -ne 0) { throw "pg_basebackup PITR thất bại." }

  Invoke-PsqlScalar $sourceDb "UPDATE pitr_probe SET value='BEFORE_TARGET' WHERE id=1; SELECT value FROM pitr_probe WHERE id=1;" | Out-Null
  $targetTime = Invoke-PsqlScalar $mainDb "SELECT clock_timestamp()::text;"
  Start-Sleep -Seconds 2
  Invoke-PsqlScalar $sourceDb "UPDATE pitr_probe SET value='AFTER_TARGET' WHERE id=1; SELECT value FROM pitr_probe WHERE id=1;" | Out-Null
  $beforeRaw = Invoke-PsqlScalar $mainDb "SELECT archived_count::text FROM pg_stat_archiver;"
  $before = if ($beforeRaw -match '^\d+$') { [int64]$beforeRaw } else { 0 }
  Invoke-PsqlScalar $mainDb "SELECT pg_switch_wal()::text;" | Out-Null
  if (-not (Wait-ArchiveAdvance $before)) { throw "WAL archive không tiến sau pg_switch_wal()." }

  docker volume create $walVolume | Out-Null
  docker run --rm --volumes-from nhienin3d-postgres -v "${walVolume}:/wal-copy" postgres:18.6-bookworm sh -lc 'cp -a /var/lib/postgresql/wal-archive/. /wal-copy/ && chown -R postgres:postgres /wal-copy' | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không copy được WAL archive cho restore cô lập." }

  $targetEscaped = $targetTime.Replace("'", "''")
  docker run --rm -v "${restoreVolume}:/var/lib/postgresql" postgres:18.6-bookworm sh -lc "printf \"restore_command = 'cp /wal-archive/%f %p'\nrecovery_target_time = '$targetEscaped'\nrecovery_target_action = 'promote'\n\" >> /var/lib/postgresql/data/postgresql.auto.conf && touch /var/lib/postgresql/data/recovery.signal && chown -R postgres:postgres /var/lib/postgresql/data" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không cấu hình recovery_target_time." }

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  docker run -d --name $restoreContainer -e PGDATA=/var/lib/postgresql/data -v "${restoreVolume}:/var/lib/postgresql" -v "${walVolume}:/wal-archive:ro" postgres:18.6-bookworm | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không khởi động được PITR restore container." }
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    docker exec $restoreContainer pg_isready -U $dbUser -d $sourceDb *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  }
  if (-not $ready) { docker logs $restoreContainer --tail 120; throw "PITR restore container không ready." }
  $sw.Stop()

  $restored = docker exec $restoreContainer psql -U $dbUser -d $sourceDb -X -qAt -v ON_ERROR_STOP=1 -c "SELECT value FROM pitr_probe WHERE id=1;"
  if ($LASTEXITCODE -ne 0) { throw "Không đọc được PITR sentinel sau restore." }
  $restored = ([string]$restored).Trim()
  if ($restored -ne "BEFORE_TARGET") { throw "PITR target-time sai sentinel (value=$restored)." }

  $report = [ordered]@{
    version = "3.18.0"
    completed_at = (Get-Date).ToUniversalTime().ToString("o")
    pitr_restore_exercised = $true
    target_time = $targetTime
    target_value_verified = $true
    expected_value = "BEFORE_TARGET"
    restored_value = $restored
    after_target_value_excluded = $true
    rto_seconds = [Math]::Round($sw.Elapsed.TotalSeconds, 2)
    source_database = $sourceDb
    isolated_restore = $true
  }
  $backupDir = Join-Path $Root "backups"
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  $path = Join-Path $backupDir "recovery-pitr-v3180-latest.json"
  $report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $path -Encoding UTF8
  Write-Host "Target-time PITR v3.18.0 PASS ✅" -ForegroundColor Green
  Write-Host "Target time      : $targetTime"
  Write-Host "Restored sentinel: $restored"
  Write-Host "RTO              : $($report.rto_seconds)s"
  Write-Host "Report           : $path"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($restoreContainer) { docker rm -f $restoreContainer *> $null }
  if ($sourceDb) { "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$sourceDb'; DROP DATABASE IF EXISTS $sourceDb;" | docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1' *> $null }
  if ($restoreVolume) { docker volume rm -f $restoreVolume *> $null }
  if ($walVolume) { docker volume rm -f $walVolume *> $null }
  Pop-Location
}
