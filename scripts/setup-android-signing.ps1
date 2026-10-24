# New era: the established one-line GitKraken entry point now generates NEW Google Play upload keys.
[CmdletBinding()]
param([switch]$SkipDrive,[switch]$SkipGitHub,
      [ValidatePattern('^[A-Za-z0-9_-]+$')][string]$DriveRemote='gdrive')
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$generator=Join-Path $PSScriptRoot 'generate-new-play-upload-keys.ps1'
if (-not (Test-Path -LiteralPath $generator -PathType Leaf)) { throw 'New Play signing generator missing; pull main first.' }
& $generator -SkipDrive:$SkipDrive -SkipGitHub:$SkipGitHub -DriveRemote $DriveRemote
