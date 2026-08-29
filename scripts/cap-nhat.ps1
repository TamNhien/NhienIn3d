$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
  throw "Thieu .env. Sao chep .env.example thanh .env va doi secret."
}

Write-Host "[1/4] Test + typecheck + build + security..." -ForegroundColor Cyan
& "$PSScriptRoot\kiem-tra.ps1"
if ($LASTEXITCODE -ne 0) { throw "Kiem tra source that bai" }

Write-Host "[2/4] Build va khoi dong Docker..." -ForegroundColor Cyan
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw "Docker Compose that bai" }

Write-Host "[3/4] Kiem tra trang thai..." -ForegroundColor Cyan
docker compose ps

Write-Host "[4/4] Kiem tra seed moi bang >= 10 dong..." -ForegroundColor Cyan
docker compose run --rm migrate npm run db:kiem-tra-du-lieu
if ($LASTEXITCODE -ne 0) { throw "Database chua du toi thieu 10 dong moi bang nghiep vu" }

Write-Host "Cap nhat NhienIn3d hoan tat: test + build + migration + seed + kiem tra du lieu." -ForegroundColor Green
