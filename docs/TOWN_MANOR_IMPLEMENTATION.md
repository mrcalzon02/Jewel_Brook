# Town Residence / Manor House — implementation and art contract

## Playable feature

The **Manor House** is a real Town destination, linked from Home and Farm.
The resident building is a single existing 40-level progression, not a second
house wallet or duplicative manor economy. Levels 1–35 are the Hawseed/Garden/
Townhouse/Noble residence progression; **36–40 are Royal Manor tiers**.
The Manor page shows the correct owned residence level, building preview,
available plot capacity, actual upgrade price and Rupee balance. Its Upgrade
button calls `RupeeTownGarden.upgradeHouse(saved)` and uses the ordinary save
path. If funds are insufficient or tier 40 is reached it is disabled.

Manor rooms are actual navigation, not inert decorative controls:

- **Wardrobe:** `open-wardrobe` opens the **Outfits** shop (not Character Cards)
  and its existing equip transaction. The equipped illustrated full-body
  outfit is the Town hero/avatar.
- **Gardens:** enters the actual Farm, where plots, seed purchases, cultivation,
  harvest and upgrades continue to function.
- **Kitchen & Dining:** enters the existing Farm cooking/serving section, keeping
  actual ingredients, prepared meals and reward logic.

`saved.unlocked`, `saved.rupeeExpedition`, cosmetic inventory, farming plots
and the existing `rupeerush.save.v1` persistence key remain independent.
No new residence currency or mannequin/ASCII placeholder was created.

## Future approved-art production, no substitution

The existing `web/art/embryon/town/houses/previews/house_lv_01.svg`
through `house_lv_40.svg` are **unapproved architectural previews only**.
This implementation uses those established previews until the manor is painted,
and labels them as such. Do not replace them with Nut Buster houses, fake
castles, newly generated stand-ins, or generic game art.

The owner-requested manor artwork still needed:

1. Level 36, 37, 38, 39, 40 **five independent** transparent painted exterior
   masters in approved Jewelbrook luminous palace style, matching existing
   tier-by-tier geometry and preserving door/yard anchors.
2. Full facade and accessible yard view with no crops or plot locations baked
   into the building sprites. The existing eight garden slots must remain live.
3. Optional approved interior room images for Wardrobe, foyer, and pantry.
   The currently integrated Kitchen/Dining art remains reused, not duplicated.
4. Final master review for camera, edge alpha, consistency, character scale,
   and compositing. Transparent runtime PNG/WebP derived after sign-off.

The architecture is a **residential royal manor, not a castle**, per
`docs/TOWN_HOMESTEAD_DESIGN.md`. The same user-approved full-body outfit is
Daysha's one prominent avatar on Home and inside the Manor; it is not a tiny
thumbnail, overlay on a generated character-card SVG, or an additional figure.

## Functional release checks

`tests/rupee-rush.test.js` covers actual Manor navigation, paid home
upgrades, independent campaign state, Wardrobe → outfit shop, Kitchen → real
cooking controls, and Garden → farm controls. `tests/economy-market.test.js`
checks that changing the outfit changes the Daysha avatar, while changing an
independent character-card collectible cannot replace that image.

Do not introduce screenshot-comparison or cosmetic blockers in CI. The Android
signed-APK workflow already runs both existing functional suites. 
