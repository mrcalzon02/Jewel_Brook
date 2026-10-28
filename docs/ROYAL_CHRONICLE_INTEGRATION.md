# Jewel Brook — Embryon citizen story and Daysha Royal Chronicle

## Historical premise
The player is an ordinary inhabitant of Embryon whose mining, farming, cooking and trading contribute to the working economy. The royal family's storyline unfolds in the same world; do **not** rewrite the player as Daysha or Rome, or credit the player for specific royal orders unless backed by an implemented delivery mechanic.

At the opening of the player's story, Daysha and Rome are newly married. Their daughter Estelle was only just conceived on the wedding night; she **has not been born**. The first 15 established Gilded Spindle episodes are assigned to **actual days on the same timeline** as the player's adventures. Completing each main level for the first time advances the royal and citizen chronicle by exactly one day. Estelle's childhood scenes remain future expansions beyond the opening 1,000 levels, an early part of the circa sixteen-year story. Calendar-year conversion awaits the thirteen-month Elaranth canon.

**Single canonical chronology:** an event assigned to Level N occurs on Campaign Day N. The same victory advances both the player's story and the royal family's; the associated reader entry becomes available because that day happened. The 15 current atelier events have day positions identical to their stages. Estelle's four future events occupy Days 1250, 1320, 1450, and 1520 beyond the current engine ceiling. Their exact month, regnal year and Estelle's age still require canonical calendar alignment. Existing Friday/Sunday phrasing must be checked for consistency before assigning weekdays.

## Integration
- Data registry: `web/royal-chronicle.js` with event IDs, original summaries, trade-perspective notes, historical day equal to assigned level, nullable calendar year/Estelle age, and established story IDs.
- Reader: home and expedition-map links; story list/episode reader; archival approved portrait studies.
- First-time level clear: advances the joint chronology to that day, triggers that day's royal events, and makes their Chronicle entries readable. Reading access uses existing cleared stars, not a new save key, wallet, paid gate or repeating reward.
- Art: 13 original approved Daysha gallery files from `HB-TTRPG-tools/data/daysha-royal-purchases.json`, copied with exact upstream Git object SHA and no third-party images. Two portrait studies can be shown immediately; 11 future Estelle illustrations remain held in the game bundle until their episodes become narratively appropriate.
- The five existing cavern chapters, all 1000 puzzles, daily move bank, stage difficulty, house and garden upgrades, kitchen, shop, mining, updater, native implementations, cosmetics and currencies remain otherwise untouched.
- Do not insert cosmetic image or snapshot checks into blocking release tests.

## Working expansion backlog
1. Source and vet Daysha artwork for current (pre-birth) episodes, then add precise per-event image associations.
2. Align the verified thirteen-month Elaranth calendar to Campaign Day 1; preserve assigned event-day positions and only assign months, weekdays, years, birth dates, and Estelle ages from supported canon.
3. When expanding the campaign beyond level 1000, unlock later family episodes without retroactively altering older saved-game progress.
4. Consider real player-supplied palace contracts only when the existing economy supports honest inventory debits and fulfillment. Until then, narrative trade notes are thematic and do not imply completed palace deliveries.

## Original Daysha elemental gown illustration integration
Ten source-verified original AI-generated Daysha elemental gowns are bundled offline at `web/art/embryon/story/elemental-gowns/`, with hashes, source IDs and elemental trial mapping in the adjacent `manifest.json`. The Royal Chronicle presents an illustration only after the corresponding optional elemental trial has actually been cleared and the main-story gate reached. A first-time qualifying trial clear shows a playable victory-screen entrypoint to view the dress. These are **original generated portraits of Daysha**, not photographs supplied as dress references or buyable player-avatar replacements; no receipt or canonical purchase date is invented. Earlier known royal visits and Estelle's later childhood episodes retain their own chronology. See the generated image sorting inventory for the 19 as-yet-unpublished original atelier scenes.
