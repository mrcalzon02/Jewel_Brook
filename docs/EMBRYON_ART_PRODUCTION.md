# Heroes of Embryon — art sprint production contract

## Ticket template
```
ID: RR-ART-___
Asset: [name]
Category: character | gems | blockers | UI | environment | effect | marketing
Approved visual: crystal_princess_of_the_sky_palace.png
NUTBUSTER-R style reference: docs/wiki/FX-and-UI-Production.md
Source reference provenance: [file / SHA-256 / license]
Target path: web/art/embryon/[category]/[stable-id].png
Tile or screen state ID: [existing game identifier; do not rename]
Source art resolution: [pixels] | Delivery pixels: [pixels]
Alpha boundaries: [verified / failed] | clipping: [pass / fail]
Phone scale 32/44/56px: [pass / fail]
States: [normal / selected / disabled / matched / reduced motion]
Manifest added and valid: [pass / fail]
Real browser screenshot: [pass / fail]
GitHub commit SHA and readback: [pending until verified]
Art approval: concept | revise | approved | integrated | packaged
```

## Planned initial batches
**A. Daysha:** reference-preserving character full-body, bust and expression pack; allow art review **before** slicing and integration.

**B. Gems:** sapphire, ruby, emerald, topaz, amethyst, aquamarine as six different silhouettes, each with normal/selected sprite. Secondary prismatic and rare tiles afterward.

**C. Interface:** embossed logo, title backing, original Embryon crest, primary/secondary button set, HUD hearts, Rupees, Star Gems, power-ups and shop icons. All controls use distinct images, never emoji.

**D. Campaign:** Aurelian Court hub, Lumenwood, Shardsong Heights, Prismfall Observatory, Emberglass Depths. Keep biome names provisional until world design approval.

**E. Mining:** reuse approved original Nut Buster rocks/pickaxes/gloves, add Embryon-branded surroundings without altering equipment tiers.

## Stage gates
Concept → approved reference → isolated production art + alpha inspection → manifest → runtime integration → screenshot verification → commit/push verification → packaged release. Partial work stays marked as partial. Never add a GitHub Actions workflow for an art task. Only the Rupee Rush repository may be changed under this contract.
