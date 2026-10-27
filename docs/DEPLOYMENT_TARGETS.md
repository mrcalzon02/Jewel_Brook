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

## Native desktop application identity

Windows uses an EXE icon resource built from the existing approved emerald
gem `web/art/embryon/generated/gems/emerald.png`, with the original PNG
embedded unmodified inside an ICO wrapper. Linux ships the original gemstone
PNG as a Freedesktop application icon, a native `.desktop` entry and portable
shell launcher. SDL3 uses the same original art for the live window icon.
The native main menu displays the emerald as the official crest and uses
a dark jewel/ink palette with emerald highlights and high-contrast text.

Currency-icon mappings, source gem tile artwork, mining atlas, Android/Fire OS
application icons, and approved booster art are **not** modified. This is
desktop application branding, not a currency assignment. See
`native/icons/ART_IDENTITY.md`.

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

## Source-authored early match-three stage port

The first seventeen levels are imported **at native build time** from `web/engine.js` by `native/tests/export_intro_campaign.js`. The executable packages only a compact numeric stage data file, **not** a JavaScript interpreter or webpage. The native stage loader uses the source's exact starting board, irregular void-mask silhouette, move allowance, score/ice objective, ice layers and RNG state. It refuses unsupported source changes instead of inventing alternative gameplay. The original `web/art/primary/blockers/ice-1.png` and `ice-2.png` are used as the ice overlays, and pinned tiles cannot be dragged. Native saves advance to RRNATIVE3 with backward-compatible loading for the old preview. Levels 15–17 now support the approved opal asset (source ID 11) and the level-15 Water elemental. Water's row-washing ability is tracked only when its gem is actually destroyed; statuses it washes do not appear yet in the first 17 levels. Later elemental kinds and level 18's Shuffle unlock remain unported. and are not falsely presented as implemented.

## Early authored boosters

Level 1 grants exactly three Hammers. Clearing level 5 grants three Extra Moves (+5 per activation), and clearing level 10 grants three Row Rockets for later levels; all are granted **only once**. Native Hammer breaks up to twenty successive layers/contents on one targeted cell, matching the source rule; Extra Moves revives an out-of-moves level. Their stock is stored atomically together with the board in RRNATIVE3; previous RRNATIVE1/2 saves remain readable. Approved artwork is loaded directly from `art/primary/powerups/hammer.png` and `art/additions/economy/hourglass.png` without placeholder buttons. Native Row Rocket becomes selectable in stages 11–14 after its level-10 unlock, using the existing approved `web/art/embryon/runtime/boosters/row.webp` image converted to PNG **during the build** (the Python converter is never packaged). The blast respects authored empty tiles. Release-blocking tests check inventory grants, valid/invalid target behavior, consumption, ice effects, and persistent saves, not cosmetic pixels.

## Known missing native ports

These features remain in the existing Android implementation and **are not yet present on desktop**: authored levels 18+, blockers beyond early ice, remaining boosters/power-ups, combo specials, elemental levels, full campaign stage definitions, mining tiers and refinery economy, farming, cooking, houses/avatar, inventory/shop/exchanges, daily rewards, refined typography, existing sound/music/announcer, enhanced animation and sound, touch/controller navigation. Native scoring and the more advanced mini-game integrations are still provisional; the native mining economic transactions and ore generator now follow the authoritative mining module and receive cross-runtime functional checks. Do not silently replace approved art or claim complete cross-platform parity. Do not introduce cosmetic release-blocking tests.

## Verification and distributions

GitHub Actions workflow artifacts and prerelease source verification attest to successful compilation/tests only. Real device operation, smooth drag interaction, native installation, audio and save persistence across updates require Windows/Linux smoke tests. The native desktop preview is explicitly marked **experimental and gameplay-incomplete**, not a production-complete release. Desktop auto-update is not implemented; future native update mechanism must verify publisher before installation.

## Supported native Water gem milestone (levels 15–17)

The Android `web/engine.js` stage exporter rejects unexpected new overlays, statuses, abilities or roster changes. It exports the exact level-15 Opal identity (ID 11), the original source-defined stage roster, and the single level-15 Water elemental gem. The C++ game moves the Water flag with the gem, triggers the Water ability only when that gem is destroyed, clears the flag on activation, and persists its state in backwards-compatible `RRNATIVE4` saves. The original `web/art/embryon/runtime/gems/opal.webp` is converted to PNG during compilation without redrawing or changing the approved artwork. No Python or browser runtime is shipped.

Only levels 1–17 are enabled. Level 18 adds a Shuffle upgrade for which `web/progression.js` still specifies no approved booster artwork, so it remains a separate milestone. All visual work is secondary to build/runtime and functional mechanics tests; cosmetic tests must not block releases.
