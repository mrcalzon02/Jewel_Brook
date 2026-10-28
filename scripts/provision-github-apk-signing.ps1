# One-time Jewelbrook GitHub signer enrollment; NO local Gradle or Android SDK build.
[CmdletBinding()]
param([switch]$ReplaceExistingSecrets)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$repo='mrcalzon02/Rupee-rush'
$alias='rupeerush-local-apk-v1'
if (-not $env:LOCALAPPDATA) { throw 'Windows LOCALAPPDATA unavailable.' }
$homeDir=Join-Path $env:LOCALAPPDATA 'Embryon\rupeerush-local-apk-v1'
$store=Join-Path $homeDir 'rupeerush-local-release.p12'
$passwordFile=Join-Path $homeDir 'store-password.txt'
$pin=Join-Path $homeDir 'certificate-sha256.txt'
$names=@('RUPEE_APK_KEYSTORE_BASE64','RUPEE_APK_STORE_PASSWORD','RUPEE_APK_KEY_ALIAS','RUPEE_APK_KEY_PASSWORD','RUPEE_APK_CERT_SHA256')
function Find-Exe([string]$name) {
    $cmd=Get-Command $name -CommandType Application -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $possible=@()
    if ($name -eq 'gh' -and $env:ProgramFiles) { $possible+=Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe' }
    if ($name -eq 'keytool') {
        if ($env:JAVA_HOME) { $possible+=Join-Path $env:JAVA_HOME 'bin\keytool.exe' }
        if ($env:ProgramFiles) {
            $possible+=Join-Path $env:ProgramFiles 'Android\Android Studio\jbr\bin\keytool.exe'
            foreach ($vendor in @('Microsoft','Eclipse Adoptium','Java','Zulu','Amazon Corretto')) {
                $folder=Join-Path $env:ProgramFiles $vendor
                if (Test-Path -LiteralPath $folder -PathType Container) {
                    foreach ($child in @(Get-ChildItem -LiteralPath $folder -Directory -ErrorAction SilentlyContinue)) {
                        $possible+=Join-Path $child.FullName 'bin\keytool.exe'
                    }
                }
            }
        }
    }
    foreach ($path in $possible) { if (Test-Path -LiteralPath $path -PathType Leaf) { return (Resolve-Path -LiteralPath $path).Path } }
    return $null
}
function Write-Private([string]$file,[string]$value) {
    [IO.File]::WriteAllText($file,$value,([Text.UTF8Encoding]::new($false)))
}
function New-Password {
    $bytes=New-Object byte[] 48
    $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}
function Cert-Sha([string]$secret) {
    $der=Join-Path $env:TEMP ('rupee-signing-'+[guid]::NewGuid().ToString('N')+'.der')
    $prior=[Environment]::GetEnvironmentVariable('RR_SIGNING_PASSWORD','Process')
    try {
        [Environment]::SetEnvironmentVariable('RR_SIGNING_PASSWORD',$secret,'Process')
        & $keytool -exportcert -storetype PKCS12 -keystore $store -alias $alias '-storepass:env' 'RR_SIGNING_PASSWORD' -file $der | Out-Null
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $der -PathType Leaf)) {
            throw 'Original Jewelbrook signing keystore/alias cannot be verified; refusing key replacement.'
        }
        return (Get-FileHash -LiteralPath $der -Algorithm SHA256).Hash.ToLowerInvariant()
    } finally {
        [Environment]::SetEnvironmentVariable('RR_SIGNING_PASSWORD',$prior,'Process')
        Remove-Item -LiteralPath $der -Force -ErrorAction SilentlyContinue
    }
}
function Set-Secret([string]$name,[string]$value) {
    $info=New-Object Diagnostics.ProcessStartInfo
    $info.FileName=$gh
    $info.Arguments="secret set $name --repo $repo"
    $info.UseShellExecute=$false
    $info.CreateNoWindow=$true
    $info.RedirectStandardInput=$true
    $info.RedirectStandardOutput=$true
    $info.RedirectStandardError=$true
    $process=[Diagnostics.Process]::Start($info)
    try {
        $process.StandardInput.Write($value)
        $process.StandardInput.Close()
        $null=$process.StandardOutput.ReadToEnd()
        $null=$process.StandardError.ReadToEnd()
        $process.WaitForExit()
        if ($process.ExitCode -ne 0) { throw "GitHub refused $name; earlier secrets may be partially uploaded. Do not generate another key." }
    } finally { $process.Dispose() }
}
$gh=Find-Exe 'gh'
$keytool=Find-Exe 'keytool'
if (-not $gh) { throw 'GitHub CLI (gh) missing. No Android Gradle/SDK is required.' }
if (-not $keytool) { throw 'JDK keytool missing. No Android Gradle/SDK is required.' }
& $gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
    & $gh auth login
    if ($LASTEXITCODE -ne 0) { throw 'GitHub login failed.' }
}
$existing=@(& $gh secret list --repo $repo --json name --jq '.[].name')
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect existing signing secret names.' }
$overlap=@($existing | Where-Object { $names -contains $_ })
if ($overlap.Count -eq $names.Count -and -not $ReplaceExistingSecrets) {
    Write-Host 'All five Jewelbrook signing secret names already present. Not replacing.'
    & $gh workflow run rupee-rush-android.yml --repo $repo --ref main
    if ($LASTEXITCODE -ne 0) { throw 'Failed to request cloud APK build.' }
    Write-Host 'RUNNING GITHUB BUILD: https://github.com/mrcalzon02/Rupee-rush/actions'
    return
}
if ($overlap.Count -gt 0 -and -not $ReplaceExistingSecrets) {
    throw 'Existing or partial GitHub signing secrets detected. Investigate the existing certificate before explicitly using -ReplaceExistingSecrets.'
}
if (-not (Test-Path -LiteralPath $homeDir -PathType Container)) {
    $null=New-Item -ItemType Directory -Force -Path $homeDir
    $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    & icacls.exe $homeDir '/inheritance:r' '/grant:r' ('*'+$sid+':(OI)(CI)F') '*S-1-5-18:(OI)(CI)F' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Unable to protect Jewelbrook signing-key directory.' }
}
$haveStore=Test-Path -LiteralPath $store -PathType Leaf
$havePassword=Test-Path -LiteralPath $passwordFile -PathType Leaf
if ($haveStore -ne $havePassword) {
    throw 'Incomplete Jewelbrook key/password pair; restore it rather than generating a replacement.'
}
if (-not $haveStore) {
    $secret=New-Password
    $old=[Environment]::GetEnvironmentVariable('RR_SIGNING_PASSWORD','Process')
    try {
        [Environment]::SetEnvironmentVariable('RR_SIGNING_PASSWORD',$secret,'Process')
        & $keytool -genkeypair -keystore $store -storetype PKCS12 -alias $alias -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -validity 10950 '-storepass:env' 'RR_SIGNING_PASSWORD' '-keypass:env' 'RR_SIGNING_PASSWORD' -dname 'CN=Rupee Rush Local APK Updates, O=Embryon Games, C=US' -noprompt
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $store -PathType Leaf)) {
            throw 'Local key generation failed; inspect partial keystore; do not delete it and regenerate.'
        }
        Write-Private $passwordFile ($secret+[Environment]::NewLine)
        Write-Host 'Created a permanent signing key. APK compilation runs on GitHub.'
    } finally {
        [Environment]::SetEnvironmentVariable('RR_SIGNING_PASSWORD',$old,'Process')
        $secret=$null
    }
} else { Write-Host 'Reusing existing Jewelbrook permanent signing key.' }
$secret=[IO.File]::ReadAllText($passwordFile).TrimEnd([char[]]@(13,10))
if (-not $secret) { throw 'Existing private signing password is empty.' }
$sha=Cert-Sha $secret
if (Test-Path -LiteralPath $pin -PathType Leaf) {
    if ([IO.File]::ReadAllText($pin).Trim().ToLowerInvariant() -ne $sha) {
        throw 'Jewelbrook signing certificate differs from the stored private pin.'
    }
} else { Write-Private $pin ($sha+[Environment]::NewLine) }
Write-Host "Signing certificate SHA256: $sha"
Set-Secret 'RUPEE_APK_KEYSTORE_BASE64' ([Convert]::ToBase64String([IO.File]::ReadAllBytes($store)))
Set-Secret 'RUPEE_APK_STORE_PASSWORD' $secret
Set-Secret 'RUPEE_APK_KEY_ALIAS' $alias
Set-Secret 'RUPEE_APK_KEY_PASSWORD' $secret
Set-Secret 'RUPEE_APK_CERT_SHA256' $sha
$secret=$null
$verified=@(& $gh secret list --repo $repo --json name --jq '.[].name')
if ($LASTEXITCODE -ne 0) { throw 'Cannot verify GitHub secret names.' }
foreach ($name in $names) { if ($verified -notcontains $name) { throw "GitHub secret name not confirmed: $name" } }
Write-Host 'Five signing secret names verified. GitHub secret VALUES are write-only.'
Write-Host 'IMPORTANT: securely back up the original .p12 and password file OFFLINE.'
& $gh workflow run rupee-rush-android.yml --repo $repo --ref main
if ($LASTEXITCODE -ne 0) { throw 'Signing secrets uploaded but workflow dispatch failed. Trigger the workflow in GitHub Actions.' }
Write-Host 'RUNNING GITHUB BUILD: https://github.com/mrcalzon02/Rupee-rush/actions'
Write-Host 'SIGNED RELEASES: https://github.com/mrcalzon02/Rupee-rush/releases'
