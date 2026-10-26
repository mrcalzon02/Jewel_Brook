# Rupee Rush — deployment targets

One authoritative game: `web/` (match-three, mining, farming, cooking, shop, art, music and saves). Do not fork/reimplement gameplay for any platform.

| Target | Package | Delivery | Status |
| --- | --- | --- | --- |
| Android phones/tablets | `RupeeRush-Android.apk` | GitHub signed prereleases | Existing pipeline; verify on device |
| Amazon Fire tablets (Fire OS 7/8+) | The **same** `RupeeRush-Android.apk` | Side-load GitHub APK | API-level eligible; physical Fire device verification pending |
| Windows x64 | NSIS `.exe` installer and portable `.exe` | GitHub desktop prereleases | Electron packaged workflow; runtime installation pending |
| Linux x64 | `.AppImage` and `.tar.gz` | GitHub desktop prereleases | Electron packaged workflow; runtime installation pending |

The Fire OS 7 minimum is Android API 28 and Fire OS 8 is API 30. The current Android `minSdk 26` supports both at the manifest/API level. This is **not** proof of actual Fire compatibility. Fire OS 5 and 6 are below the minimum. Devices with new Fire OS versions must be tested before being claimed compatible.

## Android and Fire

Existing package `io.github.mrcalzon02.rupeerush` and permanent signing identity are unchanged. The same GitHub prerelease update service checks APK version, digest and original signer and prompts before installation. Fire OS is a targeted **sideload** environment; this change does not enroll the game in Amazon Appstore. If Amazon Appstore distribution is authorized separately, its packaging, signing, installation and store-driven update policy need independent review. Never exchange signing keys or silently switch updates to a different channel.

Fire acceptance requires physical hardware checks: first launch, offline launch, portrait/landscape constraints, click/touch drag-swaps without page scrolling, mining/glove/pick sprites, farming, cooking, store, persistent saves, APK in-place update, and acceptable frame/memory performance. Do not label code-level compatibility checks as hardware tests.

## Windows and Linux

`desktop/` is a thin Electron wrapper. The **same** `web/` assets are copied to the desktop package by electron-builder (`extraResources`). The runtime serves them at a fixed secure origin `rupeerush://game/` rather than at a version-dependent `file://` path. JavaScript has no Node/filesystem bridge. External network loads are blocked; only the GitHub Releases link opens in the user's browser.

A local desktop save is stored by Chromium under Electron's application data. It is intentionally separate from Android saves; there is no cloud save/synchronization service. Reinstall or upgrade without deleting user data. Windows and Linux have a **manual** GitHub Releases update path, not an auto-updater. Neither Windows installers nor Linux packages are code signed as part of this initial pipeline. Windows may show a publisher trust warning.

To build locally on a desktop with Node.js 22+, from `desktop/`:

```sh
npm install
npm start
# For packaged output, choose your platform:
npm run dist:win
npm run dist:linux
```

The existing GitHub Android workflow also runs a Windows/Linux desktop package matrix. It uploads each OS package as an artifact and, after successful builds, creates a separate prerelease tagged `rupeerush-desktop-<run>-<attempt>`. Android signed prereleases and prerelease update discovery are **not** changed.

## Functional acceptance

Only functional diagnostics or package assembly/signature checks may gate a release; no cosmetic/asset-style checks. Initial desktop tests verify the common runtime's asset routing, stable origin, isolation, and expected output targets. Actual launch, save persistence, input handling, and installation must be tested on Windows and Linux before claiming fully verified delivery. Treat a GitHub workflow as evidence of packaging, not proof of gameplay on physical equipment.
