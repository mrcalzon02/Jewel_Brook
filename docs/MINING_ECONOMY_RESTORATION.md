# Mining and collectible economy restoration

Source: https://github.com/mrcalzon02/NUTBUSTER-R
Destination: https://github.com/mrcalzon02/Rupee-rush

## Mining asset provenance
The destination already held 40 pickaxe tier illustrations, 40 glove tier illustrations, and six extra collector variants; they had been committed, but were incompletely applied in the playable mine.

27 exact Nut Buster brand-neutral currency, manufactured goods, and writ illustrations have been imported into the destination's web/art/nutvale/mining-economy/ directory. Asset SHA identities were preserved in the transfer. Acorn-branded money/writ art was intentionally excluded.

The original Nut Buster excavation board uses CSS-styled gradient boulders and state emojis. There was no dedicated original collection of layered boulder textures in that source. Rupee Rush no longer presents the flat match-three rock blocker on the excavation board; it uses a shaded faceted rock treatment with progressively revealed cracks. Revealed ore displays a neutral gemstone image, empty rocks display an empty marker, and production resources use the imported currency and crate images.

The original art is also used by 40 mining tool tiers per type, and players may unlock visual-only equipment skins without altering tool tier or mining outcome probability.

## Marketplace
The third currency, Style Shards, has a strictly cosmetic spend route separate from Rupees, Star Gems and Mining Credits. The collectible catalog has 32 vector character portraits, 40 Daysha wardrobe sprites, 44 pickaxe skins, 42 glove skins and 20 decorative frames, totaling 178.

Eight loot chests are available in Rupees or Star Gems; each includes one or more independent rolls from four disclosed percent-weighted tables. Rewards include multiple currencies, boosters, random character/outfit/cosmetic unlocks, and occasional mining tier upgrades. Duplicate cosmetic rewards convert into Style Shards.

The daily mystery chest supports these outcomes once per local calendar day. Legacy 12-hour hearts and moves rewards remain separate. Collections, the selected character/outfit/frame/skins, currency balances and recent reward history all persist in the Rupee Rush save. There is no new real-money checkout.

## Test
Run: node tests/economy-market.test.js
The existing GitHub Android action runs all tests/*.test.js scripts prior to assembling the APK.
