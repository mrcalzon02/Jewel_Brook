# Development status

This page distinguishes **implemented code**, **verified GitHub build evidence**, **planned work**, and **physical-device validation**. It is not a marketing claim that all platforms have feature parity.

## Current status by platform

| Platform | Current implementation | Verified in CI | Still outstanding |
| --- | --- | --- | --- |
| Android phones | Offline-packaged local WebView game; native signed GitHub prerelease updater | Functional gameplay diagnostics, APK compilation, packaging, signing fingerprint and version checks on successful release runs | Actual on-device upgrade, save continuity and interactive performance require device checks |
| Amazon Fire tablets | Reuses same APK and Android-local gameplay | Android source/API deployment contract | Physical Fire OS installation, input/layout and audio checks |
| Windows x64 | Native C++/SDL3 executable; limited port | Windows build, CTest and packaged executable smoke launch | Missing Android gameplay systems, manual installer/UI verification, code signing |
| Linux x64 | Native C++/SDL3 executable; limited port | Linux build, CTest, dependency and headless launch checks | Missing gameplay systems, real desktop setup and launcher testing |

A [verified native preview release](https://github.com/mrcalzon02/Jewel_Brook/releases/tag/jewelbrook-native-52-1) contains both platform archives. The native game currently exports **stages 1–124**, not the entire 1,000-stage Android campaign. The desktop release is *experimental*, and desktop self-update is not implemented.

## Implemented gameplay in the broader Android/web codebase

- Deterministic gemstone puzzle engine; 1,000 main stage definitions, five regions, 300 elemental trials, 16 booster unlocks and source-defined special effects.
- Mining/refining/trading with persistent excavation and 40-tier pickaxe plus glove progression.
- Farm plots, residence upgrades 1–40, Manor navigation, actual cooking/serving recipes, independent economy and shop.
- Offline World Guide and level-based Royal Chronicle with original generated Daysha assets and gated elemental gowns.
- Signed GitHub Android prerelease channel with hash, app-identity, version and publisher-certificate verification plus explicit consent to download/install.

## Unfinished or not independently verified

- Desktop full campaign and feature parity, including the full Town/farm/kitchen/store/Chronicle and media subsystems.
- Final approved art for all residence/Manor previews and recovery of some original generated atelier images.
- Exact thirteen-month Elaranth calendar names, epoch and historical weekdays; do **not** invent dates.
- Physical device checks for existing Android save migration, Fire OS compatibility and desktop end-user installation.
- Google Play store distribution; this is *deferred*.

## Release evidence discipline

A successful GitHub Actions job verifies that particular run's steps, not an untested device experience. The project's source truth is `main`; later work may supersede an older release. [Actions](https://github.com/mrcalzon02/Jewel_Brook/actions), [Releases](https://github.com/mrcalzon02/Jewel_Brook/releases), [Android signing runbook](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/GITHUB_ANDROID_RELEASES.md), [native platform detail](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/DEPLOYMENT_TARGETS.md).
