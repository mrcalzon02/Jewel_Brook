# NEW Google Play upload-key generation. Three distinct RSA-4096 keys, no legacy recovery.
# Run on the owner's Windows PC; Google Play controls device-facing signing keys.
[CmdletBinding()]
param([switch]$SkipDrive,[switch]$SkipGitHub,
      [ValidatePattern('^[A-Za-z0-9_-]+$')][string]$DriveRemote='gdrive')
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$apps=@(
    [pscustomobject]@{ Name='ReverieVR';Id='reverievr';Package='io.github.mrcalzon02.reverievr';Alias='reverievr-play-upload-v1';Repo='mrcalzon02/ReverieVR' },
    [pscustomobject]@{ Name='Nut Buster';Id='nutbuster';Package='io.github.mrcalzon02.nutbuster';Alias='nutbuster-play-upload-v1';Repo='mrcalzon02/NUTBUSTER-R' },
    [pscustomobject]@{ Name='Rupee Rush';Id='rupeerush';Package='io.github.mrcalzon02.rupeerush';Alias='rupeerush-play-upload-v1';Repo='mrcalzon02/Rupee-rush' }
)
if (-not $env:LOCALAPPDATA) { throw 'Windows LOCALAPPDATA unavailable. No signing keys generated.' }
$root=Join-Path $env:LOCALAPPDATA 'Embryon\play-upload-v1'
$keyRoot=Join-Path $root 'keys'
$recoveryRoot=Join-Path $root 'recovery'
$driveFolderId='1sAvMvu9prGSUBIg9q5laisgoCmBIY-zT'

function Find-Tool([string]$Name) {
    $cmd=Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $paths=@()
    if ($env:LOCALAPPDATA) { $paths+=Join-Path $env:LOCALAPPDATA ('Microsoft\WinGet\Links\'+$Name+'.exe') }
    if ($Name -eq 'keytool') {
        if ($env:JAVA_HOME) { $paths+=Join-Path $env:JAVA_HOME 'bin\keytool.exe' }
        if ($env:ProgramFiles) {
            $paths+=Join-Path $env:ProgramFiles 'Android\Android Studio\jbr\bin\keytool.exe'
            foreach ($vendor in @('Microsoft','Eclipse Adoptium','Java','Amazon Corretto','Zulu')) {
                $base=Join-Path $env:ProgramFiles $vendor
                if (Test-Path -LiteralPath $base -PathType Container) {
                    foreach ($child in @(Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue)) {
                        $paths+=Join-Path $child.FullName 'bin\keytool.exe'
                    }
                }
            }
        }
    }
    if ($Name -eq 'age') {
        $paths+=Join-Path $HOME 'scoop\apps\age\current\age.exe'
        if ($env:LOCALAPPDATA) {
            $packages=Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
            if (Test-Path -LiteralPath $packages -PathType Container) {
                foreach ($folder in @(Get-ChildItem -Path (Join-Path $packages 'FiloSottile.age_*') -Directory -ErrorAction SilentlyContinue)) {
                    $paths+=Join-Path $folder.FullName 'age.exe'
                    $paths+=@(Get-ChildItem -LiteralPath $folder.FullName -Filter age.exe -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
                }
            }
        }
    }
    if ($Name -eq 'gh' -and $env:ProgramFiles) { $paths+=Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe' }
    foreach ($p in $paths) { if ($p -and (Test-Path -LiteralPath $p -PathType Leaf)) { return (Resolve-Path -LiteralPath $p).Path } }
    return $null
}
function Save-Text([string]$Path,[string]$Value) {
    [IO.File]::WriteAllText($Path,$Value,([Text.UTF8Encoding]::new($false)))
}
function Strong-Password {
    $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes=New-Object byte[] 48
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}
function Protect-Folder([string]$Folder) {
    $null=New-Item -ItemType Directory -Force -Path $Folder
    $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    & icacls.exe $Folder '/inheritance:r' '/grant:r' ('*'+$sid+':(OI)(CI)F') '*S-1-5-18:(OI)(CI)F' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not restrict private folder access: $Folder" }
}
function Certificate-Sha([string]$Store,[string]$Alias,[string]$Password) {
    $cert=Join-Path $env:TEMP ('embryon-cert-'+[guid]::NewGuid().ToString('N')+'.der')
    $prior=[Environment]::GetEnvironmentVariable('EMBRYON_PLAY_KEYPASS','Process')
    try {
        [Environment]::SetEnvironmentVariable('EMBRYON_PLAY_KEYPASS',$Password,'Process')
        & $keytool -exportcert -storetype PKCS12 -keystore $Store -alias $Alias '-storepass:env' 'EMBRYON_PLAY_KEYPASS' -file $cert | Out-Null
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $cert -PathType Leaf)) { throw "Could not verify keystore $Store" }
        return (Get-FileHash -LiteralPath $cert -Algorithm SHA256).Hash.ToLowerInvariant()
    } finally {
        [Environment]::SetEnvironmentVariable('EMBRYON_PLAY_KEYPASS',$prior,'Process')
        Remove-Item -LiteralPath $cert -Force -ErrorAction SilentlyContinue
    }
}
function Generate-Or-Verify($App) {
    $dir=Join-Path $keyRoot $App.Id
    $store=Join-Path $dir 'upload.p12'
    $passFile=Join-Path $dir 'upload-password.txt'
    $cert=Join-Path $dir 'upload-certificate.pem'
    $info=Join-Path $dir 'upload-public.json'
    $all=@($store,$passFile,$cert,$info)
    $found=@($all | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf })
    if (Test-Path -LiteralPath $dir -PathType Container) {
        $files=@(Get-ChildItem -LiteralPath $dir -Force)
        if ($files.Count -gt 0 -and $found.Count -ne 4) {
            throw "Incomplete existing Play identity in $dir. Refusing to overwrite or regenerate."
        }
    }
    if ($found.Count -eq 0) {
        Protect-Folder $dir
        $password=Strong-Password
        $prior=[Environment]::GetEnvironmentVariable('EMBRYON_PLAY_KEYPASS','Process')
        try {
            [Environment]::SetEnvironmentVariable('EMBRYON_PLAY_KEYPASS',$password,'Process')
            $dn='CN='+$App.Name+' Play Upload V1, O=Embryon Games, C=US'
            & $keytool -genkeypair -keystore $store -storetype PKCS12 -alias $App.Alias -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -validity 10950 '-storepass:env' 'EMBRYON_PLAY_KEYPASS' '-keypass:env' 'EMBRYON_PLAY_KEYPASS' -dname $dn -noprompt
            if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $store -PathType Leaf)) { throw "Generation failed for $($App.Name); no old key touched." }
            & $keytool -exportcert -rfc -storetype PKCS12 -keystore $store -alias $App.Alias '-storepass:env' 'EMBRYON_PLAY_KEYPASS' -file $cert | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Certificate export failed for $($App.Name)." }
            Save-Text $passFile ($password+[Environment]::NewLine)
            $sha=Certificate-Sha $store $App.Alias $password
            $public=[ordered]@{schema=1;generation='play-v1';title=$App.Name;appId=$App.Package;alias=$App.Alias;uploadCertificateSha256=$sha;keystoreSha256=(Get-FileHash -LiteralPath $store -Algorithm SHA256).Hash.ToLowerInvariant()}
            Save-Text $info ($public | ConvertTo-Json -Depth 5)
            Write-Host "GENERATED NEW RSA-4096 PLAY UPLOAD KEY: $($App.Name)"
        } finally {
            [Environment]::SetEnvironmentVariable('EMBRYON_PLAY_KEYPASS',$prior,'Process')
            $password=$null
        }
    }
    foreach ($p in $all) { if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "Incomplete Play signer: $p" } }
    $metadata=Get-Content -LiteralPath $info -Raw | ConvertFrom-Json
    $password=[IO.File]::ReadAllText($passFile).TrimEnd([char[]]@(13,10))
    if ($metadata.appId -ne $App.Package -or $metadata.alias -ne $App.Alias -or -not $password) { throw "Existing key metadata mismatch for $($App.Name)" }
    $sha=Certificate-Sha $store $App.Alias $password
    if ($sha -ne $metadata.uploadCertificateSha256) { throw "Existing certificate SHA mismatch for $($App.Name)" }
    if ((Get-FileHash -LiteralPath $store -Algorithm SHA256).Hash.ToLowerInvariant() -ne $metadata.keystoreSha256) { throw "Existing keystore SHA mismatch for $($App.Name)" }
    Write-Host "VERIFIED $($App.Name) upload certificate SHA-256: $sha"
    return [pscustomobject]@{App=$App;Store=$store;Password=$password;Fingerprint=$sha}
}
function Set-GitHubSecret([string]$Repo,[string]$Name,[string]$Value) {
    $start=New-Object Diagnostics.ProcessStartInfo
    $start.FileName=$gh
    $start.Arguments="secret set $Name --repo $Repo"
    $start.UseShellExecute=$false
    $start.CreateNoWindow=$true
    $start.RedirectStandardInput=$true
    $start.RedirectStandardOutput=$true
    $start.RedirectStandardError=$true
    $p=[Diagnostics.Process]::Start($start)
    try {
        $p.StandardInput.Write($Value)
        $p.StandardInput.Close()
        $null=$p.StandardOutput.ReadToEnd()
        $null=$p.StandardError.ReadToEnd()
        $p.WaitForExit()
        if ($p.ExitCode -ne 0) { throw "Could not register $Name in $Repo." }
    } finally { $p.Dispose() }
}
$keytool=Find-Tool 'keytool'
$age=Find-Tool 'age'
$gh=Find-Tool 'gh'
$rclone=Find-Tool 'rclone'
if (-not $keytool) { throw 'JDK keytool missing. Install JDK 17+ or Android Studio. No keys generated.' }
if (-not $age) { throw 'age encryption missing. No unprotected keys generated.' }
if (-not $env:TEMP) { throw 'Windows TEMP is missing.' }
Protect-Folder $root
$null=New-Item -ItemType Directory -Force -Path $keyRoot
$null=New-Item -ItemType Directory -Force -Path $recoveryRoot
Write-Host "New Play signer directory: $keyRoot"
$results=@()
foreach ($app in $apps) { $results+=Generate-Or-Verify $app }
if ((@($results | ForEach-Object { $_.Fingerprint } | Select-Object -Unique)).Count -ne 3) { throw 'Signing keys are not three distinct certificates.' }
Write-Host 'ALL THREE NEW PLAY UPLOAD KEYS VERIFIED.'

$archive=Join-Path $recoveryRoot 'embryon-play-upload-v1.zip.age'
$receipt=Join-Path $recoveryRoot 'embryon-play-upload-v1-receipt.json'
if ((Test-Path -LiteralPath $archive -PathType Leaf) -ne (Test-Path -LiteralPath $receipt -PathType Leaf)) {
    throw 'Partial encrypted backup exists; do not overwrite it.'
}
$fingerprints=@($results | ForEach-Object { $_.Fingerprint })
if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) {
    $zip=Join-Path $recoveryRoot ('.transient-'+[guid]::NewGuid().ToString('N')+'.zip')
    try {
        Compress-Archive -Path (Join-Path $keyRoot '*') -DestinationPath $zip -CompressionLevel Optimal -ErrorAction Stop
        Write-Host 'Set an age RECOVERY PASSPHRASE and store it OFFLINE, separately from Google Drive.'
        & $age -p -o $archive $zip
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $archive -PathType Leaf)) { throw 'Encrypted recovery backup failed; keys remain local.' }
        $summary=[ordered]@{schema=1;generation='play-v1';fingerprints=$fingerprints;archiveSha256=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()}
        Save-Text $receipt ($summary | ConvertTo-Json -Depth 5)
    } finally { Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue }
}
$verifiedReceipt=Get-Content -LiteralPath $receipt -Raw | ConvertFrom-Json
if ($verifiedReceipt.generation -ne 'play-v1' -or @($verifiedReceipt.fingerprints).Count -ne 3) { throw 'Recovery receipt is invalid.' }
for ($i=0; $i -lt 3; $i++) { if ($verifiedReceipt.fingerprints[$i] -ne $fingerprints[$i]) { throw 'Recovery archive belongs to a different key generation.' } }
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $verifiedReceipt.archiveSha256) { throw 'Encrypted backup checksum mismatch.' }
Write-Host "LOCAL ENCRYPTED BACKUP VERIFIED: $archive"
if ($SkipDrive) {
    Write-Warning 'Encrypted Drive backup skipped by switch.'
} elseif (-not $rclone) {
    Write-Warning 'rclone unavailable: Drive backup PENDING, local encrypted copy retained.'
} else {
    $remotes=@(& $rclone listremotes)
    if ($LASTEXITCODE -ne 0 -or -not ($remotes -contains ($DriveRemote+':'))) {
        Write-Warning "Google Drive remote '$DriveRemote' not configured: Drive backup PENDING."
    } else {
        $target=$DriveRemote+':play-upload-v1'
        & $rclone copy $recoveryRoot $target --drive-root-folder-id $driveFolderId --checksum --log-level ERROR
        if ($LASTEXITCODE -ne 0) { throw 'Encrypted Drive upload failed. Local backup retained.' }
        & $rclone check $recoveryRoot $target --drive-root-folder-id $driveFolderId --one-way --checksum --log-level ERROR
        if ($LASTEXITCODE -ne 0) { throw 'Encrypted Drive upload checksum failed.' }
        Write-Host 'VERIFIED Google Drive encrypted backup of ALL THREE new keys.'
    }
}
if ($SkipGitHub) {
    Write-Warning 'GitHub Play upload signing secret registration skipped.'
} elseif (-not $gh) {
    Write-Warning 'GitHub CLI not installed; new keys generated locally, GitHub secrets PENDING.'
} else {
    & $gh auth status | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning 'GitHub CLI not authenticated. Run gh auth login and rerun; existing keys will be reused.'
    } else {
        foreach ($result in $results) {
            $app=$result.App
            $existing=@(& $gh secret list --repo $app.Repo --json name --jq '.[].name')
            if ($LASTEXITCODE -ne 0) { throw "Unable to check Play signing secrets in $($app.Repo)" }
            $clashing=@($existing | Where-Object { $_ -match '^PLAY_UPLOAD_(KEYSTORE_BASE64|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)$' })
            if ($clashing.Count -gt 0) {
                Write-Warning "Some PLAY_UPLOAD secrets already exist in $($app.Repo); refusing silent replacement of a new-era identity."
                continue
            }
            Set-GitHubSecret $app.Repo 'PLAY_UPLOAD_KEYSTORE_BASE64' ([Convert]::ToBase64String([IO.File]::ReadAllBytes($result.Store)))
            Set-GitHubSecret $app.Repo 'PLAY_UPLOAD_STORE_PASSWORD' $result.Password
            Set-GitHubSecret $app.Repo 'PLAY_UPLOAD_KEY_ALIAS' $app.Alias
            Set-GitHubSecret $app.Repo 'PLAY_UPLOAD_KEY_PASSWORD' $result.Password
            $names=@(& $gh secret list --repo $app.Repo --json name --jq '.[].name')
            if ($LASTEXITCODE -ne 0) { throw "Cannot verify GitHub secret names in $($app.Repo)" }
            foreach ($n in @('PLAY_UPLOAD_KEYSTORE_BASE64','PLAY_UPLOAD_STORE_PASSWORD','PLAY_UPLOAD_KEY_ALIAS','PLAY_UPLOAD_KEY_PASSWORD')) {
                if ($names -notcontains $n) { throw "Missing newly registered GitHub secret name $n in $($app.Repo)" }
            }
            Write-Host "VERIFIED new Play secret names: $($app.Repo)"
        }
    }
}
Write-Host 'NEW Play upload key generation completed. OLD publisher keys were not used.'
Write-Host 'Google Play will manage the separate DEVICE app-signing certificates.'
Write-Host 'No APK/AAB was uploaded to Play and no Play Console account state was changed by this script.'
