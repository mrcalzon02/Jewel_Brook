# Rupee Rush — Heroes of Embryon / Town Homestead & Gardening

**Status:** Town/garden and cooking Phase 1 are player-facing. Current cooking uses direct deterministic craft/serve transactions; the optional cooking minigame and many future crops remain unimplemented.  
**Authority:** `docs/ART_STYLE_MASTER.md` (approved high-sheen visual identity), `docs/TOWN_AVATAR_ART.md` (existing Town avatar levels 1–40), `web/mining.js` and `web/mining-gear.js` (existing mining and glove state).  
**World:** Heroes of Embryon. **Location:** Town. **Residence progression:** Hawseed Hovel → Garden Cottage → Prosperous Townhouse → Royal Manor.

## Scope and ownership

Town is a separate purchasable home level 1–40; it must **not** automatically follow campaign progress or avatar visual level. Campaign `saved.unlocked` continues to govern Daysha's avatar in `web/town-avatars.js`, and garden `saved.town.houseLevel` governs residence, plots and store. Preserve the `rupeerush.save.v1` localStorage key, independent mining expansion, existing currencies and campaign mechanics. Initial home level is 1, the Hawseed Hovel. The existing **40-tier gloves** from `saved.rupeeExpedition.gloveTier` (0–39) determine additional crop yield; never create a second glove upgrade economy.

## House level-to-visual ladder

House sprites must use a **fixed three-quarter isometric camera, common bounding box, same door location**, unpainted transparent background, no characters, no permanent crops or planted grow-beds baked into the art. Garden beds are composited separately so the real state is visible. The progression is architectural and gradual; a true palace by level 10 is **incorrect**. The peak at level 40 is a royal *manor house*, not a fortified castle. Plum-purple, royal blue, champagne gold, pale stone and timber match the Embryon style, with gloss concentrated on metal, glass and crystals, and matte/satin on wood and thatch.

| Levels | Band | Story and major changes | Functional garden plots |
|---|---|---|---|
| 1–5 | Hawseed Hovel | Bent posts, patchy thatch, tiny hearth → sound timber, patched blue shingles, window and door | 1 |
| 6–10 | Hawseed Homestead | Fenced yard, repaired chimney, paths, flower boxes, tidy cottage; **no towers** | 2 |
| 11–15 | Garden Cottage | Plaster infill, solid porch, tile roof, gardening shed, first bright greenhouse panes | 3 |
| 16–20 | Working Garden House | Conservatory frame, enlarged kitchen, sturdier stone, walled vegetable garden | 4 |
| 21–25 | Prosperous Townhouse | Second-floor room, slate-blue dormers, masonry, merchant awning, proper pantry | 5 |
| 26–30 | Merchant Residence | Glazed conservatory, carved stone details, larger terrace, excellent garden paths | 6 |
| 31–35 | Noble Residence | Pearl stone façade, silver window trim, blue roof, elegant balconies, ornamental court | 7 |
| 36–40 | Royal Manor | Expanded manor wings, luminous crystals, marble paths, elaborate greenhouse and finials | 8 |

### Specific per-level art milestones

See `web/art/embryon/town/houses/plan.json` for **all forty** art names, assets and plot unlock levels. Every increment needs a visible change. House improvements **must not conceal or reposition functional bed hit targets**. Do not use painted level numbers: add plaques as live accessible UI outside the art.

## Garden economy: tested Phase 1 contract

`web/town-garden.js` exports `RupeeTownGarden` in a browser or via Node CommonJS. It is deliberately **not** loaded by `web/index.html` yet; it has no localStorage, browser timing or network behavior. Its owner calls actions, saves the result with the game's existing save mechanism, and renders status with its own DOM implementation only after an interactive screen receives review.

### Save schema and currency

```
save.town = {
  schemaVersion: 1,
  houseLevel: 1,
  seeds: { carrot: 0, wheat: 0, berry: 0 },
  fertilizers: { compost: 0, quality: 0, royal: 0 },
  harvest: { carrot: 0, wheat: 0, berry: 0 },
  plots: [null, null, null, null, null, null, null, null]
}
```

All purchases and sales use **Rupees** (`saved.coins`) already shown in the main shop, never `saved.rupeeMine.dollars` directly; existing mining converts its own earnings separately. Avoid real-money transactions until a separately approved Google Play monetization design exists. Purchases are atomic, reject invalid input or lack of funds, and cannot silently consume supplies on invalid planting or harvest.

### House upgrades and unlocks

From house level `L` to `L+1`, pay `40 + 20L + 8L²` Rupees. Level 40 cannot upgrade again. Unlock plots at levels **1, 6, 11, 16, 21, 26, 31, 36**. House level gives modest growth-time efficiency (0.5% per level, capped to 19.5%), and the store allows crop/fertilizer tiers based on house level. Do not consume existing seeds or empty active plots on house upgrades.

### Starter crop store

| Crop | House level | Seed cost | Growth | Base yield | Sale per harvested unit |
|---|---:|---:|---:|---:|---:|
| Hawseed Carrot | 1 | 12 Rupees | 5 min | 2 | 12 Rupees |
| Sunwheat | 4 | 25 Rupees | 12 min | 3 | 12 Rupees |
| Bluebell Berry | 8 | 40 Rupees | 30 min | 3 | 18 Rupees |

These are first vertical-slice values, not final production balancing. Later tiers should include onion, squash, healing herbs, crystal pears, royal lavender and starlight grapes with increasing recipe utility; do not silently pretend those crops are implemented already.

### Fertilizer store

| Type | Min house | Purchase cost | Growth duration | Bonus yield |
|---|---:|---:|---:|---:|
| Garden Compost | 1 | 15 Rupees | 90% | +1 |
| Fortified Soil | 11 | 40 Rupees | 80% | +2 |
| Royal Crystal Feed | 26 | 80 Rupees | 70% | +3 |

Each planting may consume **one** fertilizer. Higher fertilizers are reserved in the backend for later crop families and a required profitability review before exposing them in the first store UI. No fertilizer is forced or auto-reapplied. Show total projected cost, duration and yield **before** purchase or planting.

### Mining gloves in the garden

The current `rupeeExpedition.gloveTier` determines `+floor(gloveTier/10)` harvest units for each planting (tiers 0–9: +0, tiers 10–19: +1, 20–29: +2, 30–39: +3). Compute bonuses **once at planting** and persist the resulting yield. Changing gloves mid-growth must not retroactively duplicate or delete harvests. Mine surveying actions and their budgets are untouched.

### Growth lifecycle

Each plot occupies one of eight fixed slots. States: **locked → empty → seed → sprout → growing → maturing → ready → empty**. On planting, consume one seed and optional fertilizer, persist plantedAt, readyAt and harvest yield. The next visit recomputes stage from wall-clock elapsed milliseconds; no background timer is required. A ready plot remains ready indefinitely and never withers at Phase 1. Harvest occurs once, moves the fixed yield into Town harvest inventory, and clears the plot. Inventory can be sold for Rupees. No negative quantities, fractional quantities or overflowing balance/stock.

The client clock is not a secure source of truth against intentional device-clock manipulation. **Do not promise anti-cheat protection** without an authenticated server clock; for the current offline-first project, predictable persistent elapsed-time behavior is the correct default.

## Kitchen / cooking (Phase 1 working implementation)

The earlier design decision is now implemented in `web/kitchen-cooking.js`: a **two-step, deterministic craft-and-serve loop**. Cooking withdraws real harvested crop units atomically and adds a meal to `save.town.kitchen.meals`. That step grants **no immediate resource**. Only a separate **Serve** action consumes the prepared meal and credits an existing gameplay wallet via its canonical subsystem API. Full health, locked boosters or capped stocks reject serving without spending a meal.

The six initial active recipes span the farming, match-three, mining and move-bank systems:

| Meal | House level | Required harvested ingredients | Served benefit |
|---|---:|---|---|
| Hawseed Garden Salad | 1 | 3 carrot | 1 Farm Compost Cache power-up |
| Hawseed Broth | 4 | 2 carrot + 1 wheat | 1 life, respecting the standard 5-life cap |
| Prospector Rations | 4 | 2 wheat + 1 carrot | 3 bonus mining strikes |
| Bluebell Tart | 8 | 2 berry + 1 wheat | 3 moves in the existing daily move bank |
| Bluebell Infusion | 8 | 2 berry + 1 carrot | 2 bonus mining surveys |
| Royal Harvest Platter | 11 | 2 carrot + 2 wheat + 2 berry | 1 already-unlocked Hammer booster |

These are **initial implementation balances**, not user-confirmed final pricing. Recipes use only the three currently growable crops and the existing earned-resource systems. The new pantry state is backward-compatible and preserves unknown meal entries for future versions. Cook supports carefully capped batch operations; no new currency or extra daily reset exists. The food illustrations are temporary placeholders built from approved existing farming art.

Original ideas such as Herbal Tisane, Royal Feast, additional processing ingredients, premium rewards and cooking minigames are still future design concepts until their crops, drops, rewards, cooldowns, and accessibility are specified and tested. Current game provides real cooking/serving buttons inside the Farm screen and a separate clearly labeled nonfunctional future recipe index.

## Visual / technical art production inventory

1. **House progressions:** four 2×5 review boards, ten **independent transparent RGBA PNGs per board** (40 total), all with same isometric camera, door anchor and slot bounds. Source masters ideally 1024×1024; runtime downsampled 512×512 WebP/PNG, individually named `house_lv_01`..`house_lv_40`. No inter-house scenery, no baked plots, no plaque text inside house sprite. A review board can show plaques, but runtime art must not.
2. **Ground module:** one base yard stage per architectural band (four ground backgrounds), with **eight consistent plot-anchor sockets** and separate seasonal/path decor on non-interactive layers.
3. **Garden beds:** empty, tilled, planted, watered and fertilized layers; visible selection/ready rings, plus disabled/locked visual. Bed overlay must be independent of houses for correct rendering.
4. **Per-crop growth:** carrot, wheat, berry × 5 states (seed mark, sprout, young, mature, harvest ready) = **15 transparent crop images** for first build; harvested item icons ×3 and seed packets ×3.
5. **Fertilizer:** three pack icons, sprinkled-soil overlay, small interaction animation, accessible fallback labels.
6. **Props:** water barrel, watering can, garden gloves reuse icon, tool rack, seed shop counter, basket, compost bin, planter/trellis, conservatory module.
7. **Economy/UI:** Town nav icon, house upgrade button, crop seed chooser, store cards, harvest/sell buttons, timers and inventory quantities. Text/numeric costs rendered in DOM, not raster images.
8. **Cooking later:** pantry/stove/kitchen worktop, minimum four food icons, recipe cards, ingredients, and crafting feedback.

**QA gate:** sprite master, approved source, correct alpha corners, consistent camera and bounding box, no clipped chimneys or foliage, no interactive garden images baked into architecture, no fixed background, thumbnails readable at 96–180 CSS px. The two initial generated `Lv01–Lv10` reference compositions explored the palette but are **not approved**: they contain opaque brown backdrops, non-modular planted beds, and a manor/castle already at Level 10. Do not integrate or label them as final assets.

## Delivery gates

1. **Phase 1:** data and simulation, stable save schema, unlock table, transactional tests. **Implemented in source only.**
2. **Phase 2:** clean, reviewed Level 1–10 hovel/cottage art and three crop growth sets; cut out alpha and produce manifest with hashes.
3. **Phase 3:** Town button/screen, house and bed layering, seed/fertilizer shop controls, growth countdown and one-tap harvest/sell; persist through existing game save function; manual Android WebView test.
4. **Phase 4:** expand to 11–20 / 21–30 / 31–40 houses and richer crop store with economics tests.
5. **Phase 5:** pantry + deterministic kitchen recipe crafting and life/move grants respecting current caps; optional minigame design only after instrumentation/feedback.

Avoid GitHub Actions changes, unrelated repository edits and changes to existing progression or mineral extraction behavior. Distinguish tested model logic from on-device gameplay.
