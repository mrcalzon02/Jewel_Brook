# Rupee Rush — signed APKs built on GitHub

Just like Nut Buster, Rupee Rush now builds Android APKs on GitHub Actions. You do not need Gradle, Android SDK, or Android Studio on your Windows PC.

## Normal builds

Push updates to main through GitKraken. GitHub runs all project tests, compiles the Android 36 APK, validates its signing certificate/package/version and packages assets, and publishes each verified signed build as a GitHub prerelease:

https://github.com/mrcalzon02/Rupee-rush/releases

Download RupeeRush-Android.apk and install over an older Rupee Rush APK with the same signer. Do not uninstall first if you want to keep localStorage saves. Version codes are monotonically increasing per successful new GitHub workflow run. Package identity is io.github.mrcalzon02.rupeerush.

## One-time permanent signer enrollment

GitHub runners are temporary; generating a fresh signing certificate on every build breaks in-place Android updates. The original Rupee Rush signing key must therefore be registered ONCE as protected GitHub repository secrets. From Rupee Rush in GitKraken PowerShell, after pulling latest main, run:

    .\scripts\provision-github-apk-signing.ps1

This runs ONLY keytool and GitHub CLI to enroll the permanent signing key. It never compiles an APK locally or requires Android Gradle/SDK. It reuses existing private signing material in %LOCALAPPDATA%\Embryon\rupeerush-local-apk-v1, or generates a new key once if absent, refusing to overwrite incomplete identities. It creates five RUPEE_APK_* secrets, verifies only their names (values cannot be read back), and dispatches a cloud build.

Keep a PRIVATE backup of rupeerush-local-release.p12 and store-password.txt. Losing or rotating the key breaks in-place updates to sideloaded Rupee Rush builds. Do not put secrets into Git.

## Before enrollment

GitHub still builds a disposable debug APK artifact at https://github.com/mrcalzon02/Rupee-rush/actions. It is intended only to test launch/packaging; the temporary runner's debug certificate is not guaranteed to remain stable, so it is NOT a permanent update channel. Signed GitHub Releases only appear once signing secrets are provisioned and verified.

## Local build script

scripts/build-android-apk.ps1 remains an optional advanced manual path that uses the same signer. It is NOT required for ordinary Rupee Rush builds or releases. Google Play app-signing enrollment is separate and deferred.

The GitHub source commit alone does not prove a runner successfully built or published a signed APK. Verify the Actions result and installation on your phone.