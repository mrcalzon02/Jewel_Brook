# Jewel Brook: Heroes of Embryon

**Jewel Brook: Heroes of Embryon** is an offline-first fantasy gemstone match-three adventure set in the working kingdom of Embryon. The player clears expeditions, mines and refines gems, grows and cooks food, develops a town residence, trades resources, and witnesses the unfolding story of Queen Daysha and King Rome.

Previously developed under the name **Rupee Rush**, the game now lives at **[mrcalzon02/Jewel_Brook](https://github.com/mrcalzon02/Jewel_Brook)** on `main`. This is the same game, **not** a fork of or an update channel for [Nut Buster](https://github.com/mrcalzon02/NUTBUSTER-R).

> **Development status:** Playable signed Android test APKs are released from GitHub. Native Windows/Linux C++/SDL3 builds are functional **but experimental, with partial gameplay parity**. Amazon Fire tablets share the Android APK target; physical Fire-device verification is still required. Google Play publication has **not** occurred.

## Get the game

| Platform | Current distribution | Important limitations |
| --- | --- | --- |
| **Android phones** | [Signed GitHub Android prereleases](https://github.com/mrcalzon02/Jewel_Brook/releases) — download `Jewel-Brook-Heroes-of-Embryon-Android.apk` | Installs outside Google Play; permit installation when Android asks. Updating an existing signed installation should preserve saves. |
| **Amazon Fire tablets** | Same Android APK | Fire OS compatibility is a deployment target, not a claim of verified operation on every Fire tablet. |
| **Windows x64** | [Native desktop prereleases](https://github.com/mrcalzon02/Jewel_Brook/releases) — `JewelBrook-Native-Windows-x64.zip` | Genuine native executable; no embedded browser. Experimental content subset; unsigned Windows executable. |
| **Linux x64** | Same releases — `JewelBrook-Native-Linux-x64.tar.gz` | Native SDL3 executable and packaged dependencies; experimental content subset. |
| **Source-browser preview** | Open `web/index.html` or serve `web/` locally | For local development; not a desktop distribution and not a substitute for the native executables. |

For the latest **applicable** release, browse [all releases, including prereleases](https://github.com/mrcalzon02/Jewel_Brook/releases). GitHub's stable-only `/releases/latest` endpoint is **not** the test update channel.

**Update behavior:** Signed sideloaded Android builds check the **renamed** `Jewel_Brook` repository for new matching prerelease APKs. A download and installation both require permission; the updater verifies the APK's hash, version, package ID and publisher certificate. Native desktop **does not yet have an in-app updater**—download a newer native archive manually. See [Android releases and signing](docs/GITHUB_ANDROID_RELEASES.md) and [platform status](docs/DEPLOYMENT_TARGETS.md).

## What's implemented?

The **Android/local web gameplay** is the broader feature set:

- **1,000 main expedition stages** in five 200-stage chapters: Goblin Caves, Troll Caverns, Sulfur Sumps, Mushroom Mire and Ghost Mines. Deterministic matching, board conditions, blockers and 16 progressively earned boosters are defined in the source.
- **300 optional elemental trials** with distinct unlock requirements and powers. Trials are not extra campaign calendar days.
- **Mining and processing from the start:** persistent excavations, real barren rocks, cart and refinery upgrades, ore/refining/trading, and 40 authored pickaxe plus 40 glove tiers. Mining is optional support for the puzzle game, not a prerequisite.
- **Town economy:** seeds, real growing plots and harvests; a 40-level residence with real paid upgrades, a Manor destination, and functional Kitchen, Garden and Wardrobe navigation. Recipes consume actual harvested ingredients and award defined support items.
- **Currencies and shop:** Rupees, Star Gems, Mining Credits and cosmetic Style Shards have distinct roles. There is **no real-money checkout, ads, tracking SDK or online account**.
- **World Guide and Royal Chronicle:** offline reference data and level-tied royal episodes; source-approved **original generated** Daysha illustrations and ten elemental gowns have conditional story/trial reveal rules.

**Story premise:** You are part of the working population whose mining, food and commerce sustain Embryon. The royal story takes place on the **same campaign timeline**: the first clear of Level N advances the shared history to Campaign Day N. At the opening, Daysha and Rome are newly married and their daughter Estelle has **not** been born. Later Estelle scenes are *future story material*, not opening-game events. Exact Elaranth month/year conversion remains unconfirmed. The existing Town avatar art depicts Daysha; that presentation must not be mistaken for making the narrative citizen player the queen.

**Native desktop status:** The Windows/Linux builds run original C++/SDL3 code—not Electron, Chromium, WebView or a bundled JavaScript interpreter. GitHub has compiled and smoke-tested both platforms with functional checks. The native campaign currently exports the **first 124 source-authored stages** and some matching, mining, booster, status and save systems. It **does not yet match** the complete Android farming, kitchen, store, Chronicle, audio or 1,000-stage feature set. See [deployment and port status](docs/DEPLOYMENT_TARGETS.md); a successful desktop release is not full-game parity.

## World, development and art documentation

- [Wiki source home](wiki/Home.md) — organized repository-backed pages for game systems, canon, platform releases and the verified status. These pages are **versioned documentation**; they are not automatically the separate GitHub Wiki site.
- [World guide / chronology reference](docs/EMBRYON_WORLD_WIKI.md) — official in-repository counterpart of the offline World Guide.
- [Royal Chronicle integration](docs/ROYAL_CHRONICLE_INTEGRATION.md) and [Daysha generated-image inventory](docs/DAYSHA_GENERATED_IMAGE_SORTING.md) — what is in the game, future events and missing original-image bytes.
- [Daysha identity contract](docs/DAYSHA_ART_CONTRACT.md), [master art style](docs/ART_STYLE_MASTER.md) and [art production contract](docs/EMBRYON_ART_PRODUCTION.md).
- [Residence / Manor feature status](docs/TOWN_MANOR_IMPLEMENTATION.md).
- [Repository and compatibility migration](docs/REPOSITORY_PLATFORM_MIGRATION.md).

The game uses approved original art and carefully selected reusable artwork from the owner's existing projects. **Do not remap currency artwork, substitute unapproved rock/gem icons, or upload third-party dress-reference images as if they were generated originals.** Some residence/exterior art is still preview-grade and final approved painting remains incomplete. Art inventory and runtime readiness are not interchangeable.

## Developer quick start

The locally runnable browser gameplay requires no backend:

```sh
python3 -m http.server 8000 --directory web
```

Open `http://localhost:8000`. Alternatively open `web/index.html` directly where supported.

Functional checks (Node.js) are in `tests/`. The signed Android release workflow runs its specified functional diagnostics, Gradle assembly and signer/APK identity checks on **GitHub Actions**, not the user's PC. Native Windows/Linux builds run their own CMake/CTest diagnostics and packaged-executable smoke tests on GitHub. Avoid adding release-blocking cosmetic or screenshot-diff tests. Build/check status is verified per [Actions run](https://github.com/mrcalzon02/Jewel_Brook/actions), not inferred from a source commit.

## Compatibility identities — intentionally unchanged

**Do not rename these casually** even though public branding is Jewel Brook:

- Android package ID and Java namespace: `io.github.mrcalzon02.rupeerush`.
- Permanent sideload signing identity/certificate, update version progression and local save key `rupeerush.save.v1`.
- Android update asset `Jewel-Brook-Heroes-of-Embryon-Android.apk` and prerelease tag convention `rupeerush-phone-test-<run>-<attempt>`; the signed updater validates them.
- Native existing save location `SDL_GetPrefPath("RupeeRush","RupeeRushDesktop")` and compatible save formats.
- Stable internal APIs, asset paths and some historical workflow/test names where renaming them adds risk rather than user value.

**External-facing** GitHub links, Android update endpoints, project name and Windows/Linux packaged application names now use **Jewel Brook**. Google Play signing/upload keys are separate and **publication is deferred**; no current Google Play release is implied.
