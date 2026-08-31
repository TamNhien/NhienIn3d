$ErrorActionPreference = "Stop"
$thuMucGoc = Split-Path -Parent $PSScriptRoot
$tepCA = Join-Path $thuMucGoc ".local-https\nhienin3d-local-ca.crt"

if (-not (Test-Path $tepCA)) {
  Write-Host "Khong tim thay $tepCA. Khong co gi de go." -ForegroundColor Yellow
  exit 0
}

$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($tepCA)
$duongDan = "Cert:\CurrentUser\Root\$($cert.Thumbprint)"
if (Test-Path $duongDan) {
  Remove-Item $duongDan -Force
  Write-Host "Da go CA NhienIn3d local khoi Trusted Root cua CurrentUser." -ForegroundColor Green
} else {
  Write-Host "CA nay khong con nam trong Trusted Root cua CurrentUser." -ForegroundColor Yellow
}
