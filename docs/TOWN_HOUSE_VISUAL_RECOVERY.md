# Town house artwork: recovered and generated visual bridge

The original Town Homestead Phase 1 Drive archive preserves plans and the functioning forty-level house economy, not approved finished house sprites. The earlier two conceptual boards were rejected for opaque background, planted plots baked into architecture, and a premature manor at level ten. Nut Buster's forty houses use setting-specific acorn/squirrel motifs; do not copy them into Embryon.

This pass adds a reproducible **transparent illustrated SVG preview for each of the forty house levels** using `scripts/generate-town-house-previews.js`. They are committed separately under `web/art/embryon/town/houses/previews/`, with explicit unapproved status in their manifest and resolver `web/town-houses.js`. They display on Home and Farm according to `saved.town.houseLevel` only. They are visual illustrations, not the final approved painting-quality RGBA sprite masters; `houses/plan.json` remains pending_review.

The farm now overlays existing real transparent `garden-plot.webp` art with growth states and real curated crop item artwork on each of eight interactive plot sockets. Growth, selection, harvest and upgrade transactions are unchanged. Every house tier and artwork path is covered by `tests/town-house-previews.test.js`.

Next art milestone: independently painted 1024×1024 transparent 3/4 isometric house masters, fixed door anchor, forty levels reviewed in 4 × (2×5) boards; 512×512 runtime; no baked functional beds, and a non-fortified manor only in the final tier. Finish proper crop plants (3 crops ×5 stages), ground modules, crops, garden props, and mobile visual acceptance before designating art complete.

All forty previews use the same extended SVG viewBox (0 -56 480 516) and stable translated/scaled group, keeping upper roofs/finials within the alpha canvas and the door near the prescribed normalized 0.5×0.8 anchor. This is source-level geometric QA only; device/image-pixel visual acceptance remains outstanding.

## Visual review viewer
Open `web/town-house-art-review.html` using the project's local HTTP preview server. It displays four ten-tier boards with alpha checkerboard, light/dark backgrounds, zoomable individual art, actual original house names/descriptions and loaded-asset counts. It does not mutate any save or alter runtime UI.
