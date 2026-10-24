# Reuses Nut Buster's permanent signer. Never create/rotate a key.
[CmdletBinding()]
param([string]$RestoreKeystorePath,[string]$RestorePasswordFile,[switch]$SetGitHubSecrets,[switch]$AllowExistingSecrets)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = 'mrcalzon02/Rupee-rush'
$keyAlias = 'nutbuster'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$expected = [IO.File]::ReadAllText((Join-Path $root 'config/nutbuster-publisher.sha256')).Trim().ToLowerInvariant()
if ($expected -notmatch '^[0-9a-f]{64}$') { throw 'Invalid pinned certificate.' }
$directory = Join-Path $HOME '.local/share/nutbuster-signing'
$keystore = Join-Path $directory 'nutbuster-publisher.p12'
$passwordFile = Join-Path $directory 'store-password'
$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) { throw 'Install JDK 17+ keytool. No files changed.' }
if ([bool]$RestoreKeystorePath -ne [bool]$RestorePasswordFile) {
    throw 'Restore requires BOTH -RestoreKeystorePath and -RestorePasswordFile.'
}
function Read-Password([string]$path) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing password file: $path" }
    $value = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $path).Path).TrimEnd([char[]]@(13,10))
    if (-not $value) { throw 'Empty signing password.' }
    return $value
}
function Assert-OriginalSigner([string]$path,[string]$password) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing original keystore: $path" }
    $cert = Join-Path ([IO.Path]::GetTempPath()) ('nutbuster-public-' + [guid]::NewGuid().ToString('N') + '.der')
    $old = [Environment]::GetEnvironmentVariable('RR_KEYPASS','Process')
    try {
        [Environment]::SetEnvironmentVariable('RR_KEYPASS',$password,'Process')
        & $keytool.Source -exportcert -alias $keyAlias -keystore $path '-storepass:env' 'RR_KEYPASS' -file $cert 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $cert)) { throw 'Cannot verify original key alias/password.' }
        $actual = (Get-FileHash -LiteralPath $cert -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $expected) { throw "WRONG SIGNER $actual; expected $expected. Refusing." }
        return $actual
    } finally {
        [Environment]::SetEnvironmentVariable('RR_KEYPASS',$old,'Process')
        Remove-Item -LiteralPath $cert -Force -ErrorAction SilentlyContinue
    }
}
if ($RestoreKeystorePath) {
    $source = (Resolve-Path -LiteralPath $RestoreKeystorePath).Path
    $recoveredPassword = Read-Password $RestorePasswordFile
    $null = Assert-OriginalSigner $source $recoveredPassword
    if ((Test-Path -LiteralPath $keystore) -or (Test-Path -LiteralPath $passwordFile)) {
        throw 'Refusing to overwrite existing Nut Buster signing material.'
    }
    $null = New-Item -ItemType Directory -Path $directory -Force
    Copy-Item -LiteralPath $source -Destination $keystore -ErrorAction Stop
    try { [IO.File]::WriteAllText($passwordFile,$recoveredPassword,([Text.UTF8Encoding]::new($false))) }
    catch { Remove-Item -LiteralPath $keystore -Force -ErrorAction SilentlyContinue; throw }
    Write-Host "Restored verified original key to $directory"
}
$password = Read-Password $passwordFile
$actual = Assert-OriginalSigner $keystore $password
Write-Host "Verified Nut Buster/Rupee Rush certificate SHA256: $actual"
Write-Host "Existing local signer location: $directory"
if ($SetGitHubSecrets) {
    $gh = Get-Command gh -ErrorAction SilentlyContinue
    if (-not $gh) { throw 'GitHub CLI gh missing. Authenticate with gh auth login.' }
    & $gh.Source auth status *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Not logged in to gh. Run gh auth login.' }
    # GitHub secrets are write-only: do not silently rotate an existing, unverifiable signer.
    $already = @(& $gh.Source secret list --repo $repo --json name --jq '.[].name')
    if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect existing Rupee Rush secret names.' }
    $clashing = @($already | Where-Object { $_ -match '^PHONE_TEST_(KEYSTORE_BASE64|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)
        # Secret values only through stdin; never through command arguments or Git.
        $info = New-Object Diagnostics.ProcessStartInfo
        $info.FileName = $gh.Source
        $info.Arguments = "secret set $name --repo $repo"
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardInput = $true
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        $p = [Diagnostics.Process]::Start($info)
        try {
            $p.StandardInput.Write($value)
            $p.StandardInput.Close()
            $null = $p.StandardOutput.ReadToEnd()
            $null = $p.StandardError.ReadToEnd()
            $p.WaitForExit()
            if ($p.ExitCode -ne 0) { throw "GitHub refused $name; some earlier secrets might already be set." }
        } finally { $p.Dispose() }
    }
    Set-Secret 'PHONE_TEST_KEYSTORE_BASE64' ([Convert]::ToBase64String([IO.File]::ReadAllBytes($keystore)))
    Set-Secret 'PHONE_TEST_STORE_PASSWORD' $password
    Set-Secret 'PHONE_TEST_KEY_ALIAS' $keyAlias
    Set-Secret 'PHONE_TEST_KEY_PASSWORD' $password
    $names = @(& $gh.Source secret list --repo $repo --json name --jq '.[].name')
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read back signing secret names.' }
    foreach ($required in @('PHONE_TEST_KEYSTORE_BASE64','PHONE_TEST_STORE_PASSWORD','PHONE_TEST_KEY_ALIAS','PHONE_TEST_KEY_PASSWORD')) {
        if ($names -notcontains $required) { throw "Unverified secret name: $required" }
    }
    Write-Host 'Four GitHub signing secret names verified. No build or release triggered.'
} else { Write-Host 'Verification only; use -SetGitHubSecrets to provision Rupee Rush.' }
 })
    if ($clashing.Count -gt 0 -and -not $AllowExistingSecrets) {
        throw 'One or more signing secrets already exist. Refusing silent replacement; rerun with -AllowExistingSecrets only after verifying prior publisher lineage.'
    }
    function Set-Secret([string]$name,[string]$value) {
        # Secret values only through stdin; never through command arguments or Git.
        $info = New-Object Diagnostics.ProcessStartInfo
        $info.FileName = $gh.Source
        $info.Arguments = "secret set $name --repo $repo"
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardInput = $true
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        $p = [Diagnostics.Process]::Start($info)
        try {
            $p.StandardInput.Write($value)
            $p.StandardInput.Close()
            $null = $p.StandardOutput.ReadToEnd()
            $null = $p.StandardError.ReadToEnd()
            $p.WaitForExit()
            if ($p.ExitCode -ne 0) { throw "GitHub refused $name; some earlier secrets might already be set." }
        } finally { $p.Dispose() }
    }
    Set-Secret 'PHONE_TEST_KEYSTORE_BASE64' ([Convert]::ToBase64String([IO.File]::ReadAllBytes($keystore)))
    Set-Secret 'PHONE_TEST_STORE_PASSWORD' $password
    Set-Secret 'PHONE_TEST_KEY_ALIAS' $keyAlias
    Set-Secret 'PHONE_TEST_KEY_PASSWORD' $password
    $names = @(& $gh.Source secret list --repo $repo --json name --jq '.[].name')
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read back signing secret names.' }
    foreach ($required in @('PHONE_TEST_KEYSTORE_BASE64','PHONE_TEST_STORE_PASSWORD','PHONE_TEST_KEY_ALIAS','PHONE_TEST_KEY_PASSWORD')) {
        if ($names -notcontains $required) { throw "Unverified secret name: $required" }
    }
    Write-Host 'Four GitHub signing secret names verified. No build or release triggered.'
} else { Write-Host 'Verification only; use -SetGitHubSecrets to provision Rupee Rush.' }
