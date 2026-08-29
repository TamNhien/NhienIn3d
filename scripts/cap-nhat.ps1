$ErrorActionPreference = "Stop"
if (-not (Test-Path ".env")) { throw "Thieu .env. Sao chep .env.example thanh .env va doi secret." }

docker compose build
if ($LASTEXITCODE -ne 0) { throw "Build Docker that bai" }

docker compose up -d
if ($LASTEXITCODE -ne 0) { throw "Khoi dong Docker that bai" }

docker compose ps

Write-Host "Kiem tra so dong du lieu mau..." -ForegroundColor Cyan
docker compose run --rm migrate npm run db:kiem-tra-du-lieu
if ($LASTEXITCODE -ne 0) { throw "Database chua du toi thieu 10 dong moi bang nghiep vu" }

Write-Host "Cap nhat hoan tat: migration + seed version moi + kiem tra du lieu + API + Web da duoc ap dung." -ForegroundColor Green
