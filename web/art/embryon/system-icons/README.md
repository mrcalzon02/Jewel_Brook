# Jewelbrook — approved system icon library

Two approved 4×4 sheets: **navigation and economy** (16 icons) and **gameplay hazards** (16 icons). Each icon is exported as an individual alpha-transparent 192×192 WebP for direct use on mobile, with its 1024×1024 optimized atlas also retained.

The 32 stable IDs and source atlas positions are enumerated in `manifest.json` with SHA-256 digests, dimensions, and original generated PNG checksums. The unmodified 1254px PNG source sheets are also preserved in the conversation's deliverable archive.

The 16 navigation/economy icons are: home, levels, mine, shop, rewards, settings, back, close, confirm, info, warning, locked, rupee, star-gems, heart, daily-moves.

The 16 gameplay icons are: match, cascade, objective, shuffle, combo, victory, defeat, bomb, frozen, poison, ward, portal, conveyor-left, conveyor-right, wind-up, wind-down.

## Integration rules

`web/system-icons.js` is the only runtime lookup contract and includes deliberate semantic aliases for pre-existing UI IDs. It must not substitute unrelated art for missing icons. Bottom navigation, top currency, status icons, and board conveyor/portal/wind markers use the approved icon family. Special-tile visuals use the previously approved unique booster artwork. Existing tile blockers, overlays, save keys, gameplay economy, music and scoring remain unchanged.

## QA

Run `node tests/system-icons.test.js` and all repository source tests. Check icon readability at actual 23–31px mobile sizes, board marker size, transparency boundaries, and Android screen scale.
