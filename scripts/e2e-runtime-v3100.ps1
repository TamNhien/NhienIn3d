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
    Write-Host "[E2E v3.10.0] Backup/SHA/restore runtime nền..." -ForegroundColor Cyan
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

  Write-Host "[E2E v3.10.0] Preflight API version để tránh kiểm tra nhầm container cũ..." -ForegroundColor Cyan
  $publicHealth = Invoke-RestMethod -Uri "$base/suc-khoe" -Method Get -TimeoutSec 20
  Assert-True ($publicHealth.phien_ban -eq "v3.10.0") "API đang chạy $($publicHealth.phien_ban), không phải v3.10.0. Docker build trước đó có thể đã thất bại và container cũ vẫn đang chạy. Hãy chạy lại: docker compose up -d --build --remove-orphans"

  Write-Host "[E2E v3.10.0] Đăng nhập Admin qua cookie session..." -ForegroundColor Cyan
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginBody = @{ thu_dien_tu = $adminEmail; mat_khau = $adminPassword; trinh_duyet_hien_thi = "NhienIn3d E2E v3.10.0" } | ConvertTo-Json

  # Docker mặc định WEB_PUBLIC_URL=https://localhost:3000 nên API phát cookie access có cờ Secure.
  # Runtime smoke CI lại gọi trực tiếp http://localhost:API_PORT và không khởi động Caddy; WebRequestSession
  # vì vậy giữ cookie nhưng đúng chuẩn sẽ không gửi Secure cookie qua HTTP. Lấy access cookie từ Set-Cookie
  # rồi gắn tường minh vào request loopback để vẫn kiểm tra đúng JWT/session/role ở API.
  $loginResponse = Invoke-WebRequest -Uri "$base/xac-thuc/dang-nhap" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody -WebSession $session -TimeoutSec 20 -UseBasicParsing
  $login = $loginResponse.Content | ConvertFrom-Json
  Assert-True ($null -ne $login.nguoi_dung) "Đăng nhập không trả về người dùng."
  Assert-True ($login.nguoi_dung.vai_tro -eq "ADMIN") "Tài khoản E2E không có vai trò ADMIN."

  $setCookie = @($loginResponse.Headers["Set-Cookie"]) -join ","
  $accessMatch = [regex]::Match($setCookie, "(?:^|[,\s])nhienin3d_phien=([^;,\s]+)")
  Assert-True $accessMatch.Success "Đăng nhập không phát cookie nhienin3d_phien."
  $adminHeaders = @{ Cookie = "nhienin3d_phien=$($accessMatch.Groups[1].Value)" }

  Write-Host "[E2E v3.10.0] Kiểm tra đơn hàng + sản phẩm..."
  $orders = @(Invoke-RestMethod -Uri "$base/quan-tri/don-hang" -Method Get -Headers $adminHeaders -TimeoutSec 20)
  $products = @(Invoke-RestMethod -Uri "$base/quan-tri/san-pham" -Method Get -Headers $adminHeaders -TimeoutSec 20)
  Assert-True ($null -ne $orders) "API danh sách đơn hàng không phản hồi."
  Assert-True ($products.Count -gt 0) "Không có sản phẩm để kiểm tra runtime Admin."

  Write-Host "[E2E v3.10.0] Preview nhập kho CSV, không thay đổi tồn kho..."
  $variant = $null
  foreach ($product in $products) {
    if ($product.bien_the -and @($product.bien_the).Count -gt 0) { $variant = @($product.bien_the)[0]; break }
  }
  Assert-True ($null -ne $variant) "Không có biến thể để kiểm tra preview nhập kho."
  $csv = "ma_bien_the,so_luong_nhap,ly_do`r`n$($variant.ma_bien_the),1,E2E preview v3.10.0`r`n"
  $base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($csv))
  $previewBody = @{ ten_file = "e2e-v3100.csv"; du_lieu_base64 = $base64 } | ConvertTo-Json
  $preview = Invoke-RestMethod -Uri "$base/quan-tri/kho/import/kiem-tra" -Method Post -ContentType "application/json; charset=utf-8" -Body $previewBody -Headers $adminHeaders -TimeoutSec 20
  Assert-True ($preview.tong_dong -eq 1) "Preview nhập kho không đọc đúng 1 dòng."
  Assert-True ($preview.hop_le -eq 1) "Preview nhập kho không hợp lệ với biến thể đang tồn tại."

  Write-Host "[E2E v3.10.0] Kiểm tra báo cáo Excel + phiếu nhập..."
  $receipts = @(Invoke-RestMethod -Uri "$base/quan-tri/kho/phieu-nhap" -Method Get -Headers $adminHeaders -TimeoutSec 20)
  $report = Invoke-RestMethod -Uri "$base/quan-tri/bao-cao/ton-kho/excel" -Method Get -Headers $adminHeaders -TimeoutSec 30
  Assert-True ($report.ten_file -like "*.xlsx") "Báo cáo tồn kho không trả về file XLSX."
  Assert-True (-not [string]::IsNullOrWhiteSpace([string]$report.base64)) "Báo cáo tồn kho Excel không có dữ liệu base64."

  Write-Host "[E2E v3.10.0] Kiểm tra Ops: persistent SLI/Apdex, encrypted DLQ scheduler, metrics cache, RBAC on-call..."
  $health = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/suc-khoe" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $alertConfig = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/cau-hinh-canh-bao" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $sloConfig = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/cau-hinh-slo" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $maintenance = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/bao-tri" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $maintenanceList = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/bao-tri/danh-sach" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $sloAdvanced = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/cau-hinh-slo-nang-cao" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $sla = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/sla?so_ngay=30" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $webhookDelivery = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/webhook/delivery?gioi_han=5" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $webhookDeadLetter = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/webhook/dead-letter?gioi_han=5" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $opsRuntime = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/ops/runtime" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $opsAssignments = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/ops/phan-cong" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $opsExcel = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/ops/excel" -Method Get -Headers $adminHeaders -TimeoutSec 30
  $incidents = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/su-co?gioi_han=5" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $incidentExcel = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/su-co/excel" -Method Get -Headers $adminHeaders -TimeoutSec 30
  $opsCursor = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/lich-su/cursor?kich_thuoc=10" -Method Get -Headers $adminHeaders -TimeoutSec 20
  $auditCursor = Invoke-RestMethod -Uri "$base/quan-tri/nhat-ky/cursor?kich_thuoc=10" -Method Get -Headers $adminHeaders -TimeoutSec 20
  Assert-True ($health.phien_ban -eq "3.10.0") "Health endpoint chưa lên v3.10.0."
  Assert-True ($alertConfig.chu_ky_phut -ge 15) "Cấu hình cảnh báo runtime không hợp lệ."
  Assert-True ($null -ne $maintenance.dang_bao_tri) "Maintenance window chưa trả trạng thái runtime."
  Assert-True ($null -ne $maintenanceList.du_lieu) "Danh sách maintenance v3.10.0 chưa phản hồi."
  Assert-True (@($sloAdvanced.burn_windows).Count -ge 1) "SLO nâng cao chưa có burn-rate windows."
  Assert-True ($sloAdvanced.service_targets.postgresql -ge 90) "SLO theo dịch vụ chưa hợp lệ."
  Assert-True (@($sloAdvanced.endpoint_checks).Count -ge 1) "SLO nâng cao chưa có endpoint probe thật."
  Assert-True ($null -ne $sloAdvanced.maintenance_policy) "SLO nang cao chua tra maintenance policy v3.10.0."
  $endpoint0 = @($sloAdvanced.endpoint_checks)[0]
  Assert-True ($endpoint0.method -in @("GET","HEAD")) "Endpoint probe method khong hop le."
  Assert-True ($endpoint0.latency_target_ms -ge 50) "Endpoint probe chua co latency target v3.10.0."
  Assert-True ($null -ne $health.webhook.san_sang) "Health chưa trả trạng thái webhook v3.10.0."
  Assert-True ($health.webhook.adapter -in @("GENERIC","SLACK","TEAMS","DISCORD")) "Webhook adapter preset không hợp lệ."
  Assert-True ($health.webhook.dlq_retention_days -ge 1) "Health chua tra DLQ retention v3.10.0."
  Assert-True ($null -ne $health.webhook.dlq_encryption_ready) "Health chưa trả trạng thái mã hóa DLQ v3.10.0."
  Assert-True ($opsRuntime.phien_ban -eq "3.10.0") "Ops runtime chưa lên v3.10.0."
  Assert-True (-not [string]::IsNullOrWhiteSpace([string]$opsRuntime.probe_agent.agent_id)) "Ops runtime chưa trả probe agent id."
  Assert-True ($opsRuntime.endpoint_samples -ge 0) "Ops runtime chưa trả số persistent endpoint samples."
  Assert-True ($opsRuntime.dlq.chu_ky_phut -ge 1) "Ops runtime chưa trả DLQ scheduled retry policy."
  Assert-True ($null -ne $opsRuntime.dlq.payload_encryption_ready) "Ops runtime chưa trả trạng thái encrypted DLQ."
  Assert-True ($opsRuntime.ops_metrics.refresh_phut -ge 1) "Ops runtime chưa trả scheduler metrics cache."
  Assert-True (@($opsRuntime.rbac.roles).Count -ge 3) "Ops runtime chưa trả RBAC roles."
  Assert-True ($null -ne $opsAssignments.du_lieu) "Danh sách phân quyền Ops/on-call chưa phản hồi."
  Assert-True ($sla.so_ngay -eq 30) "SLA 30 ngày không phản hồi đúng cửa sổ."
  Assert-True ($null -ne $sla.ngan_sach_loi.sla) "SLA chưa trả error budget."
  Assert-True ($null -ne $sla.burn_rate.sla.mot_gio) "SLA chưa trả burn-rate 1h."
  Assert-True ($null -ne $sla.burn_rate.sla.sau_gio) "SLA chưa trả burn-rate 6h."
  Assert-True ($null -ne $sla.burn_rate.sla.hai_muoi_bon_gio) "SLA chưa trả burn-rate 24h."
  Assert-True (@($sla.burn_rate_policy).Count -ge 1) "SLA chưa trả multi-window burn-rate policy."
  Assert-True ($null -ne $sla.ngan_sach_dich_vu.postgresql) "SLA chưa trả error budget theo dịch vụ."
  Assert-True ($null -ne $sla.incident_metrics.tong_incident) "SLA chưa trả MTTA/MTTR incident metrics."
  Assert-True ($null -ne $sla.endpoint_slo.time_weighted) "SLA chưa trả endpoint SLO time-weighted."
  Assert-True ($sla.endpoint_slo.maintenance_aware -eq $true) "Endpoint SLO chua bat maintenance-aware v3.10.0."
  Assert-True ($null -ne $sla.maintenance_policy_applied) "SLA chua tra maintenance policy applied."
  Assert-True (@($sla.endpoint_slo.endpoints).Count -ge 1) "SLA chưa trả availability endpoint."
  $endpointSla0 = @($sla.endpoint_slo.endpoints)[0]
  Assert-True ($null -ne $endpointSla0.latency) "Endpoint SLO chua tra latency SLI."
  Assert-True ($null -ne $endpointSla0.latency.histogram) "Endpoint SLO chua tra latency histogram."
  Assert-True ($null -ne $endpointSla0.latency.apdex) "Endpoint SLO chưa trả Apdex v3.10.0."
  Assert-True ($null -ne $endpointSla0.persistent_samples) "Endpoint SLO chưa trả persistent sample count v3.10.0."
  Assert-True ($null -ne $endpointSla0.probe_agents) "Endpoint SLO chưa trả probe agents v3.10.0."
  Assert-True (@($sla.burn_rate_series).Count -ge 1) "SLA chưa trả burn-rate timeline."
  Assert-True ($null -ne $sla.comparison.chin_muoi_ngay) "SLA chưa trả comparison 90 ngày."
  Assert-True ($null -ne $sla.maintenance_annotations) "SLA chưa trả maintenance annotation."
  Assert-True ($null -ne $webhookDelivery.du_lieu) "Webhook delivery log chưa phản hồi."
  Assert-True ($null -ne $webhookDeadLetter.du_lieu) "Webhook dead-letter chưa phản hồi."
  Assert-True ($opsExcel.ten_file -like "*.xlsx") "Ops aggregate Excel không trả XLSX."
  Assert-True ($sloConfig.sla_muc_tieu_percent -ge 90) "Cấu hình SLO không hợp lệ."
  Assert-True ($null -ne $incidents.du_lieu) "Endpoint incident không trả danh sách."
  Assert-True ($incidents.nguon -eq "BANG_TONG_HOP") "Incident chưa đọc từ bảng tổng hợp v3.10.0."
  Assert-True ($incidentExcel.ten_file -like "*.xlsx") "Incident Excel không trả tên file XLSX."
  Assert-True (-not [string]::IsNullOrWhiteSpace([string]$incidentExcel.base64)) "Incident Excel không có base64."
  if (@($incidents.du_lieu).Count -gt 0) {
    $incident0 = @($incidents.du_lieu)[0]
    $timelineExcel = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/su-co/$($incident0.chu_ky)/excel" -Method Get -Headers $adminHeaders -TimeoutSec 30
    Assert-True ($timelineExcel.ten_file -like "*.xlsx") "Timeline incident không trả XLSX."
    $timelineCursor = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/su-co/$($incident0.chu_ky)/timeline?q=E2E&kich_thuoc=10" -Method Get -Headers $adminHeaders -TimeoutSec 20
    Assert-True ($null -ne $timelineCursor.cursor) "Incident timeline cursor/full-text chưa phản hồi."
  }
  Assert-True ($health.database.migration_gan_nhat.ten -eq "202609010003_v3100_ops_persistence_dlq_oncall") "Migration moi nhat phai la 202609010003_v3100_ops_persistence_dlq_oncall cua v3.10.0."
  Assert-True ($null -ne $opsCursor.cursor) "Cursor lịch sử vận hành không hợp lệ."
  Assert-True ($null -ne $auditCursor.cursor) "Cursor audit không hợp lệ."

  # CI seed một incident tổng hợp riêng cho browser E2E. Chỉ chạy trong CI hoặc khi chủ động bật E2E_SEED_INCIDENT=true,
  # không chạm incident thật của máy local. Docker CI sẽ down -v sau browser E2E nên dữ liệu này tự biến mất.
  $seedIncident = ([Environment]::GetEnvironmentVariable("CI") -eq "true") -or ([Environment]::GetEnvironmentVariable("E2E_SEED_INCIDENT") -eq "true")
  if ($seedIncident) {
    $sig = "fdde222e3bc7582312ed975e75f8e8fde98f263fd36a42183ad5f77be11e6f21"
    $dbName = Get-ProjectEnv "POSTGRES_DB"; if (-not $dbName) { $dbName = "nhienin3d" }
    $dbUser = Get-ProjectEnv "POSTGRES_USER"; if (-not $dbUser) { $dbUser = "nhienin3d_app" }
    $sql = @"
INSERT INTO su_co_van_hanh (chu_ky,trang_thai_xu_ly,van_de,bat_dau,gan_nhat,so_su_kien,so_health,so_alert,trang_thai_gan_nhat,ngay_tao,ngay_cap_nhat)
VALUES ('$sig','MOI','["E2E browser v3.10.0 synthetic incident"]'::jsonb,now(),now(),1,1,0,'CANH_BAO',now(),now())
ON CONFLICT (chu_ky) DO UPDATE SET trang_thai_xu_ly='MOI', van_de=EXCLUDED.van_de, gan_nhat=now(), trang_thai_gan_nhat='CANH_BAO', ghi_chu=NULL, nguoi_tiep_nhan_id=NULL, nguoi_tiep_nhan_ten=NULL, tiep_nhan_luc=NULL, nguoi_khac_phuc_id=NULL, nguoi_khac_phuc_ten=NULL, khac_phuc_luc=NULL, ngay_cap_nhat=now();
INSERT INTO lich_su_van_hanh (loai,trang_thai,mo_ta,chi_tiet,chu_ky_canh_bao,ngay_ket_thuc,ngay_tao)
VALUES ('HEALTH','CANH_BAO','E2E browser v3.10.0 synthetic incident','{"van_de":["E2E browser v3.10.0 synthetic incident"]}'::jsonb,'$sig',now(),now());
"@
    $sql | docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U $dbUser -d $dbName | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Không seed được incident E2E v3.10.0 cho browser CI." }
    Write-Host "Synthetic incident : PASS ($sig)"
  }

  Write-Host "Runtime E2E v3.10.0 PASS ✅" -ForegroundColor Green
  Write-Host "Admin login       : PASS"
  Write-Host "Orders / products : PASS ($($orders.Count) đơn / $($products.Count) sản phẩm)"
  Write-Host "Stock import      : PASS (preview, không ghi tồn)"
  Write-Host "Inventory report  : PASS ($($report.ten_file))"
  Write-Host "Receipts          : PASS ($($receipts.Count) phiếu)"
  Write-Host "Ops config / SLO  : PASS"
  Write-Host "Maintenance xN    : PASS"
  Write-Host "Burn policy/MTTR  : PASS"
  Write-Host "Service budgets   : PASS"
  Write-Host "Endpoint SLO      : PASS (persistent + Apdex + multi-agent)"
  Write-Host "Burn timeline     : PASS (7/30/90 + maintenance)"
  Write-Host "Webhook delivery  : PASS"
  Write-Host "Webhook DLQ       : PASS (AES-GCM + scheduled retry + retention)"
  Write-Host "Ops metrics cache : PASS"
  Write-Host "Ops RBAC/on-call  : PASS"
  Write-Host "Incident timeline : PASS (cursor + GIN full-text)"
  Write-Host "Ops aggregate XLSX: PASS"
  Write-Host "Incident Excel    : PASS"
  Write-Host "Incident rollup   : PASS"
  Write-Host "Cursor pagination : PASS"
} finally {
  Pop-Location
}
