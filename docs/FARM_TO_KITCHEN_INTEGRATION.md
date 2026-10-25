# Farm-to-kitchen asset wiring (art-first milestone)

## Active integration

Rupee Rush's existing Town economy (`web/town-garden.js`) still owns the save, harvest, plant, fertilizer, house level and crop selling systems. The standalone `web/farming-art.js` registry now loads before gameplay and provides:

- `harvest(id)`: existing persisted crop `carrot`, `wheat`, `berry` map to refined carrot, wheat and blueberry pictures, respectively. **Do not migrate/rename `berry` save data.**
- `powerup(id)`: six live farm-mode power-ups map to equipment artwork rather than unrelated old packet placeholders. The market and garden consume the same art lookup.
- `equipment(id)` and `goods(id)`: only approved per-sprite local assets, with stable names.

The farm shows the harvested product picture on planted/ready plots and in the harvest store. Seed packets remain seed packet pictures, fertilizer images remain recognizable package artwork. A static farm-equipment preview is marked not purchasable.

## Cooking preview contract

`web/kitchen-catalog.js` is an offline deterministic, **read-only** item and recipe index. `pantry(save)` displays only existing stored harvest quantities; additional illustrated goods are flagged unavailable and reserved for the cooking expansion. Each illustrated recipe is explicitly `preview-only` and `craftable:false` and cannot withdraw resources, mint rewards or affect player progress.

Example prospective recipe entries: Bluebell Preserves, Garden Vegetable Stew, Harvest Loaf, Golden Honey Toast. These are concept previews, not priced or tested cooking mechanics; outputs do not yet grant health, money, moves or experience.

## Art versions / QA

The repository already contains 120 separately addressable refined farming sprites with SHA-256 manifests and the first independent equipment collection. A further **19-image v3/v4 micro-retouch** has been produced outside the repository; its binary replacements must be transferred and verified independently before the final micro-retouch may be called shipped. Never change the manifest to claim those binary hashes until the corresponding updated WebP bytes are committed.

Do not enable new crops in `RupeeTownGarden.CROPS` without unlock, stock, growth, and economy tests. Do not introduce `town.pantry` persistence, recipe crafting transactions, or new currencies by simply showing artwork. The stable save key remains `rupeerush.save.v1`.

## Checks

- `node tests/kitchen-catalog.test.js`: read-only quantities, availability, recipe preview and visual mapping.
- `node tests/rupee-rush.test.js`: in-game garden, pantry and power-up art.
- `node tests/farming-refined-assets.test.js`: 120 hashes, dimensions and URL lookup.
- Full Actions build and Android on-device small-icon review remain required.
