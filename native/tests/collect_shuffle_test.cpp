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
    if(argc!=2){std::cerr<<"Missing Android campaign fixture\n";return 2;}
    auto stage=[&](Game& g,int n){
        std::ifstream f(argv[1]);
        assert(f.good());
        assert(g.startIntro(n,f));
    };
    Game game(7919);
    for(int stageNumber=18;stageNumber<=20;++stageNumber){
        Game stageGame;
        stage(stageGame,stageNumber);
        assert(stageGame.width==5&&stageGame.height==6);
        assert(stageGame.activeRoster==std::vector<int>({0,1,2,11}));
        assert(stageGame.matchedCells()==0&&stageGame.hasMove());
        assert(stageGame.elementals.size()==stageGame.cells.size());
        for(int e:stageGame.elementals)assert(e==0);
        if(stageNumber==18||stageNumber==19){
            assert(stageGame.objectiveKind==2);
            assert(stageGame.collectColor>=0);
            assert(stageGame.collected==0);
            bool found=false;
            for(size_t k=0;k<stageGame.cells.size();++k)
                if(stageGame.cells[k]==stageGame.collectColor && stageGame.ice[k]==0)found=true;
            assert(found);
        }
    }
    stage(game,18);
    assert(game.shuffleCount==0&&!game.claimedShuffle);
    assert(!game.useShuffle()); // must earn unlock first
    int target=-1;
    for(int i=0;i<static_cast<int>(game.cells.size());++i)
        if(game.cells[i]==game.collectColor&&game.ice[i]==0){target=i;break;}
    assert(target>=0);
    const int moves=game.moves;
    // Reduce the target only inside this functional test to exercise
    // source-defined first-clear grant deterministically.
    game.objectiveTarget=1;
    assert(game.useHammer(target));
    assert(game.collected>=1 && game.moves==moves);
    assert(game.won && game.claimedShuffle && game.shuffleCount==3);
    assert(!game.useShuffle()); // finished stages cannot spend
    std::stringstream earned;
    assert(game.save(earned));
    Game restored;
    assert(restored.load(earned));
    assert(restored.shuffleCount==3 && restored.claimedShuffle);
    assert(restored.collectColor==game.collectColor && restored.collected==game.collected);
    stage(restored,19);
    assert(restored.shuffleCount==3 && restored.claimedShuffle);
    assert(restored.objectiveKind==2 && restored.collected==0);
    const auto beforeIce=restored.ice;
    const int moveCount=restored.moves;
    const int goalColor=restored.collectColor;
    const int goalTarget=restored.objectiveTarget;
    const int currentScore=restored.score;
    const auto shape=restored.cells;
    assert(restored.useShuffle());
    assert(restored.shuffleCount==2 && restored.moves==moveCount);
    assert(restored.ice==beforeIce);
    assert(restored.collectColor==goalColor && restored.objectiveTarget==goalTarget);
    assert(restored.score==currentScore && restored.collected==0);
    assert(restored.matchedCells()==0&&restored.hasMove());
    for(size_t i=0;i<shape.size();++i)if(shape[i]==-2)assert(restored.cells[i]==-2);
    std::stringstream after;
    assert(restored.save(after));
    Game resumed;
    assert(resumed.load(after));
    assert(resumed.shuffleCount==2&&resumed.claimedShuffle);
    assert(resumed.cells==restored.cells&&resumed.elementals==restored.elementals);
    assert(resumed.ice==restored.ice&&resumed.randomState==restored.randomState);
    Game blocked;
    stage(blocked,18);
    blocked.shuffleCount=3;blocked.claimedShuffle=true;
    for(size_t i=0;i<blocked.cells.size();++i)
        if(blocked.cells[i]>=0)blocked.ice[i]=1;
    auto unchanged=blocked.cells;
    auto seed=blocked.randomState;
    assert(!blocked.useShuffle());
    assert(blocked.shuffleCount==3&&blocked.randomState==seed&&blocked.cells==unchanged);
    std::cout<<"Native collect/shuffle functional tests passed for Android-authored levels 18-20\n";
}
