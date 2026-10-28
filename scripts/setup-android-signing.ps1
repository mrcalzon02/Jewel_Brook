# Jewelbrook ONE-COMMAND entry point: sign and build on GitHub, NOT locally.
# Google Play upload keys are intentionally deferred to their separate named generator.
[CmdletBinding()]
param([switch]$ReplaceExistingSecrets)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'provision-github-apk-signing.ps1'
if (-not (Test-Path -LiteralPath $script -PathType Leaf)) {
    throw 'GitHub APK signer enrollment script missing. Pull Jewelbrook main.'
}
& $script -ReplaceExistingSecrets:$ReplaceExistingSecrets
