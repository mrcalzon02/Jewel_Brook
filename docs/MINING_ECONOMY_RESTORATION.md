# Mining and collectible economy restoration

Source: https://github.com/mrcalzon02/NUTBUSTER-R
Destination: https://github.com/mrcalzon02/Rupee-rush

## Mining asset provenance
The destination already held 40 pickaxe tier illustrations, 40 glove tier illustrations, and six extra collector variants; they had been committed, but were incompletely applied in the playable mine.

27 exact Nut Buster brand-neutral currency, manufactured goods, and writ illustrations have been imported into the destination's web/art/nutvale/mining-economy/ directory. Asset SHA identities were preserved in the transfer. Acorn-branded money/writ art was intentionally excluded.

The original Nut Buster excavation board used CSS-styled boulders and emojis; neither repository currently has a dedicated three-stage damaged-boulder sprite pack. The Rupee Rush excavation board now renders the checked-in **PNG rock** `web/art/primary/blockers/rock.png`, with persisted damage visually shown using the checked-in raster `web/art/primary/overlays/void-rock.png` and damage-specific shading. It no longer draws boulders as CSS polygons and lines or substitutes emoji for survey rock faces. Excavated results render original Embryon gemstone sprites; controls and counters render imported mining tool and mining supply crate illustrations. This is a raster-art integration, not a claim that bespoke damage-stage rock paintings already exist.

The original art is also used by 40 mining tool tiers per type, and players may unlock visual-only equipment skins without altering tool tier or mining outcome probability.

## Marketplace
The third currency, Style Shards, has a strictly cosmetic spend route separate from Rupees, Star Gems and Mining Credits. The collectible catalog has 32 vector character portraits, 40 Daysha wardrobe sprites, 44 pickaxe skins, 42 glove skins and 20 decorative frames, totaling 178.

Eight loot chests are available in Rupees or Star Gems; each includes one or more independent rolls from four disclosed percent-weighted tables. Rewards include multiple currencies, boosters, random character/outfit/cosmetic unlocks, and occasional mining tier upgrades. Duplicate cosmetic rewards convert into Style Shards.

The daily mystery chest supports these outcomes once per local calendar day. Legacy 12-hour hearts and moves rewards remain separate. Collections, the selected character/outfit/frame/skins, currency balances and recent reward history all persist in the Rupee Rush save. There is no new real-money checkout.

## Test
Run: node tests/economy-market.test.js
The existing GitHub Android action runs all tests/*.test.js scripts prior to assembling the APK.
