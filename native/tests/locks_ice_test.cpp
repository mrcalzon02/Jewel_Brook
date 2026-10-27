#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <cassert>
#include <algorithm>
#include <fstream>
#include <sstream>
#include <iostream>
#include <vector>
using rupee::Game;
int main(int argc,char**argv) {
    if(argc!=2)return 2;
    auto stage=[&](Game& g,int n){std::ifstream f(argv[1]);assert(f&&g.startIntro(n,f));};
    Game g;
    stage(g,28);
    assert(g.level==28&&g.width==5);
    int locked=-1,iceGem=-1,initialLocks=0;
    for(int i=0;i<static_cast<int>(g.cells.size());++i){
        if(g.locks[i]>0){if(locked<0)locked=i;initialLocks+=g.locks[i];}
        if(g.elementals[i]==3){assert(iceGem==-1);iceGem=i;}
    }
    assert(locked>=0 && initialLocks>0 && iceGem>=0);
    assert(g.ice[iceGem]==0&&g.locks[iceGem]==0);
    assert(!g.adjacent(locked,locked+1));
    assert(g.objectiveKind>=0&&g.objectiveKind<=3);
    const int oldMoves=g.moves,oldLock=g.locks[locked],oldClears=g.locksCleared;
    assert(g.useHammer(locked));
    assert(g.locks[locked]==0&&g.locksCleared==oldClears+oldLock);
    assert(g.moves==oldMoves);
    std::stringstream lockSave;assert(g.save(lockSave));
    Game lockedResume;assert(lockedResume.load(lockSave));
    assert(lockedResume.locks==g.locks&&lockedResume.locksCleared==g.locksCleared);
    // Reinitialize the exact level 28 layout to isolate Ice activation.
    stage(g,28);
    const int originalMoves=g.moves;
    g.objectiveKind=0;g.collectColor=-1;g.objectiveTarget=999999;
    assert(g.useHammer(iceGem));
    assert(g.moves==originalMoves && g.iceActivations==1);
    int frozenCount=0;
    for(int i=0;i<static_cast<int>(g.frozen.size());++i)if(g.frozen[i]>0){
        ++frozenCount;
        assert(g.frozen[i]==2&&g.locks[i]==0&&g.ice[i]==0);
        assert(!g.adjacent(i,i+1));
    }
    assert(frozenCount>=1 && frozenCount<=2);
    std::stringstream freezeSave;assert(g.save(freezeSave));
    Game thawing;assert(thawing.load(freezeSave));
    assert(thawing.frozen==g.frozen && thawing.iceActivations==1);
    const auto makeTurn=[&](Game& board){
        for(int i=0;i<static_cast<int>(board.cells.size());++i)
            for(int j:{i+1,i+board.width})
                if(board.adjacent(i,j))return board.swap(i,j);
        return false;
    };
    assert(makeTurn(thawing));
    int remaining=0;
    for(int value:thawing.frozen){if(value>0){assert(value==1);++remaining;}}
    assert(remaining==frozenCount);
    std::stringstream mid;assert(thawing.save(mid));
    Game restored;assert(restored.load(mid));
    assert(restored.frozen==thawing.frozen);
    assert(makeTurn(restored));
    for(int value:restored.frozen)assert(value==0);
    assert(restored.iceActivations==1);
    for(int n=29;n<=30;++n){
        Game board;stage(board,n);
        assert(board.matchedCells()==0&&board.hasMove());
        for(int value:board.elementals)assert(value==0);
        for(size_t i=0;i<board.cells.size();++i)
            if(board.cells[i]==-2)assert(board.locks[i]==0);
    }
    // Native preview RRNATIVE7 must load with empty new blocker/timer fields.
    Game old;
    std::stringstream saved;assert(old.save(saved));
    std::string header;assert(static_cast<bool>(std::getline(saved,header)));
    std::istringstream parser(header);
    std::vector<std::string> fields;for(std::string word;parser>>word;)fields.push_back(word);
    assert(fields.size()>5);
    fields[0]="RRNATIVE7";
    fields.erase(fields.end()-5,fields.end()-1); // remove lock and freeze counters
    std::string board,ice,lockLine,freezeLine;
    std::getline(saved,board);std::getline(saved,ice);
    std::getline(saved,lockLine);std::getline(saved,freezeLine);
    std::ostringstream legacy;
    for(const auto& word:fields)legacy<<word<<' ';
    legacy<<'\n'<<board<<'\n'<<ice<<'\n'<<saved.rdbuf();
    std::stringstream previous(legacy.str());
    Game migrated;assert(migrated.load(previous));
    assert(migrated.cells==old.cells);
    assert(std::all_of(migrated.locks.begin(),migrated.locks.end(),[](int n){return n==0;}));
    assert(std::all_of(migrated.frozen.begin(),migrated.frozen.end(),[](int n){return n==0;}));
    std::cout<<"Native locks/Ice: authored 28-30, single-hit blockers, freeze ticks and previous saves passed\n";
    return 0;
}
