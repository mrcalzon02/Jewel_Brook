#pragma once
// Native gameplay adapter for the source-equivalent conveyor primitive.
// This deliberately does not unlock Android stage 125: native stage import,
// anchored rock/vine state and full turn/goal parity still need acceptance.
#include "game_logic.h"
#include "conveyor_motion.hpp"
#include <cstddef>
#include <vector>

namespace rupee {
inline bool advanceConveyor(Game& game, int oneBasedTurn) {
    if (game.level < 125 || oneBasedTurn < 1 ||
        game.width <= 0 || game.height <= 0) return false;
    const size_t n = game.cells.size();
    if (n != static_cast<size_t>(game.width) * static_cast<size_t>(game.height) ||
        game.ice.size() != n || game.locks.size() != n ||
        game.chests.size() != n || game.frozen.size() != n ||
        game.jam.size() != n || game.poison.size() != n ||
        game.elementals.size() != n || game.specials.size() != n ||
        game.holds.size() != n) return false;

    std::vector<conveyor::Tile> tiles(n);
    for (size_t i = 0; i < n; ++i) {
        auto& t = tiles[i];
        t.type = game.cells[i];
        t.ice = game.ice[i];
        t.lock = game.locks[i];
        t.chest = game.chests[i];
        t.frozen = game.frozen[i];
        t.jam = game.jam[i];
        t.poison = game.poison[i];
        t.elemental = game.elementals[i];
        t.special = game.specials[i];
        t.hold = game.holds[i];
    }
    const auto belts = conveyor::make(game.level, game.width, game.height, tiles);
    if (belts.empty()) return false;
    const auto before = tiles;
    conveyor::advance(tiles, belts, oneBasedTurn);
    bool moved = false;
    for (size_t i = 0; i < n; ++i)
        if (before[i].type != tiles[i].type ||
            before[i].elemental != tiles[i].elemental ||
            before[i].special != tiles[i].special ||
            before[i].hold != tiles[i].hold) {
            moved = true;
            break;
        }
    if (!moved) return false;
    // Only gem-carried data moves. Board-anchored hazards and blockers stay put.
    for (size_t i = 0; i < n; ++i) {
        game.cells[i] = tiles[i].type;
        game.elementals[i] = tiles[i].elemental;
        game.specials[i] = tiles[i].special;
        game.holds[i] = tiles[i].hold;
    }
    return true;
}
} // namespace rupee
