# Rupee Rush — 32 future booster and power-up icons

**Two approved concept-art batches; 32 transparent 192px WebP icons.**

`utility-support/`: 16 extra moves, shuffle, unlock key, treasure, premium reward, shield, frostbreaker, healing, revive, score, targeting, wildcard, transmutation, stasis and gift-bundle icons.

`elemental-arcane/`: 16 fire, water, earth, wind, lightning, ice, sunlight, moonshadow, poison, cleansing, portal, gravity, time, spellbook, summoning and wild magic icons.

The repository contains **all 36 art assets**: 32 individual transparent icons, 2 untouched 1254px PNG original sources, and 2 1024px WebP reference atlases. `manifest.json` records SHA-256, bytes, source positions and transparency QA. The separate `RupeeRush_Future_Boosters_32_Icons.zip` preserves the same collection for future editing and production.

These are **future-use reserves**, not new functional boosters. No item IDs, player currency, purchases, save keys, or gameplay rules changed. Actual mechanics must be implemented and tested before any icons are enabled.

Some glowing particles touch the source atlas quadrants; manifest QA explicitly flags those items for visual review. Run `node tests/future-powerups.test.js` to validate all 36 source files and gameplay isolation.
