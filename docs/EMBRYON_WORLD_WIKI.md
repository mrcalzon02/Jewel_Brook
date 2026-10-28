# Jewel Brook: Heroes of Embryon — World Wiki
## A field guide to Elaranth, Embryon, and the royal timeline

This is a public reference to established game data, **not** a source of newly invented historical dates. The same material is available in-game under **WORLD GUIDE** without a network connection.

### The calendar and campaign dates
Elaranth is the nation; Embryon is the setting of Jewel Brook and the shared Daysha–Rome royal story. The Elaranth calendar has **thirteen months**. The definitive list of month names, lengths, leap-day rules, weekdays, epoch and the game's starting calendar date must be sourced from the authoritative Elaranth calendar before converting level numbers to formatted dates. Those details are **not confirmed** in the current game repo.

For the existing game, each of the 1,000 main campaign levels has one fixed canonical **campaign-day ordinal**, corresponding to that level number: stage 1 is campaign day 1, and stage 1000 is campaign day 1000. The date is **a story timeline coordinate**, not the date when a player happens to launch or replay the stage. No hidden, inaccurate thirteen-month conversion is performed.

The 300 optional elemental trials (IDs 1001–1300) are separate encounters. Their established required main level is the **earliest progression milestone**, not an additional day or a known historical date. See `web/elemental-challenges.js` for the actual requirement.

### Historical continuity
The opening scenario takes place around Daysha and King Rome's wedding; Estelle has not yet been born. The player's mines, gardens, meals, manufacturing, trade, and puzzle expedition contribute to the economy of the same realm. Royal Chronicle episodes have **separate historical dates** that have not yet been confirmed. Their story-unlock stage is for reading access only, not proof that the royal event took place on that day.

Later scenes featuring Estelle growing up remain future history. Do not infer a birth date from their reader-unlock stages. `web/royal-chronicle.js` is the entrypoint for established stories and source-approved art. The cross-story *Beneath Dappled Oaks* begins around the middle of King Rome's first regnal year, **before Estelle's birth**; a precise calendar alignment still requires a verified epoch.

### Expedition regions
The five playable underground chapters cover 200 levels each, totaling 1,000: **Goblin Caves** (1–200), **Troll Caverns** (201–400), **Sulfur Sumps** (401–600), **Mushroom Mire** (601–800), and **Ghost Mines** (801–1000). See `web/embryon-chapters.js` for the chapter artwork and metadata.

### Gemstones and stones
The authoritative playable gemstone roster, exclusions and exact introduction milestones live in `web/engine.js`, especially `TYPES`, `RETIRED_NUTS` and `NEW_INTRODUCTIONS`. Ruby, sapphire, emerald, topaz, amethyst and other authored stones retain their assigned art and existing gameplay identities. Elemental powers have distinct mechanics in `web/elemental-powers.js`. Do not remap a currency icon to a gemstone.

### Foods, crops and cooking
`web/town-garden.js` defines real crops, names, planting costs, yields, harvest levels and growth durations. `web/kitchen-cooking.js` defines **actual cookable dishes**, ingredient quantities, required house level and earned support effects. `web/kitchen-catalog.js` also contains **preview-only** future pantry recipes, which are not active crafting. The in-game field guide indexes live recipes, not fictitious craft availability.

### Tools and professions
`web/mining-gear.js` defines the 40 existing pickaxe and 40 glove tiers. Each retains its original authored icon, tier and measured strikes or scans. The original mined resources, food, tools and goods support Embryon's working population; the player is part of this economy. The field guide reads existing catalogs and makes no changes to production, balance or saves.

### Reference links
- [Playable campaign and world guide](../web/embryon-world-guide.js)
- [Royal Chronicle source](../web/royal-chronicle.js)
- [Campaign maps and chapter locations](../web/embryon-chapters.js)
- [Elemental challenge progression](../web/elemental-challenges.js)
- [Gem roster and boosters](../web/engine.js)
- [Farm and crops](../web/town-garden.js)
- [Kitchen recipes](../web/kitchen-cooking.js)
- [Mining equipment](../web/mining-gear.js)

**Canon safety:** A calendar entry belongs to the shared chronology only if its date comes from an established source. Newly assigned dates require source and revision notes; unlocking art or an event does not make its date historical.
