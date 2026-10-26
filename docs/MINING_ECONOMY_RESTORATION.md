# Mining and collectible economy restoration

Source: https://github.com/mrcalzon02/NUTBUSTER-R
Destination: https://github.com/mrcalzon02/Rupee-rush

## Mining asset provenance
The destination already held 40 pickaxe tier illustrations, 40 glove tier illustrations, and six extra collector variants; they had been committed, but were incompletely applied in the playable mine.

27 exact Nut Buster brand-neutral currency, manufactured goods, and writ illustrations have been imported into the destination's web/art/nutvale/mining-economy/ directory. Asset SHA identities were preserved in the transfer. Acorn-branded money/writ art was intentionally excluded.

The canonical excavation rock artwork is the original imported Nut Buster rendered **PNG rock** `web/art/primary/blockers/rock.png` (same Git blob in both repositories: `58655c1d030c5b2e40af0354ea4acc8393301ca2`). It is the source for every visible unexcavated rock. Persisted hit states use multiple clipped copies of **that exact PNG**, moving its actual painted fragments slightly apart after strikes. They do not draw CSS/SVG boulders or invent replacement rocks. No separately painted damage-stage files are required for the current mining implementation.

**Corrected asset classification:** `web/art/primary/overlays/void-rock.png` is a purple magical tile overlay, **not a mining fracture image**. It remains an approved portable overlay for its own tile status but is never laid over excavation rocks. The previously incorrect damaged-rock overlay has been disconnected. Cleared barren cells display an empty tile with the text label `EMPTY`; discovered ore and uncollected deposits use the existing Embryon gemstone PNG/WebP renders. Mining gear, mining currency, writs and supply crates continue to use imported art. The mining gameplay probabilities, rewards, and saves are unchanged.

The original art is also used by 40 mining tool tiers per type, and players may unlock visual-only equipment skins without altering tool tier or mining outcome probability.

## Marketplace
The third currency, Style Shards, has a strictly cosmetic spend route separate from Rupees, Star Gems and Mining Credits. The collectible catalog has 32 vector character portraits, 40 Daysha wardrobe sprites, 44 pickaxe skins, 42 glove skins and 20 decorative frames, totaling 178.

Eight loot chests are available in Rupees or Star Gems; each includes one or more independent rolls from four disclosed percent-weighted tables. Rewards include multiple currencies, boosters, random character/outfit/cosmetic unlocks, and occasional mining tier upgrades. Duplicate cosmetic rewards convert into Style Shards.

The daily mystery chest supports these outcomes once per local calendar day. Legacy 12-hour hearts and moves rewards remain separate. Collections, the selected character/outfit/frame/skins, currency balances and recent reward history all persist in the Rupee Rush save. There is no new real-money checkout.

## Test
Run: node tests/economy-market.test.js
The existing GitHub Android action runs all tests/*.test.js scripts prior to assembling the APK.
