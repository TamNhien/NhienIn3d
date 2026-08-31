param(
  [string]$OutputDirectory = ".\backups",
  [int]$DailyRetentionDays = 14,
  [int]$WeeklyRetentionWeeks = 8,
  [switch]$NoWeeklySnapshot
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-OpsHistory {
  param([string]$Type, [string]$Status, [string]$Description, [hashtable]$Detail = @{})
  try {
    $descSql = $Description.Replace("'", "''")
    $jsonSql = ($Detail | ConvertTo-Json -Compress -Depth 8).Replace("'", "''")
    $sql = "INSERT INTO lich_su_van_hanh (loai,trang_thai,mo_ta,chi_tiet,ngay_bat_dau,ngay_ket_thuc) VALUES ('$Type','$Status','$descSql','$jsonSql'::jsonb,NOW(),NOW());"
    $sql | docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Warning "Không ghi được lịch sử vận hành (có thể migration v3.2.0 chưa được áp dụng)." }
  } catch {
    Write-Warning "Không ghi được lịch sử vận hành: $($_.Exception.Message)"
  }
}

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $Root
try {
  if ($DailyRetentionDays -lt 1) { throw "DailyRetentionDays phải >= 1." }
  if ($WeeklyRetentionWeeks -lt 1) { throw "WeeklyRetentionWeeks phải >= 1." }

  $running = @(docker compose ps --status running --services 2>$null)
  if ($running -notcontains "postgres") {
    throw "PostgreSQL container chưa chạy. Hãy chạy docker compose up -d postgres trước."
  }

  $outDir = if ([System.IO.Path]::IsPathRooted($OutputDirectory)) { $OutputDirectory } else { Join-Path $Root $OutputDirectory }
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $name = "nhienin3d-daily-$stamp.dump"
  $localFile = Join-Path $outDir $name
  $remoteFile = "/tmp/$name"

  Write-Host "[NhienIn3d] Đang tạo PostgreSQL backup daily..." -ForegroundColor Cyan
  $dumpCmd = 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "{0}"' -f $remoteFile
  docker compose exec -T postgres sh -lc $dumpCmd
  if ($LASTEXITCODE -ne 0) { throw "pg_dump thất bại." }
  docker cp "nhienin3d-postgres:$remoteFile" $localFile | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không thể copy backup từ container." }
  docker compose exec -T postgres rm -f $remoteFile | Out-Null

  function Write-Sha([string]$Path) {
    $hash = (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLowerInvariant()
    $shaFile = "$Path.sha256.txt"
    "$hash  $([System.IO.Path]::GetFileName($Path))" | Set-Content -Encoding ascii -Path $shaFile
    return $hash
  }

  $hash = Write-Sha $localFile
  Write-Host "Daily backup hoàn tất ✅" -ForegroundColor Green
  Write-Host "File   : $localFile"
  Write-Host "SHA-256: $hash"

  # Mỗi Chủ nhật giữ thêm snapshot weekly độc lập để chính sách retention daily không xóa mất mốc tuần.
  if (-not $NoWeeklySnapshot -and (Get-Date).DayOfWeek -eq [System.DayOfWeek]::Sunday) {
    $weeklyName = "nhienin3d-weekly-$stamp.dump"
    $weeklyFile = Join-Path $outDir $weeklyName
    Copy-Item -Force $localFile $weeklyFile
    $weeklyHash = Write-Sha $weeklyFile
    Write-Host "Weekly snapshot: $weeklyFile" -ForegroundColor Green
    Write-Host "Weekly SHA-256: $weeklyHash"
  }

  $dailyCutoff = (Get-Date).AddDays(-$DailyRetentionDays)
  $weeklyCutoff = (Get-Date).AddDays(-7 * $WeeklyRetentionWeeks)
  $removed = 0
  Get-ChildItem -Path $outDir -File -Filter "nhienin3d-daily-*.dump" | Where-Object { $_.LastWriteTime -lt $dailyCutoff } | ForEach-Object {
    Remove-Item -Force $_.FullName
    Remove-Item -Force "$($_.FullName).sha256.txt" -ErrorAction SilentlyContinue
    $removed++
  }
  Get-ChildItem -Path $outDir -File -Filter "nhienin3d-weekly-*.dump" | Where-Object { $_.LastWriteTime -lt $weeklyCutoff } | ForEach-Object {
    Remove-Item -Force $_.FullName
    Remove-Item -Force "$($_.FullName).sha256.txt" -ErrorAction SilentlyContinue
    $removed++
  }
  Write-Host "Retention: daily $DailyRetentionDays ngày, weekly $WeeklyRetentionWeeks tuần; đã dọn $removed file backup cũ."
  Write-OpsHistory -Type "BACKUP" -Status "THANH_CONG" -Description "Backup PostgreSQL hoàn tất" -Detail @{ file = $name; sha256 = $hash; daily_retention_days = $DailyRetentionDays; weekly_retention_weeks = $WeeklyRetentionWeeks; removed = $removed }
} catch {
  Write-OpsHistory -Type "BACKUP" -Status "THAT_BAI" -Description "Backup PostgreSQL thất bại" -Detail @{ error = $_.Exception.Message }
  throw
} finally {
  docker compose exec -T postgres sh -lc 'rm -f /tmp/nhienin3d-daily-*.dump /tmp/nhienin3d-weekly-*.dump' 2>$null | Out-Null
  Pop-Location
}
