#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <cassert>
#include <fstream>
#include <iostream>
#include <sstream>
#include <vector>
using rupee::Game;
int main(int argc,char** argv){
    if(argc!=2){std::cerr<<"Missing source-authored campaign file\n";return 2;}
    Game g;
    {
        std::ifstream f(argv[1]);
        assert(f && g.startIntro(21,f));
    }
    assert(g.level==21 && g.cells.size()==30);
    int fireAt=-1,fireTotal=0;
    for(int i=0;i<static_cast<int>(g.elementals.size());++i){
        if(g.elementals[i]==2){fireAt=i;++fireTotal;}
    }
    assert(fireTotal==1 && fireAt>=0 && g.ice[fireAt]==0);
    assert(g.fireAuras.size()==g.cells.size());
    for(int tick:g.fireAuras)assert(tick==0);
    // Keep the objective safely out of reach only inside this diagnostic, so
    // a two-turn timer can be observed without accidentally clearing the level.
    g.objectiveKind=0;
    g.collectColor=-1;
    g.objectiveTarget=999999;
    int oldMoves=g.moves;
    assert(g.useHammer(fireAt));
    assert(g.moves==oldMoves);
    assert(g.fireActivations==1 && g.fireDetonations==0);
    int marked=-1;
    for(int i=0;i<static_cast<int>(g.fireAuras.size());++i){
        if(g.fireAuras[i]>0){
            assert(marked<0);
            marked=i;
            assert(g.fireAuras[i]==2);
            assert(g.cells[i]>=0 && g.ice[i]==0);
        }
    }
    assert(marked>=0 && marked!=fireAt);
    assert(g.elementals[fireAt]==0);
    // Fire is anchored to a cell; moving a gem may not relocate this aura.
    std::stringstream before;
    assert(g.save(before));
    Game restored;
    assert(restored.load(before));
    assert(restored.fireAuras==g.fireAuras && restored.fireActivations==1);
    assert(restored.fireDetonations==0);
    auto turn=[&](Game& state){
        for(int i=0;i<static_cast<int>(state.cells.size());++i)
            for(int j:{i+1,i+state.width})
                if(state.adjacent(i,j))return state.swap(i,j);
        return false;
    };
    assert(turn(restored));
    assert(restored.fireDetonations==0);
    assert(restored.fireAuras[marked]==1);
    std::stringstream mid;
    assert(restored.save(mid));
    Game resumed;
    assert(resumed.load(mid));
    assert(resumed.fireAuras[marked]==1);
    assert(turn(resumed));
    assert(resumed.fireDetonations==1);
    assert(resumed.fireAuras[marked]==0);
    assert(resumed.matchedCells()==0);
    std::stringstream after;
    assert(resumed.save(after));
    Game finalState;
    assert(finalState.load(after));
    assert(finalState.fireDetonations==1);
    assert(finalState.fireAuras==resumed.fireAuras);
    assert(finalState.cells==resumed.cells);
    assert(finalState.elementals==resumed.elementals);
    assert(finalState.randomState==resumed.randomState);
    // Board masks and their immovable ice layers are always source-authoritative.
    for(int i=0;i<static_cast<int>(g.cells.size());++i){
        if(g.cells[i]==-2)assert(finalState.cells[i]==-2);
    }
    for(int n=22;n<=25;++n){
        Game normal;
        std::ifstream f(argv[1]);
        assert(f && normal.startIntro(n,f));
        for(int power:normal.elementals)assert(power==0);
        for(int timer:normal.fireAuras)assert(timer==0);
        assert(normal.hasMove() && normal.matchedCells()==0);
    }
    std::cout<<"Native Fire mechanics: adjacent reaction, anchored two-turn aura, expiry and RRNATIVE6 saves passed\n";
    return 0;
}
