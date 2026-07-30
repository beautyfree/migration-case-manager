param([Parameter(Mandatory=$true)][string]$Version, [switch]$YesDownload)
$base = if ($env:MIGRATION_OS_RELEASE_BASE) { $env:MIGRATION_OS_RELEASE_BASE } else { "https://github.com/beautyfree/migration-case-manager/releases/download" }
$releaseTagPattern = '^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$'
if ($Version -notmatch $releaseTagPattern) { throw "BINARY_INVALID_RELEASE_VERSION: expected a versioned vX.Y.Z release tag" }
if (-not $base.StartsWith("https://", [System.StringComparison]::OrdinalIgnoreCase)) { throw "BINARY_INVALID_RELEASE_BASE: release downloads must use HTTPS" }
$artifact = switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()) { "X64" { "migration-os-windows-x64.exe" } "Arm64" { "migration-os-windows-arm64.exe" } default { throw "BINARY_UNSUPPORTED_PLATFORM: Windows/$($_)" } }
$dest = if ($env:MIGRATION_OS_HOME) { $env:MIGRATION_OS_HOME } else { Join-Path $env:LOCALAPPDATA "MigrationOS" }
$url = "$base/$Version/$artifact"; $checksums = "$base/$Version/checksums.txt"
$entry = (Invoke-WebRequest -Uri $checksums -MaximumRedirection 3).Content -split "`n" | Where-Object { $_ -match "\s$([regex]::Escape($artifact))$" } | Select-Object -First 1
$expected = ($entry -split '\s+')[0]
if (-not $expected -or $expected -notmatch '^[0-9A-Fa-f]{64}$') { throw "BINARY_CHECKSUM_MISMATCH: artifact is absent from checksums.txt or has an invalid SHA-256" }
if (-not $YesDownload) { Write-Output "Consent required. Release $Version would download $url, verify SHA-256 $expected from $checksums, run doctor, then install to $(Join-Path $dest $artifact). Re-run with -YesDownload after user approval."; exit 3 }
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$tmp = Join-Path $dest ".download-$([guid]::NewGuid()).exe"
try {
  Invoke-WebRequest -Uri $url -OutFile $tmp -MaximumRedirection 3
  if ((Get-FileHash -Algorithm SHA256 $tmp).Hash.ToLower() -ne $expected.ToLower()) { throw "BINARY_CHECKSUM_MISMATCH: downloaded file was not installed" }
  & $tmp doctor
  if ($LASTEXITCODE -ne 0) { throw "BINARY_DOCTOR_FAILED: downloaded file was not installed" }
  Move-Item -Force $tmp (Join-Path $dest $artifact)
} finally { if (Test-Path $tmp) { Remove-Item -Force $tmp } }
