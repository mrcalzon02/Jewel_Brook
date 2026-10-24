# Encrypt and back up both ORIGINAL Android signing identities to a private Google Drive folder.
# Nut Buster and Rupee Rush reuse one publisher key; ReverieVR has its own key.
[CmdletBinding()]
param(
    [string]$ReverieRoot,
    [ValidatePattern('^[A-Za-z0-9_-]+$')][string]$DriveRemote='gdrive',
    [string]$DriveFolderId='1sAvMvu9prGSUBIg9q5laisgoCmBIY-zT',
    [switch]$EncryptOnly
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nutDir = Join-Path $HOME '.local/share/nutbuster-signing'
$nutKey = Join-Path $nutDir 'nutbuster-publisher.p12'
$nutPass = Join-Path $nutDir 'store-password'
if (-not $ReverieRoot) {
    if ($env:REVERIEVR_ROOT) { $ReverieRoot=$env:REVERIEVR_ROOT }
    else { $ReverieRoot = Join-Path $root '../ReverieVR' }
}
if (-not (Test-Path -LiteralPath $ReverieRoot -PathType Container)) {
    throw 'ReverieVR checkout not found; supply -ReverieRoot.'
}
$revDir = Join-Path (Resolve-Path -LiteralPath $ReverieRoot).Path '.local/reverievr-signing'
$revSecrets = Join-Path $revDir 'github-secrets.txt'
$revCandidates = @(
    @((Join-Path $revDir 'reverievr-phone-test.keystore'),(Join-Path $revDir 'reverievr-phone-test.jks')) |
        Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }
)
if ($revCandidates.Count -ne 1) { throw 'Expected one original ReverieVR keystore, not zero/multiple.' }
$revKey = $revCandidates[0]
foreach ($path in @($nutKey,$nutPass,$revKey,$revSecrets)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Original signing source missing: $path. No upload." }
}
if (-not (Get-Command age -ErrorAction SilentlyContinue)) { throw 'Install age encryption (https://github.com/FiloSottile/age).' }
if (-not $EncryptOnly -and -not (Get-Command rclone -ErrorAction SilentlyContinue)) { throw 'Install rclone and configure your Google Drive remote.' }
$keytool=Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) { throw 'JDK keytool is required to verify signing certificates.' }
# Reverify the pinned original Nut Buster/Rupee Rush signer without mutating anything.
& (Join-Path $PSScriptRoot 'provision-rupee-signing.ps1') | Out-Null
if (-not $?) { throw 'Nut Buster identity verification failed.' }
$values=@{}
foreach ($line in [IO.File]::ReadAllLines($revSecrets)) {
    if ($line -match '^([A-Z][A-Z0-9_]+)=(.*)$') { $values[$Matches[1]]=$Matches[2] }
}
foreach ($name in @('PHONE_TEST_KEYSTORE_BASE64','PHONE_TEST_STORE_PASSWORD','PHONE_TEST_KEY_ALIAS','PHONE_TEST_KEY_PASSWORD')) {
    if (-not $values.ContainsKey($name) -or -not $values[$name]) { throw "ReverieVR credentials missing $name" }
}
$decoded=[Convert]::FromBase64String($values['PHONE_TEST_KEYSTORE_BASE64'])
$decodedHash=([BitConverter]::ToString(([Security.Cryptography.SHA256]::Create()).ComputeHash($decoded))).Replace('-','').ToLowerInvariant()
if ($decodedHash -ne (Get-FileHash -LiteralPath $revKey -Algorithm SHA256).Hash.ToLowerInvariant()) {
    throw 'ReverieVR keystore is not the one in its original GitHub secrets staging file.'
}
$cert = Join-Path ([IO.Path]::GetTempPath()) ('reverie-public-' + [guid]::NewGuid().ToString('N') + '.der')
$old=[Environment]::GetEnvironmentVariable('RR_REV_PASS','Process')
try {
    [Environment]::SetEnvironmentVariable('RR_REV_PASS',$values['PHONE_TEST_STORE_PASSWORD'],'Process')
    & $keytool.Source -exportcert -keystore $revKey -alias $values['PHONE_TEST_KEY_ALIAS'] '-storepass:env' 'RR_REV_PASS' -file $cert 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $cert)) { throw 'Cannot verify original ReverieVR certificate.' }
    $revFingerprint=(Get-FileHash -LiteralPath $cert -Algorithm SHA256).Hash.ToLowerInvariant()
} finally {
    [Environment]::SetEnvironmentVariable('RR_REV_PASS',$old,'Process')
    Remove-Item -LiteralPath $cert -Force -ErrorAction SilentlyContinue
}
$revRecorded=Join-Path $revDir 'certificate-sha256.txt'
if (Test-Path -LiteralPath $revRecorded -PathType Leaf) {
    if ($revFingerprint -ne [IO.File]::ReadAllText($revRecorded).Trim().ToLowerInvariant()) {
        throw 'ReverieVR signer differs from original recorded certificate.'
    }
}
$nutFingerprint=[IO.File]::ReadAllText((Join-Path $root 'config/nutbuster-publisher.sha256')).Trim()
Write-Host "Verified Nut Buster/Rupee Rush: $nutFingerprint"
Write-Host "Verified ReverieVR: $revFingerprint"
$tag=(Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8)
$stage=Join-Path $root ('.local/signing-backups/' + $tag)
$null=New-Item -ItemType Directory -Force -Path $stage
$items=@(
    @{ Source=$nutKey; Name='nutbuster-publisher.p12.age' },
    @{ Source=$nutPass; Name='nutbuster-store-password.txt.age' },
    @{ Source=$revKey; Name='reverievr-phone-test.keystore.age' },
    @{ Source=$revSecrets; Name='reverievr-github-secrets.txt.age' }
)
foreach ($item in $items) {
    $dest=Join-Path $stage $item.Name
    Write-Host "Encrypting $($item.Name). Record its prompted age recovery passphrase OFFLINE."
    & age -p -o $dest $item.Source
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $dest -PathType Leaf) -or (Get-Item -LiteralPath $dest).Length -lt 200) {
        Remove-Item -LiteralPath $dest -Force -ErrorAction SilentlyContinue
        throw "Encryption failure: $($item.Name). No upload."
    }
}
$notes=@"
Encrypted Android signer recovery. Each AGE file has a prompted passphrase you must store OFFLINE.
Nut Buster and Rupee Rush share nutbuster-publisher.p12.age and nutbuster-store-password.txt.age.
Canonical Nut Buster Windows location: %USERPROFILE%\.local\share\nutbuster-signing\
Original ReverieVR Windows checkout location: .local\reverievr-signing\
Nut Buster publisher cert SHA-256: $nutFingerprint
ReverieVR publisher cert SHA-256: $revFingerprint
Recover privately: age -d -o RECOVERED-FILENAME FILENAME.age
Do not overwrite existing signers or store recovery passphrases here.
"@
[IO.File]::WriteAllText((Join-Path $stage 'RESTORE-README.txt'),$notes,(New-Object Text.UTF8Encoding($false)))
$checks=@(Get-ChildItem -LiteralPath $stage -File | Sort-Object Name | ForEach-Object {
    '{0}  {1}' -f (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant(),$_.Name
})
[IO.File]::WriteAllLines((Join-Path $stage 'SHA256SUMS.txt'),$checks,(New-Object Text.UTF8Encoding($false)))
Write-Host "Only encrypted backup files and public notes staged: $stage"
if ($EncryptOnly) { Write-Host 'EncryptOnly requested: no Drive upload.'; return }
if ($DriveFolderId -notmatch '^[A-Za-z0-9_-]{15,}$') { throw 'Invalid Drive folder ID.' }
$remotes=@(& rclone listremotes)
if ($LASTEXITCODE -ne 0 -or -not ($remotes -contains ($DriveRemote + ':'))) { throw "rclone remote $DriveRemote absent. Encrypted files retained locally." }
$target=('{0}:{1}' -f $DriveRemote,$tag)
& rclone copy $stage $target --drive-root-folder-id $DriveFolderId --checksum --log-level ERROR
if ($LASTEXITCODE -ne 0) { throw "Google Drive copy failed; ciphertext remains locally: $stage" }
& rclone check $stage $target --drive-root-folder-id $DriveFolderId --one-way --checksum --log-level ERROR
if ($LASTEXITCODE -ne 0) { throw "Remote checksum verification failed. Do NOT count this as a verified backup. Local ciphertext: $stage" }
Write-Host "VERIFIED encrypted upload to Drive folder $DriveFolderId / $tag"
Write-Host 'Save all age recovery passphrases separately OFFLINE and perform a private recovery test.'
