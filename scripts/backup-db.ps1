param(
  [string]$OutputDirectory = ".\backups"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $Root
try {
  $running = @(docker compose ps --status running --services 2>$null)
  if ($running -notcontains "postgres") {
    throw "PostgreSQL container chưa chạy. Hãy chạy docker compose up -d postgres trước."
  }

  $outDir = if ([System.IO.Path]::IsPathRooted($OutputDirectory)) { $OutputDirectory } else { Join-Path $Root $OutputDirectory }
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $name = "nhienin3d-$stamp.dump"
  $localFile = Join-Path $outDir $name
  $remoteFile = "/tmp/$name"

  Write-Host "[NhienIn3d] Đang tạo PostgreSQL backup..." -ForegroundColor Cyan
  $dumpCmd = 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "{0}"' -f $remoteFile
  docker compose exec -T postgres sh -lc $dumpCmd
  if ($LASTEXITCODE -ne 0) { throw "pg_dump thất bại." }
  docker cp "nhienin3d-postgres:$remoteFile" $localFile | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không thể copy backup từ container." }
  docker compose exec -T postgres rm -f $remoteFile | Out-Null

  $hash = (Get-FileHash -Algorithm SHA256 -Path $localFile).Hash.ToLowerInvariant()
  $shaFile = "$localFile.sha256.txt"
  "$hash  $name" | Set-Content -Encoding ascii -Path $shaFile

  Write-Host "Backup hoàn tất ✅" -ForegroundColor Green
  Write-Host "File   : $localFile"
  Write-Host "SHA-256: $hash"
} finally {
  Pop-Location
}
