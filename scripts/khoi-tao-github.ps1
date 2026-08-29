$ErrorActionPreference = "Stop"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "Chua cai GitHub CLI (gh)" }
gh auth status
if ($LASTEXITCODE -ne 0) { gh auth login }
if (-not (Test-Path ".git")) { git init; git branch -M main }
$remote = git remote 2>$null
if ($remote -notcontains "origin") {
  gh repo view TamNhien/NhienIn3d *> $null
  if ($LASTEXITCODE -eq 0) {
    git remote add origin https://github.com/TamNhien/NhienIn3d.git
  } else {
    gh repo create TamNhien/NhienIn3d --private --source=. --remote=origin
  }
}
git add .
$coThayDoi = git status --porcelain
if ($coThayDoi) { git commit -m "feat: khoi tao NhienIn3d v1.0.0" }
git push -u origin main
Write-Host "Da ket noi TamNhien/NhienIn3d." -ForegroundColor Green
