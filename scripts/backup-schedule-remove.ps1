param([string]$TaskName = "NhienIn3d-PostgreSQL-Backup")
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Host "Không có Scheduled Task '$TaskName'."
  exit 0
}
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Đã gỡ lịch backup '$TaskName' ✅" -ForegroundColor Green
