# Mining and collectible economy restoration

Source: https://github.com/mrcalzon02/NUTBUSTER-R
Destination: https://github.com/mrcalzon02/Jewel_Brook

## Mining asset provenance
The destination already held 40 pickaxe tier illustrations, 40 glove tier illustrations, and six extra collector variants; they had been committed, but were incompletely applied in the playable mine.

27 exact Nut Buster brand-neutral currency, manufactured goods, and writ illustrations have been imported into the destination's web/art/nutvale/mining-economy/ directory. Asset SHA identities were preserved in the transfer. Acorn-branded money/writ art was intentionally excluded.

The mine already has the **exact Nut Buster source PNG** `web/art/primary/blockers/rock.png` (shared Git blob `58655c1d030c5b2e40af0354ea4acc8393301ca2`). Nut Buster's current excavation UI uses emoji faces for its board and text `CRACK n/hardness` for struck rocks; it does not have painted multi-stage damage sprites. Jewelbrook uses the existing imported PNG rather than those emoji faces and reports persisted hit progress using the same source labels. **Do not generate, clip, recolor, or reassign rock artwork to simulate missing sprites.**

`web/art/primary/overlays/void-rock.png` is a **match-3 tile overlay**, never mining damage artwork. The survey indicator no longer displays a diamond for unknown ore rarity. Uncollected ore uses its actual discovered ore class, and all 114 permitted Nut Buster mining-art files already present in both repositories have identical Git blob checksums. Ten missing Nut Buster source files are acorn-branded economy visuals or a source manifest, deliberately outside the Jewelbrook mining art selection. Mining rules, save keys, equipment tiers, and Jewelbrook-specific power-ups are unchanged.

The original art is also used by 40 mining tool tiers per type, and players may unlock visual-only equipment skins without altering tool tier or mining outcome probability.

## Marketplace
The third currency, Style Shards, has a strictly cosmetic spend route separate from Rupees, Star Gems and Mining Credits. The collectible catalog has 32 vector character portraits, 40 Daysha wardrobe sprites, 44 pickaxe skins, 42 glove skins and 20 decorative frames, totaling 178.

Eight loot chests are available in Rupees or Star Gems; each includes one or more independent rolls from four disclosed percent-weighted tables. Rewards include multiple currencies, boosters, random character/outfit/cosmetic unlocks, and occasional mining tier upgrades. Duplicate cosmetic rewards convert into Style Shards.

The daily mystery chest supports these outcomes once per local calendar day. Legacy 12-hour hearts and moves rewards remain separate. Collections, the selected character/outfit/frame/skins, currency balances and recent reward history all persist in the Jewelbrook save. There is no new real-money checkout.

## Test
Run: node tests/economy-market.test.js
The existing GitHub Android action runs all tests/*.test.js scripts prior to assembling the APK.
