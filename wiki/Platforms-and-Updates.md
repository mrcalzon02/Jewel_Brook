# Platforms, packages and safe updates

The authoritative repository is [`mrcalzon02/Jewel_Brook`](https://github.com/mrcalzon02/Jewel_Brook). All current public source, release and updater destinations use it, not `mrcalzon02/Rupee-rush`.

## Android phones and Amazon Fire OS

Android and Fire OS use the packaged Android/WebView game. GitHub Actions publishes signed prerelease APKs under [GitHub Releases](https://github.com/mrcalzon02/Jewel_Brook/releases), with the **legacy-compatible filename** `RupeeRush-Android.apk`. Install as an update over an existing same-signer copy rather than uninstalling (which risks local save loss).

The installed native updater calls `https://api.github.com/repos/mrcalzon02/Jewel_Brook/releases?per_page=30`, deliberately **including prereleases**, then validates candidate tag, download URL, version, SHA-256, size, package identity and publisher certificate. Both download and installation require user approval. Stable-only `/releases/latest` is **not** suitable for the development channel. No automatic Play Store updater is involved.

**Compatibility-critical:** Android application ID `io.github.mrcalzon02.rupeerush`, its existing permanent signer and the `rupeerush.save.v1` storage key must stay unchanged for in-place updates and existing progress. Google Play is not published and uses a separately planned signing process.

## Windows and Linux native releases

Windows and Linux package genuine C++/SDL3 programs; they **do not bundle Chromium, Electron or a browser runtime**. The public release assets are `JewelBrook-Native-Windows-x64.zip` and `JewelBrook-Native-Linux-x64.tar.gz`. Inside, the application binary is `JewelBrookNative(.exe)`. Linux also includes `jewel-brook-launch.sh` and desktop icon/launcher metadata. The previously established SDL native save directory remains intentionally unchanged.

**No desktop in-app auto-update exists yet.** Users download a new archive from the project's prereleases. These are **partial feature previews**, not full copies of the Android experience. GitHub's native build includes CTest and packaged binary launch checks; this is not a substitute for a real desktop compatibility test.

## What has to be tested manually?

Verify Android in-place installation, signer continuity, save preservation and update prompts on actual hardware; install and test the APK on actual Fire tablets; and check genuine Windows/Linux setup, launcher integration, input, audio and persistence on user machines.

Further details: [GitHub Android APK runbook](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/GITHUB_ANDROID_RELEASES.md), [deployment status](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/DEPLOYMENT_TARGETS.md), [repository migration](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/REPOSITORY_PLATFORM_MIGRATION.md).
