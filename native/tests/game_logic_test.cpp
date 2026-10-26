#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <cassert>
#include <sstream>
#include <iostream>
using rupee::Game;
int main() {
    Game a(7919),b(7919);
    assert(a.cells==b.cells);
    assert(a.matchedCells()==0);
    assert(a.hasMove());
    assert(a.width==4 && a.height==5 && a.rosterSize()==3);
    assert(!a.swap(-1,2));
    assert(!a.swap(0,19));
    assert(a.swap(0,1)); // adjacent swaps accepted even when not a match
    assert(a.moves==23);
    assert(a.matchedCells()==0);
    assert(a.mine(0));
    assert(a.strikes==11);
    assert(a.rocks[0].hits==1);
    for(int i=1;i<16 && a.strikes>0;++i)a.mine(i);
    assert(a.strikes==0);
    assert(!a.mine(15));
    std::stringstream archive;
    assert(a.save(archive));
    Game restored;
    assert(restored.load(archive));
    assert(restored.cells==a.cells);
    assert(restored.score==a.score && restored.ore==a.ore);
    assert(restored.strikes==0 && restored.rocks[0].hits==a.rocks[0].hits);
    std::stringstream corrupt("RRNATIVE1 1 200 201 23 0 850 0 12 0 0 1 40200");
    assert(!restored.load(corrupt));
    restored.startLevel(11);
    assert(restored.width==5 && restored.height==6);
    assert(restored.matchedCells()==0 && restored.hasMove());
    std::cout<<"Native functional diagnostics: seed, drag-swap model, cascades, approved mine mechanics, and save validation OK\n";
}
