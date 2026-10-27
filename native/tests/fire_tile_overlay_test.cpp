#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <algorithm>
#include <cassert>
#include <fstream>
#include <iostream>
#include <sstream>
#include <vector>
using rupee::Game;

int main(int argc,char**argv){
    if(argc!=2)return 2;
    auto stage=[&](Game& g,int level){
        std::ifstream source(argv[1]);
        assert(source.good()&&g.startIntro(level,source));
    };
    auto nextTurn=[](Game& game){
        for(int i=0;i<static_cast<int>(game.cells.size());++i)
            for(int j:{i+1,i+game.width})
                if(game.adjacent(i,j))return game.swap(i,j);
        return false;
    };
    for(int level=45;level<=48;++level){
        Game g;
        stage(g,level);
        assert(g.level==level && g.width==6 && g.height==7);
        assert(g.matchedCells()==0 && g.hasMove());
        int fire=-1;
        for(int i=0;i<static_cast<int>(g.cells.size());++i)
            if(g.fireAuras[i]>0){
                assert(fire<0);fire=i;
                assert(g.fireAuras[i]==2);
                assert(g.cells[i]>=0 && g.ice[i]==0 && g.locks[i]==0);
            }
        assert(fire>=0);
        std::stringstream saved;assert(g.save(saved));
        Game loaded;assert(loaded.load(saved));
        assert(loaded.fireAuras==g.fireAuras);
        assert(loaded.randomState==g.randomState);
        assert(loaded.elementals==g.elementals);
        assert(loaded.activeRoster==g.activeRoster);
        // Prevent a lucky match ending the level before the two-tick timer
        // in the diagnostic alone. The shipped goal is source-authored.
        loaded.objectiveKind=0;loaded.collectColor=-1;
        loaded.objectiveTarget=1999999;
        assert(nextTurn(loaded));
        assert(loaded.fireAuras[fire]==1);
        assert(loaded.fireDetonations==0);
        std::stringstream mid;assert(loaded.save(mid));
        Game resumed;assert(resumed.load(mid));
        assert(resumed.fireAuras[fire]==1);
        assert(nextTurn(resumed));
        assert(resumed.fireAuras[fire]==0);
        assert(resumed.fireDetonations==1);
        assert(resumed.matchedCells()==0);
        assert(resumed.moves==g.moves-2);
        for(size_t i=0;i<g.cells.size();++i)
            if(g.cells[i]==-2)assert(resumed.cells[i]==-2);
        std::stringstream done;assert(resumed.save(done));
        Game again;assert(again.load(done));
        assert(again.fireDetonations==1);
        assert(again.fireAuras==resumed.fireAuras);
        assert(again.cells==resumed.cells);
    }
    // Earlier stages have no pre-seeded tile fire, even when they carry a
    // Fire elemental gem. No aura inventing or duplicate Fire icons.
    for(int level:{21,42,44}){
        Game g;stage(g,level);
        assert(std::all_of(g.fireAuras.begin(),g.fireAuras.end(),
                           [](int x){return x==0;}));
    }
    std::cout<<"Native Android-source tile Fire: levels 45-48, 2-turn anchored expiry, old Fire seed separation and save continuity passed\n";
    return 0;
}
