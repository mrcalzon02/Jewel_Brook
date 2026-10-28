# One-time encrypted backup of the CURRENT Jewelbrook publisher key to a private Google Drive folder.
# Run on the Windows PC that holds the original signing key; does not create or rotate keys.
[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9_-]+$')][string]$DriveRemote = 'gdrive',
    [ValidatePattern('^[A-Za-z0-9_-]{15,}$')][string]$DriveFolderId = '1sAvMvu9prGSUBIg9q5laisgoCmBIY-zT'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not $env:LOCALAPPDATA -or -not $env:TEMP) {
    throw 'This script requires a normal Windows PowerShell profile.'
}
$keyDir = Join-Path $env:LOCALAPPDATA 'Embryon\rupeerush-local-apk-v1'
$keystore = Join-Path $keyDir 'rupeerush-local-release.p12'
$passwordFile = Join-Path $keyDir 'store-password.txt'
$pinnedCert = Join-Path $keyDir 'certificate-sha256.txt'
$backupRoot = Join-Path $keyDir 'encrypted-backups'
$alias = 'rupeerush-local-apk-v1'

# Verify both files EXIST. Never generate another signing identity on an error.
foreach ($file in @($keystore, $passwordFile)) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        throw "Existing publisher recovery file is missing: $file. No replacement key will be generated."
    }
}
function Find-Executable([string]$Name) {
    $cmd = Get-Command -Name $Name -CommandType Application -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @()
    if ($Name -eq 'keytool') {
        if ($env:JAVA_HOME) { $candidates += Join-Path $env:JAVA_HOME 'bin\keytool.exe' }
        if ($env:ProgramFiles) {
            $candidates += Join-Path $env:ProgramFiles 'Android\Android Studio\jbr\bin\keytool.exe'
            foreach ($vendor in @('Microsoft','Eclipse Adoptium','Java','Zulu','Amazon Corretto')) {
                $vendorDir = Join-Path $env:ProgramFiles $vendor
                if (Test-Path -LiteralPath $vendorDir -PathType Container) {
                    foreach ($dir in @(Get-ChildItem -LiteralPath $vendorDir -Directory -ErrorAction SilentlyContinue)) {
                        $candidates += Join-Path $dir.FullName 'bin\keytool.exe'
                    }
                }
            }
        }
    } else {
        if ($env:LOCALAPPDATA) {
            $candidates += Join-Path $env:LOCALAPPDATA ('Microsoft\WinGet\Links\' + $Name + '.exe')
            $packageDir = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
            $prefix = if ($Name -eq 'age') { 'FiloSottile.age_*' } else { 'Rclone.Rclone_*' }
            if (Test-Path -LiteralPath $packageDir -PathType Container) {
                foreach ($dir in @(Get-ChildItem -Path (Join-Path $packageDir $prefix) -Directory -ErrorAction SilentlyContinue)) {
                    $candidates += Join-Path $dir.FullName ($Name + '.exe')
                    $candidates += @(Get-ChildItem -LiteralPath $dir.FullName -Filter ($Name + '.exe') -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
                }
            }
        }
        $candidates += Join-Path $HOME ('scoop\apps\' + $Name + '\current\' + $Name + '.exe')
        if ($env:ProgramFiles) { $candidates += Join-Path $env:ProgramFiles ($Name + '\' + $Name + '.exe') }
    }
    foreach ($file in $candidates) {
        if ($file -and (Test-Path -LiteralPath $file -PathType Leaf)) {
            return (Resolve-Path -LiteralPath $file).Path
        }
    }
    return $null
}
function Ensure-Tool([string]$Name,[string]$Package) {
    $exe = Find-Executable $Name
    if ($exe) { return $exe }
    $winget = Get-Command winget -CommandType Application -ErrorAction SilentlyContinue
    if (-not $winget) {
        throw "Required tool $Name missing. Install the $Package WinGet package before retrying."
    }
    $answer = Read-Host "Install missing $Name ($Package) using Windows Package Manager? [y/N]"
    if ($answer -notmatch '^(y|yes)$') {
        throw "$Name installation declined; original signing keys remain untouched."
    }
    & $winget.Source install --id $Package --exact --source winget --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { throw "WinGet could not install $Package; original keys unchanged." }
    $exe = Find-Executable $Name
    if (-not $exe) {
        foreach ($scope in @('Machine','User')) {
            $extraPath = [Environment]::GetEnvironmentVariable('Path',$scope)
            if ($extraPath) { $env:Path += ';' + $extraPath }
        }
        $exe = Find-Executable $Name
    }
    if (-not $exe) {
        throw "$Package installed but its executable is not yet visible. Reopen GitKraken PowerShell and rerun the same command."
    }
    return $exe
}

$keytool = Find-Executable 'keytool'
if (-not $keytool) {
    throw 'JDK keytool not found. Signing key left untouched; install a JDK 17+ (no Android SDK build needed).'
}
$age = Ensure-Tool 'age' 'FiloSottile.age'
$rclone = Ensure-Tool 'rclone' 'Rclone.Rclone'

# Do not encrypt a key that is corrupt or whose certificate has changed.
$password = [IO.File]::ReadAllText($passwordFile).TrimEnd([char[]]@(13,10))
if (-not $password) { throw 'Current signing password file is empty.' }
$certTemp = Join-Path $env:TEMP ('rupeerush-public-' + [guid]::NewGuid().ToString('N') + '.der')
$prior = [Environment]::GetEnvironmentVariable('RR_BACKUP_PASSWORD','Process')
try {
    [Environment]::SetEnvironmentVariable('RR_BACKUP_PASSWORD',$password,'Process')
    & $keytool -exportcert -storetype PKCS12 -keystore $keystore -alias $alias '-storepass:env' 'RR_BACKUP_PASSWORD' -file $certTemp | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $certTemp -PathType Leaf)) {
        throw 'Cannot validate current signing key/password. Backup not started.'
    }
    $certSha = (Get-FileHash -LiteralPath $certTemp -Algorithm SHA256).Hash.ToLowerInvariant()
} finally {
    [Environment]::SetEnvironmentVariable('RR_BACKUP_PASSWORD',$prior,'Process')
    Remove-Item -LiteralPath $certTemp -Force -ErrorAction SilentlyContinue
    $password = $null
}
if (Test-Path -LiteralPath $pinnedCert -PathType Leaf) {
    $pin = [IO.File]::ReadAllText($pinnedCert).Trim().ToLowerInvariant()
    if ($pin -ne $certSha) {
        throw "Stored signing fingerprint differs from keystore: expected $pin actual $certSha. STOP."
    }
}
Write-Host "Verified ORIGINAL Jewelbrook APK signing certificate SHA256: $certSha"

$remote = $DriveRemote + ':'
$remotes = @(& $rclone listremotes)
if ($LASTEXITCODE -ne 0) { throw 'Cannot read rclone remotes. No backup uploaded.' }
if ($remotes -notcontains $remote) {
    Write-Host "Configure a Google Drive OAuth remote named '$DriveRemote' for the same Google account as your private backup folder."
    & $rclone config
    if ($LASTEXITCODE -ne 0) { throw 'Google Drive configuration was not completed.' }
    $remotes = @(& $rclone listremotes)
    if ($LASTEXITCODE -ne 0 -or $remotes -notcontains $remote) {
        throw "Google Drive remote '$DriveRemote' still missing; no backup uploaded."
    }
}
# Fail early if OAuth is for the wrong Google account or the target folder is inaccessible.
& $rclone lsf $remote --drive-root-folder-id $DriveFolderId --max-depth 1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Google Drive target folder inaccessible. Choose the correct account when authorizing rclone.'
}

# Each run is immutable: timestamp + UUID prevents overwriting a prior recovery snapshot.
$tag = 'rupeerush-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ') + '-' +
    [guid]::NewGuid().ToString('N').Substring(0,8)
$stage = Join-Path $backupRoot $tag
$null = New-Item -ItemType Directory -Path $stage -Force
$sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls.exe $stage '/inheritance:r' '/grant:r' ('*' + $sid + ':(OI)(CI)F') '*S-1-5-18:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Could not secure backup working directory: $stage" }

$temporaryZip = Join-Path $stage ('TRANSIENT-' + [guid]::NewGuid().ToString('N') + '.zip')
$verificationZip = Join-Path $stage ('VERIFY-' + [guid]::NewGuid().ToString('N') + '.zip')
$encrypted = Join-Path $stage 'rupeerush-signing-recovery.zip.age'
$manifest = Join-Path $stage 'RECOVERY-METADATA.json'
try {
    # Encrypt keystore and its matching password as ONE unit, with ONE recovery passphrase.
    Compress-Archive -LiteralPath @($keystore,$passwordFile) -DestinationPath $temporaryZip -CompressionLevel Optimal -ErrorAction Stop
    Write-Host ''
    Write-Host 'Create a strong AGE passphrase. Store it OFFLINE, separately from Google Drive.'
    Write-Host 'You will be asked for this passphrase once more to test decryption.'
    & $age -p -o $encrypted $temporaryZip
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $encrypted -PathType Leaf)) {
        throw 'Encryption failed. No files uploaded.'
    }
    # Never keep an unencrypted archive after the encryption step.
    Remove-Item -LiteralPath $temporaryZip -Force
    & $age -d -o $verificationZip $encrypted
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $verificationZip -PathType Leaf)) {
        throw 'Recovery decryption test failed. No files uploaded.'
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($verificationZip)
    try {
        if ($zip.Entries.Count -ne 2) { throw 'Recovery archive contains an unexpected number of files.' }
        foreach ($original in @($keystore,$passwordFile)) {
            $name = Split-Path $original -Leaf
            $entry = $zip.GetEntry($name)
            if (-not $entry) { throw "Recovery archive is missing $name." }
            $stream = $entry.Open()
            try {
                $inside = (Get-FileHash -InputStream $stream -Algorithm SHA256).Hash
            } finally { $stream.Dispose() }
            $outside = (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash
            if ($inside -ne $outside) { throw "Decrypted archive content does not match original $name" }
        }
    } finally { $zip.Dispose() }
} finally {
    foreach ($tmp in @($temporaryZip,$verificationZip)) {
        Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
    }
}
$cipherHash = (Get-FileHash -LiteralPath $encrypted -Algorithm SHA256).Hash.ToLowerInvariant()
$receipt = [ordered]@{
    schema = 'rupeerush-signing-backup/v1'
    createdUtc = (Get-Date).ToUniversalTime().ToString('o')
    package = 'io.github.mrcalzon02.rupeerush'
    alias = $alias
    certificateSha256 = $certSha
    encryptedArchive = 'rupeerush-signing-recovery.zip.age'
    encryptedArchiveSha256 = $cipherHash
    includes = @('rupeerush-local-release.p12','store-password.txt')
    recovery = 'Use age -d to decrypt the .age archive, then extract the two original files privately.'
    important = 'AGE DECRYPTION PASSPHRASE IS NOT STORED HERE. KEEP IT OFFLINE.'
}
[IO.File]::WriteAllText($manifest,($receipt | ConvertTo-Json -Depth 5),([Text.UTF8Encoding]::new($false)))
Write-Host 'Local encrypted archive created, decrypted and verified against BOTH original files.'

$target = $remote + $tag
& $rclone copy $stage $target --drive-root-folder-id $DriveFolderId --checksum --log-level ERROR
if ($LASTEXITCODE -ne 0) { throw "Encrypted Google Drive upload failed. Local encrypted archive retained at $stage" }
# --download forces an actual byte comparison, not just a metadata or size check.
& $rclone check $stage $target --drive-root-folder-id $DriveFolderId --download --one-way --log-level ERROR
if ($LASTEXITCODE -ne 0) {
    throw "Google Drive ciphertext read-back FAILED. Keep local archive at $stage; do not consider it backed up."
}
Write-Host ''
Write-Host "SUCCESS: Encrypted Jewelbrook signing recovery uploaded and verified in Drive:"
Write-Host "https://drive.google.com/drive/folders/$DriveFolderId"
Write-Host "Backup subfolder: $tag"
Write-Host "Certificate SHA256: $certSha"
Write-Host "Encrypted file SHA256: $cipherHash"
Write-Host 'IMPORTANT: Preserve the AGE passphrase OFFLINE, separately from both your PC and Google Drive.'
