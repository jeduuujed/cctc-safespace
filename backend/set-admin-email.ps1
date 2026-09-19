param(
  [Parameter(Mandatory=$true)]
  [string]$Email,

  [Parameter(Mandatory=$false)]
  [string]$BackendEnvPath = "./.env",

  [Parameter(Mandatory=$false)]
  [string]$FrontendEnvPath = "../frontend/.env.local"
)

$backendFullPath = (Resolve-Path $BackendEnvPath -ErrorAction SilentlyContinue)?.Path
if (-not $backendFullPath) {
  $backendFullPath = (Join-Path (Get-Location) ".env")
}

$frontendFullPath = (Resolve-Path $FrontendEnvPath -ErrorAction SilentlyContinue)?.Path
if (-not $frontendFullPath) {
  $frontendFullPath = (Join-Path (Split-Path (Get-Location) -Parent) "frontend/.env.local")
}

function Set-OrCreateEnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  if (-not (Test-Path $Path)) {
    New-Item -ItemType File -Path $Path -Force | Out-Null
  }

  $content = Get-Content $Path -Raw
  $pattern = "^$([regex]::Escape($Key))=.*$"
  if ($content -match $pattern) {
    $updated = [regex]::Replace($content, $pattern, "$Key=$Value", 1)
  } else {
    if ($content -notmatch '\n$') {
      $content += "`n"
    }
    $updated = $content + "$Key=$Value`n"
  }

  Set-Content -Path $Path -Value $updated -NoNewline
}

Set-OrCreateEnvValue -Path $backendFullPath -Key "ADMIN_EMAILS" -Value $Email
Set-OrCreateEnvValue -Path $frontendFullPath -Key "NEXT_PUBLIC_ADMIN_EMAILS" -Value $Email

Write-Host "Admin email configured successfully: $Email" -ForegroundColor Green
Write-Host "Updated files:" -ForegroundColor Yellow
Write-Host " - $backendFullPath"
Write-Host " - $frontendFullPath"
