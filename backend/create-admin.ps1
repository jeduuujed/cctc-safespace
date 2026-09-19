param(
  [Parameter(Mandatory=$true)]
  [string]$Email,

  [Parameter(Mandatory=$true)]
  [string]$Password,

  [Parameter(Mandatory=$false)]
  [string]$CredentialPath = ""
)

if ([string]::IsNullOrWhiteSpace($CredentialPath)) {
  $CredentialPath = $env:GOOGLE_APPLICATION_CREDENTIALS
}

if ([string]::IsNullOrWhiteSpace($CredentialPath)) {
  Write-Host "Please provide -CredentialPath or set GOOGLE_APPLICATION_CREDENTIALS." -ForegroundColor Red
  exit 1
}

$env:GOOGLE_APPLICATION_CREDENTIALS = $CredentialPath
node .\create-admin.js $Email $Password
