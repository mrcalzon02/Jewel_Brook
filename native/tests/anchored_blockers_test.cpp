#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <algorithm>
#include <cassert>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using rupee::Game;

static void deterministicBoard(Game& game) {
    for(int y=0;y<game.height;++y)
        for(int x=0;x<game.width;++x)
            game.cells[y*game.width+x]=(x+y)%3;
    // The diagonal pattern alone has no legal moves; one authored-style
    // variation keeps a move available without creating a starting match.
    game.cells[0]=2;
    assert(game.matchedCells()==0&&game.hasMove());
}
int main() {
    // Native source stage 125 remains deliberately NOT importable.
    Game blocked(7919);
    std::istringstream noCatalog("");
    assert(!blocked.startIntro(125,noCatalog));
    blocked.startLevel(125);
    deterministicBoard(blocked);
    const int rock=blocked.width+2;
    const int rockGem=blocked.cells[rock];
    blocked.rockLayers[rock]=2;
    blocked.rowCount=2;
    assert(!blocked.adjacent(rock,rock+1));
    assert(blocked.useRowRocket(rock)); // exactly one damage hit per square
    assert(blocked.rockLayers[rock]==1);
    assert(blocked.cells[rock]==rockGem); // hit rock, not underlying gem
    assert(!blocked.adjacent(rock,rock+1));
    assert(blocked.useRowRocket(rock));
    assert(blocked.rockLayers[rock]==0);
    assert(blocked.adjacent(rock,rock+1)); // unpinned when last layer breaks

    Game vine(7919);
    // Isolate timed vines from the still-gated stage-125 conveyor turn.
    vine.startLevel(124);
    deterministicBoard(vine);
    const int origin=2*vine.width+2, north=origin-vine.width;
    const int oldNorth=vine.cells[north];
    assert(vine.cells[origin]!=oldNorth);
    vine.vineAuras[origin]=2;
    vine.rockLayers[origin+vine.width]=2;
    vine.specials[north]=1;vine.holds[north]=2;
    assert(!vine.adjacent(origin,origin+1));
    assert(vine.swap(0,1)); // first turn: vine remains anchored
    assert(vine.vineAuras[origin]==1);
    assert(!vine.adjacent(origin,origin+1));
    std::stringstream saved;
    assert(vine.save(saved));
    const std::string versioned=saved.str();
    assert(versioned.rfind("RRNATIVE14 ",0)==0);
    Game restored(7919);
    std::istringstream savedIn(versioned);
    assert(restored.load(savedIn));
    assert(restored.rockLayers==vine.rockLayers);
    assert(restored.vineAuras==vine.vineAuras);
    assert(restored.specials==vine.specials&&restored.holds==vine.holds);
    assert(restored.swap(0,1)); // second turn: source-defined vine expiry
    assert(restored.vineAuras[origin]==0);
    assert(restored.rockLayers[origin+restored.width]==2);
    assert(restored.adjacent(origin,origin+1));
    assert(restored.cells[north]==restored.cells[origin]); // first free cardinal neighbor
    assert(restored.specials[north]==1&&restored.holds[north]==2); // only type copied

    // A plain pre-stage-125 save retains the RRNATIVE13 encoding and loads
    // with zero new anchored arrays, preserving existing player saves.
    Game ordinary(7919);
    std::stringstream legacy;
    assert(ordinary.save(legacy));
    assert(legacy.str().rfind("RRNATIVE13 ",0)==0);
    Game migrated(7919);
    assert(migrated.load(legacy));
    assert(std::all_of(migrated.rockLayers.begin(),migrated.rockLayers.end(),[](int n){return n==0;}));
    assert(std::all_of(migrated.vineAuras.begin(),migrated.vineAuras.end(),[](int n){return n==0;}));

    // Malformed RRNATIVE14 timers fail atomically; never corrupt a live save.
    std::string corrupt=versioned;
    const size_t last=corrupt.find_last_not_of("\n\r ");
    assert(last!=std::string::npos);
    const size_t start=corrupt.rfind('\n',last);
    assert(start!=std::string::npos);
    corrupt.replace(start+1,1,"9"); // invalid vine duration, max 2
    const auto oldCells=restored.cells,oldRock=restored.rockLayers;
    std::istringstream bad(corrupt);
    assert(!restored.load(bad));
    assert(restored.cells==oldCells&&restored.rockLayers==oldRock);
    std::cout<<"Rock hit/release, vine timer/expiry, anchored conveyor prerequisites, RRNATIVE14 and legacy saves passed\n";
    return 0;
}
