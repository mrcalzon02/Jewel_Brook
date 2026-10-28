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
static void stage(Game& g,const char* path,int n){
    std::ifstream src(path);
    assert(src.good() && g.startIntro(n,src));
}
static int usable(const Game& g){
    return static_cast<int>(std::count_if(g.cells.begin(),g.cells.end(),[](int x){return x>=0;}));
}
static int sum(const std::vector<int>& a){
    int total=0;for(int x:a)total+=x;return total;
}
static void quickClear(Game& g){
    int target=-1;
    for(int i=0;i<static_cast<int>(g.cells.size());++i){
        if(g.cells[i]>=0 && g.ice[i]==0 && g.locks[i]==0 && g.chests[i]==0){target=i;break;}
    }
    assert(target>=0);
    // A fresh booster allowance for each diagnostic attempt.
    if(g.hammerCount<1)g.hammerCount=3;
    g.objectiveKind=0;g.objectiveTarget=1;g.collectColor=-1;
    assert(g.useHammer(target));assert(g.won);
}
int main(int argc,char**argv){
    if(argc!=2)return 2;
    const char* catalog=argv[1];
    for(int level=49;level<=100;++level){
        Game g;stage(g,catalog,level);
        assert(g.width==(level<=70?6:7));
        assert(g.height==g.width+1);
        assert(g.matchedCells()==0&&g.hasMove()&&usable(g)>0);
        assert(g.chests.size()==g.cells.size());
        assert(g.objectiveKind>=0&&g.objectiveKind<=5);
        int active=0;
        for(int effect:g.elementals)if(effect)++active;
        assert(active==(level%7==0?1:0));
        assert(sum(g.fireAuras)==2);
        if(level>=80)assert(g.activeRoster==std::vector<int>({0,1,2,15,((level-1)/16)%2==0?11:18}));
        if(level<80)assert(g.activeRoster==std::vector<int>({0,1,2,11,18}));
        for(size_t i=0;i<g.cells.size();++i)if(g.cells[i]==-2)
            assert(g.ice[i]==0&&g.locks[i]==0&&g.chests[i]==0);
        if(level>=68)assert(sum(g.chests)>0);
        std::stringstream data;assert(g.save(data));
        Game r;assert(r.load(data));
        assert(r.chests==g.chests&&r.cells==g.cells);
        assert(r.secondaryKind==g.secondaryKind&&r.secondaryTarget==g.secondaryTarget);
        assert(r.activeRoster==g.activeRoster&&r.fireAuras==g.fireAuras);
    }
    Game g;stage(g,catalog,49);
    assert(!g.claimedCross && !g.useCross(0));
    quickClear(g);assert(g.claimedCross&&g.crossCount==3);
    stage(g,catalog,50);
    int at=-1;for(int i=0;i<static_cast<int>(g.cells.size());++i)
        if(g.cells[i]>=0){at=i;break;}
    assert(at>=0);
    const int m=g.moves;
    assert(g.useCross(at));assert(g.crossCount==2&&g.moves==m);
    for(size_t i=0;i<g.cells.size();++i)if(g.cells[i]==-2)
        assert(g.chests[i]==0);
    stage(g,catalog,62);quickClear(g);
    assert(g.claimedColor&&g.colorCount==3);
    stage(g,catalog,63);
    at=-1;for(int i=0;i<static_cast<int>(g.cells.size());++i)
        if(g.cells[i]>=0&&g.ice[i]==0&&g.locks[i]==0){at=i;break;}
    assert(at>=0);
    const int color=g.cells[at];
    int candidates=static_cast<int>(std::count(g.cells.begin(),g.cells.end(),color));
    const int oldMoves=g.moves,oldCollected=g.collected;
    assert(g.useColor(at));assert(g.colorCount==2 && g.moves==oldMoves);
    if(g.objectiveKind==2 && g.collectColor==color)assert(g.collected>=oldCollected);
    assert(candidates>0);
    stage(g,catalog,77);quickClear(g);assert(g.claimedDrill&&g.drillCount==3);
    stage(g,catalog,78);
    at=-1;for(int i=0;i<static_cast<int>(g.cells.size());++i)
        if(g.chests[i]>0){at=i;break;}
    assert(at>=0);
    const int col=at%g.width, beforeChests=g.chestsCleared;
    const int chestLayers=g.chests[at];
    assert(g.useDrill(at));
    assert(g.drillCount==2&&g.chestsCleared>=beforeChests+std::min(3,chestLayers));
    assert(col>=0);
    stage(g,catalog,92);quickClear(g);assert(g.claimedUnlock&&g.unlockCount==3);
    stage(g,catalog,93);
    assert(sum(g.locks)>0);
    const int locks=sum(g.locks),cleared=g.locksCleared;
    assert(g.useUnlock());
    assert(g.unlockCount==2&&sum(g.locks)==0&&g.locksCleared==cleared+locks);
    assert(!g.useUnlock()&&g.unlockCount==2);
    std::stringstream current;assert(g.save(current));
    Game saved;assert(saved.load(current));
    assert(saved.chests==g.chests&&saved.chestsCleared==g.chestsCleared);
    assert(saved.claimedCross&&saved.crossCount==2);
    assert(saved.claimedColor&&saved.colorCount==2);
    assert(saved.claimedDrill&&saved.drillCount==2);
    assert(saved.claimedUnlock&&saved.unlockCount==2);
    // Dual objectives must require BOTH quotas. Only diagnostic goal
    // thresholds are adjusted; shipped stages retain Android source targets.
    for(int level:{99,100}){
        Game dual;stage(dual,catalog,level);
        assert(dual.objectiveKind==5);
        assert(dual.secondaryKind==1||dual.secondaryKind==3||dual.secondaryKind==4);
        assert(dual.secondaryTarget>0&&dual.collectColor>=0);
        assert(!dual.won);
        std::stringstream dualSave;assert(dual.save(dualSave));
        Game recovered;assert(recovered.load(dualSave));
        assert(recovered.secondaryKind==dual.secondaryKind);
        assert(recovered.secondaryTarget==dual.secondaryTarget);
        assert(recovered.collectColor==dual.collectColor);
        recovered.objectiveTarget=1;recovered.secondaryTarget=1000;
        recovered.collected=1;
        int at=-1;
        for(int i=0;i<static_cast<int>(recovered.cells.size());++i)
            if(recovered.cells[i]>=0 && recovered.ice[i]==0 &&
               recovered.locks[i]==0 && recovered.chests[i]==0){at=i;break;}
        assert(at>=0);
        recovered.hammerCount=3;
        assert(recovered.useHammer(at));
        assert(!recovered.won);
    }
    // Convert a *default* v10 snapshot back into the exact old v9 layout.
    Game defaults;
    std::stringstream out;assert(defaults.save(out));
    std::string header;assert(static_cast<bool>(std::getline(out,header)));
    std::istringstream fields(header);
    std::vector<std::string> words;
    for(std::string word;fields>>word;)words.push_back(word);
    assert(words.size()>12);words[0]="RRNATIVE9";
    words.erase(words.end()-18,words.end()-1); // nine new header fields
    std::string cells,ice,locksLine,chestLine,freeze;
    assert(static_cast<bool>(std::getline(out,cells)));
    assert(static_cast<bool>(std::getline(out,ice)));
    assert(static_cast<bool>(std::getline(out,locksLine)));
    assert(static_cast<bool>(std::getline(out,chestLine)));
    assert(static_cast<bool>(std::getline(out,freeze)));
    std::ostringstream legacy;
    for(const auto& word:words)legacy<<word<<' ';
    std::vector<std::string> lines;
    for(std::string line;std::getline(out,line);)lines.push_back(line);
    assert(lines.size()>=4);
    lines.erase(lines.end()-4,lines.end()-1);
    legacy<<"\n"<<cells<<"\n"<<ice<<"\n"<<locksLine<<"\n"<<freeze<<"\n";
    for(const auto& line:lines)legacy<<line<<"\n";
    std::istringstream input(legacy.str());
    Game migrated;assert(migrated.load(input));
    assert(migrated.cells==defaults.cells);
    assert(migrated.crossCount==0&&!migrated.claimedCross);
    assert(migrated.colorCount==0&&!migrated.claimedColor);
    assert(migrated.drillCount==0&&!migrated.claimedDrill);
    assert(migrated.unlockCount==0&&!migrated.claimedUnlock);
    assert(sum(migrated.chests)==0);
    std::cout<<"Native levels 49–100, chest objective, four source boosters, Jade and backwards save tests passed\n";
    return 0;
}
