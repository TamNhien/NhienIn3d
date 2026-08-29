$ErrorActionPreference = "Stop"
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Da tao .env. Hay mo file va doi POSTGRES_PASSWORD, JWT_SECRET, COOKIE_SECRET, ADMIN_PASSWORD roi chay lai." -ForegroundColor Yellow
  exit 1
}

docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw "Docker Compose khoi dong that bai" }

docker compose run --rm migrate npm run db:kiem-tra-du-lieu
if ($LASTEXITCODE -ne 0) { throw "Database chua du toi thieu 10 dong moi bang nghiep vu" }

Write-Host "NhienIn3d v2.0.0 da khoi tao xong. Migration + seed + kiem tra 10 dong moi bang nghiep vu da hoan tat." -ForegroundColor Green
Write-Host "Web: http://localhost:3000"
Write-Host "API: http://localhost:3001/api/v1"
Write-Host "Health: http://localhost:3001/api/v1/suc-khoe"
Write-Host "Swagger: http://localhost:3001/tai-lieu"
Write-Host "PostgreSQL (Windows/pgAdmin): 127.0.0.1:5434"
