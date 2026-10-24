# Rupee Rush: one-command signer verification, encrypted backup and GitHub provisioning.
# Never generates or replaces signing keys. External tool installation requires consent.
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
    throw 'Signing scripts are missing; update the Rupee Rush checkout.'
}

# Android Studio bundles keytool under jbr\bin. Do not require an additional JDK if it exists.
function Find-LocalTool([string]$Name) {
    $cmd = Get-Command -Name $Name -CommandType Application -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $paths = @()
    if ($Name -eq 'keytool') {
        if ($env:JAVA_HOME) { $paths += Join-Path $env:JAVA_HOME 'bin/keytool.exe' }
        if ($env:ProgramFiles) {
            $paths += Join-Path $env:ProgramFiles 'Android/Android Studio/jbr/bin/keytool.exe'
            $paths += Join-Path $env:ProgramFiles 'Android/Android Studio/jre/bin/keytool.exe'
            foreach ($subdir in @('Eclipse Adoptium','Microsoft','Java','Amazon Corretto','Zulu')) {
                $base = Join-Path $env:ProgramFiles $subdir
                if (Test-Path -LiteralPath $base -PathType Container) {
                    foreach ($child in @(Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue)) {
                        $paths += Join-Path $child.FullName 'bin/keytool.exe'
                        $paths += Join-Path $child.FullName 'Contents/Home/bin/keytool.exe'
                    }
                }
            }
        }
        if ($env:LOCALAPPDATA) {
            foreach ($subdir in @('Programs/Eclipse Adoptium','Programs/Microsoft')) {
                $base = Join-Path $env:LOCALAPPDATA $subdir
                if (Test-Path -LiteralPath $base -PathType Container) {
                    foreach ($child in @(Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue)) {
                        $paths += Join-Path $child.FullName 'bin/keytool.exe'
                    }
                }
            }
        }
    } else {
        if ($env:LOCALAPPDATA) {
            $paths += Join-Path $env:LOCALAPPDATA ("Microsoft/WinGet/Links/" + $Name + ".exe")
        }
        if ($env:ProgramFiles -and $Name -eq 'gh') {
            $paths += Join-Path $env:ProgramFiles 'GitHub CLI/gh.exe'
        }
        $paths += Join-Path $HOME ("scoop/apps/" + $Name + "/current/" + $Name + ".exe")
    }
    foreach ($candidate in $paths) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }
    return $null
}
function Add-CommandDirectory([string]$FileName) {
    $folder = Split-Path -Parent $FileName
    if (($env:Path -split ';') -notcontains $folder) {
        $env:Path = $folder + ';' + $env:Path
    }
}
function Refresh-SessionPath {
    foreach ($scope in @('Machine','User')) {
        $p = [Environment]::GetEnvironmentVariable('Path',$scope)
        if ($p) { $env:Path += ';' + $p }
    }
    if ($env:LOCALAPPDATA) {
        $env:Path += ';' + (Join-Path $env:LOCALAPPDATA 'Microsoft/WinGet/Links')
    }
}
$packageIds = @{
    keytool = 'Microsoft.OpenJDK.17'
    gh = 'GitHub.cli'
    age = 'FiloSottile.age'
    rclone = 'Rclone.Rclone'
}
$required = @('keytool','gh','age')
if (-not $EncryptOnly) { $required += 'rclone' }

$missing = @()
foreach ($name in $required) {
    $found = Find-LocalTool $name
    if ($found) {
        Add-CommandDirectory $found
        Write-Host "Found $name : $found"
    } else {
        $missing += $name
    }
}
if ($missing.Count -gt 0) {
    Write-Host 'Missing local prerequisites:'
    foreach ($name in $missing) {
        Write-Host ('  {0} -> winget package {1}' -f $name,$packageIds[$name])
    }
    $winget = Get-Command -Name winget -CommandType Application -ErrorAction SilentlyContinue
    if (-not $winget) {
        throw 'Windows Package Manager (winget) unavailable. Install App Installer or the missing tools first.'
    }
    $answer = Read-Host 'Install these missing tools from the WinGet repository? [y/N]'
    if ($answer -notmatch '^(y|yes)$') {
        throw 'Installation declined. No signing material or GitHub secrets were changed.'
    }
    foreach ($name in $missing) {
        Write-Host "Installing approved package: $($packageIds[$name])"
        & $winget.Source install --id $packageIds[$name] --exact --source winget --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -ne 0) { throw "WinGet installation failed for $($packageIds[$name]); original keys were not modified." }
        Refresh-SessionPath
        $found = Find-LocalTool $name
        if (-not $found) {
            throw "WinGet reported installation of $($packageIds[$name]) but $name is still unavailable. Restart GitKraken/PowerShell if required, then rerun the SAME command."
        }
        Add-CommandDirectory $found
    }
}
# Recheck ALL tools in this PowerShell session before touching private credentials.
foreach ($name in $required) {
    if (-not (Find-LocalTool $name)) { throw "Missing required executable $name. No keys changed." }
}

# Originals are mandatory. Do not recreate signing identities from public fingerprints.
$nutDir = Join-Path $HOME '.local/share/nutbuster-signing'
foreach ($name in @('nutbuster-publisher.p12','store-password')) {
    if (-not (Test-Path -LiteralPath (Join-Path $nutDir $name) -PathType Leaf)) {
        throw "Original Nut Buster signing material missing from $nutDir. Restore the existing key from a private backup; never generate a replacement."
    }
}
if (-not $ReverieRoot) {
    if ($env:REVERIEVR_ROOT) { $ReverieRoot = $env:REVERIEVR_ROOT }
    else { $ReverieRoot = Join-Path $root '../ReverieVR' }
}
if (-not (Test-Path -LiteralPath $ReverieRoot -PathType Container)) {
    throw "Cannot locate ReverieVR checkout. Reinvoke with -ReverieRoot 'C:\path\to\ReverieVR'."
}
$ReverieRoot = (Resolve-Path -LiteralPath $ReverieRoot).Path
$reverieSecrets = Join-Path $ReverieRoot '.local/reverievr-signing/github-secrets.txt'
if (-not (Test-Path -LiteralPath $reverieSecrets -PathType Leaf)) {
    throw "Existing ReverieVR signing secrets file missing: $reverieSecrets. Do not generate a replacement identity."
}

& gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'GitHub authentication is required to register Rupee Rush secrets.'
    & gh auth login
    if ($LASTEXITCODE -ne 0) { throw 'GitHub authentication was not completed.' }
    & gh auth status *> $null
    if ($LASTEXITCODE -ne 0) { throw 'GitHub credentials still unavailable.' }
}
$existingNames = @(& gh secret list --repo mrcalzon02/Rupee-rush --json name --jq '.[].name')
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect current GitHub signing secret names.' }
$existingSigners = @($existingNames | Where-Object { $_ -match '^PHONE_TEST_(KEYSTORE_BASE64|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)$' })
if ($existingSigners.Count -gt 0 -and -not $AllowExistingSecrets) {
    throw 'Rupee Rush signing secrets already exist. Refusing to overwrite an unverified publisher lineage.'
}
if (-not $EncryptOnly) {
    $remotes = @(& rclone listremotes)
    if ($LASTEXITCODE -ne 0 -or -not ($remotes -contains ($DriveRemote + ':'))) {
        $answer = Read-Host "Google Drive remote '$DriveRemote' is missing. Open rclone config now? [y/N]"
        if ($answer -notmatch '^(y|yes)$') { throw 'Drive setup declined. No backup/upload or GitHub secret changes occurred.' }
        & rclone config
        if ($LASTEXITCODE -ne 0) { throw 'Rclone configuration was not completed.' }
        $remotes = @(& rclone listremotes)
        if ($LASTEXITCODE -ne 0 -or -not ($remotes -contains ($DriveRemote + ':'))) {
            throw "No rclone remote named $DriveRemote. Use that exact name for the Google Drive OAuth remote."
        }
    }
}

Write-Host '[1/3] Verify existing Nut Buster/Rupee Rush signing certificate'
& $provision
Write-Host '[2/3] Encrypt and verify Nut Buster plus ReverieVR backups'
& $backup -ReverieRoot $ReverieRoot -DriveRemote $DriveRemote -EncryptOnly:$EncryptOnly
Write-Host '[3/3] Register original signer in Rupee Rush GitHub secrets'
& $provision -SetGitHubSecrets -AllowExistingSecrets:$AllowExistingSecrets
Write-Host 'Done: signing secret names registered; backup workflow completed.'
Write-Host 'No APK was compiled, signed or published by this script.'
