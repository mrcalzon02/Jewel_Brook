# Jewel Brook — Embryon citizen story and Daysha Royal Chronicle

## Historical premise
The player is an ordinary inhabitant of Embryon whose mining, farming, cooking and trading contribute to the working economy. The royal family's storyline unfolds in the same world; do **not** rewrite the player as Daysha or Rome, or credit the player for specific royal orders unless backed by an implemented delivery mechanic.

At the opening of the player's story, Daysha and Rome are newly married. Their daughter Estelle was only just conceived on the wedding night; she **has not been born**. The first 15 established Gilded Spindle episodes are staged as *reveal* milestones across the opening game. Later Estelle childhood episodes are intentionally reserved for future expansions after the first 1000 levels. Each level is approximately one campaign day, and 1000 levels ≈ 2.74 years, not the complete circa sixteen-year chronicle.

**Historical sequence vs game unlocks:** the first 15 atelier events have established relative order but no confirmed dates/reign years. Unlock stages are milestones to read the story, not assertions about when these scenes occurred. The four undated Estelle episodes are assigned future **reader access targets** at 1250, 1320, 1450, and 1520, beyond today's engine ceiling; do not claim these are canonical dates or the child's age. No birth date or reign-year slot is fabricated.

## Integration
- Data registry: `web/royal-chronicle.js` with event IDs, original summaries, trade-perspective notes, nullable historic-day/year/Estelle age, and reveal levels.
- Reader: home and expedition-map links; story list/episode reader; archival approved portrait studies.
- First-time level clear: existing result screen offers reading newly unlocked story entries. Reading access is derived from existing cleared stars, not a new save key, wallet, paid gate or repeating reward.
- Art: 13 original approved Daysha gallery files from `HB-TTRPG-tools/data/daysha-royal-purchases.json`, copied with exact upstream Git object SHA and no third-party images. Two portrait studies can be shown immediately; 11 future Estelle illustrations remain held in the game bundle until their episodes become narratively appropriate.
- The five existing cavern chapters, all 1000 puzzles, daily move bank, stage difficulty, house and garden upgrades, kitchen, shop, mining, updater, native implementations, cosmetics and currencies remain otherwise untouched.
- Do not insert cosmetic image or snapshot checks into blocking release tests.

## Working expansion backlog
1. Source and vet Daysha artwork for current (pre-birth) episodes, then add precise per-event image associations.
2. Continue Project Daysha chronology, preserve existing canon, and only update historical dates/Estelle ages when explicitly established.
3. When expanding the campaign beyond level 1000, unlock later family episodes without retroactively altering older saved-game progress.
4. Consider real player-supplied palace contracts only when the existing economy supports honest inventory debits and fulfillment. Until then, narrative trade notes are thematic and do not imply completed palace deliveries.

## Original Daysha elemental gown illustration integration
Ten source-verified original AI-generated Daysha elemental gowns are bundled offline at `web/art/embryon/story/elemental-gowns/`, with hashes, source IDs and elemental trial mapping in the adjacent `manifest.json`. The Royal Chronicle presents an illustration only after the corresponding optional elemental trial has actually been cleared and the main-story gate reached. A first-time qualifying trial clear shows a playable victory-screen entrypoint to view the dress. These are **original generated portraits of Daysha**, not photographs supplied as dress references or buyable player-avatar replacements; no receipt or canonical purchase date is invented. Earlier known royal visits and Estelle's later childhood episodes retain their own chronology. See the generated image sorting inventory for the 19 as-yet-unpublished original atelier scenes.
