# Rupee Rush — Heroes of Embryon: Approved Booster / VFX Art Batch

**Approved by project owner:** six original AI-generated 4×4 source atlases, 96 individual components.
**Scope:** original source sheets, each isolated as a 384px RGBA master and 192px RGBA runtime preview. These are static images, NOT animated frame sequences or wired gameplay implementations.

## Slicing and preservation

Extraction uses the existing Rupee Rush 4×4 alpha-aware dynamic-seam slicer. Individual items have a 26px transparent inset; source original atlases remain unchanged. Each SHA-256 is in `manifest.json`. The extraction algorithm and QA previews are included.

## Source sheets

| ID | Category | Sprites | Opaque seam contacts |
|---|---|---:|---:|
| 01_powerup_gems | `fantasy_jewel_power_up_icon_grid.png` | 16 | 17 |
| 02_booster_tools | `glowing_fantasy_booster_icon_collection.png` | 16 | 319 |
| 03_arcane_relics | `fantasy_rpg_icon_collection.png` | 16 | 222 |
| 04_impact_vfx | `fantasy_vfx_icon_grid.png` | 16 | 148 |
| 05_action_vfx | `glossy_crystal_magic_effects_sprite_sheet.png` | 16 | 178 |
| 06_equippable_boosters | `fantasy_rpg_booster_icon_set.png` | 16 | 0 |

## Important QA considerations

Automated SHA/dimensions/transparency/ZIP integrity checks passed; contact sheets have been visually reviewed. Several generated source atlases have glow or particle art crossing neighboring quadrants. Dynamic seam isolation prevents adjoining subjects from being imported as one piece, but an overlapping glow may be clipped at the cut; check these sprites at full resolution before final gameplay integration.
No artwork from Nut Buster was changed or overwritten. All existing Rupee Rush gameplay IDs, code and balance are untouched.

## Packaging

Every per-sheet ZIP includes the original 1254×1254 atlas, 16 384px sprites, 16 192px sprites, a contact sheet and a sheet manifest. The all-in-one ZIP includes all six source sheets, 192 individual PNGs, all QA sheets and the source script.

These named conceptual art pieces require a later mechanics-to-asset mapping and mobile-scale validation before production deployment.

## Project archive and runtime source

Approved full-resolution masters, six untouched 1254px source atlases and all 384px exports are in the [Rupee Rush Booster & VFX Google Drive library](https://drive.google.com/drive/folders/1Ox7oOMWMrcP0s-ZJ4r1yFdvRaI_axKtK).

The six tracked runtime archives in `runtime192/` include **all 96 isolated 192px transparent sprites**, names and per-sprite SHA-256. The 384px masters remain in Drive's complete packages (not represented by placeholders in this repository). Use `slice_assets.py` with the six original atlases to rebuild or adjust all source-resolution exports. No current gameplay asset paths were overwritten.

| Runtime ZIP | SHA-256 |
|---|---|
| `runtime192/01_powerup_gems-runtime192.zip` | `778b656fc4300c71b25209f11fe2fc89b0fd02f2e7b2cc7b2170df70f30f0ca1` |
| `runtime192/02_booster_tools-runtime192.zip` | `fac464b8a7b470a0a040c9b99f78f57b0ef0fc5c11ebe8c4dabf4d04c691b234` |
| `runtime192/03_arcane_relics-runtime192.zip` | `9ac4a5cf8a5d9c1a0e0a940a2e5114210e28f5f0097ae61ee9faf2edbcfa15dc` |
| `runtime192/04_impact_vfx-runtime192.zip` | `80c4c517b425e5b9f27eda33d13c24f82175dc2fae4d0e5c06bda2e5784b4dd1` |
| `runtime192/05_action_vfx-runtime192.zip` | `d0411b96db081ccad47c28fddeadada683366a7f03cf5501eec2c7feefd56cee` |
| `runtime192/06_equippable_boosters-runtime192.zip` | `cf763d09e073229249f63128432c322a85f12ce1ce925dba8c64b3538503b77f` |
