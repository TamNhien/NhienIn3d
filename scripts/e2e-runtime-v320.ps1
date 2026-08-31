param(
  [switch]$KhongKiemTraApi
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $Root
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$dbName = "nhienin3d_e2e_$stamp"
$remoteDump = "/tmp/$dbName.dump"
$localDump = Join-Path ([System.IO.Path]::GetTempPath()) "$dbName.dump"

function Invoke-PostgresShell([string]$Command) {
  docker compose exec -T postgres sh -lc $Command
  if ($LASTEXITCODE -ne 0) { throw "PostgreSQL runtime command thất bại: $Command" }
}

try {
  $running = @(docker compose ps --status running --services 2>$null)
  if ($running -notcontains "postgres") { throw "PostgreSQL container chưa chạy. Hãy chạy docker compose up -d postgres trước." }

  Write-Host "[E2E v3.2.0] Tạo database cô lập $dbName..." -ForegroundColor Cyan
  Invoke-PostgresShell ('createdb -U "$POSTGRES_USER" "{0}"' -f $dbName)

  $seedSql = "CREATE TABLE e2e_probe (id integer PRIMARY KEY, value text NOT NULL); INSERT INTO e2e_probe(id,value) VALUES (1,'nhienin3d-v320');"
  $seedSql | docker compose exec -T postgres sh -lc ('psql -U "$POSTGRES_USER" -d "{0}" -v ON_ERROR_STOP=1' -f $dbName) | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không seed được database E2E." }

  Write-Host "[E2E v3.2.0] pg_dump custom-format..."
  Invoke-PostgresShell ('pg_dump -U "$POSTGRES_USER" -d "{0}" -Fc -f "{1}"' -f $dbName, $remoteDump)
  docker cp "nhienin3d-postgres:$remoteDump" $localDump | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Không copy được dump E2E." }
  $hashBefore = (Get-FileHash -Algorithm SHA256 -Path $localDump).Hash.ToLowerInvariant()
  if (-not $hashBefore) { throw "Không tính được SHA-256 dump E2E." }

  Write-Host "[E2E v3.2.0] Xóa và restore database cô lập..."
  Invoke-PostgresShell ('dropdb -U "$POSTGRES_USER" --if-exists "{0}"' -f $dbName)
  Invoke-PostgresShell ('createdb -U "$POSTGRES_USER" "{0}"' -f $dbName)
  Invoke-PostgresShell ('pg_restore -U "$POSTGRES_USER" -d "{0}" --no-owner --no-privileges "{1}"' -f $dbName, $remoteDump)

  $value = docker compose exec -T postgres sh -lc ('psql -U "$POSTGRES_USER" -d "{0}" -At -v ON_ERROR_STOP=1 -c "SELECT value FROM e2e_probe WHERE id=1;"' -f $dbName)
  if ($LASTEXITCODE -ne 0 -or ($value -join "").Trim() -ne "nhienin3d-v320") { throw "Restore E2E không khôi phục đúng sentinel." }

  if (-not $KhongKiemTraApi) {
    $api = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/suc-khoe" -Method Get -TimeoutSec 10
    if (-not $api) { throw "API health không phản hồi." }
  }

  Write-Host "Runtime E2E PASS ✅" -ForegroundColor Green
  Write-Host "Database cô lập : $dbName"
  Write-Host "SHA-256 dump     : $hashBefore"
  Write-Host "Restore sentinel : PASS"
  if (-not $KhongKiemTraApi) { Write-Host "API health        : PASS" }
} finally {
  try { docker compose exec -T postgres sh -lc ('dropdb -U "$POSTGRES_USER" --if-exists "{0}"' -f $dbName) 2>$null | Out-Null } catch {}
  try { docker compose exec -T postgres rm -f $remoteDump 2>$null | Out-Null } catch {}
  Remove-Item -Force $localDump -ErrorAction SilentlyContinue
  Pop-Location
}
