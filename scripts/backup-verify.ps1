param([string]$Directory = ".\backups")
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dir = if ([IO.Path]::IsPathRooted($Directory)) { $Directory } else { Join-Path $Root $Directory }
if (-not (Test-Path $dir)) { throw "Không tìm thấy thư mục backup: $dir" }

$files = @(Get-ChildItem -Path $dir -File -Filter "*.dump" | Sort-Object LastWriteTime -Descending)
if ($files.Count -eq 0) { throw "Không có file .dump để kiểm tra." }
$failed = 0
foreach ($file in $files) {
  $shaPath = "$($file.FullName).sha256.txt"
  if (-not (Test-Path $shaPath)) {
    Write-Host "MISSING SHA  $($file.Name)" -ForegroundColor Yellow
    $failed++
    continue
  }
  $expected = ((Get-Content -Raw $shaPath).Trim() -split '\s+')[0].ToLowerInvariant()
  $actual = (Get-FileHash -Algorithm SHA256 -Path $file.FullName).Hash.ToLowerInvariant()
  if ($expected -eq $actual) { Write-Host "PASS $($file.Name)" -ForegroundColor Green }
  else { Write-Host "FAIL $($file.Name)" -ForegroundColor Red; $failed++ }
}
if ($failed -gt 0) { throw "$failed backup không đạt kiểm tra SHA-256." }
Write-Host "Tất cả $($files.Count) backup đều hợp lệ ✅" -ForegroundColor Green
