param(
  [Parameter(Mandatory=$true)][string]$AgentId,
  [string]$Region = "local",
  [string]$NodeName = "",
  [int]$ExpiresMinutes = 30,
  [string]$DeviceId = ""
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

try {
  if ([string]::IsNullOrWhiteSpace($NodeName)) { $NodeName = $AgentId }
  $apiPort = Get-ProjectEnv "API_PORT"; if (-not $apiPort) { $apiPort = "3001" }
  $base = "http://127.0.0.1:$apiPort/api/v1"
  $email = Get-ProjectEnv "ADMIN_EMAIL"
  $password = Get-ProjectEnv "ADMIN_PASSWORD"
  if (-not $email -or -not $password) { throw "Thiếu ADMIN_EMAIL/ADMIN_PASSWORD trong .env hoặc environment." }

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginBody = @{ thu_dien_tu = $email; mat_khau = $password; trinh_duyet_hien_thi = "Probe Enrollment v3.18.0" } | ConvertTo-Json
  $loginResponse = Invoke-WebRequest -Uri "$base/xac-thuc/dang-nhap" -Method Post -ContentType "application/json; charset=utf-8" -Body $loginBody -WebSession $session -TimeoutSec 20 -UseBasicParsing
  $setCookie = @($loginResponse.Headers["Set-Cookie"]) -join ","
  $accessMatch = [regex]::Match($setCookie, "(?:^|[,\s])nhienin3d_phien=([^;,\s]+)")
  if (-not $accessMatch.Success) { throw "Đăng nhập không phát cookie nhienin3d_phien." }
  $adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loopbackUri = [Uri]("$base/")
  $adminSession.Cookies.SetCookies($loopbackUri, "nhienin3d_phien=$($accessMatch.Groups[1].Value); Path=/")
  $payload = @{ agent_id = $AgentId; region = $Region; node_name = $NodeName; expires_minutes = [Math]::Max(5, [Math]::Min(1440, $ExpiresMinutes)) }
  if (-not [string]::IsNullOrWhiteSpace($DeviceId)) { $payload.device_id = $DeviceId.Trim() }
  $body = $payload | ConvertTo-Json
  $result = Invoke-RestMethod -Uri "$base/quan-tri/he-thong/ops/probe-enrollment-token" -Method Post -WebSession $adminSession -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec 20
  Write-Host "[Probe Enrollment v3.18.0] Token tạo thành công cho $AgentId@$Region/$NodeName" -ForegroundColor Green
  Write-Host "Hết hạn : $($result.expires_at)"
  $deviceState = if ($result.device_bound) { "BOUND" } else { "OPTIONAL" }
  Write-Host "Device  : $deviceState"
  Write-Host "Token   : $($result.token)" -ForegroundColor Yellow
  Write-Warning "Token chỉ dùng một lần. Không commit/chụp log token này."
} finally {
  Pop-Location
}
