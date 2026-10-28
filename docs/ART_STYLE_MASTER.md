# JEWELBROOK — HEROES OF EMBRYON
## Master Art Style Guide · RR-ART-001 · Version 1.0 · 2026-10-23

**Status:** APPROVED VISUAL DIRECTION. This document governs subsequent illustration, tile, UI, world, character, animation and marketing art. “Approved” describes the style direction, not readiness of every runtime sprite.

**The visual lock:** the owner-approved illustration **`crystal_princess_of_the_sky_palace.png`** is Jewelbrook's primary character-and-material reference. Its full-size original is 1122 × 1402 RGB PNG, SHA-256 `667672081d8c59d0c1aaded6b46f185d6f1728b6d15628832d58c3234e43cf30`. This source has been approved in the project conversation; the original full-resolution binary is now committed at **`web/art/embryon/characters/daysha-approved-key-art.png`**. Check `web/art/embryon/approved-reference.json` for the machine-readable provenance record. **Never substitute earlier rejected blonde/green-eyed mockups.**

### 1. Creative direction: how Embryon should feel

**Crystal-bright heroic fantasy, rendered like a deluxe casual mobile game.** Take the high-sheen, high-saturation, soft-paint/hard-specular hybrid rendering standard already used in Nut Buster, but replace that game's nuts, acorns and woodland parody with **original gemstones, crystalline magic, courtly adventure and elemental exploration**. The look is bright, immediately friendly, tactile and intentionally luxurious. The map, menus, power-ups, currency and character portraits must all look as though they are products of *one* art department.

Never imitate Nintendo-owned visual assets, logos, character clothing, props, geography or symbols. “Vaguely Zelda-like” is genre inspiration for wonder and adventure, **not** a costume/symbol template. Embryon must be self-owned intellectual property.

**The six immutable art pillars:**
1. **High gloss:** large, deliberate specular hits on gemstones, glass, polished metal and glazed interface surfaces.
2. **Readable shape:** silhouette comes before filigree; elements must work at their final phone-screen size.
3. **Royal saturation:** sapphire and violet are the home colors; gold delivers prestige; emerald, ruby and amber deliver playful contrast.
4. **Inviting light:** sunlit skies, crystalline bounce, bright color; deep navy is for grounding, not an oppressive grimdark world.
5. **Distinct materials:** crystal refracts; gold reflects; silk shimmers; leather and stone stay relatively matte.
6. **Original coherence:** Embryon symbols, areas and characters arise from this universe rather than borrowed iconography.

### 2. Daysha — approved character lock

**Who:** Daysha, the playable elven adventurer of *Heroes of Embryon*. Her reference depicts a poised, warm, confident adult elf with expressive violet eyes, long flowing **silver/icy-blue hair**, long pointed ears and delicate gold-and-blue hair ornaments. Her face is soft-featured, intelligent and approachable; she is never a generic blond fantasy mascot.

**Approved Jewelbrook key-art costume:** sculpted ivory/pearl bodice, deep royal-blue structured fabric, layered lilac/lavender translucent drapes, luminous cobalt crystal adornments, fine champagne-gold botanical filigree and jewelry, elegant gold footwear. Character anatomy remains consistent across the UI, campaign, expedition and marketing. Her blue crystal is a floating **Embryon shard**, not a borrowed franchise relic.

**Original secondary costume:** the earlier noble adventurer character sheets establish dark navy dragon-scale armor, silver pauldrons and a blue cloak as a valid alternate **adventure/combat outfit**. This is not the default key-art costume for Jewelbrook.

**Expression set:** neutral-confidence; curious; planning/thoughtful; amused; surprised; victorious; disappointed-but-determined. Preserve hair parting, silhouette, iris color, ear proportion, nose and mouth geometry between portraits. Full-body art should not collapse into an indistinct mass of drapes when displayed small. Combat/campaign variations share the same identifiable face.

**Pose standards:** friendly open-handed invitations; one hand presenting the floating crystal; elegant, active body language. The illustration's elaborate costume and ornate architecture are reference-quality key art. **For tiny avatar portraits, reduce jewelry complexity and strengthen eye/face contrast rather than compressing the entire full-body render.**

**Do not:** recolor hair to blonde or auburn; turn irises green; replace her with a generic green-clad hero; drastically alter age or facial structure; enlarge costume ornaments until they hide the figure; crop ears, hair tips, hands or crystal glows.

### 3. Material and lighting bible

| Material | Surface treatment | Light behavior | Where it belongs |
| --- | --- | --- | --- |
| Cut crystal | Broad geometric facets, translucent-looking luminous core, sharp edge bevel | Two specular accents, small internal bounce, restrained cyan glint | Match tiles, shards, rewards, magical set dressing |
| Polished royal gold | Warm metallic rim, dark amber occlusion, creamy highlight | Bright ribbon highlights; depth from dark engraved seams | Frames, buttons, insignia, elite collectibles |
| Pearl / ivory silk | Warm high-value base, lavender form shadow, delicate highlights | Soft wide gradients, subtle specular at folds | Daysha's costume, ceremonial banners |
| Royal-blue fabric | Midnight fold shadows, electric cobalt edge-light | Satin sheen, never mirror-chrome | Daysha's dress, capes, map banners |
| Dark bedrock | Jagged macro forms, granular detail, cold occlusion | Minimal highlight; gemstone veins stand out | Mining rocks, cave walls, blockers |
| UI lacquer / enamel | Bold bevel and clear press-depth | Wide top-edge white ribbon and lower rim shade | CTA buttons, tab icons, shop cards |

**Lighting hierarchy:** key light from upper-left (warm daylight), cool blue rim from upper-right, narrow white highlight on glossy surfaces, controlled ambient bounce. FX glows must not obscure tile types, interactive labels, or Daysha's face. Gloss is a *material instruction*, not permission to blur everything with bloom.

### 4. Production color tokens

The JSON and CSS files in `web/art/embryon/` hold the implementation-friendly palette. These are initial design tokens, not an excuse to force all gems into one shape.

| Token | Hex | Use |
| --- | --- | --- |
| `--rr-night` | `#11162E` | frame, shadow, title contrast |
| `--rr-royal` | `#1F3D91` | cobalt/navy costume, HUD |
| `--rr-sapphire` | `#207CFA` | hero gem / active controls |
| `--rr-crystal` | `#52E0FF` | edge glow |
| `--rr-amethyst` | `#A567E9` | magical highlights / violet gems |
| `--rr-lilac` | `#C7B0F3` | drapery / neutral magical tint |
| `--rr-gold` | `#F6C55C` | frame edges |
| `--rr-cream` | `#FFF2C9` | gold lights / secondary text highlight |
| `--rr-ivory` | `#F8F4F5` | pale cloth |
| `--rr-ruby` | `#F23E67` | gem type / urgency |
| `--rr-emerald` | `#2CD18A` | gem type / accessible success |
| `--rr-amber` | `#FFAA3B` | sun crystal |
| `--rr-hair` | `#B8CEFA` | Daysha hair midtone |
| `--rr-iris` | `#9455D9` | Daysha iris midtone |

**Value separation:** highlights must stay clearly lighter than bases; shadow masses must stay dark enough to anchor bright crystals. No interface panel may lose text contrast against a map or illustration.

### 5. Match-3 gem art specification

The **basic launch family** is Ruby (red elongated crown), Sapphire (blue elongated hex/cut prism), Emerald (green square/octagonal cushion), Topaz (gold diamond-kite), Amethyst (violet tall double-point), Aquamarine (cyan teardrop prism). Each receives its own distinct silhouette, facet logic and reflected-light structure; colorblind users should not need hue alone. White/opal, onyx/void, rainbow/prismatic and star/heart crystals are reserved for later special/rare tile identities and must not duplicate basic silhouettes.

**Source masters:** at least 512 × 512 RGBA with 8%–10% safe area, then export 192 × 192 PNG for regular gameplay or as dictated by measured rendering. High-quality vector source is allowed when it reproduces the art direction and alpha correctly. Production sprites are **separate individually named images**, not collages, contact sheets or emoji.

**At mobile scale:** test 32, 44, 56 and 72 CSS pixels, both idle and selected, bright and dark boards. Facets should be chunky and clearly readable; glint should be one intentional highlight, not dozens of white noise particles.

**Match FX:** small break-glint → facet fracture → outward shards → fade, with gameplay state never waiting on VFX. Color-correct secondary particles identify the matched type. Reduced-motion mode substitutes a static one-frame highlight.

**Overlay invariant:** chains, frost, locks, vines and cracked ice are **alpha-through overlays**—underlying crystal remains visible in the middle. Transparent means true alpha; never fill an opening with an opaque painted color.

### 6. UI kit: jewel-box, not raw vector wireframes

**Buttons:** deep recessed dark outer shadow → metal gold rim → saturated jewel/lacquer top surface → crisp white specular strip. Hover brightens; pressed moves bevel inward; disabled desaturates but keeps text legible; primary CTA has a distinct silhouette. Keep actual screen text and accessibility labels programmatic, never baked into art.

**Panels:** deep royal-blue/obsidian glass with gold restrained corners, open breathing space, 8–16px inner padding at mobile sizes. Use ornamental flourishes only near edges so they do not contaminate numbers, scores or controls.

**HUD:** hearts/lives, ordinary Rupees, Star Gems, moves, score, booster inventory and mining resources have separate icon families, consistent proportions and one primary role per icon. Rupees and Star Gems must never become visually interchangeable. Menu/navigation icons must be actual authored icons, **not emoji placeholders**.

**Navigation:** bottom bar for Home / Campaign / Mine / Shop / Rewards / Settings. Minimum 44 × 44 CSS px active hit regions; text labels always readable in portrait orientation. Provide focus, selection and disabled states. Screen text must remain legible at 320px viewport width.

**Type:** game logo in custom dimensional lettering for title/marketing; UI uses a sharp, broadly legible sans. Use gold for display hierarchy and pale ivory for body copy. Avoid dense pseudo-medieval script on functional controls.

### 7. Environments and map identity

- **Aurelian Court** — Daysha's marble-and-gold starting hub, sapphire banners, crystal-lit terraces; bright and welcoming.
- **Lumenwood Verge** — luminous trees, emerald turquoise springs, hanging motes and botanical crystal growth.
- **Crystal Hollow** — accessible-from-start mining caverns with familiar Nut Buster **rocks, pickaxes and gloves**; mine rewards feed into match-3.
- **Shardsong Heights** — suspended stone spans, blue waterfalls, floating crystal bridges and hopeful wide skies.
- **Prismfall Observatory** — celestial machinery, violet/refraction puzzles, silver circular arches.
- **Emberglass Depths** — volcanic obsidian and orange-crimson crystal contrast; late-adventure challenge.

These names are initial Embryon proposals for the art bible, **not evidence of implemented campaign maps or new game mechanics**. Every scene needs distance/background, navigable middle, readable foreground and a reserved low-noise zone behind interactive UI.

### 8. Effects, icons and motion

**Animation beats:** idle shimmer 1–2 seconds (subtle), hover/press 100–180ms, successful match pop 300–500ms, premium victory flourish ≤ 1.5 seconds and instantly skippable. Timing values are targets to profile, not forced engine mechanics.

**Production effect atlas:** transparent 256 × 256 cells where required; padded frame gutters; manifest records frame count, frame size, rate, loop, alignment and source SHA. No overlay can block gameplay input or alter deterministic board results.

**Every effect has:** regular state, bright-board/dark-board QA, low-power fallback and reduced-motion appearance. Do not render a permanent glow field that obliterates gem silhouettes.

### 9. Mining and match-3 must look related, not identical

The **only wholesale Nut Buster art reuse expressly permitted** is rocks, pickaxes and gloves. Their original files and tier identities can remain recognizable, with Embryon-themed frame dressing around them. Do **not** overwrite those original PNGs just to achieve palette consistency. Mining is available on day one, supplements the campaign and can produce resources to purchase moves, lives and boosters. No post-campaign mining gate; no art task is authorization to rewrite mechanics, saves, economic rates or levels.

### 10. Production file layout and asset acceptance

```text
docs/ART_STYLE_MASTER.md                  ← this master specification
docs/DAYSHA_ART_CONTRACT.md                ← playable character lock
docs/EMBRYON_ART_PRODUCTION.md             ← ticket/QA requirements
web/art/embryon/
  approved-reference.json                 ← approved visual source provenance
  style-tokens.json                       ← machine-readable tokens
  style-tokens.css                        ← CSS-only design tokens
  preview.html                             ← standalone component preview
  components/royal-button.svg             ← VECTOR DESIGN SPECIMEN, NOT GAME READY
  components/crystal-medallion.svg         ← VECTOR DESIGN SPECIMEN, NOT GAME READY
tests/embryon-style.test.js                ← static production contract checks
```

All **new** images must be filed in their proper `web/art/embryon/characters|gems|ui|worlds|fx` hierarchy when built. Do not wire the master preview assets into the live game simply because they are present. The existing procedural `web/art.js` is still a placeholder pipeline.

**Approval gate:** (1) direct reference conformity and original-IP check; (2) named source + provenance + license; (3) image format/dimensions and SHA; (4) alpha and crop inspection, no clipping; (5) distinguishable 32px thumbnail; (6) full viewport browser/mobile QA; (7) manifest import and runtime screenshot; (8) verified commit; (9) separately verified package/build if shipping. The order matters. A pretty contact sheet is not a production-ready sprite set.

### 11. Reusable art-generation prompts (briefs, not source art)

**Daysha key art:** “Daysha, adult noble elven heroine, long silver-blue flowing hair, violet eyes, pointed ears; blue/white/ivory layered costume with elegant gold filigree and bright sapphire jewelry; joyful confident adventurer holding a floating faceted blue Embryon crystal; premium gloss casual-game look, crisp chunky forms and luminous reflections, jewel-bright royal fantasy, attractive but readable as a game character. Match the approved Jewelbrook Daysha reference. No blond hair, no green eyes, no green tunic, no Zelda franchise symbols. High-resolution standalone character with complete edges and plain/transparent-background output as requested.”

**Gem family:** “Individually isolated match-3 crystal gem, unique unmistakable silhouette, chunky bevels and crystal facets, specular upper-left white highlight, bright saturated body color, dark underside shadow, true transparent alpha, no border clipping; premium Nut Buster-grade casual-game illustration, no text, no emoji, no painted checkerboard.”

**Royal button:** “Original gold-beveled luxurious jewel-lacquer casual-game interface button, crisp reflective enamel, dramatic pressable rim and soft inset shadow, text-free, RGBA alpha, readable at 44px, no borrowed franchise symbolism.”

**Embryon landscape:** “Original bright royal fantasy landscape of crystalline rivers, gold-marble architecture and cobalt banners, cyan crystal illumination with sunlight, tactile illustration, deep environmental layering and uncluttered HUD-safe regions; no Hyrule landmarks or known Zelda motifs.”

### 12. Change control

This document is the master authority for Jewelbrook's **art direction**. Any intentional visual redesign requires updating this guide, the token files and the affected asset manifest in the same verified change. Gameplay integration requires a separate implementation and QA step. Do not change Nut Buster itself for a Jewelbrook art run.


## Approved master composite board — 2026-10-23

The owner-approved master composite was produced before the Jewelbrook public rename and is retained as a **character, material and interface style reference**, not a current logo or public title. Its original embedded Rupee Rush text is retired. Its image identity is recorded in `web/art/embryon/master-style-board.json`; that record is the change-controlled pointer for **all future character, gem, power-up, button, environment, typography and framing art**.

The composition presents Daysha at the left, legacy gold title lettering and Heroes of Embryon subtitle across the top, and clear labeled production-reference panels on the right: Daysha expression/wardrobe studies, six primary faceted gem colors, special pieces/boosters, jewel-box UI examples, and original crystal-world environments. **Use the accepted master composite board as the unified visual authority for a family of assets**; do not substitute the previously rejected blonde/green-eyed fantasy mockups. Her visual identity is silver-blue flowing hair, violet eyes, long pointed ears, and gold/blue/ivory crystalline regal wear; dark scale armor remains an alternate adventure outfit.

### Master-board-specific production discipline

- Main character: soft yet crisp premium-casual rendering, dimensional highlights and distinct face/ears even when reduced; use the exact approved master character as the appearance target, rather than generating a generic elf.
- Logo and metallic trim: deep navy jewel-box grounding, vivid champagne-gold extruded serif lettering, tiny sapphire ornaments; any usable logo must be its own isolated layer, not a crop containing the neighboring portrait.
- Core tile set: *ruby red*, *sapphire blue*, *emerald green*, *topaz gold*, *amethyst violet* and *rose-pink*. All require isolated transparent sprites and independent silhouettes; polished facets should echo the **same specular/occlusion treatment** seen in the approved board. Do not recycle icons by relabeling them.
- Specials: metallic rocket, star bomb, prismatic color-wild and jeweled crown are **mood references**, not implementation-ready IDs. Match the existing gameplay IDs and visual meaning before creating production sprites.
- HUD and buttons: an embossed gold/sapphire **Play** control, individual ornate navigation icons, clean inset panels. Functional text lives in the DOM; do not crop text out of the style-board collage and treat it as a button.
- Worlds: bright pearl-and-gold crystal palace, cloud-borne sky ruins, blue cavern mines and blossom-filled gardens. Their background readability must survive actual board overlays.
- Never use the composite artwork itself as a sheet for arbitrary rectangular crops. Generate each source atlas with deliberate padded regions; **no bleed from adjacent panels**, no clipped glow or half-icons, and validate against crop coordinates before publishing.
- This approval authorizes art *direction*, not automatic replacement of live game assets or release/package certification.

**Important source availability:** the full master PNG was approved in chat, and its exact dimensions and SHA-256 are preserved in the manifest. Until the original binary is copied to GitHub via a supported binary upload, `sourceImageCommitted` must stay `false`. Do not claim the PNG is checked into GitHub merely because this style guide, manifest and existing Daysha art are committed.

