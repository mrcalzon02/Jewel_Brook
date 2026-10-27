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

The first thirty levels are imported **at native build time** from `web/engine.js` by `native/tests/export_intro_campaign.js`. The executable packages only a compact numeric stage data file, **not** a JavaScript interpreter or webpage. The native stage loader uses the source's exact starting board, irregular void-mask silhouette, move allowance, score/ice objective, ice layers and RNG state. It refuses unsupported source changes instead of inventing alternative gameplay. The original `web/art/primary/blockers/ice-1.png` and `ice-2.png` are used as the ice overlays, and pinned tiles cannot be dragged. Native saves advance to RRNATIVE3 with backward-compatible loading for the old preview. Levels 15–17 now support the approved opal asset (source ID 11) and the level-15 Water elemental. Water's row-washing ability is tracked only when its gem is actually destroyed; statuses it washes do not appear yet in the first 30 levels. Later elemental kinds and level 18's Shuffle unlock remain unported. and are not falsely presented as implemented.

## Early authored boosters

Level 1 grants exactly three Hammers. Clearing level 5 grants three Extra Moves (+5 per activation), and clearing level 10 grants three Row Rockets for later levels; all are granted **only once**. Native Hammer breaks up to twenty successive layers/contents on one targeted cell, matching the source rule; Extra Moves revives an out-of-moves level. Their stock is stored atomically together with the board in RRNATIVE3; previous RRNATIVE1/2 saves remain readable. Approved artwork is loaded directly from `art/primary/powerups/hammer.png` and `art/additions/economy/hourglass.png` without placeholder buttons. Native Row Rocket becomes selectable in stages 11–14 after its level-10 unlock, using the existing approved `web/art/embryon/runtime/boosters/row.webp` image converted to PNG **during the build** (the Python converter is never packaged). The blast respects authored empty tiles. Release-blocking tests check inventory grants, valid/invalid target behavior, consumption, ice effects, and persistent saves, not cosmetic pixels.

## Known missing native ports

These features remain in the existing Android implementation and **are not yet present on desktop**: authored levels 32+, blockers beyond early ice, remaining boosters/power-ups, combo specials, elemental levels, full campaign stage definitions, mining tiers and refinery economy, farming, cooking, houses/avatar, inventory/shop/exchanges, daily rewards, refined typography, existing sound/music/announcer, enhanced animation and sound, touch/controller navigation. Native scoring and the more advanced mini-game integrations are still provisional; the native mining economic transactions and ore generator now follow the authoritative mining module and receive cross-runtime functional checks. Do not silently replace approved art or claim complete cross-platform parity. Do not introduce cosmetic release-blocking tests.

## Verification and distributions

GitHub Actions workflow artifacts and prerelease source verification attest to successful compilation/tests only. Real device operation, smooth drag interaction, native installation, audio and save persistence across updates require Windows/Linux smoke tests. The native desktop preview is explicitly marked **experimental and gameplay-incomplete**, not a production-complete release. Desktop auto-update is not implemented; future native update mechanism must verify publisher before installation.

## Supported native Water gem milestone (levels 15–17)

The Android `web/engine.js` stage exporter rejects unexpected new overlays, statuses, abilities or roster changes. It exports the exact level-15 Opal identity (ID 11), the original source-defined stage roster, and the single level-15 Water elemental gem. The C++ game moves the Water flag with the gem, triggers the Water ability only when that gem is destroyed, clears the flag on activation, and persists its state in backwards-compatible `RRNATIVE5` saves. The original `web/art/embryon/runtime/gems/opal.webp` is converted to PNG during compilation without redrawing or changing the approved artwork. No Python or browser runtime is shipped.

The native campaign currently enables levels 1–31. Levels 18–19 introduce source-authored gem-color collection objectives and level 18 grants three Shuffle boosters after its first clear. The native UI uses the existing Rupee Rush runtime `shuffle.webp` sprite, converted losslessly to PNG at build time. The original web/progression.js BOOSTER_ART entry remains intentionally unchanged; no currency artwork is remapped. All visual work is secondary to build/runtime and functional mechanics tests; cosmetic tests must not block releases.

## Native collection goals and Shuffle (levels 18–20)

The stage exporter records the source's exact per-color collection objective (kind 2), target, and original gem type ID. Only **destroyed** gems of the objective color count; cracked ice without gem destruction does not award color progress. Source-authored board masks, blocker states, and starting gem roster remain unchanged. The first clear of level 18 awards three Shuffle boosters, once. Shuffle exchanges movable gem payloads while retaining ice layers, void cells, source objective, moves, and Water elemental attachment to its gem; unsuccessful attempts never consume inventory. Native saves now use RRNATIVE5 and continue reading RRNATIVE1–4.

Rupee Rush already contains `web/art/embryon/runtime/boosters/shuffle.webp`; the desktop app converts **those exact existing pixels** at build time and displays that image instead of an emoji, SVG, or arbitrary substitute. The separate `web/progression.js` gameplay icon catalog still lists Shuffle as null and has **not** been modified. This is desktop-only artwork reuse, not a retroactive currency assignment or an Android change. There are no appearance-based release-blocking tests; only functional diagnostics and needed runtime packaging checks gate native releases.

Level 21 now seeds a Fire elemental. Later levels through 25 use the Android-authored stage data, while level 26's Column Rocket unlock remains the next unported booster milestone. Full parity with Android is still incomplete.

## Native Fire elemental and authored levels 21–25

The build-time Android stage exporter now supports Fire as a second gem-carried
elemental flag (2; Water stays 1). It still rejects unexpected overlay,
roster, blocker and element changes. Destroying a Fire gem queues an
activation, damages the four orthogonally adjacent valid tiles for one hit,
and ignites the nearest surviving movable square for two turn ticks. Fire
auras attach to **board positions**, not gem identities; expiration hits the
square and its four valid neighbors, then processes any subsequent elemental
reactions, gravity, and cascades. The exact
`web/art/primary/overlays/fire.png` is installed for the native tile overlay.
No substitute art is generated.

`RRNATIVE6` persists fire counters and aura countdowns and preserves read
compatibility for earlier `RRNATIVE1`–`RRNATIVE5` saves. Native tests check
level-21 Fire seeding, destruction, two-turn delayed activation, continued
save/load, the five newly authored levels and existing functional game/mine
contracts. Android gameplay and currency artwork mappings are unchanged.

The next campaign milestone is **level 26**, which introduces the Column
Rocket. Desktop remains an experimental, incomplete native port; these
stage milestones do not establish full Android parity.

## Native Column Rocket milestone (levels 26–27)

The next two stage initial configurations come **directly from Android** at build time, using `web/engine.js` rather than newly invented layouts. After the first clear of level 26, the player receives exactly **three Column Rockets**, following `web/progression.js` and the earlier one-time booster unlock pattern. The native action delivers one hit per present square along the chosen column, cracking a single ice layer or destroying the exposed gem, with source-compatible collection counting, no cost in moves, and no impact on authored void squares. The same existing artwork from `web/art/embryon/runtime/boosters/column.webp` is converted into SDL3-compatible PNG at build time; no desktop artwork substitutions or currency remapping.

The `RRNATIVE7` save format persists claimed Column Rocket unlocks and remaining stock, reads earlier RRNATIVE1–6 saves without granting extra stock, and retains Water/Fire flags and countdowns. Functional diagnostics enforce inventory spending, first-clear rewards, void preservation, original objectives, source-stage loader, runtime launcher checks, and save recovery. **No cosmetic or pixel-diff tests gate a release.** Android/Fire OS remains unchanged, and the native Windows/Linux package contains no embedded browser, HTML, or Python runtime.

Level 28 adds locks and other authored mechanics not yet ported and remains disabled. The wider farming, cooking, package, shop, animation, and sound systems are still outstanding in the native implementation.

## Native lock blockers and Ice elemental (levels 28–30)

Android's stage exporter now imports the original lock layers separately from ice, retains the exact source board cells and goals (including a lock-clear objective), and rejects unsupported future mechanics. Pinned locks prevent drag-swaps, matches and gravity until damaged; attacks strip **one lock layer per hit**, and a lock objective counts removed lock layers. These are original lock sprites from `web/art/primary/blockers/lock.png`—not substituted gems or emoji.

The Ice elemental seeded by level 28 is a *gem-carried power*, distinct from pinned ice blockers. Destroying it freezes up to two adjacent valid unpinned gems for two normal turns. Frozen positions cannot be swapped or matched until they thaw and are shown with the existing `web/art/primary/overlays/frost.png`. Native saved boards now use `RRNATIVE8` (lock layers, removed-lock progress, freeze flags and activations) with read compatibility for `RRNATIVE1`–`RRNATIVE7`. There are no new or blocking cosmetic tests: release gates exercise gameplay rules, save/load, packaging, and actual native executable startup.

## Native six-column stage 31 (first expansion after the original thirty)

Stage 31 is exported from the unchanged Android `web/engine.js` using the
same deterministic stage seed as the earlier levels. The source-authored
**6×7 board has 12 actual void cells**, a 31-move budget, an Opal collection
objective of 20, four ice-covered cells, and one locked cell. The build-time
exporter refuses any unsupported future overlays, elemental powers, blocker
types or roster changes instead of fabricating replacements. Its catalog
format is `RRCAMPAIGN8` with exactly 31 entries and is packaged as
`data/campaign-31.txt`. No JavaScript interpreter is included.

The C++ loader validates each authored entry at its own actual width,
including the 5→6-column transition, and the SDL3 board/input layout uses
that width. Native functional tests pin the source-authored void positions,
objective, RNG state and blocker stock, then exercise stage 30→31 with
earned inventory retained and a stage-31 `RRNATIVE8` save/reload roundtrip.
Existing RRNATIVE1–8 saves remain readable; no save migration or extra
booster award is needed at this milestone.

**Stages 32–38 are now imported from the authored Android campaign. The next
milestone after 38 remains gated until additional source mechanics are ported.
GitHub Actions compilation, functional tests and packaged startup are automated
diagnostics, not a substitute for installed Windows/Linux acceptance testing.

## Native 6×7 campaign expansion and Crystal Bomb (levels 32–38)

The original Android engine now supplies the starting board and stage goals for levels 1–38 through the build-time `RRCAMPAIGN9` data file. All seven new levels use the source's six-column geometry and seeded roster; the level-35 Water elemental is exported and handled as a real Water gem (not a made-up replacement). Unsupported art, blockers or powers abort the export instead of silently remapping. Existing currency icons and Android/Fire OS code remain unchanged.

The level-37 first-clear award gives **three** Crystal Bomb charges from the original progression ladder. A Crystal Bomb performs one damage hit against each present square in the selected 3×3 region, including one layer of ice/locks where present. The native HUD uses an exact conversion of the existing `web/art/embryon/runtime/boosters/blast.webp` into PNG as a compile-time step; the original artwork is unchanged and no converter or browser runtime is packaged. The new native `RRNATIVE9` format saves this inventory and its claimed flag, reads `RRNATIVE1`–`RRNATIVE8` without inventing charges, and retains all earlier mining, booster and elemental state.

Functional tests cover stage seed/shape validation, a level-35 Water gem, the level-37 one-time reward, successful/invalid blast actions, area effects on blockers/voids, inventory persistence and old-save migration. Booster controls now occupy their own bar above navigation rather than overlapping it. No cosmetic snapshots or pixel comparisons gate development or release.

### Stage 35 original Alexandrite asset and roster

Stage 35 introduces **Alexandrite (source gem ID 18)** alongside Opal (ID 11) and the original three starting gemstones. It is rendered using the existing `web/art/embryon/runtime/gems/alexandrite.webp` image, converted for the native PNG loader at build time, never substituted with another gem. Stages 35–38 use the five-species roster `[0,1,2,11,18]` and the stage-35 gem carries the Water elemental. Exporter, loader and functional tests explicitly verify this inventory of gem identities, and packaging fails if the original artwork is unavailable.

## Levels 39–44: source-authoritative Fire reuse

Stages 39–44 are exported from the unchanged Android engine in the build-time `RRCAMPAIGN10` format (`campaign-44.txt`). Original board silhouettes, blocker layers, five-species gem roster (including Alexandrite at ID 18), objectives and random states are validated on every stage, without authored-art substitutions. Stage 42 contains exactly one Fire-powered original gem; the existing native Fire reaction and two-turn tile blast handle it. Native functional tests verify the stage-42 Fire identity and save/load, and check all added source boards before allowing Windows/Linux packaged startup. Stage 45 introduces a **different** source-authoritative square-bound Fire overlay and remains locked until its timer/damage lifecycle and original overlay are ported and tested. Older native saves and booster inventory are preserved without changing the RRNATIVE9 save schema. No added cosmetic release-blocking tests.
