# Rupee Rush — Six-Atlas Booster and VFX Sprite Extraction QA

Extracted **96 named sprites** from **6 source atlases**, each in 384 px and 192 px transparent RGBA PNG.

Each atlas is preserved. Dynamic alpha-minimizing gutters isolate its 4×4 cells; disconnected speckles are removed. A 26px transparent safety margin surrounds every exported PNG. Source edge contacts are diagnostic flags, **not** proof that every feature is perfect.

| Sheet | 16 sprites | high-alpha seam cuts | sprites with edge contact > 10 pixels |
|---|---:|---:|---:|
| 01_powerup_gems | 16 | 17 | 0 |
| 02_booster_tools | 16 | 319 | 0 |
| 03_arcane_relics | 16 | 222 | 0 |
| 04_impact_vfx | 16 | 148 | 2 |
| 05_action_vfx | 16 | 178 | 0 |
| 06_equippable_boosters | 16 | 0 | 0 |

## Inspection
Each `qa/<sheet>-qa.jpg` renders all sixteen separated results over contrasting checkerboard and gives original extraction dimensions, disconnected-noise count and edge-contact indicators.
A nonzero seam cut indicates that adjacent generated subjects/glow overlapped in the source. Borders and padding are protected in exported PNGs, but regenerate flagged source tiles if the cut affects a main crystal tip.
The labels identify positions and intended assets; individual sprites are not wired into gameplay or sold as production-approved assets until reviewed on phones.

## Packaging
Six per-sheet ZIP archives in `packs/` each include its original atlas, sixteen high-res/low-res PNG pairs, a QA preview, and the manifest. Root manifest inventories every file by SHA-256. `Rupee_Rush_Embryon_Booster_VFX_Library.zip` contains 320 individually named PNG exports, all six source sheets, previews, manifest and source code; the six per-sheet ZIPs are uploaded separately to the same Drive folder to avoid redundant nested archives.

## Final review note
Six contact sheets visually inspected; 96 sprites have distinct subject silhouettes. Several sources contain adjacent overlapping glow and particle tails, especially the action/impact VFX sheets. This is a source limitation documented by the seam metrics, not a claim that every alpha pixel has been artistically regenerated. No game-runtime or device testing has been carried out.
