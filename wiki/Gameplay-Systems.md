# Gameplay systems

Jewel Brook combines a playable deterministic match-three expedition with resource production and ordinary life in Embryon. **Mining and town activities are support loops, not mandatory gates for starting match-three.**

## Expedition and progression

There are **1,000 main stages**, split into Goblin Caves (1–200), Troll Caverns (201–400), Sulfur Sumps (401–600), Mushroom Mire (601–800) and Ghost Mines (801–1000). The level engine handles authored boards, tile conditions, gravity/cascades, blockers, specialist effects and rewards; **16 earned booster types** unlock at specified milestones. The source of truth is [`web/engine.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/engine.js), [`web/level-design.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/level-design.js), [`web/progression.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/progression.js) and [`web/embryon-chapters.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/embryon-chapters.js).

**300 optional elemental trials** occupy IDs 1001–1300 with requirements defined separately in [`web/elemental-challenges.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/elemental-challenges.js). They unlock powers and original royal artwork but are **not** extra fixed campaign-history days.

## Mining and economy

The mine is available from the beginning. The player strikes seeded rock tiles, finds ore or honest barren rock, uses a mine cart, refines resources and exchanges products. Upgrades modify the mine, cart and refinery. Equipment includes **40 pickaxe and 40 glove tiers** with existing approved identity/art from the mining source project. See [`web/mining.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/mining.js) and [`web/mining-gear.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/mining-gear.js).

Rupees, Star Gems, Mining Credits and Style Shards have **different internal roles**. The game does not have a real-money checkout; [`web/economy.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/economy.js) defines market and currency rules.

## Home, residence, farm and cooking

The residence has **40 paid upgrade levels** and increasing garden plot availability. The Manor is a **real Town destination**, not a second house or a distinct currency. From its controls the player can navigate to Gardens, Wardrobe and Kitchen & Dining. Real planted crops take time to grow and produce harvestable ingredients. Cooking consumes those ingredients, stores meals and grants predefined support effects on serving.

The mechanics are in [`web/town-garden.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/town-garden.js), [`web/kitchen-cooking.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/kitchen-cooking.js), [`web/town-houses.js`](https://github.com/mrcalzon02/Jewel_Brook/blob/main/web/town-houses.js) and [the Manor implementation contract](https://github.com/mrcalzon02/Jewel_Brook/blob/main/docs/TOWN_MANOR_IMPLEMENTATION.md).

**Art caveat:** The 40 house previews are not fully approved final painted exteriors; do not mistake a functional upgrade for completed environment art. Currency images, ore atlases, gemstone sprites and original generated Daysha pieces are change-controlled assets.

## World Guide

The offline World Guide lists world regions, gems, recipes, crops, equipment and royal events from actual source registries. It does not invent missing calendar month names. See [World and Story](World-and-Story.md).
