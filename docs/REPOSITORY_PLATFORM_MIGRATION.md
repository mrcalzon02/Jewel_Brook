# Jewel Brook: Heroes of Embryon — repository and platform migration

Authoritative repository: https://github.com/mrcalzon02/Jewel_Brook (main).
The name formerly used in public is **Rupee Rush**. The current public name is **Jewel Brook: Heroes of Embryon**; short name **Jewel Brook**.

## Migration: active destinations

- Android/Fire OS updater: GitHub release API at `https://api.github.com/repos/mrcalzon02/Jewel_Brook/releases?per_page=30`; release asset download prefix `https://github.com/mrcalzon02/Jewel_Brook/releases/download/`; links and signing/provisioning scripts target the renamed repository.
- Web-browser fallback and Android release-view action open `https://github.com/mrcalzon02/Jewel_Brook/releases`.
- Native Windows/Linux GitHub Actions uses `GITHUB_REPOSITORY`, which resolves to the new repository on every run.
- Native desktop distribution artifacts are `JewelBrook-Native-Windows-x64.zip` and `JewelBrook-Native-Linux-x64.tar.gz` containing the `JewelBrook/JewelBrookNative(.exe)` package.
- Linux installed icon: `jewel-brook.png`; desktop entry: `jewel-brook.desktop`; portable launcher: `jewel-brook-launch.sh`. These still use the original approved gemstone icon pixels.
- Windows executable product properties and SDL window metadata display the new title. Android/Fire OS launcher label is Jewel Brook. The HTML document already uses the full official title.

## Intentionally preserved compatibility identifiers (DO NOT rename casually)

- Android `applicationId`, Java package path, publisher certificate, signer alias, versionCode progression, WebView origin, and `rupeerush.save.v1` key.
- `rupeerush-phone-test-<run>-<attempt>` tag scheme and `RupeeRush-Android.apk` asset filename: **required** by the deployed Android updater's parser and strict asset URL validation.
- Native SDL3 persistence location `SDL_GetPrefPath("RupeeRush","RupeeRushDesktop")`; existing `RRNATIVE*` save formats.
- Native CMake's internal target name `RupeeRushNative`, internal JS symbols, GitHub workflow filenames, stable test filenames, secret names, source asset paths, and original signing archive paths. These are implementation identifiers, not public branding.
- Desktop has **no implemented in-app updater**. Distribution is through tagged GitHub prereleases; source-to-native parity is still incomplete. Windows executable is unsigned pending future signer enrollment. Do not describe the port as feature-complete.

## Functional verification

- Android GitHub Actions release diagnostics verify the update contract and release identities; the signed release must still pass compiler, package, signature and publisher checks.
- Native GitHub Actions compiles both Windows and Linux, executes CTest gameplay diagnostics, launches packaged binaries in headless smoke mode, verifies SDL3 packaging and absence of a bundled browser engine, and publishes preview archives only after both succeed.
- The release contract checks names, command paths, server destinations and save keys; it is **not** a visual or cosmetic test.
- Manual validation still required: install newer signed Android APK over the old one and verify existing save data; install/run native Windows and Linux distributions on actual machines; physical Fire OS device compatibility.

## Archived material and possible external references

- Historical Rupee Rush signing archives and source-credit records can retain their historical spellings when clearly marked archival; they are **not** active publication destinations.
- Any local Git checkout at the former folder path can continue to work after a remote rename, provided its `origin` is the new URL. Local folder moves are optional and should not be assumed.
- Other repositories, Google Drive folder labels, GitHub Pages links and third-party shortcuts need independent inspection; this repository audit does not claim to modify them.
