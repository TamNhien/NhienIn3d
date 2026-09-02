param(
  [string]$AgentId = "",
  [switch]$Once,
  [int]$IntervalSeconds = 0
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

function Default-Profile([string]$Id) {
  switch ($Id) {
    "agent-hcm-01" { return @{ agent_id = $Id; region = "hcm"; node_name = "server-hcm-01" } }
    "agent-hn-01"  { return @{ agent_id = $Id; region = "hanoi"; node_name = "server-hn-01" } }
    "agent-local"  { return @{ agent_id = $Id; region = "local"; node_name = "server-local-01" } }
    default          { return @{ agent_id = $Id; region = "local"; node_name = $Id } }
  }
}

try {
  $rawKeys = Get-ProjectEnv "SYSTEM_SLO_AGENT_KEYS_JSON"
  if ([string]::IsNullOrWhiteSpace($rawKeys)) { throw "Thiếu SYSTEM_SLO_AGENT_KEYS_JSON trong .env hoặc environment." }
  $keys = $rawKeys | ConvertFrom-Json
  $keyProperties = @($keys.PSObject.Properties)
  if ($keyProperties.Count -eq 0) { throw "SYSTEM_SLO_AGENT_KEYS_JSON không có agent nào." }

  $profileMap = @{}
  $rawProfiles = Get-ProjectEnv "SYSTEM_SLO_AGENT_PROFILES_JSON"
  if (-not [string]::IsNullOrWhiteSpace($rawProfiles)) {
    $profiles = @($rawProfiles | ConvertFrom-Json)
    foreach ($profile in $profiles) {
      $id = [string]$profile.agent_id
      if ([string]::IsNullOrWhiteSpace($id)) { continue }
      $region = [string]$profile.region
      $node = [string]$profile.node_name
      if ([string]::IsNullOrWhiteSpace($region)) { $region = "local" }
      if ([string]::IsNullOrWhiteSpace($node)) { $node = $id }
      $profileMap[$id] = @{ agent_id = $id; region = $region; node_name = $node }
    }
  }

  $api = Get-ProjectEnv "NH3D_PROBE_API_URL"
  if ([string]::IsNullOrWhiteSpace($api)) { $api = "http://127.0.0.1:3001/api/v1" }

  if ($IntervalSeconds -le 0) {
    $rawInterval = Get-ProjectEnv "NH3D_PROBE_INTERVAL_SECONDS"
    if ([string]::IsNullOrWhiteSpace($rawInterval)) { $rawInterval = "300" }
    $parsedInterval = 0
    if (-not [int]::TryParse($rawInterval, [ref]$parsedInterval)) { $parsedInterval = 300 }
    $IntervalSeconds = $parsedInterval
  }
  $IntervalSeconds = [Math]::Max(30, $IntervalSeconds)

  $selected = @($keyProperties | Where-Object { [string]::IsNullOrWhiteSpace($AgentId) -or $_.Name -eq $AgentId })
  if ($selected.Count -eq 0) { throw "Không tìm thấy agent '$AgentId' trong SYSTEM_SLO_AGENT_KEYS_JSON." }

  function Invoke-ProbeFleetCycle {
    $failures = @()
    $cycleStarted = Get-Date
    Write-Host "[Probe Fleet v3.12.0] cycle $($cycleStarted.ToString('yyyy-MM-ddTHH:mm:ssK')) · $($selected.Count) agent(s)" -ForegroundColor Cyan

    foreach ($prop in $selected) {
      $id = [string]$prop.Name
      $secret = [string]$prop.Value
      if ($secret.Length -lt 16) {
        $failures += "${id}: secret ngắn hơn 16 ký tự"
        Write-Warning "Probe agent $id bị bỏ qua: secret phải có ít nhất 16 ký tự."
        continue
      }

      $profile = if ($profileMap.ContainsKey($id)) { $profileMap[$id] } else { Default-Profile $id }
      $env:NH3D_PROBE_API_URL = $api
      $env:NH3D_PROBE_AGENT_ID = $id
      $env:NH3D_PROBE_REGION = [string]$profile.region
      $env:NH3D_PROBE_NODE = [string]$profile.node_name
      $env:NH3D_PROBE_AGENT_SECRET = $secret
      $env:NH3D_PROBE_INTERVAL_SECONDS = [string]$IntervalSeconds

      Write-Host "  -> $id@$($env:NH3D_PROBE_REGION)/$($env:NH3D_PROBE_NODE) · secret $($secret.Length) chars" -ForegroundColor DarkGray
      & node (Join-Path $PSScriptRoot "probe-agent-v3120.mjs") --once
      if ($LASTEXITCODE -ne 0) {
        $failures += "${id}: exit code $LASTEXITCODE"
        Write-Warning "Probe agent $id thất bại với exit code $LASTEXITCODE."
      }
    }

    Remove-Item Env:NH3D_PROBE_AGENT_SECRET -ErrorAction SilentlyContinue
    if ($failures.Count -eq 0) {
      Write-Host "Probe Fleet v3.12.0 cycle PASS ✅" -ForegroundColor Green
      return $true
    }

    Write-Warning "Probe Fleet v3.12.0 cycle có $($failures.Count) lỗi: $($failures -join '; ')"
    return $false
  }

  if ($Once) {
    if (-not (Invoke-ProbeFleetCycle)) { throw "Probe Fleet v3.12.0 one-shot thất bại." }
    Write-Host "Probe Fleet v3.12.0 PASS ✅" -ForegroundColor Green
    return
  }

  Write-Host "[Probe Fleet v3.12.0] Managed mode: heartbeat mỗi $IntervalSeconds giây. Nhấn Ctrl+C để dừng." -ForegroundColor Cyan
  while ($true) {
    $null = Invoke-ProbeFleetCycle
    Start-Sleep -Seconds $IntervalSeconds
  }
} finally {
  Remove-Item Env:NH3D_PROBE_AGENT_SECRET -ErrorAction SilentlyContinue
  Pop-Location
}
