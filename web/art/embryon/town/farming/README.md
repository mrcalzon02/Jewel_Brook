# Rupee Rush farming equipment — dynamic sliced runtime candidates

This directory contains **41 alpha-transparent 192 × 192 WebP equipment sprites** extracted from the approved *Farming Tools & Equipment* sheet via the reproducible alpha-aware dynamic slicer. They are **not yet assigned to live farming mechanics**.

Assets include tools, bags, boxes, harvesting, irrigation, buildings, and boost potions. The immutable source sheets, 384px RGBA masters, QA contacts and an additional **79 overview crops** are preserved in the [Google Drive art pack](https://drive.google.com/drive/folders/1v68b2THrKke3Vui15EFe36JEfHVsxypg).

Some sprite edges have source-overlap diagnostics; consult `manifest.json` before publishing them as a finished visual set. Preserve the source PNGs and never replace the existing 10 garden seed/fertilizer icons or alter farming logic merely by adding this art.

Verification: `node tests/farming-equipment-assets.test.js`.