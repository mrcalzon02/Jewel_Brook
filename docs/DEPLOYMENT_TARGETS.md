# Rupee Rush — platform deployment policy and status

**One game identity, with two distinct implementations.** Android phones and Amazon Fire tablets run the existing Android WebView game. Windows and Linux use a genuine native C++/SDL3 application. The Android implementation, signing keys, saver namespace and GitHub APK prerelease updater are not to be rewritten or altered for desktop support.

| Deployment environment | Runtime | Artifact | State |
| --- | --- | --- | --- |
| Android phones | Existing WebView on Android | signed RupeeRush-Android.apk | existing release system |
| Amazon Fire OS 7/8+ tablets | Existing Android WebView using the same APK | signed RupeeRush-Android.apk | API eligibility; physical Fire testing required |
| Windows x64 | **Native C++/SDL3** | RupeeRush-Native-Windows-x64.zip containing .exe and SDL3 DLL | first native vertical slice only |
| Linux x64 | **Native C++/SDL3** | RupeeRush-Native-Linux-x64.tar.gz containing ELF and SDL3 shared library | first native vertical slice only |

## Desktop runtime rules

No Chromium, Electron, WebView, NW.js, CEF, packaged website or JS engine. The desktop executable owns the window, UI, graphics, input, match logic and mining logic. No browser libraries are linked or copied. SDL3 is pinned to a verified source version. Assets are packaged selectively as existing **approved PNGs**, not the original HTML/JS/CSS site. Desktop app-specific persistence uses SDL_GetPrefPath, separate from Android WebView saves. This is not Android save-file interoperability and not a cloud save.

The latest native build removes the earlier Electron proof-of-concept completely. `.github/workflows/native-desktop.yml` compiles and archives real Windows/Linux executables and ships only their dynamic SDL3 runtime plus the approved raster assets required by this first step. The existing Android signing/release workflow continues independently. The Android release tests may still validate Fire manifest/API eligibility, but this does not certify physical hardware.

## Current native functionality (not a claim of full parity)

- Native main menu, game board and mining screen.
- Mining now implements the **source-authored six map sizes, 40 pickaxe/glove tiers, daily strike/scan capacities, upgrade prices, survey, cart capacity/exposed ore, unloading, refinery, parcel crafting and selling**, with original equipment artwork for every tier.
- Functional source comparison is generated from the existing JavaScript mining engine at build time and checked against C++ for all mine tiers, several seeds and every cell. The build-time Node tool is **not** shipped with the game.
- Existing experimental native preview's mined ore and remaining strikes are imported into independent native mining saves, preserving previous partial progress. Android saves and APK updater stay unchanged.
- Native mouse-down/drag/release moves: adjacent swaps, including non-matching swaps that consume a move.
- Deterministic match-three spawning, scoring, gravity and cascade resolution; no initial matches; repair if trapped.
- Level 1 uses the familiar 4×5 / 3-gem early-stage footprint; new levels expand the board.
- **Exact existing gem artwork files**, no new generated gem substitutes.
- **Exact approved** `nutvale-mines-ore-atlas-approved.png` with the crop rectangles from `web/mine-ore-atlas.js`; separate native deterministic hardness, barren/ordinary/rich/crystal mining, strikes and ore.
- Native offline save/restore with strict input validation and previous-save backup.
- Native functional diagnostics test board seeding, swap validity, progression footprint, mining, exhaustion and save load.

## Known missing native ports

These features remain in the existing Android implementation and **are not yet present on desktop**: authored level shapes, blockers, boosters/power-ups, combo specials, elemental levels, full campaign stage definitions, mining tiers and refinery economy, farming, cooking, houses/avatar, inventory/shop/exchanges, daily rewards, refined typography, existing sound/music/announcer, enhanced animation and sound, touch/controller navigation. Native scoring and the more advanced mini-game integrations are still provisional; the native mining economic transactions and ore generator now follow the authoritative mining module and receive cross-runtime functional checks. Do not silently replace approved art or claim complete cross-platform parity. Do not introduce cosmetic release-blocking tests.

## Verification and distributions

GitHub Actions workflow artifacts and prerelease source verification attest to successful compilation/tests only. Real device operation, smooth drag interaction, native installation, audio and save persistence across updates require Windows/Linux smoke tests. The native desktop preview is explicitly marked **experimental and gameplay-incomplete**, not a production-complete release. Desktop auto-update is not implemented; future native update mechanism must verify publisher before installation.
