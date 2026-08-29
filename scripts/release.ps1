param([Parameter(Mandatory=$true)][string]$Version)
$ErrorActionPreference = "Stop"

if ($Version -notmatch '^v\d+\.\d+\.\d+$') { throw "Version phai theo dang v1.0.0" }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "Chua cai Git" }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "Chua cai GitHub CLI (gh)" }

gh auth status
if ($LASTEXITCODE -ne 0) { throw "Hay chay: gh auth login" }

$clean = $Version.TrimStart('v')
$sourceVersion = (Get-Content "VERSION" -Raw).Trim()
if ($sourceVersion -ne $clean) {
  throw "Source hien tai la v$sourceVersion. Hay dung lenh release v$sourceVersion hoac cap nhat source dung phien ban truoc khi release."
}

if (git tag -l $Version) { throw "Tag $Version da ton tai" }

& "$PSScriptRoot\kiem-tra.ps1"
if (-not (Test-Path "package-lock.json")) { throw "Thieu package-lock.json sau npm install; khong the release tai lap." }

# npm install trong kiem-tra.ps1 da dong bo package-lock voi workspace hien tai.
git add .
$coThayDoi = git status --porcelain
if ($coThayDoi) { git commit -m "release: NhienIn3d $Version" }

git tag -a $Version -m "NhienIn3d $Version"
git push origin main
git push origin $Version

Write-Host "Da push $Version. GitHub Actions se tu build, kiem tra, push GHCR va tao GitHub Release." -ForegroundColor Green
