#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <cassert>
#include <fstream>
#include <iostream>
#include <sstream>
using rupee::Game;
int main(int argc,char** argv) {
    if(argc!=2){std::cerr<<"Missing exported intro campaign fixture\n";return 2;}
    Game previous;
    for(int stage=1;stage<=10;++stage) {
        std::ifstream source(argv[1]);
        assert(source.good());
        Game g(7919);
        assert(g.startIntro(stage,source));
        assert(g.level==stage);
        assert(g.width==4&&g.height==5&&g.cells.size()==20&&g.ice.size()==20);
        assert(g.moves>=12 && g.moves<=36);
        assert(g.matchedCells()==0&&g.hasMove());
        assert(g.objectiveTarget>0);
        assert((stage==3||stage==6||stage==8||stage==9||stage==10)?
            g.objectiveKind==1 : g.objectiveKind==0);
        if(g.objectiveKind==1) {
            int frozen=0, layers=0;
            for(size_t i=0;i<g.ice.size();++i)if(g.ice[i]>0){
                ++frozen;layers+=g.ice[i];
                assert(!g.adjacent(static_cast<int>(i),static_cast<int>(i)+1));
            }
            assert(frozen>0&&layers>=g.objectiveTarget);
        }
        assert(!g.won&&!g.lost);
        std::stringstream disk;
        assert(g.save(disk));
        Game restored;
        assert(restored.load(disk));
        assert(restored.cells==g.cells);
        assert(restored.ice==g.ice);
        assert(restored.moves==g.moves);
        assert(restored.objectiveTarget==g.objectiveTarget);
        assert(restored.objectiveKind==g.objectiveKind);
        assert(restored.randomState==g.randomState);
        if(stage==3){
            int original=g.moves;
            // Adjacent swaps consume a turn even without a match.
            bool accepted=false;
            for(int i=0;i<20 && !accepted;++i)
                for(int j:{i+1,i+4})if(g.adjacent(i,j)) {
                    accepted=g.swap(i,j);
                    if(accepted)break;
                }
            assert(accepted && g.moves==original-1);
            assert(g.ice.size()==20);
            assert(g.matchedCells()==0);
            std::stringstream resumed;assert(g.save(resumed));
            Game reloaded;assert(reloaded.load(resumed));
            assert(reloaded.ice==g.ice&&reloaded.iceCleared==g.iceCleared);
        }
        previous=g;
    }
    std::ifstream source(argv[1]);
    assert(!previous.startIntro(11,source));
    Game legacy;
    std::stringstream old;
    // Verify native preview v1 loads without deleting saves.
    old<<"RRNATIVE1 1 4 5 23 100 850 0 12 0 0 7919 20\n";
    for(int i=0;i<20;++i)old<<"0 ";old<<"\n";
    for(const auto& r:legacy.rocks)
        old<<r.kind<<" "<<r.hardness<<" "<<r.hits<<" "<<r.done<<" ";
    old<<"\n";
    assert(legacy.load(old));
    assert(legacy.ice.size()==20);
    assert(legacy.objectiveKind==0&&legacy.objectiveTarget==850);
    std::cout<<"Native authored intro: 10 source-derived stages, ice blockers, drag swaps, and v1/v2 saves passed\n";
    return 0;
}
