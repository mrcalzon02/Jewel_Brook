# First image-generated gem art batch — Heroes of Embryon

**This batch contains real raster illustration**, extracted from an image-generated concept sheet. It is explicitly not a programmatically drawn SVG set. Master visual authority for Daysha is `web/art/embryon/characters/daysha-approved-key-art.png`, approved in the project conversation and committed as a real PNG.

## Deliverables

Ten individual **192 × 192, RGBA** PNG gemstones: ruby, sapphire, emerald, topaz, amethyst, rose-heart, sun-star, aquamarine, sunstone and prismatic, plus a compact JPEG of the actual image-generated source atlas. Check `web/art/embryon/generated/manifest.json` for each file and Git blob SHA. The original full-sized source PNG is retained in the linked Google Drive art folder.

## Art status and corrective work

These gemstones are visual **drafts**, not final game sprites. Transparency extraction and 192px canvas checks were performed, including inspection on checkerboard, but actual browser/device QA and runtime integration have not been done. **Ruby/Sapphire/Emerald/Topaz/Amethyst currently share closely related hex outlines**; the style guide demands that baseline tile types are distinguishable without color, so they require distinct shapes at the next asset generation stage.

Do **not** treat the older procedural SVG specimens under `web/art/embryon/components` or the current `web/art.js` procedural placeholders as final artwork. This batch supersedes them as *visual references* but does not authorize overwriting game art IDs, saves, buttons or rules without integration tests.

## Authoring pipeline

Approved Daysha reference → image generation → source atlas → individual RGBA extraction → SHA/dimension/alpha checks → manual style approval → runtime mapping → mobile visual QA → release packaging. Mining rocks, pickaxes and gloves from Nut Buster stay intact; no code or packaging changes in this art batch.
