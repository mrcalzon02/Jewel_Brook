# Active minigame power-up families

Rupee Rush now has **16 original match-3 boosters**, **6 farming consumables**, and **6 mining consumables**. The original match-3 booster stock, level gates and engine are preserved.

Farming: Sunrise Elixir matures one selected growing plot; Raincaller Bell halves the remaining growth time across all growing plots; Bounty Charm adds two to a ready crop yield; Seed Satchel grants three unlocked crop seeds; Compost Cache gives two unlocked fertilizer units; Festival Cart sells stored harvests for 20 percent more Rupees. These use the original persistent town gardening model. Farming is accessible from Home and the Farm navigation button.

Mining: Stamina Tonic grants 5 persistent bonus strikes; Survey Flask grants 3 bonus scans; Stonebreaker Charge delivers up to 2 free hits against the marked rock; Prospector Lens scans one rock without a charge; Ore Cache adds 5 stored ore; Trade Voucher grants 200 mining credits. Bonus strikes and scans are separate from daily allowances. Deterministic rock identity and ore probabilities remain unchanged. In Dig select TARGET ROCK, then click a rock and open the POWERUPS tab.

Match-3: All 16 existing boosters remain available through the active booster shelf and shop, subject to their existing unlock thresholds.

The shop has separate singles and six curated packs (two per minigame). Daily mystery chests and purchased loot rolls can award a random farming, mining or match-3 booster with disclosed weights. No gameplay consumable spends the cosmetics-only Style Shards currency.

These items use existing committed illustration assets. The 32 future-powerup concept icons remain reserved until explicitly approved for live mechanics.

QA: node tests/mode-powerups.test.js; then every tests/*.test.js. The Android publish action runs all tests before the APK build.
