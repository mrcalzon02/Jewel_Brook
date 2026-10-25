# Rupee Rush — future booster and power-up art library

**32 approved concept illustrations, not additional activated game mechanics.** Two cohesive batches of 16 transparent 192×192 WebP sprites: utility/support and elemental/arcane. Use their stable IDs in `manifest.json` when future features are designed and implemented.

`manifest.json` preserves individual file byte counts, SHA-256, transparent alpha QA, source cell coordinates, concept/approved distinctions, and hashes for the retained full-size original images.

The full-size 1254×1254 PNG originals and optimized 1024px sheet references are archived in `RupeeRush_Future_Boosters_32_Icons.zip`, supplied separately as a downloadable design-source package. The repository stores *each of the 32 transparent icons* as an individual binary image; the original sheets are not part of this Git tree. This avoids duplicating large reference sources in the Android installer.

Nothing in this package changes `web/game.js`, `web/engine.js`, the live booster mappings, purchases, balances, or level behavior. Art assignments to actual mechanics require a separate product/design pass.

Some glows reach source grid seams. The manifest lists contact warnings, so inspect borderline sprites on the device before final release. Run `node tests/future-powerups.test.js` to validate all asset hashes and that no gameplay integration was inadvertently activated.