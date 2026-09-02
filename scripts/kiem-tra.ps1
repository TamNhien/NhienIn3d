$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot
Write-Host "Repo root: $RepoRoot" -ForegroundColor DarkGray


Write-Host "[1/5] Cai dat dependencies tu thu muc goc..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install that bai" }

Write-Host "[1b/5] Kiem tra mysql2 security tree..." -ForegroundColor Cyan
npm run security:mysql2
if ($LASTEXITCODE -ne 0) { throw "mysql2 chua dat ban va bao mat >=3.22.0" }

Write-Host "[2/5] Chay test..." -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) { throw "Test root/API/Web that bai" }

Write-Host "[3/5] Typecheck API + Web..." -ForegroundColor Cyan
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck that bai" }

Write-Host "[4/5] Build API + Web..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build that bai" }

Write-Host "[5/5] Security audit..." -ForegroundColor Cyan
npm run audit:security
if ($LASTEXITCODE -ne 0) { throw "Security audit phat hien lo hong muc high tro len" }

Write-Host "NhienIn3d test/typecheck/build/security: PASS" -ForegroundColor Green
