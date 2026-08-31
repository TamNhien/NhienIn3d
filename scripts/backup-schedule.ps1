param(
  [string]$At = "02:00",
  [string]$TaskName = "NhienIn3d-PostgreSQL-Backup",
  [int]$DailyRetentionDays = 14,
  [int]$WeeklyRetentionWeeks = 8
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BackupScript = Join-Path $Root "scripts\backup-db.ps1"
if (-not (Test-Path $BackupScript)) { throw "Không tìm thấy backup-db.ps1" }

try { $time = [DateTime]::ParseExact($At, "HH:mm", [Globalization.CultureInfo]::InvariantCulture) }
catch { throw "At phải có định dạng HH:mm, ví dụ 02:00." }

$argument = "-NoProfile -ExecutionPolicy Bypass -File `"$BackupScript`" -DailyRetentionDays $DailyRetentionDays -WeeklyRetentionWeeks $WeeklyRetentionWeeks"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argument -WorkingDirectory $Root
$trigger = New-ScheduledTaskTrigger -Daily -At $time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2)
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "NhienIn3d PostgreSQL backup daily; Sunday weekly snapshot; SHA-256 + retention." -Force | Out-Null

Write-Host "Đã tạo lịch backup ✅" -ForegroundColor Green
Write-Host "Task      : $TaskName"
Write-Host "Mỗi ngày  : $At"
Write-Host "Daily giữ : $DailyRetentionDays ngày"
Write-Host "Weekly giữ: $WeeklyRetentionWeeks tuần"
Write-Host "Kiểm tra  : Get-ScheduledTask -TaskName '$TaskName'"
