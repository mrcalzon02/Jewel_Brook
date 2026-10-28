# Heroes of Embryon — approved asset integration pass 2

## Runtime implementation

Uses the user-approved 192px isolated sprite sheets, not panel crops or newly invented artwork. Sources: six booster/VFX sliced packs and the 160-gem sprite library previously archived in the Jewelbrook Google Drive. Every runtime sprite is its own WebP with original alpha padding and independently verified hashes in `web/art/embryon/runtime/manifest.json`.

- All **16** existing `RupeeEngine.BOOSTERS` have dedicated high-gloss Embryon icon images rendered on the gameplay board and in the shop. Existing item IDs, prices, unlock gates, effects, achievements and saves stay unchanged.
- All **16** boosters have mapped effect artwork, together with match, cascade and victory artwork. The game displays each static impact image with a short CSS pulse/fade animation above the board. This is a first-pass functional VFX system, not hand-keyframed frame animation. Visual overlay never receives pointer events or changes gameplay state.
- **9 further gemstone identities** are mapped to the approved 160-gem library, adding citrine, diamond, moonstone, garnet, onyx, opal, jade, tanzanite and alexandrite. The existing original seven illustrated stones remain intact. Turquoise and lapis have no accurately labeled equivalents in the approved sliced library and deliberately remain procedural until their distinct art is approved; peridot is retired from play.
- Announcer: existing **Embryon Wayfinder** is still the original 109-line written recording script. Booster use now routes through the most appropriate existing specific line categories (hammer, rocket, bomb, shuffle and color). **No Nut Buster recording is used.** Device text-to-speech preview is still opt-in and there are no completed professional voice takes.
- Preserve the five 200-stage chapters, chapter artwork, shop and mine location screens, save namespace, gameplay mechanics, and Android signer. No new GitHub Actions.

## Validation and limitations

`node --test tests/embryon-runtime-assets.test.js` validates every icon/effect ID against the actual extracted binary, file size, SHA-256 and transparency padding. Existing full repo tests are required. Browser smoke navigates to shop, chapter map and level, validates 16 booster icons and playable board on mobile viewport; this is **not** an actual Android physical device certification. New artwork should be verified on phone before calling a build production-ready.

Do not treat the ZIP archives in `web/art/embryon/booster-vfx/runtime192/` as directly loadable browser image files. Only the individually extracted runtime assets in `web/art/embryon/runtime/` are loaded by the game.
