#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <algorithm>
#include <cassert>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using rupee::Game;

int main(int argc,char**argv){
    if(argc!=2)return 2;
    auto loadStage=[&](Game& g,int n){
        std::ifstream input(argv[1]);
        assert(input.good()&&g.startIntro(n,input));
    };
    Game g(7919);
    for(int level=32;level<=48;++level){
        Game check;
        loadStage(check,level);
        assert(check.width==6&&check.height==7&&check.cells.size()==42);
        assert(check.matchedCells()==0&&check.hasMove());
        if(level>=35){
            assert(check.activeRoster==std::vector<int>({0,1,2,11,18}));
        }
        if(level==42){
            int count=0;
            for(int power:check.elementals)if(power==2)++count;
            assert(count==1);
        }
        if(level==35){
            int count=0;for(int effect:check.elementals)if(effect==1)++count;
            assert(count==1);  // exact authored Water seed, not a generic icon
        }
        std::stringstream saved;assert(check.save(saved));
        Game restored;assert(restored.load(saved));
        assert(restored.cells==check.cells);
        assert(restored.ice==check.ice&&restored.locks==check.locks);
        assert(restored.elementals==check.elementals);
    }

    loadStage(g,37);
    assert(!g.claimedBlast&&g.blastCount==0);
    assert(!g.useBlast(0)); // not yet earned
    int hammerAt=-1;
    for(int i=0;i<static_cast<int>(g.cells.size());++i)
        if(g.cells[i]>=0&&g.ice[i]==0&&g.locks[i]==0){hammerAt=i;break;}
    assert(hammerAt>=0);
    // Only diagnostics lower the goal. The shipped stage still uses its
    // Android-authored objective and original target.
    g.objectiveKind=0;g.collectColor=-1;g.objectiveTarget=1;
    assert(g.useHammer(hammerAt));
    assert(g.won&&g.claimedBlast&&g.blastCount==3);
    assert(!g.useBlast(hammerAt)); // cleared stage cannot spend boosters
    std::stringstream unlocked;assert(g.save(unlocked));
    Game replayed;assert(replayed.load(unlocked));
    assert(replayed.claimedBlast&&replayed.blastCount==3);
    loadStage(replayed,38);
    assert(replayed.claimedBlast&&replayed.blastCount==3&&!replayed.won);
    assert(!replayed.useBlast(-1));
    assert(!replayed.useBlast(static_cast<int>(replayed.cells.size())));
    assert(replayed.blastCount==3);

    int target=-1;
    for(int i=0;i<static_cast<int>(replayed.cells.size());++i)
        if(replayed.cells[i]>=0){target=i;break;}
    assert(target>=0);
    const auto beforeCells=replayed.cells;
    const auto beforeIce=replayed.ice,beforeLocks=replayed.locks;
    const int beforeMoves=replayed.moves;
    const int beforeClearedIce=replayed.iceCleared;
    const int beforeClearedLocks=replayed.locksCleared;
    const int beforeScore=replayed.score;
    int iceHits=0,lockHits=0,valid=0;
    const int row=target/replayed.width,col=target%replayed.width;
    for(int y=std::max(0,row-1);y<=std::min(replayed.height-1,row+1);++y)
      for(int x=std::max(0,col-1);x<=std::min(replayed.width-1,col+1);++x){
        const int i=y*replayed.width+x;
        if(beforeCells[i]<0)continue;
        ++valid;
        if(beforeIce[i]>0)++iceHits;
        else if(beforeLocks[i]>0)++lockHits;
      }
    assert(valid>0);
    assert(replayed.useBlast(target));
    assert(replayed.blastCount==2&&replayed.moves==beforeMoves);
    assert(replayed.score>=beforeScore+valid*35);
    assert(replayed.iceCleared>=beforeClearedIce+iceHits);
    assert(replayed.locksCleared>=beforeClearedLocks+lockHits);
    for(int i=0;i<static_cast<int>(beforeCells.size());++i)
        if(beforeCells[i]==-2)assert(replayed.cells[i]==-2);
    std::stringstream after;assert(replayed.save(after));
    Game resumed;assert(resumed.load(after));
    assert(resumed.blastCount==2&&resumed.claimedBlast);
    assert(resumed.cells==replayed.cells&&resumed.randomState==replayed.randomState);
    assert(resumed.ice==replayed.ice&&resumed.locks==replayed.locks);

    // A genuine RRNATIVE8 layout contains no Crystal Bomb fields.
    // Derive one from the default-state save to test backwards compatibility.
    Game preview;
    std::stringstream newer;assert(preview.save(newer));
    std::string header;assert(static_cast<bool>(std::getline(newer,header)));
    std::istringstream split(header);
    std::vector<std::string> fields;
    for(std::string word;split>>word;)fields.push_back(word);
    assert(fields.size()>4);
    fields[0]="RRNATIVE8";
    fields.erase(fields.end()-14,fields.end()-1);
    // Strip the chest-layer line newly added in the current save layout;
    // historical RRNATIVE8 contains cells/ice/locks/frozen without chests.
    std::string board,ice,locks,chests,frozen;
    assert(static_cast<bool>(std::getline(newer,board)));
    assert(static_cast<bool>(std::getline(newer,ice)));
    assert(static_cast<bool>(std::getline(newer,locks)));
    assert(static_cast<bool>(std::getline(newer,chests)));
    assert(static_cast<bool>(std::getline(newer,frozen)));
    std::ostringstream prior;
    for(const auto& part:fields)prior<<part<<' ';
    std::vector<std::string> lines;
    for(std::string line;std::getline(newer,line);)lines.push_back(line);
    assert(lines.size()>=4);
    lines.erase(lines.end()-4,lines.end()-1);
    prior<<"\n"<<board<<"\n"<<ice<<"\n"<<locks<<"\n"<<frozen<<"\n";
    for(const auto& line:lines)prior<<line<<"\n";
    std::stringstream oldSave(prior.str());
    Game migrated;assert(migrated.load(oldSave));
    assert(!migrated.claimedBlast&&migrated.blastCount==0);
    assert(migrated.cells==preview.cells);
    assert(migrated.randomState==preview.randomState);
    std::cout<<"Native stages 32-38: source Water gem, Crystal Bomb 3x3, 37 unlock, save migration passed\n";
    return 0;
}
