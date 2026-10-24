# Rupee Rush Android APK — playable local builds

This project builds a directly installable, signed Android APK from the existing web/ game without touching Nut Buster, ReverieVR or Google Play upload keys.

## One command in GitKraken PowerShell (C:\GITS\Rupee-rush)

    git pull --ff-only; if ($LASTEXITCODE -eq 0) { .\scripts\build-android-apk.ps1 }

Output: release\RupeeRush-Android.apk, plus an audit metadata JSON file. If a phone is connected with USB debugging enabled, use .\scripts\build-android-apk.ps1 -Install to install it through adb.

First run: a JDK 17+ is required. The build script searches installed JDK/Android Studio installations, downloads a pinned Gradle 9.6.1 distribution with SHA-256 verification, and installs missing Android command-line SDK tools, API 36 and build-tools 36.0.0 from Google. An Android SDK license prompt may appear.

## Permanent signing key and safe updates

Only Rupee Rush's local APK channel uses %LOCALAPPDATA%\Embryon\rupeerush-local-apk-v1\rupeerush-local-release.p12 and store-password.txt. The script generates a new RSA-4096 signing identity once and reuses it thereafter. It refuses to replace a partially missing pair. Back up BOTH secret files privately; losing the original key prevents an in-place APK update.

The Android application ID is always io.github.mrcalzon02.rupeerush. Each successful build increases versionCode, and the output is rejected if apksigner, aapt package/version checks, or embedded assets do not match. Android allows same-ID, same-cert, higher-version updates with application data preserved. Uninstalling wipes locally stored progress. This local APK signing key is NOT a Google Play upload key.

## Game packaging and offline persistence

android/app/build.gradle packages the entire web/ folder as APK assets. WebViewAssetLoader exposes a local HTTPS origin at https://appassets.androidplatform.net/assets/index.html, not a file:// origin; the application grants no INTERNET permission and has JavaScript/DOM storage enabled. Rupee Rush's save key is rupeerush.save.v1. The APK must be installed on a physical device to verify actual gameplay and save survival.

No GitHub Actions added. No APK has been compiled or device-tested merely because these files were committed. Keep signing credentials off Git.
