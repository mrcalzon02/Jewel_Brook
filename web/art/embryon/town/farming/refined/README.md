# Jewelbrook refined farming asset library — v2

This is a **non-destructive image-only extraction pass** for two user-approved farming art sheets. It preserves all prior Town gardening seed/fertilizer art, game economy, save behavior, and active UI.

The new `refined/runtime/` directory contains **120 standalone WebP sprites**, exactly 192×192 and transparent, each with stable ID, source variant, SHA-256, and provenance in `manifest.json`. 41 use the dedicated farming-tools sheet; 79 come from the broader overview sheet. The algorithm uses source alpha components, reconnects nearby deliberate detached decoration, avoids neighboring subjects, and preserves unmodified source illustrations in the complete Google Drive package.

`web/farming-art.js` supplies the **optional** stable lookup `RupeeFarmingArt.get('watering-can')`; the clean farming-tools version is preferred when the same ID appears in both sheets. Request an explicit `variant` to select the alternate. This is *not* loaded automatically into gameplay; do not invent a farming economy or enable a new booster just because art exists.

## Validation / QA limitations

`node tests/farming-refined-assets.test.js` checks all 120 bytes/hashes/file signatures and the registry contract. The original 384px transparent PNG masters, exact unchanged original PNG sheets, reproducible script, and contact QA images are available in **RupeeRush_Farming_Art_Refined_v2.zip** in the project's Google Drive Farming Equipment folder. A few lower-row subjects inherit fine horizontal source-sheet flourishes and deserve an actual mobile visual review; the export process cannot reconstruct source pixels absent from generated art.