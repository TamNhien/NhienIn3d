param([Parameter(Mandatory=$true)][string]$Version)
$ErrorActionPreference = "Stop"
if ($Version -notmatch '^v\d+\.\d+\.\d+$') { throw "Version phai theo dang v1.0.0" }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "Chua cai Git" }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "Chua cai GitHub CLI (gh)" }
gh auth status
if ($LASTEXITCODE -ne 0) { throw "Hay chay: gh auth login" }
& "$PSScriptRoot\kiem-tra.ps1"
$clean = $Version.TrimStart('v')
Set-Content -Path "VERSION" -Value $Version -Encoding utf8
npm --prefix apps/api version $clean --no-git-tag-version
npm --prefix apps/web version $clean --no-git-tag-version
$rootPkg = Get-Content package.json -Raw | ConvertFrom-Json; $rootPkg.version=$clean; $rootPkg | ConvertTo-Json -Depth 20 | Set-Content package.json -Encoding utf8
git add .
$coThayDoi = git status --porcelain
if ($coThayDoi) { git commit -m "release: NhienIn3d $Version" }
if (git tag -l $Version) { throw "Tag $Version da ton tai" }
git tag -a $Version -m "NhienIn3d $Version"
git push origin main
git push origin $Version
Write-Host "Da push $Version. GitHub Actions se tu build, kiem tra va tao GitHub Release." -ForegroundColor Green
