param(
  [Parameter(Mandatory=$true)][string]$File,
  [switch]$XacNhan
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
if (-not $XacNhan) {
  throw "Restore sẽ ghi đè dữ liệu hiện tại. Chạy lại với -XacNhan sau khi đã kiểm tra đúng file backup."
}

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Backup = (Resolve-Path $File).Path
Push-Location $Root
$remoteFile = "/tmp/nhienin3d-restore.dump"
try {
  $running = @(docker compose ps --status running --services 2>$null)
  if ($running -notcontains "postgres") {
    docker compose up -d postgres
    if ($LASTEXITCODE -ne 0) { throw "Không thể khởi động PostgreSQL." }
  }

  Write-Host "[NhienIn3d] Dừng API/Web/HTTPS trước khi restore..." -ForegroundColor Yellow
  docker compose stop api web https 2>$null | Out-Null
  docker cp $Backup "nhienin3d-postgres:$remoteFile" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không thể copy file backup vào PostgreSQL container." }

  Write-Host "[NhienIn3d] Đang restore PostgreSQL..." -ForegroundColor Cyan
  $restoreCmd = 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges "{0}"' -f $remoteFile
  docker compose exec -T postgres sh -lc $restoreCmd
  if ($LASTEXITCODE -ne 0) { throw "pg_restore thất bại. Dữ liệu có thể ở trạng thái chưa hoàn chỉnh; hãy kiểm tra log trước khi chạy lại dịch vụ." }
  docker compose exec -T postgres rm -f $remoteFile | Out-Null

  Write-Host "Restore hoàn tất. Khởi động lại stack..." -ForegroundColor Green
  docker compose up -d api web https
  if ($LASTEXITCODE -ne 0) { throw "Restore xong nhưng không thể khởi động lại API/Web/HTTPS." }
  docker compose ps
} finally {
  docker compose exec -T postgres rm -f $remoteFile 2>$null | Out-Null
  Pop-Location
}
