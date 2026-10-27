#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <cassert>
#include <fstream>
#include <iostream>
#include <sstream>
using rupee::Game;
int main(int argc,char** argv){
    if(argc!=2){std::cerr<<"Missing authoritative stage data\n";return 2;}
    auto stage=[&](Game& g,int level){
        std::ifstream source(argv[1]);
        assert(source.good()&&g.startIntro(level,source));
    };
    Game g(7919);
    stage(g,3);
    assert(g.hammerCount==3&&g.extraCount==0&&!g.claimedExtra);
    assert(!g.useHammer(-1));
    assert(g.hammerCount==3); // invalid tool use is free
    int pinned=-1;
    for(int i=0;i<20;++i)if(g.ice[i]>0){pinned=i;break;}
    assert(pinned>=0);
    const int layer=g.ice[pinned],beforeIce=g.iceCleared;
    const int remainingMoves=g.moves;
    assert(g.useHammer(pinned));
    assert(g.ice[pinned]==0 && g.iceCleared==beforeIce+layer);
    assert(g.moves==remainingMoves); // Hammer does not eat a match turn
    assert(g.hammerCount==2);
    assert(g.matchedCells()==0);
    std::stringstream save;
    assert(g.save(save));
    Game loaded;
    assert(loaded.load(save));
    assert(loaded.hammerCount==2&&loaded.extraCount==0);
    assert(loaded.ice==g.ice && loaded.iceCleared==g.iceCleared);
    assert(!g.useExtraMoves());  // unlock not earned
    stage(g,5);
    assert(!g.claimedExtra&&g.extraCount==0);
    // Source first-clear reward triggers once on successful stage completion.
    g.objectiveKind=0;g.objectiveTarget=1;
    assert(g.useHammer(0)); // +35 can complete the stage
    assert(g.won&&g.claimedExtra&&g.extraCount==3);
    assert(!g.useHammer(0)); // cannot farm stock after completion
    stage(g,6);
    assert(g.extraCount==3 && !g.won);
    const int originalMoves=g.moves;
    assert(g.useExtraMoves());
    assert(g.moves==originalMoves+5 && g.extraCount==2);
    std::stringstream snapshot;
    assert(g.save(snapshot));
    Game resumed;
    assert(resumed.load(snapshot));
    assert(resumed.extraCount==2 && resumed.claimedExtra);
    stage(resumed,10);
    assert(resumed.rowCount==0 && !resumed.claimedRow);
    resumed.objectiveKind=0;resumed.objectiveTarget=1;
    const int hammerBefore=resumed.hammerCount;
    assert(resumed.useHammer(0) && resumed.won && resumed.rowCount==3 && resumed.claimedRow);
    assert(resumed.hammerCount==hammerBefore-1);
    assert(!resumed.useRowRocket(0)); // finished stage
    std::stringstream milestone;
    assert(resumed.save(milestone));
    Game completed;
    assert(completed.load(milestone));
    assert(completed.rowCount==3&&completed.claimedRow);
    completed.won=false;completed.lost=false;
    completed.objectiveKind=0;completed.objectiveTarget=999999;
    const int row=completed.rowCount;
    assert(!completed.useRowRocket(-1));
    assert(completed.rowCount==row);
    const int oldMoves=completed.moves;
    assert(completed.useRowRocket(0));
    assert(completed.moves==oldMoves&&completed.rowCount==row-1);
    assert(completed.matchedCells()==0);
    std::stringstream after;
    assert(completed.save(after));
    Game reloaded;
    assert(reloaded.load(after));
    assert(reloaded.rowCount==2 && reloaded.claimedRow);
    std::cout<<"Native early booster diagnostics: source unlocks, valid target spending, Hammer ice, +5 moves, Row and save persistence passed\n";
    return 0;
}
