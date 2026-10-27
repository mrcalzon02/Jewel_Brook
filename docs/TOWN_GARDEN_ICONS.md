# Town gardening — glossy icon set, batch 01

The Rupee Rush / Heroes of Embryon gardening source sheet has been isolated into ten 512×512 RGBA sprites. Styling: glossy Nut Buster-class fantasy casual-game materials, original Embryon emerald/sapphire/gold packaging, and unobstructed silhouettes. All ten are asset files, not a new economy or unlocked inventory.

## Existing game IDs and icon mappings

| Existing Town economy ID | Asset |
| --- | --- |
| `CROPS.carrot` | `icons/seeds-carrot.png` |
| `CROPS.wheat` | `icons/seeds-wheat.png` |
| `CROPS.berry` | `icons/seeds-bluebell-berry.png` |
| `FERTILIZERS.compost` | `icons/fertilizer-compost.png` |
| `FERTILIZERS.quality` | `icons/fertilizer-enriched.png` |
| `FERTILIZERS.royal` | `icons/fertilizer-crystal-tonic.png` |

Other assets: `icons/seeds-onion.png`, `icons/seeds-cabbage.png`, `icons/seeds-herbs.png`, `icons/seed-store-bundle.png`. The latter are **reserved art only**—do not fabricate new runtime crops or alter save schemas merely because sprites exist.

## Reproduction and asset ownership

- Source: `web/art/embryon/town/gardening/source/fantasy_gardening_supplies_icon_sheet.png`, the image generated in the Rupee Rush project chat.
- Crop logic: `web/art/embryon/town/gardening/slice_garden_icons.py`; requires Python 3 + Pillow + numpy + OpenCV. Re-running the script from its folder rebuilds ten sprites and the manifest. The preview is for QA and is not rendered in game.
- Machine-readable data, source SHA-256, per-sprite SHA-256, pixel dimensions and game-ID bindings are recorded in `manifest.json`.
- Visual QA: alpha corners, no opaque backdrop, clean separated icons, fixed 512×512 canvas. Inspect small-scale phone rendering before wiring the shop UI.
- To make these icons appear in Town, bind the paths using the mapping above in a separately reviewed UI integration, keeping mechanical IDs, transactions, mining tools and saves unchanged.
