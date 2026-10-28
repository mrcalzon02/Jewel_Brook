# Platforms, packages and safe updates

The authoritative repository is [`mrcalzon02/Jewel_Brook`](https://github.com/mrcalzon02/Jewel_Brook). All current public source, release and updater destinations use it, not `mrcalzon02/Rupee-rush`.

## Android phones and Amazon Fire OS

Android and Fire OS use the packaged Android/WebView game. GitHub Actions publishes signed prerelease APKs under [GitHub Releases](https://github.com/mrcalzon02/Jewel_Brook/releases), with the public asset name `Jewel-Brook-Heroes-of-Embryon-Android.apk`. Jewel Brook is a **new installed Android package**, which can coexist with old Rupee Rush but does not inherit its private saves.

The installed native updater calls `https://api.github.com/repos/mrcalzon02/Jewel_Brook/releases?per_page=30`, deliberately **including prereleases**, then validates candidate tag, download URL, version, SHA-256, size, package identity and publisher certificate. Both download and installation require user approval. Stable-only `/releases/latest` is **not** suitable for the development channel. No automatic Play Store updater is involved.

**New Android identity:** `io.github.mrcalzon02.jewelbrook`, with separate release tags `jewelbrook-phone-test-*`. Old `io.github.mrcalzon02.rupeerush` installs are deliberately incompatible. The signing key remains the same for ongoing Jewel Brook releases, and the internal `rupeerush.save.v1` key is contained in each Android app's own private storage. Google Play is still deferred.

## Windows and Linux native releases

Windows and Linux package genuine C++/SDL3 programs; they **do not bundle Chromium, Electron or a browser runtime**. The public release assets are `JewelBrook-Native-Windows-x64.zip` and `JewelBrook-Native-Linux-x64.tar.gz`. Inside, the application binary is `JewelBrookNative(.exe)`. Linux also includes `jewel-brook-launch.sh` and desktop icon/launcher metadata. The previously established SDL native save directory remains intentionally unchanged.

**No desktop in-app auto-update exists yet.** Users download a new archive from the project's prereleases. These are **partial feature previews**, not full copies of the Android experience. GitHub's native build includes CTest and packaged binary launch checks; this is not a substitute for a real desktop compatibility test.

## What has to be tested manually?

Verify Android in-place installation, signer continuity, save preservation and update prompts on actual hardware; install and test the APK on actual Fire tablets; and check genuine Windows/Linux setup, launcher integration, input, audio and persistence on user machines.

Further details: [GitHub Android APK runbook](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/GITHUB_ANDROID_RELEASES.md), [deployment status](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/DEPLOYMENT_TARGETS.md), [repository migration](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/REPOSITORY_PLATFORM_MIGRATION.md).
