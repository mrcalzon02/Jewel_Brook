# Jewelbrook local APK assembler: persistent LOCAL key and monotonic signed updates.
# Run on Windows PowerShell from the Jewelbrook checkout. No other projects or Play keys touched.
[CmdletBinding()]
param([switch]$Install)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$android=Join-Path $root 'android'
$web=Join-Path $root 'web'
if (-not $env:LOCALAPPDATA) { throw 'Windows LOCALAPPDATA missing.' }
$private=Join-Path $env:LOCALAPPDATA 'Embryon\rupeerush-local-apk-v1'
$store=Join-Path $private 'rupeerush-local-release.p12'
$passFile=Join-Path $private 'store-password.txt'
$sequence=Join-Path $private 'last-successful-version.txt'
$alias='rupeerush-local-apk-v1'
$sdk=if ($env:ANDROID_SDK_ROOT) {$env:ANDROID_SDK_ROOT} elseif ($env:ANDROID_HOME) {$env:ANDROID_HOME} else {Join-Path $env:LOCALAPPDATA 'Android\Sdk'}
$gradleVersion='9.6.1'
$gradleHash='9c0f7faeeb306cb14e4279a3e084ca6b596894089a0638e68a07c945a32c9e14'
$toolsHome=Join-Path $env:LOCALAPPDATA 'Embryon\toolchains'

function Require([string]$file,[string]$purpose) {
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "$purpose missing at $file" }
}
function Get-Keytool {
    $command=Get-Command keytool -CommandType Application -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $candidates=@()
    if ($env:JAVA_HOME) { $candidates+=Join-Path $env:JAVA_HOME 'bin\keytool.exe' }
    if ($env:ProgramFiles) {
        $candidates+=Join-Path $env:ProgramFiles 'Android\Android Studio\jbr\bin\keytool.exe'
        foreach ($vendor in @('Microsoft','Eclipse Adoptium','Java','Zulu','Amazon Corretto')) {
            $base=Join-Path $env:ProgramFiles $vendor
            if (Test-Path -LiteralPath $base -PathType Container) {
                foreach ($child in @(Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue)) {
                    $candidates+=Join-Path $child.FullName 'bin\keytool.exe'
                }
            }
        }
    }
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return (Resolve-Path -LiteralPath $candidate).Path }
    }
    return $null
}
function Store-Text([string]$file,[string]$value) {
    [IO.File]::WriteAllText($file,$value,([Text.UTF8Encoding]::new($false)))
}
function New-Password {
    $bytes=New-Object byte[] 48
    $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}
function Cert-Sha([string]$password) {
    $cert=Join-Path $env:TEMP ('rr-certificate-'+[guid]::NewGuid().ToString('N')+'.der')
    $old=[Environment]::GetEnvironmentVariable('RR_APK_PASSWORD','Process')
    try {
        [Environment]::SetEnvironmentVariable('RR_APK_PASSWORD',$password,'Process')
        & $keytool -exportcert -keystore $store -storetype PKCS12 -alias $alias '-storepass:env' 'RR_APK_PASSWORD' -file $cert | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Could not verify existing signing keystore and alias; NOT generating a replacement.' }
        Require $cert 'Public certificate export'
        return (Get-FileHash -LiteralPath $cert -Algorithm SHA256).Hash.ToLowerInvariant()
    } finally {
        [Environment]::SetEnvironmentVariable('RR_APK_PASSWORD',$old,'Process')
        Remove-Item -LiteralPath $cert -Force -ErrorAction SilentlyContinue
    }
}
function Setup-Sdk([string]$path) {
    $jar=Join-Path $path 'platforms\android-36\android.jar'
    $sign=Join-Path $path 'build-tools\36.0.0\apksigner.bat'
    $aapt=Join-Path $path 'build-tools\36.0.0\aapt.exe'
    if ((Test-Path -LiteralPath $jar) -and (Test-Path -LiteralPath $sign) -and
        (Test-Path -LiteralPath $aapt)) { return }
    $manager=Join-Path $path 'cmdline-tools\latest\bin\sdkmanager.bat'
    if (-not (Test-Path -LiteralPath $manager -PathType Leaf)) {
        Write-Host 'Downloading official Android SDK command-line tools (if not installed).'
        $staging=Join-Path $env:TEMP ('rupee-sdk-'+[guid]::NewGuid().ToString('N'))
        $null=New-Item -ItemType Directory -Force -Path $staging
        try {
            $zip=Join-Path $staging 'cmdline.zip'
            Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip' -OutFile $zip -UseBasicParsing
            Expand-Archive -LiteralPath $zip -DestinationPath (Join-Path $staging 'expanded') -ErrorAction Stop
            $source=Join-Path $staging 'expanded\cmdline-tools'
            Require (Join-Path $source 'bin\sdkmanager.bat') 'Android SDK command-line tools'
            $target=Join-Path $path 'cmdline-tools\latest'
            if (Test-Path -LiteralPath $target) { throw "Partial SDK cmdline-tools installation at $target; inspect before overwriting." }
            $null=New-Item -ItemType Directory -Force -Path $target
            Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse -Force
        } finally {
            Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host 'Installing Android API 36 and Build Tools 36.0.0. Accept Android SDK licenses if asked.'
    & $manager "--sdk_root=$path" 'platforms;android-36' 'build-tools;36.0.0' 'platform-tools'
    if ($LASTEXITCODE -ne 0) { throw 'Android SDK package installation failed. Accept SDK licenses and rerun.' }
    foreach ($required in @($jar,$sign,$aapt)) { Require $required 'Android SDK build component' }
}
function Setup-Gradle {
    $bin=Join-Path $toolsHome ('gradle-'+$gradleVersion+'\bin\gradle.bat')
    if (Test-Path -LiteralPath $bin -PathType Leaf) { return $bin }
    $null=New-Item -ItemType Directory -Force -Path $toolsHome
    $zip=Join-Path $toolsHome ('gradle-'+$gradleVersion+'-bin.zip')
    if (-not (Test-Path -LiteralPath $zip -PathType Leaf)) {
        Write-Host 'Downloading pinned Gradle 9.6.1 build tool distribution.'
        Invoke-WebRequest -Uri ('https://services.gradle.org/distributions/gradle-'+$gradleVersion+'-bin.zip') -OutFile $zip -UseBasicParsing
    }
    if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $gradleHash) {
        throw 'Gradle download SHA-256 mismatch; refusing to execute unverified tools.'
    }
    Expand-Archive -LiteralPath $zip -DestinationPath $toolsHome -ErrorAction Stop
    Require $bin 'Gradle launcher'
    return $bin
}

foreach ($asset in @('index.html','game.js','mining.js','style.css','art/embryon/generated/gems/ruby.png','art/primary/blockers/rock.png')) {
    Require (Join-Path $web $asset) 'Jewelbrook game asset'
}
Require (Join-Path $android 'app\build.gradle') 'Jewelbrook Android Gradle project'
$keytool=Get-Keytool
if (-not $keytool) { throw 'JDK 17+ keytool missing; install a JDK/Android Studio. No signing key generated.' }
$env:JAVA_HOME=Split-Path -Parent (Split-Path -Parent $keytool)
$env:Path=(Join-Path $env:JAVA_HOME 'bin')+';'+$env:Path
$env:ANDROID_SDK_ROOT=$sdk
$env:ANDROID_HOME=$sdk
if (-not (Test-Path -LiteralPath $private -PathType Container)) {
    $null=New-Item -ItemType Directory -Force -Path $private
    $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    & icacls.exe $private '/inheritance:r' '/grant:r' ('*'+$sid+':(OI)(CI)F') '*S-1-5-18:(OI)(CI)F' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Unable to restrict private signing-key folder permissions.' }
}
$existing=Test-Path -LiteralPath $store -PathType Leaf
$existingPassword=Test-Path -LiteralPath $passFile -PathType Leaf
if ($existing -ne $existingPassword) { throw 'INCOMPLETE existing key/password pair. Never regenerate automatically; restore from backup.' }
if (-not $existing) {
    $secret=New-Password
    $old=[Environment]::GetEnvironmentVariable('RR_APK_PASSWORD','Process')
    try {
        [Environment]::SetEnvironmentVariable('RR_APK_PASSWORD',$secret,'Process')
        $args=@('-genkeypair','-keystore',$store,'-storetype','PKCS12','-alias',$alias,'-keyalg','RSA','-keysize','4096','-sigalg','SHA256withRSA','-validity','10950','-storepass:env','RR_APK_PASSWORD','-keypass:env','RR_APK_PASSWORD','-dname','CN=Rupee Rush Local APK Updates, O=Embryon Games, C=US','-noprompt')
        & $keytool @args
        if ($LASTEXITCODE -ne 0) { throw 'Local key generation failed. Inspect partial keystore before retrying.' }
        Require $store 'Generated keystore'
        Store-Text $passFile ($secret+[Environment]::NewLine)
        Write-Host "CREATED permanent Jewelbrook APK key: $store"
    } finally {
        [Environment]::SetEnvironmentVariable('RR_APK_PASSWORD',$old,'Process')
        $secret=$null
    }
} else { Write-Host "REUSING permanent Jewelbrook APK key: $store" }
$secret=[IO.File]::ReadAllText($passFile).TrimEnd([char[]]@(13,10))
if (-not $secret) { throw 'Keystore password is empty; refusing to change identity.' }
$fingerprint=Cert-Sha $secret
Write-Host "Signer certificate SHA-256: $fingerprint"

$last=0L
if (Test-Path -LiteralPath $sequence -PathType Leaf) {
    $raw=[IO.File]::ReadAllText($sequence).Trim()
    if ($raw -notmatch '^[0-9]{1,10}$') { throw 'Corrupt last-successful-version marker.' }
    $last=[long]::Parse($raw)
}
$code=[long][Math]::Max(([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()-1577836800L),($last+1))
if ($code -lt 1 -or $code -gt 2100000000L) { throw 'APK version code out of range.' }
Write-Host "Building signed versionCode $code"
$gradle=Setup-Gradle
Setup-Sdk $sdk

# Inject signing material into Gradle process environment, never into Git/command arguments.
$fields=@{rupeeKeystorePath=$store;rupeeStorePassword=$secret;rupeeKeyAlias=$alias;rupeeKeyPassword=$secret;rupeeVersionCode="$code"}
$before=@{}
foreach ($name in $fields.Keys) {
    $var='ORG_GRADLE_PROJECT_'+$name
    $before[$var]=[Environment]::GetEnvironmentVariable($var,'Process')
}
try {
    foreach ($name in $fields.Keys) {
        [Environment]::SetEnvironmentVariable(('ORG_GRADLE_PROJECT_'+$name),$fields[$name],'Process')
    }
    & $gradle -p $android --no-daemon --stacktrace :app:assembleRelease
    if ($LASTEXITCODE -ne 0) { throw 'Android APK Gradle build failed; existing key preserved.' }
} finally {
    foreach ($var in $before.Keys) { [Environment]::SetEnvironmentVariable($var,$before[$var],'Process') }
    $secret=$null
}
$built=Join-Path $android 'app\build\outputs\apk\release\app-release.apk'
Require $built 'Signed APK output'
$signTool=Join-Path $sdk 'build-tools\36.0.0\apksigner.bat'
$aapt=Join-Path $sdk 'build-tools\36.0.0\aapt.exe'
$check=@(& $signTool verify --verbose --print-certs $built)
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
$match=[regex]::Match(($check -join [Environment]::NewLine),'Signer #1 certificate SHA-256 digest:\s*([0-9a-fA-F:]+)')
if (-not $match.Success) { throw 'APK certificate digest missing in apksigner verification.' }
$actual=$match.Groups[1].Value.Replace(':','').ToLowerInvariant()
if ($actual -ne $fingerprint) { throw 'APK was not signed with the permanent Jewelbrook key.' }
$badging=@(& $aapt dump badging $built)
if ($LASTEXITCODE -ne 0) { throw 'Cannot verify packaged Android manifest.' }
$package=($badging | Where-Object { $_ -match '^package: ' } | Select-Object -First 1)
if ($package -notmatch "name='io.github.mrcalzon02.rupeerush'" -or
    $package -notmatch ("versionCode='"+$code+"'")) { throw "Wrong packaged app/version: $package" }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead($built)
try {
    $names=@{}
    foreach ($entry in $zip.Entries) { $names[$entry.FullName]=$true }
    foreach ($asset in @('assets/index.html','assets/game.js','assets/mining.js','assets/style.css','assets/art/embryon/generated/gems/ruby.png','assets/art/primary/blockers/rock.png')) {
        if (-not $names.ContainsKey($asset)) { throw "Missing game file INSIDE APK: $asset" }
    }
} finally { $zip.Dispose() }
$outDir=Join-Path $root 'release'
$null=New-Item -ItemType Directory -Force -Path $outDir
$dest=Join-Path $outDir 'RupeeRush-Android.apk'
Copy-Item -LiteralPath $built -Destination $dest -Force
$metadata=[ordered]@{
    packageId='io.github.mrcalzon02.rupeerush';versionCode=$code
    signingCertificateSha256=$fingerprint
    apkSha256=(Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash.ToLowerInvariant()
    channel='local-signed-apk'
}
Store-Text (Join-Path $outDir 'RupeeRush-Android-build.json') ($metadata | ConvertTo-Json -Depth 5)
Store-Text $sequence ("$code"+[Environment]::NewLine)
Write-Host "SIGNED APK VERIFIED: $dest"
Write-Host "versionCode $code | package io.github.mrcalzon02.rupeerush | signer $fingerprint"
if ($Install) {
    $adb=Join-Path $sdk 'platform-tools\adb.exe'
    Require $adb 'Android device installer adb'
    & $adb install -r $dest
    if ($LASTEXITCODE -ne 0) { throw 'Phone installation failed; do not uninstall if you need to retain saves.' }
    Write-Host 'Android device updated without uninstalling or resetting saves.'
}
