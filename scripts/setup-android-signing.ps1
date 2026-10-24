# New era: the established one-line GitKraken entry point now generates NEW Google Play upload keys.
[CmdletBinding()]
param([switch]$SkipDrive,[switch]$SkipGitHub,
      [ValidatePattern('^[A-Za-z0-9_-]+$')][string]$DriveRemote='gdrive')
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$generator=Join-Path $PSScriptRoot 'generate-new-play-upload-keys.ps1'
if (-not (Test-Path -LiteralPath $generator -PathType Leaf)) { throw 'New Play signing generator missing; pull main first.' }
# Install the single mandatory encryption dependency before any private key exists.
# WinGet installations can succeed without making their PATH links visible until shell restart.
function Find-Age {
    $installed = Get-Command age -CommandType Application -ErrorAction SilentlyContinue
    if ($installed) { return $installed.Source }
    $candidates = @()
    if ($env:LOCALAPPDATA) {
        $candidates += Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\age.exe'
        $packages = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
        if (Test-Path -LiteralPath $packages -PathType Container) {
            foreach ($folder in @(Get-ChildItem -Path (Join-Path $packages 'FiloSottile.age_*') -Directory -ErrorAction SilentlyContinue)) {
                $candidates += Join-Path $folder.FullName 'age.exe'
                # Constrain search to the known age package, never the entire disk.
                $candidates += @(Get-ChildItem -LiteralPath $folder.FullName -Filter age.exe -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
            }
        }
    }
    if ($env:ProgramFiles) {
        $candidates += Join-Path $env:ProgramFiles 'age\age.exe'
    }
    $candidates += Join-Path $HOME 'scoop\apps\age\current\age.exe'
    foreach ($path in $candidates) {
        if ($path -and (Test-Path -LiteralPath $path -PathType Leaf)) {
            return (Resolve-Path -LiteralPath $path).Path
        }
    }
    return $null
}
$ageExe = Find-Age
if (-not $ageExe) {
    $winget = Get-Command winget -CommandType Application -ErrorAction SilentlyContinue
    if (-not $winget) {
        throw 'age is missing and Windows Package Manager is unavailable. Install age from the official FiloSottile.age WinGet package.'
    }
    Write-Host 'Missing required encryption tool age. Installing official FiloSottile.age via WinGet.'
    & $winget.Source install --id FiloSottile.age --exact --source winget --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        throw 'age WinGet installation failed. No signing keys were generated. Check the install error above.'
    }
    # No shell restart required: resolve and prepend the actual installed binary directory.
    $ageExe = Find-Age
    if (-not $ageExe) {
        foreach ($scope in @('Machine','User')) {
            $currentPath = [Environment]::GetEnvironmentVariable('Path',$scope)
            if ($currentPath) { $env:Path += ';' + $currentPath }
        }
        $ageExe = Find-Age
    }
    if (-not $ageExe) {
        throw 'WinGet completed, but age.exe could not be located. Reopen GitKraken PowerShell and rerun the same one-line command. No keys were generated.'
    }
}
$ageDir = Split-Path -Parent $ageExe
if (($env:Path -split ';') -notcontains $ageDir) {
    $env:Path = $ageDir + ';' + $env:Path
}
Write-Host "Encryption prerequisite verified: $ageExe"

& $generator -SkipDrive:$SkipDrive -SkipGitHub:$SkipGitHub -DriveRemote $DriveRemote
