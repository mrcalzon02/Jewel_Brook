# Jewel Brook — seasonal crop growth and Farmer’s Almanac translation

This document is the implementation reference for **48 real garden crop IDs** in `web/town-garden.js`. It preserves existing art assets, seeds, yields, store prices, recipes, glove bonuses, house levels, fertilizer purchases, and the permanent Android save namespace.

## Core rule: missions become growing days

- The wedding is Day 0 on the **working** Elaranthi date of 1 Thawcall, 282 S.M. Each **first-time victory on a main match-three level** advances the shared royal, player, and farm timeline by one day. Replays, failed attempts, and elemental trials advance no days.
- **Peak season:** one successfully cleared new level matures a crop. **Deeply off-season:** at most six such days without bonuses. Intermediate times gradually change daily growth speed based on circular distance to preferred growing-month centers. Multi-season crops such as spinach can thrive in spring and autumn.
- Each daily increment uses the actual Elaranthi calendar date. Changing into better or worse weather gradually changes crop speed **while planted**; a frozen planting-duration estimate never prevents improvements from taking effect.
- The existing fertilizer types (Garden Compost, Fortified Soil, Royal Crystal Feed), home-level growth improvement, instant Sunrise Elixir, Raincaller Bell, and Bounty Charm remain functional. They accelerate growth or improve harvest without creating extra days. **No automatic harvest or currency minting** occurs.
- Existing **real-time** garden plots remain valid with their original `plantedAt`/`readyAt` values; only newly planted crops use `mode:"campaign-day"` with day and work units. New data is saved in existing `town.plots`. Old data and supplies are retained.
- Once a crop is ready, the player still chooses **HARVEST** manually. The farm inventory and cooking mechanics are not rewritten.

This is a **game-time abstraction**, not a claim that tomatoes or apple trees mature biologically in one to six literal real days. Real-world typical maturity periods and planting seasons are reference inputs; Elaranth’s 13×28-day calendar and the player’s one-level-one-day rhythm are fantasy gameplay.

## Seasonal translation

The canonical Elaranth almanac describes Thawcall as late winter turning to thaw, Seedwake and Leafrise as spring, Sunsreach through Deepdelve as summer, and Frostgate through Hearthwane as winter. Rather than treating the thirteen months as Gregorian month numbers, each crop receives one or two *Elaranthi preferred peak months*. The model smoothly interpolates daily effectiveness across the 364-day fictional year. This is an outdoor temperate-farming assumption; a future greenhouse system could explicitly alter it but is **not silently enabled**.

Real-world growing-season guidance distinguishes hardy cool-weather crops (carrots, greens, peas, cabbage, spinach, brassicas) from warmth-demanding crops (tomatoes, peppers, squash, melons, cucumbers). Historical real-world days-to-maturity vary by variety, location, transplanting method, and frost conditions. The approximate analogue numbers below are planning context, **not universal crop specifications**. Fantasy herbs, tropical fruit, and perennial orchard species are season-mapped without claiming a single real-world seed-to-harvest duration.

## Existing 48-crop roster

| Authored crop | Peak Elaranthi month(s) | Approximate Earth maturity reference |
| --- | --- | --- |
| Hawseed Carrot | Seedwake, Casktide | 70 real days (analogue) |
| Sunwheat | Sunsreach, Casktide | 110 real days (analogue) |
| Bluebell Berry | Deepdelve, Goldgrain | — |
| Ruby Radish | Seedwake, Casktide | 30 real days (analogue) |
| Moonleaf Lettuce | Leafrise, Casktide | 45 real days (analogue) |
| Sweetpod Peas | Leafrise, Amberfall | 65 real days (analogue) |
| Frostmint | Longnight | — |
| Copper Potato | Bloomtide, Amberfall | 85 real days (analogue) |
| Amber Onion | Seedwake, Casktide | 95 real days (analogue) |
| Nightshade Spinach | Seedwake, Casktide | 50 real days (analogue) |
| Crimson Beet | Leafrise, Amberfall | 50 real days (analogue) |
| Sunblush Strawberry | Sunsreach, Haycrest | — |
| Blazevine Tomato | Deepdelve | 80 real days (analogue) |
| Pearl Cabbage | Leafrise, Casktide | 85 real days (analogue) |
| Goldrunner Beans | Deepdelve | 65 real days (analogue) |
| Silver Garlic | Casktide, Seedwake | — |
| Golden Corn | Deepdelve | 80 real days (analogue) |
| Firecrest Pepper | Deepdelve | 75 real days (analogue) |
| Evergreen Broccoli | Leafrise, Casktide | 75 real days (analogue) |
| Dewdrop Cucumber | Deepdelve | 60 real days (analogue) |
| Cloudbloom Cauliflower | Leafrise, Casktide | 80 real days (analogue) |
| Ironleaf Kale | Leafrise, Frostgate | 55 real days (analogue) |
| Velvet Raspberry | Deepdelve, Amberfall | — |
| Sungold Sunflower | Deepdelve | — |
| Duskstripe Zucchini | Deepdelve | 55 real days (analogue) |
| Violet Eggplant | Deepdelve | 75 real days (analogue) |
| Harvest Pumpkin | Goldgrain | 100 real days (analogue) |
| Highland Barley | Sunsreach, Amberfall | — |
| Moonwater Rice | Goldgrain | — |
| Cloud Cotton | Goldgrain | — |
| Crystal Sugarcane | Goldgrain | — |
| Emberleaf Herbs | Sunsreach, Amberfall | — |
| Royal Lavender | Haycrest | — |
| Mistvale Tea | Haycrest | — |
| Sunburst Daisy | Bloomtide, Amberfall | — |
| Silverglow Tulip | Leafrise | — |
| Moonshadow Rose | Sunsreach, Goldgrain | — |
| Nightfall Coffee | Deepdelve | — |
| Arcane Orchid | Goldgrain | — |
| Starlight Grapes | Goldgrain | — |
| Crystal Melon | Goldgrain | 85 real days (analogue) |
| Royal Watermelon | Goldgrain | 85 real days (analogue) |
| Gilded Apple | Goldgrain | — |
| Moonstone Pear | Goldgrain | — |
| Blushfire Peach | Deepdelve | — |
| Sunspire Pineapple | Goldgrain | — |
| Dragonheart Fruit | Goldgrain | — |
| Astral Starfruit | Goldgrain | — |

## External agronomy references

- [The Old Farmer’s Almanac — Fall vegetable gardening](https://www.almanac.com/how-plant-fall-vegetable-garden): cool-season greens, brassicas and autumn crops.
- [The Old Farmer’s Almanac — Best fall vegetables](https://www.almanac.com/best-vegetables-fall-garden): crop frost-tolerance and days-to-maturity planning.
- [CSU Extension — Vegetable Planting Guide](https://extension.colostate.edu/resource/vegetable-planting-guide/): contrasting hardy, semi-hardy and warmth-demanding vegetables.
- [WVU Extension — Succession Planting](https://extension.wvu.edu/lawn-gardening-pests/gardening/garden-management/succession-planting): planting-month windows and typical harvesting-duration ranges.
- [University of California Master Gardeners — Time of Planting](https://www.ucanr.edu/program/uc-master-gardener-program/time-planting): regional planting windows demonstrate why there is no single universal Gregorian crop calendar.
- [Home Brew Table Top — Authoritative Elaranth Almanac](https://github.com/mrcalzon02/HB-TTRPG-tools/blob/main/elaranth-almanac.html): 13 months and fantasy seasonal geography.

No Moon/astrology multiplier has been applied to crop speed; the almanac’s lunar observances remain **world-calendar facts**, not unverified agricultural physics or forced bonus gameplay.

## QA contracts

Existing functional tests verify first-clear-only advancement, one-day winter peak, six-day opposite-season growth, fertilizer speed, power-up interactions, legacy timer migration, complete crop coverage, save persistence, and live farm UI. Do not disable these tests or replace completed artwork.
