# Jewelbrook — Reusable Mobile Asset Family Audit
Version RR-ASSET-001 · 2026-10-23

## Decision

Reuse **mechanics-agnostic art**, not every file with a generic-sounding filename. The authoritative visual direction remains `docs/ART_STYLE_MASTER.md` (*Heroes of Embryon*: jewel-bright royal fantasy, Daysha, independent iconography). Every copied asset stays in Jewelbrook's local `web/art/` folder; no runtime dependency on Nut Buster URLs.

The approved portable selection is indexed with original per-file Git blob hashes in `web/art/shared-family.json`. It contains **29 newly copied files**: 16 status overlays, five additional neutral blockers, three general effects, four resource/reward icons, and one power-up illustration. The rock and the 86 mining equipment images were already migrated and stay. This is a narrowly curated selection after **visual inspection**, not a wholesale import.

### In use: statuses and obstacles

- **16 genuine tile statuses:** arcane, bomb, chain-lock, crystal, fire, frost, lightning, magma, nature-vines, poison, radiance, shadow, sticky-butter, storm, void-rock, and water. They are illustrated frames/status effects, **not** gemstone types, and remain separate from match pieces. A status appears only if its engine field is actually present. The historic filename `sticky-butter.png` is treated in Jewelbrook's UI as **crystal resin**; the artist should eventually replace the caramel palette, not pretend it is a new mechanic.
- **Standalone blockers:** chest, crate, ice-1, ice-2, lock; existing rock. Chain/ice/chest tile statuses keep their real underlying gem alive and visible. Numeric status badges communicate layer strength and countdown; counters are not an extra gem.
- **Technical rendering rule:** an overlay image sits over the gem with CSS radial transparent center (WebKit and standard masks), with a smaller physical blocker token in a separate top-left layer where appropriate. Do not make an opaque overlay or hide the gem when pinned.

### In use: power-ups and interface

- **Hammer** visual: `art/primary/powerups/hammer.png`.
- **Chain break**, **ice shatter**, and **sparkle burst**: `art/additions/effects/`. They are semantically usable as Unlock, Frostbreaker, and Starburst boosters; not arbitrarily reused for other powers.
- **Energy heart** and **hourglass**: `art/additions/economy/` represent lives and extra moves.
- **Mystery gift** and **timed chest** are staged for a future, *actually implemented* reward feature. An icon being in the repository does not mean a mechanic exists or is in use.
- Standard navigation uses independent **Embryon vector icons** from `web/art.js` plus the actual preserved mining pickaxe. The earlier walnut-and-foliage menu icons are excluded.

### Excluded or requiring original artwork

| Source family | Why it is not portable | Next action |
| --- | --- | --- |
| Nut Buster standard nut tiles and elemental nut identities | Correct artwork describes walnuts, acorns, etc.; incompatible with a gemstone match identity | Produce original gemstone family for Embryon |
| `primary/blockers/chain-1.png`, `chain-2.png` | Chain is wrapped around a visible walnut | Keep neutral chain-lock **overlay** and standalone lock art instead |
| Most `additions/ui/` sprites, including home, gift, settings, trophy, timer and menu arrows | Embedded acorns, gold-acorn symbols, woodland leaves/bark | Original royal sapphire/gold icon suite |
| Many `additions/economy/` sprites: level badge, daily calendar, booster pack, achievement medal, locked/open chest | Hidden acorn emblems or actual walnuts, despite generic filenames | Embryon economies need original gem/rupee/crown graphics |
| `additions/effects/` match-burst, horizontal/vertical clear, rocket impact, confetti, focus ring, time-boost, rainbow pulse, royal boost, chest-pop | Actual nut pieces, acorn clocks or squirrel-world prizes are embedded in the FX | Re-author effects with gemstone shards and crystal fragments |
| `primary/powerups/row-clear.png`, `rainbow.png` | Nut-bearing special pieces | Create original gemstone booster illustrations |
| Nutvale maps, fishing locations, homestead, woodland character portraits, themed advertisements | Game-specific locations/characters/advertiser jokes | Do not import |
| Ocean/aquarium environmental backdrops, animal companions, decorative items | Potential utility in a different level mode, but no current gameplay feature or visual approval | Defer instead of bloating the mobile build |
| Audio/announcer recordings | Speech and sonic branding may contain Nut Buster identities | Review track-by-track before any import |

## Verification and integration controls

1. `node tests/agnostic-art.test.js` verifies the manifest Git-object checksums, overlays' PNG shape, rendering masks, status stack, absence of disallowed paths and real gameplay view wiring.
2. `node tests/rupee-rush.test.js` continues verifying mining/day-one access, core match-3 progression, account-save separation and resume behavior.
3. Visual mobile QA still required: actually render multiple overlaid statuses in Android WebView and desktop browser, inspect transparency at 32–56 CSS pixels, verify that game tiles stay readable when an ice/lock/chest status is stacked, and inspect touch targets.
4. No GitHub Actions, Nut Buster code modifications, publisher/signing crossover or shared save key. Every asset remains locally installed and available offline.

## Next art runs

Prioritize 19 distinct gemstone silhouettes; jewel-cut cascades/combos; match-three special stones and row/column/rocket explosions; an Embryon-specific HUD/navigation set; Daysha expressions; hero map areas and original Rupee/Star Gem iconography. Preserve the approved Daysha character contract and design tokens rather than reusing Nutvale's woodland emblems.
