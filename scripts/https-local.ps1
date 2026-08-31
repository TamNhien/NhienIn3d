param(
  [switch]$KhongMoTrinhDuyet
)

$ErrorActionPreference = "Stop"
$thuMucGoc = Split-Path -Parent $PSScriptRoot
Set-Location $thuMucGoc

$thuMucChungThu = Join-Path $thuMucGoc ".local-https"
$tepCA = Join-Path $thuMucChungThu "nhienin3d-local-ca.crt"
$duongDanCATrongContainer = "/data/caddy/pki/authorities/local/root.crt"
$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { "3000" }

Write-Host "[NhienIn3d] Khoi dong stack HTTPS thong nhat..." -ForegroundColor Cyan
Write-Host "[NhienIn3d] Web khong bind truc tiep cong $webPort; Caddy la dich vu duy nhat bind cong nay." -ForegroundColor DarkGray

docker compose up -d --build --remove-orphans
if ($LASTEXITCODE -ne 0) {
  Write-Host "[NhienIn3d] Neu cong $webPort bi chuong trinh khac chiem, kiem tra: Get-NetTCPConnection -LocalPort $webPort" -ForegroundColor Yellow
  throw "Docker Compose HTTPS khong khoi dong duoc."
}

New-Item -ItemType Directory -Force -Path $thuMucChungThu | Out-Null

$sanSang = $false
for ($i = 0; $i -lt 40; $i++) {
  docker exec nhienin3d-https test -f $duongDanCATrongContainer 2>$null
  if ($LASTEXITCODE -eq 0) { $sanSang = $true; break }
  Start-Sleep -Milliseconds 500
}
if (-not $sanSang) { throw "Caddy chua tao CA local. Hay xem: docker logs nhienin3d-https" }

docker cp "nhienin3d-https:$duongDanCATrongContainer" $tepCA | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Khong sao chep duoc CA local tu container Caddy." }

Write-Host "[NhienIn3d] Cai CA vao Trusted Root cua Windows CurrentUser..." -ForegroundColor Cyan
& certutil.exe -user -addstore Root $tepCA | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Khong cai duoc CA local vao Windows CurrentUser Root." }

$url = "https://localhost:$webPort"
Write-Host "[NhienIn3d] HTTPS local da san sang: $url" -ForegroundColor Green
Write-Host "Tu v2.19.3, lenh 'docker compose up -d --build' cung dung chinh stack HTTPS nay, khong con web/Caddy tranh cong 3000." -ForegroundColor DarkGray
Write-Host "Neu trinh duyet da mo tu truoc, nhan Ctrl+F5 hoac dong/mo lai tab." -ForegroundColor DarkGray

if (-not $KhongMoTrinhDuyet) {
  Start-Process $url
}
