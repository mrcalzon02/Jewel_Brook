# Rupee Rush

**Deployment targets:** Android phones and Amazon Fire tablets use the existing signed APK. Windows/Linux use a separate **genuine native C++/SDL3 application**, with no packaged browser or JavaScript runtime. Native desktop gameplay parity is in progress. See [Deployment Targets](docs/DEPLOYMENT_TARGETS.md).

**Android APK delivery:** [GitHub-built signed Releases](docs/GITHUB_ANDROID_RELEASES.md) are the normal workflow; no local Android build is needed. [Download APK releases](https://github.com/mrcalzon02/Rupee-rush/releases).


**Google Play publication is deferred.** Its separate [future upload-key runbook](docs/GOOGLE_PLAY_NEW_KEYS.md) is not required for the playable GitHub APK channel. No keystores are committed to Git.

Offline-first gemstone match-3 and independent crystal-mining economy, based on adapted, separately maintained gameplay systems from [NUTBUSTER-R](https://github.com/mrcalzon02/NUTBUSTER-R). This repository is a standalone game, not a Nut Buster update channel or shared save database.

## Play

Open `web/index.html` in a browser, or serve the `web/` folder using `python3 -m http.server 8000 --directory web`.

- **Campaign:** deterministic boards, 1,000 progression stages, 300 elemental trials, cascades, tile features and 16 earned boosters.
- **Mining:** available from the first launch, **not** level 500. Deterministic excavation, honest barren rocks, persistent claims, 40 pickaxe tiers and 40 glove tiers, mine/cart/refinery upgrades.
- **Economy loop:** dig ore → unload → refine → craft and sell crystal parcels → buy moves, hearts, boosters, Rupees or Star Gems in the mining exchange.
- **Shop:** spend earned Rupees or Star Gems to buy lives, moves and boosters with different exchange rates.
- **Saves:** `rupeerush.save.v1` in localStorage, independent of `nutbuster.v1`. Settings → Advanced Settings → Account Reset has two confirmations.
- **Monetization:** no real-money payment handler, tracking SDK, cloud account, ad provider, updater or social profile.

## Heroes of Embryon — master art direction

The owner-approved **Daysha** visual identity and **Rupee Rush** high-gloss production rules are maintained in [Master Art Style Guide](docs/ART_STYLE_MASTER.md), [Daysha Art Contract](docs/DAYSHA_ART_CONTRACT.md), and [Art Production Contract](docs/EMBRYON_ART_PRODUCTION.md). Visual palette and UI component specimens live in `web/art/embryon/`. These are design references, not assertions of gameplay integration or a packaged visual update.

## Shared asset family

Portable, visually screened blocker/status/booster/reward art is tracked in [the asset-family audit](docs/SHARED_ASSET_FAMILY.md) and [source-hash manifest](web/art/shared-family.json). The audit rejects acorn/walnut-bearing art even when its filename sounds generic. All 16 status overlays are drawn above gems with transparent-center masks in browser and Android WebView CSS. Art preservation references are documentary and are not release-blocking tests.

## Art ownership and migration

The original Nut Buster **rocks, pickaxes and gloves** are allowed as visual assets in Rupee Rush and intentionally retain the owner-authored image files, 40+40 equipment tier identities and asset paths. Other Rupee Rush art uses a temporary procedural vector treatment pending dedicated gemstone/background/UI art runs; it is **not** finished production artwork. Do not add new nut-themed sprites as stand-ins.

## Project constraints

- Do not edit the NUTBUSTER-R repository while working on this game.
- Don't add GitHub Actions without explicit request.
- Keep separate Rupee Rush package/signing IDs, save namespaces, release channels and publishing identities.
- Mining must remain available from the outset and cannot require campaign completion.
- Match-3 is playable even without mining; mining is a supplemental way to earn play resources.
- No real cash payment should be enabled without a separately approved compliant platform implementation.

## Validation

The Android GitHub Actions workflow runs only the nine functional diagnostics explicitly listed in `.github/workflows/rupee-rush-android.yml`: application/packaging and signed-update contracts, playable match-three navigation and swaps, mining, farming, kitchen preparation/serving, store packages, and power-up economy. Artwork, visual presentation, sprite hashes, portrait appearance, and palette tests are not run and cannot gate builds. Android Gradle assembly and signed APK verification are separate release-blocking build steps. Node smoke tests do not replace device interaction checks.
