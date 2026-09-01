param(
  [switch]$KhongKiemTraBackupRestore
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $Root

function Get-ProjectEnv([string]$Name) {
  $fromProcess = [Environment]::GetEnvironmentVariable($Name)
  if (-not [string]::IsNullOrWhiteSpace($fromProcess)) { return $fromProcess.Trim() }
  $envFile = Join-Path $Root ".env"
  if (-not (Test-Path $envFile)) { return $null }
  foreach ($line in Get-Content -LiteralPath $envFile -Encoding UTF8) {
    $trim = $line.Trim()
    if (-not $trim -or $trim.StartsWith("#") -or -not $trim.Contains("=")) { continue }
    $parts = $trim.Split("=", 2)
    if ($parts[0].Trim() -eq $Name) { return $parts[1].Trim().Trim('"').Trim("'") }
  }
  return $null
}

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

try {
  if (-not $KhongKiemTraBackupRestore) {
    Write-Host "[E2E v3.4.0] Backup/SHA/restore runtime nền..." -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot "e2e-runtime-v320.ps1")
    if ($LASTEXITCODE -ne 0) { throw "E2E backup/restore v3.2.0 thất bại." }
  }

  $apiPort = Get-ProjectEnv "API_PORT"
  if (-not $apiPort) { $apiPort = "3001" }
  $base = "http://localhost:$apiPort/api/v1"
  $adminEmail = Get-ProjectEnv "ADMIN_EMAIL"
  if (-not $adminEmail) { $adminEmail = "admin@nhienin3d.local" }
  $adminPassword = Get-ProjectEnv "ADMIN_PASSWORD"
  if (-not $adminPassword) { throw "Thiếu ADMIN_PASSWORD trong biến môi trường hoặc file .env." }

  Write-Host "[E2E v3.4.0] Đăng nhập Admin qua cookie session..." -ForegroundColor Cyan
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginBody = @{ thu_dien_tu = $adminEmail; mat_khau = $adminPassword; trinh_duyet_hien_thi = "NhienIn3d E2E v3.4.0" } | ConvertTo-Json
  $login = Invoke-RestMethod -Uri "$base/xac-thuc/dang-nhap" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody -WebSession $session -TimeoutSec 20
  Assert-True ($null -ne $login.nguoi_dung) "Đăng nhập không trả về người dùng."
  Assert-True ($login.nguoi_dung.vai_tro -eq "ADMIN") "Tài khoản E2E không có vai trò ADMIN."

  Write-Host "[E2E v3.4.0] Kiểm tra đơn hàng + sản phẩm..."
  $orders = @(Invoke-RestMethod -Uri "$base/quan-tri/don-hang" -Method Get -WebSession $session -TimeoutSec 20)
  $products = @(Invoke-RestMethod -Uri "$base/quan-tri/san-pham" -Method Get -WebSession $session -TimeoutSec 20)
  Assert-True ($null -ne $orders) "API danh sách đơn hàng không phản hồi."
  Assert-True ($products.Count -gt 0) "Không có sản phẩm để kiểm tra runtime Admin."

  Write-Host "[E2E v3.4.0] Preview nhập kho CSV, không thay đổi tồn kho..."
  $variant = $null
  foreach ($product in $products) {
    if ($product.bien_the -and @($product.bien_the).Count -gt 0) { $variant = @($product.bien_the)[0]; break }
  }
  Assert-True ($null -ne $variant) "Không có biến thể để kiểm tra preview nhập kho."
  $csv = "ma_bien_the,so_luong_nhap,ly_do`r`n$($variant.ma_bien_the),1,E2E preview v3.4.0`r`n"
  $base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($csv))
  $previewBody = @{ ten_file = "e2e-v340.csv"; du_lieu_base64 = $base64 } | ConvertTo-Json
  $preview = Invoke-RestMethod -Uri "$base/quan-tri/kho/import/kiem-tra" -Method Post -ContentType "application/json; charset=utf-8" -Body $previewBody -WebSession $session -TimeoutSec 20
  Assert-True ($preview.tong_dong -eq 1) "Preview nhập kho không đọc đúng 1 dòng."
  Assert-True ($preview.hop_le -eq 1) "Preview nhập kho không hợp lệ với biến thể đang tồn tại."

  Write-Host "[E2E v3.4.0] Kiểm tra báo cáo Excel + phiếu nhập..."
  $receipts = @(Invoke-RestMethod -Uri "$base/quan-tri/kho/phieu-nhap" -Method Get -WebSession $session -TimeoutSec 20)
  $report = Invoke-RestMethod -Uri "$base/quan-tri/bao-cao/ton-kho/excel" -Method Get -WebSession $session -TimeoutSec 30
  Assert-True ($report.ten_file -like "*.xlsx") "Báo cáo tồn kho không trả về file XLSX."
  Assert-True (-not [string]::IsNullOrWhiteSpace([string]$report.base64)) "Báo cáo tồn kho Excel không có dữ liệu base64."

  Write-Host "[E2E v3.4.0] Kiểm tra Ops v3.4: config, SLA, incident, cursor..."
  $health = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/suc-khoe" -Method Get -WebSession $session -TimeoutSec 20
  $alertConfig = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/cau-hinh-canh-bao" -Method Get -WebSession $session -TimeoutSec 20
  $sla = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/sla?so_ngay=30" -Method Get -WebSession $session -TimeoutSec 20
  $incidents = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/su-co?gioi_han=5" -Method Get -WebSession $session -TimeoutSec 20
  $opsCursor = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/lich-su/cursor?kich_thuoc=10" -Method Get -WebSession $session -TimeoutSec 20
  $auditCursor = Invoke-RestMethod -Uri "$base/quan-tri/nhat-ky/cursor?kich_thuoc=10" -Method Get -WebSession $session -TimeoutSec 20
  Assert-True ($health.phien_ban -eq "3.4.0") "Health endpoint chưa lên v3.4.0."
  Assert-True ($alertConfig.chu_ky_phut -ge 15) "Cấu hình cảnh báo runtime không hợp lệ."
  Assert-True ($sla.so_ngay -eq 30) "SLA 30 ngày không phản hồi đúng cửa sổ."
  Assert-True ($null -ne $incidents.du_lieu) "Endpoint incident không trả danh sách."
  Assert-True ($null -ne $opsCursor.cursor) "Cursor lịch sử vận hành không hợp lệ."
  Assert-True ($null -ne $auditCursor.cursor) "Cursor audit không hợp lệ."

  Write-Host "Runtime E2E v3.4.0 PASS ✅" -ForegroundColor Green
  Write-Host "Admin login       : PASS"
  Write-Host "Orders / products : PASS ($($orders.Count) đơn / $($products.Count) sản phẩm)"
  Write-Host "Stock import      : PASS (preview, không ghi tồn)"
  Write-Host "Inventory report  : PASS ($($report.ten_file))"
  Write-Host "Receipts          : PASS ($($receipts.Count) phiếu)"
  Write-Host "Ops config / SLA  : PASS"
  Write-Host "Incident / cursor : PASS"
} finally {
  Pop-Location
}
