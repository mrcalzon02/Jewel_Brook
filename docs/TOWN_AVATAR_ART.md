# Jewelbrook — Town · Daysha Level Avatar Archive (01–40)

**Town** is the name of the avatar progression/location presentation (not a rename of the existing save schema, match-3 campaign, or mining economy). Do not change the game’s `rupeerush.save.v1` key when implementing Town.

## Files

- Original 10×4 concept snapshot used to extract variants: preserved, hash-identified, on [Jewelbrook Google Drive](https://drive.google.com/file/d/1OCAyiEwIEpE2x05jYFPcA8KbiQQiDfXz/view?usp=drivesdk) (3.5 MB; not duplicated in GitHub due to binary upload limit).
- `web/art/embryon/town/source/slice_from_snapshot.py`: original extraction recipe, retained for provenance; its source and output paths are absolute historical development paths, not a plug-and-play generator.
- `web/art/embryon/town/avatars/daysha_lv_01.png` through `daysha_lv_40.png`: forty independent **288×480 RGBA PNGs**, with official, legible, sapphire-and-gold level plaques. They have transparent corners and eight-pixel clear boundaries.
- `web/art/embryon/town/sheets/daysha_levels_01-10.png`, `11-20.png`, `21-30.png`, `31-40.png`: four independent **1536×1024 RGBA** atlas views.
- `web/art/embryon/town/manifest.json`: level / basename / sheet / SHA-256 / provenance contract.
- `web/town-avatars.js`: dependency-free browser/Node asset-path resolver (read-only; does not mutate or migrate saves).
- `tests/town-avatars.test.js`: verifies 40 distinct numbered assets, signatures, dimensions, hashes, sheet ranges and Level-40 clamping.

## Intended runtime behavior

`RupeeTownAvatars.fromSave(saved).path` chooses Daysha’s level-appropriate Town avatar. `saved.unlocked` already stores the campaign’s next-unlocked level. Town portraits stop upgrading after Level 40; **no campaign levels, progression, resource consumption, unlock rules or saves are changed here**.

The Tier 1–40 images are complete full-body Daysha outfit/avatar illustrations, **not tiny accessories to a second character portrait**. The actual Home/Manor avatar is now selected using `web/town-character.js` from `saved.cosmeticEquipped.outfit` (validated against owned outfits and the existing economy catalog). It is rendered as one large, centrally placed figure. A generic generated `character-XX` card is **never** substituted as Daysha's actual Town avatar. The existing `RupeeTownAvatars.fromSave` remains a read-only tier-asset resolver for use in other level galleries; equipped outfit choice controls the live hero appearance. The 40 house upgrades, mining, rewards and save key remain independent. Fallback is the existing Daysha art; no portrait grants gameplay bonuses.

## Caveats and QA

The source is a **composite generated concept snapshot**, so individual avatars have only the intrinsic resolution of the original 10×4 grid; scaling to 288×480 does not recreate lost detail. Some flowing fabric/long ear and staff details are imperfect. The original alpha export is transparent, not checkerboard art. Preserve all 40 source images in GitHub and the untouched source snapshot in the project Google Drive to make future re-authoring safe.

Review on device for alpha fringes and legibility at UI display size; replace individual sprites only after review. Do not advertise these 40 as independently hand-drawn high-resolution sprites.

## Home/Manor integration correction

The currently equipped outfit is the **whole avatar** in both Town Home and the residence screen. The earlier `profile-avatar` generated SVG and separate small `profile-outfit` image have been removed from those views. Wardrobe opens the real Outfit shop and its existing equip transaction; the Town hero updates after a normal save/render cycle. Character-card collectibles may still exist as independent cosmetic inventory but are not player-character portraits. The full-size figure remains central on phone and desktop; no extra avatar render appears above the interactive farm plots.
