# One-command owner operation for Windows PowerShell from the Rupee Rush checkout.
# Never creates/rotates signing keys, never overwrites existing keys or secrets by default.
[CmdletBinding()]
param(
    [string]$ReverieRoot,
    [ValidatePattern('^[A-Za-z0-9_-]+$')][string]$DriveRemote = 'gdrive',
    [switch]$EncryptOnly,
    [switch]$AllowExistingSecrets
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$provision = Join-Path $PSScriptRoot 'provision-rupee-signing.ps1'
$backup = Join-Path $PSScriptRoot 'backup-android-signing-to-drive.ps1'

if (-not (Test-Path -LiteralPath $provision -PathType Leaf) -or
    -not (Test-Path -LiteralPath $backup -PathType Leaf)) {
    throw 'Signing scripts are missing. Pull Rupee Rush main before running.'
}
$required = @('keytool','gh','age')
if (-not $EncryptOnly) { $required += 'rclone' }
foreach ($commandName in $required) {
    if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
        throw "Required local tool '$commandName' is not installed or on PATH. See docs/ANDROID_SIGNING_AND_BACKUP.md."
    }
}

# The local paths are not read from GitHub and must already contain ORIGINAL key material.
$nutDir = Join-Path $HOME '.local/share/nutbuster-signing'
foreach ($name in @('nutbuster-publisher.p12','store-password')) {
    if (-not (Test-Path -LiteralPath (Join-Path $nutDir $name) -PathType Leaf)) {
        throw "Original Nut Buster key material is missing from $nutDir. Refusing to generate a replacement key."
    }
}
if (-not $ReverieRoot) {
    if ($env:REVERIEVR_ROOT) { $ReverieRoot = $env:REVERIEVR_ROOT }
    else { $ReverieRoot = Join-Path $root '../ReverieVR' }
}
if (-not (Test-Path -LiteralPath $ReverieRoot -PathType Container)) {
    throw "Cannot locate sibling ReverieVR checkout. Pass -ReverieRoot 'C:\path\to\ReverieVR'."
}
$ReverieRoot = (Resolve-Path -LiteralPath $ReverieRoot).Path
$reverieSecrets = Join-Path $ReverieRoot '.local/reverievr-signing/github-secrets.txt'
if (-not (Test-Path -LiteralPath $reverieSecrets -PathType Leaf)) {
    throw "Original ReverieVR signing secrets file missing: $reverieSecrets"
}

# Prevent a backup or write attempt from hiding a prerequisite failure.
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) { throw 'GitHub CLI is not authenticated. Run gh auth login.' }
$existingNames = @(& gh secret list --repo mrcalzon02/Rupee-rush --json name --jq '.[].name')
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect existing GitHub signing secret names.' }
$existingSigners = @($existingNames | Where-Object { $_ -match '^PHONE_TEST_(KEYSTORE_BASE64|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)$' })
if ($existingSigners.Count -gt 0 -and -not $AllowExistingSecrets) {
    throw 'Rupee Rush signing secrets already exist; refusing to overwrite unverified values. Verify the original signing lineage first.'
}
if (-not $EncryptOnly) {
    $remotes = @(& rclone listremotes)
    if ($LASTEXITCODE -ne 0 -or -not ($remotes -contains ($DriveRemote + ':'))) {
        throw "Google Drive rclone remote '$DriveRemote' is not configured. Run rclone config."
    }
}

# Validate public fingerprint against ORIGINAL Nut Buster keystore before any upload.
Write-Host '[1/3] Validate the existing Nut Buster / Rupee Rush publisher certificate'
& $provision

# Encrypted backup first; GitHub secrets are untouched if verification/upload fails.
Write-Host '[2/3] Encrypt and verify Nut Buster + ReverieVR signing backups'
& $backup -ReverieRoot $ReverieRoot -DriveRemote $DriveRemote -EncryptOnly:$EncryptOnly

Write-Host '[3/3] Provision the existing signer into Rupee Rush GitHub secret storage'
& $provision -SetGitHubSecrets -AllowExistingSecrets:$AllowExistingSecrets
Write-Host 'Completed signing secret registration and encrypted backup workflow.'
Write-Host 'An Android APK has NOT been built or signed by this script.'
