# Jewelbrook Android APK — playable local builds

This project builds a directly installable, signed Android APK from the existing web/ game without touching Nut Buster, ReverieVR or Google Play upload keys.

## One command from your Jewel_Brook checkout in GitKraken PowerShell

    git pull --ff-only; if ($LASTEXITCODE -eq 0) { .\scripts\build-android-apk.ps1 }

Output: release\Jewel-Brook-Heroes-of-Embryon-Android.apk, plus an audit metadata JSON file. If a phone is connected with USB debugging enabled, use .\scripts\build-android-apk.ps1 -Install to install it through adb.

First run: a JDK 17+ is required. The build script searches installed JDK/Android Studio installations, downloads a pinned Gradle 9.6.1 distribution with SHA-256 verification, and installs missing Android command-line SDK tools, API 36 and build-tools 36.0.0 from Google. An Android SDK license prompt may appear.

## Permanent signing key and new-identity updates

Jewel Brook's local APK signing channel uses %LOCALAPPDATA%\Embryon\rupeerush-local-apk-v1\rupeerush-local-release.p12 and store-password.txt. The script generates a new RSA-4096 signing identity once and reuses it thereafter. It refuses to replace a partially missing pair. Back up BOTH secret files privately; losing the original key prevents an in-place APK update.

The Android application ID is always io.github.mrcalzon02.jewelbrook. Each successful build increases versionCode, and the output is rejected if apksigner, aapt package/version checks, or embedded assets do not match. Android allows same-ID, same-cert, higher-version updates with application data preserved. Uninstalling wipes locally stored progress. This local APK signing key is NOT a Google Play upload key.

## Game packaging and offline persistence

android/app/build.gradle packages the entire web/ folder as APK assets. WebViewAssetLoader exposes a local HTTPS origin at https://appassets.androidplatform.net/assets/index.html, not a file:// origin; the game WebView blocks external network traffic and has JavaScript/DOM storage enabled; only the native updater uses Android's INTERNET permission. Jewelbrook's save key is rupeerush.save.v1. The APK must be installed on a physical device to verify actual gameplay and save survival.

GitHub Actions publishes verified signed test APKs after full test and signing checks. Repository commits alone are not proof of a working APK; inspect the corresponding successful build and verify installation on a device. Keep signing credentials off Git.

## Mandatory compliance checklist for every APK test

The existing all-tests release workflow includes `tests/apk-release-compliance.test.js`, checking the [38-control APK release checklist](APK_RELEASE_COMPLIANCE_GATE.md). This is source/checklist coverage, **not** evidence of a signed APK, Google Play approval or actual device behavior. Complete a build-specific evidence file and run `python3 tools/verify_apk_release_gate.py --evidence <record.json> --apk <signed.apk>` for release acceptance, then independently verify signer, installed version and preserved progress. Keep `main` GitHub APK signing and sideload tests intact; `google-play` is a dormant future distribution branch, not a substitute signing key.

## Automatic update channel (GitHub test releases)

New signed Jewelbrook APKs include a native update checker copied and adapted from Nut Buster's updater. The check runs on app launch and level entry, at most hourly per running app instance. Settings > Android updates > CHECK FOR UPDATES performs a manual check, and VIEW GITHUB RELEASES opens the browser.

Unlike GitHub's /releases/latest (which skips prereleases), Jewelbrook queries `https://api.github.com/repos/mrcalzon02/Jewel_Brook/releases?per_page=30` including prereleases tagged `jewelbrook-phone-test-N-N`. Only newer APKs with the expected filename, URL, version scheme, size and SHA-256 digest qualify. Download begins **only after confirmation**. The native service then verifies the downloaded APK checksum, package ID, greater Android versionCode and actual signer certificate against the installed app before separately requesting permission to open Android's system installer. Android requests its own installation approval. The underlying web game remains offline.

The GitHub Actions workflow injects the permanent Jewelbrook signing certificate fingerprint into BuildConfig, after checking the keystore against its secret certificate hash. Local builds use the fingerprint extracted from the reused local keystore. Unsigned/debug builds cannot use the release updater. Neither Nut Buster's signing key nor its package name is reused.

**Bootstrap once (also required if a pre-rename updater cannot follow the new release asset URL):** Already-installed Jewelbrook APKs built before this feature have no update checker and cannot update themselves. To start receiving in-app updates, install a new signed Jewelbrook release **over the existing app**, preserving its data. Do not uninstall. If Android blocks the update because the certificate differs, do not uninstall in an attempt to force it; instead inspect the signing identities and recover the matching original APK/key. Approve “Install unknown apps” for Jewelbrook when Android requires it. Connectivity is optional for ordinary offline play.

Android APK release versions on GitHub use `500000000 + run_number * 100 + run_attempt`. A locally built APK with a different version code is not automatically offered to phones via GitHub. Only APKs published in this GitHub prerelease channel appear in update checks.

## Jewel Brook independent Android identity (2026-10-28)

The app's public installed package is `io.github.mrcalzon02.jewelbrook`, not `io.github.mrcalzon02.rupeerush`. This deliberately **breaks in-place Android compatibility** with older Rupee Rush installs. Both apps may coexist, but their private data is separated and old saves do not automatically transfer. The internal `rupeerush.save.v1` key remains harmless inside each isolated app sandbox.

The permanent signing certificate, SHA-256 verification, keystore secret names and alias `rupeerush-local-apk-v1` are retained. A new certificate is **not required** when the visible name or package ID changes. New GitHub test releases use `jewelbrook-phone-test-N-N` and APK asset `Jewel-Brook-Heroes-of-Embryon-Android.apk`. The signed updater verifies the new package and its signer. No automatic save migration is claimed.
