# Jewelbrook board motion integration — 2026-10-24

## Purpose
Restore Nut Buster's *animation and sound sequencing* without importing Nut Buster's nut-themed image/audio identities, mutating the deterministic match rules, or touching its repository.

## Runtime
- `web/board-motion.js` consumes `RupeeEngine.swap()`/`booster()` stage snapshots and gravity `falls`; it never changes game state.
- `web/game.js` keeps the puzzle board mounted while resolving moves. Inputs are locked until visual settlement. Per-cell state is repainted only when its signature changes; hazards and overlays remain bound to their cell while a separate gem payload is animated.
- Matching swaps use 225 ms eased translations. Each cascade paints before/after-clear, shakes and breaks removed gems, shows per-tile gemstone VFX, then animates each gravity/refill movement. Portal/conveyor/wind stages and deadlock repair also have visual feedback.
- A 24-pixel directional pointer gesture swaps adjacent gems using the same move path as tap selection. Reduced-motion users receive immediate states without cosmetic delays.
- `web/embryon-audio.js` plays individual, staggered, pitch-varied crystal pops for multi-gem destruction using original Jewelbrook WAVs. Sound and voice remain independently configurable; music remains in `embryon-music.js`.

## Contract
1. No full-board rerender between cascade stages; only the final post-move HUD/page render may replace the play screen.
2. Original gem assets and approved translucent tile overlays stay distinct. Animated gem payloads do not carry tile-affixed blockers.
3. Every valid adjacent swap still spends exactly one engine move and one daily move, even if it makes no match. Sound/VFX never affect scoring, RNG, objectives, or resource amounts.
4. `RupeeMotion` failures must permit final-state visual reconciliation; saves persist final engine state immediately after a valid move.
5. Keep `rupeerush.save.v1`, Jewelbrook Android signer, frozen-glow music, and independent release workflow intact.

## Automated verification
- `node tests/board-motion.test.js`
- `node tests/embryon-audio-motion.test.js`
- `node tests/rupee-rush.test.js`
- `node tests/agnostic-art.test.js`
- Run every source test in `tests/*.test.js` through the current Android release workflow.

## Manual mobile acceptance
Test swaps on a 4×5 intro board and an 8×9 irregular board; empty-cell and obstructed moves; cascades of 3+ waves; ice cracking without removing the gem; booster clears; wind/conveyor/portal transport; rotation and app resume; Android gesture ghost-click suppression; silent mode and reduced motion. Inspect rendering and audio on the actual signed APK before declaring the polish at parity.

## Remaining polish
Full original frame-by-frame booster animations, more distinct ice/chain/chest sound assets, advanced mixing sliders and announcer production are follow-up work. No unverified claim that this pass achieves complete Nut Buster audiovisual parity.
