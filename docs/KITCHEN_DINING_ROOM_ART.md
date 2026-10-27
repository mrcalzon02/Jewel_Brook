# Approved Hearthside Kitchen and Cozy Dining Room

The two user-approved original 1448×1086 RGB scene paintings are preserved unchanged in the conversation artifact `RupeeRush_Kitchen_Dining_Approved_Rooms.zip`. GitHub ships optimized 1280×960 WebP backgrounds in `web/art/embryon/town/kitchen/`.

## Runtime integration

The existing Farm page now includes two separate scenic sections:
- **Hearthside Kitchen** uses `kitchen-room.webp` above the COOK buttons and the actual harvested-crop requirements.
- **Cozy Dining Room** uses `dining-room.webp` above the SERVE buttons and actual prepared-meal quantities / rewards.

The cooking and dining scenes are static full-bleed decorative backdrops. All headings, controls, reward amounts, locked states, recipe text and accessible labels remain in live HTML. This ensures localization, smaller-screen support, and accessibility without re-generating the rooms.

The mechanical contract from `RupeeKitchen` remains unchanged: cooking consumes crops and produces a persistent meal; serving consumes one meal only when its reward can be granted by the relevant established gameplay wallet. This art integration neither changes costs nor invents a new economy.

## Provenance and QA

The generated scene originals do not intentionally reproduce Zelda's Triforce or eagle crest. The broad fantasy blue/gold ornamental motifs are not linked to Nintendo logos. These backgrounds are not transparent sprites, and must not be processed by sprite slicers.

Verify with `node tests/kitchen-rooms.test.js` (two image files, content hashes, dimensions, script references) and `node tests/rupee-rush.test.js` (rendered UI sections), then the Android build/release workflow. Actual-device approval should inspect crop positioning at 360–430px portrait widths, tablet landscape, contrast under labels, and both cook/serve buttons.
