# Heroes of Embryon — Adventure Chapters

Approved **second-pass** backgrounds with a deliberately high-gloss, casual mobile-game appearance, simple readable landmarks, strong silhouettes, and identifiable obstacles. These are the selected replacements for the **earlier rejected/high-fantasy-first-pass paintings**.

| Chapter | Area | Primary environment |
|---|---|---|
| 1 | Goblin Caves | Rough timber routes, hoists, blue/green crystals, goblin workings |
| 2 | Troll Caverns | Huge stone troll faces, fortifications, wooden catwalks |
| 3 | Sulfur Sumps | Lurid sulfur runoff, rusty machinery, danger barriers |
| 4 | Mushroom Mire | Luminescent caps, submerged walkways, dark swamp water |
| 5 | Ghost Mines | Abandoned tracks, spirit flames, broken carts, spectral ruins |

## Files and integration boundary

The five `1280×720` WebP files in this directory are compressed runtime-friendly derivatives. The original approved `1672×941` PNG files are kept in the project Google Drive folder. The adjacent `manifest.json` records original filenames, SHA-256 hashes, and every runtime hash. Do not mistake these landscape panels for the pre-existing `941×1672` portrait stage-map paintings in `web/campaign-maps.js`: those maps have manually traced pixel coordinates and cannot safely be swapped wholesale without retracing the routes. This commit **adds artwork only**, not a chapter/map gameplay integration or an Android release.

Game screens should use real DOM/UI overlay text, not paint interface text onto scenery; respect focus and readable contrast. Preserve the existing main-menu Kingdom artwork and screen design.

**Approved full-resolution master assets and PNG originals:** [Embryon Adventure Chapters — Google Drive](https://drive.google.com/drive/folders/1yAeBxMTaMIFakLY3-OIDz4Gy5YNwV2Zb).
