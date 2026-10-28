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
static void stage(Game& g,const char* file,int n){
    std::ifstream src(file);
    assert(src.good()&&g.startIntro(n,src));
}
static int sum(const std::vector<int>& items){
    int result=0;for(int n:items)result+=n;return result;
}
static bool turn(Game& g){
    for(int a=0;a<static_cast<int>(g.cells.size());++a)
        for(int b:{a+1,a+g.width})
            if(g.adjacent(a,b))return g.swap(a,b);
    return false;
}
static int findPower(Game& g,int power){
    int found=-1;
    for(int i=0;i<static_cast<int>(g.elementals.size());++i)
        if(g.elementals[i]==power){
            assert(found==-1);found=i;
            assert(g.cells[i]>=0&&g.ice[i]==0&&g.locks[i]==0&&g.chests[i]==0);
        }
    return found;
}
static void testElement(const char* file,int level,int power){
    Game g;stage(g,file,level);
    const int at=findPower(g,power);assert(at>=0);
    g.objectiveKind=0;g.objectiveTarget=1999999;g.collectColor=-1;
    const int moves=g.moves;
    assert(g.useHammer(at));assert(g.moves==moves);
    if(power==4)assert(g.earthActivations==1);
    if(power==5)assert(g.windActivations==1);
    if(power==6)assert(g.lightningActivations==1);
    std::stringstream saved;assert(g.save(saved));
    Game again;assert(again.load(saved));
    assert(again.earthActivations==g.earthActivations);
    assert(again.windActivations==g.windActivations);
    assert(again.lightningActivations==g.lightningActivations);
    assert(again.lightningAuras==g.lightningAuras);
    assert(again.cells==g.cells);
}
int main(int argc,char**argv){
    if(argc!=2)return 2;
    for(int n=101;n<=124;++n){
        Game g;stage(g,argv[1],n);
        assert(g.width==7&&g.height==8);
        assert(g.cells.size()==56&&g.jam.size()==56&&g.poison.size()==56);
        assert(g.lightningAuras.size()==56);
        assert(g.matchedCells()==0&&g.hasMove());
        assert(g.activeRoster==std::vector<int>({0,1,2,3,15,((n-1)/16)%2==0?11:18}));
        assert(g.objectiveKind>=0&&g.objectiveKind<=6);
        assert(sum(g.jam)>=(n>=110?1:0));
        assert(sum(g.poison)==(n>=115&&(n/7)%2!=0?2:0));
        assert(sum(g.fireAuras)==(n>=45&&(n<115||(n/7)%2==0)?2:0));
        int powerCount=0;
        for(int p:g.elementals)if(p)++powerCount;
        assert(powerCount==(n%7==0?1:0));
        for(size_t i=0;i<g.cells.size();++i)if(g.cells[i]==-2)
            assert(!g.jam[i]&&!g.poison[i]&&!g.lightningAuras[i]);
        std::stringstream saved;assert(g.save(saved));
        Game restored;assert(restored.load(saved));
        assert(restored.cells==g.cells&&restored.activeRoster==g.activeRoster);
        assert(restored.jam==g.jam&&restored.poison==g.poison);
        assert(restored.lightningAuras==g.lightningAuras);
        assert(restored.turns==g.turns);
    }
    testElement(argv[1],105,4);  // Earth: 3 nearest same-column hits
    testElement(argv[1],112,5);  // Wind: 3 same-row movable gem payloads
    testElement(argv[1],119,6);  // Lightning: matching-color hit + tile mark

    Game sticky;stage(sticky,argv[1],110);
    assert(sum(sticky.jam)>0);
    int jamAt=-1;
    for(int i=0;i<static_cast<int>(sticky.jam.size());++i)
        if(sticky.jam[i]>0){jamAt=i;break;}
    assert(jamAt>=0);
    sticky.objectiveKind=0;sticky.objectiveTarget=1999999;
    const int before=sticky.jamCleared;
    assert(sticky.useHammer(jamAt));
    assert(sticky.jamCleared>before); // status is actually breakable
    stage(sticky,argv[1],111);
    sticky.objectiveKind=0;sticky.objectiveTarget=1999999;
    assert(turn(sticky));assert(turn(sticky));assert(turn(sticky));
    assert(sticky.turns==3&&sum(sticky.jam)>0);
    std::stringstream stickySave;assert(sticky.save(stickySave));
    Game stickyLoaded;assert(stickyLoaded.load(stickySave));
    assert(stickyLoaded.turns==3&&stickyLoaded.jam==sticky.jam);

    Game poisoned;stage(poisoned,argv[1],119);
    assert(sum(poisoned.poison)==2);
    poisoned.objectiveKind=0;poisoned.objectiveTarget=1999999;
    assert(turn(poisoned));
    assert(sum(poisoned.poison)==1);
    std::stringstream halfway;assert(poisoned.save(halfway));
    Game resumed;assert(resumed.load(halfway));
    assert(sum(resumed.poison)==1);
    assert(turn(resumed));
    assert(sum(resumed.poison)==0);
    assert(sum(resumed.jam)>=1); // poison becomes sticky resin

    // Backwards compatible with actual RRNATIVE11 layout (no new counters
    // or status-array lines). Use a clean state to avoid inventing rewards.
    Game original;
    std::stringstream upgraded;assert(original.save(upgraded));
    std::string header;assert(static_cast<bool>(std::getline(upgraded,header)));
    std::istringstream split(header);std::vector<std::string> fields;
    for(std::string field;split>>field;)fields.push_back(field);
    assert(fields.size()>8);
    fields[0]="RRNATIVE11";
    fields.erase(fields.end()-7,fields.end()-1);
    std::vector<std::string> lines;
    for(std::string line;std::getline(upgraded,line);)lines.push_back(line);
    assert(lines.size()>=4);
    lines.erase(lines.end()-4,lines.end()-1);
    std::ostringstream legacy;
    for(const auto& word:fields)legacy<<word<<' ';
    legacy<<'\n';for(const auto& line:lines)legacy<<line<<'\n';
    std::istringstream oldSave(legacy.str());
    Game migrated;assert(migrated.load(oldSave));
    assert(migrated.cells==original.cells&&migrated.turns==0);
    assert(sum(migrated.jam)==0&&sum(migrated.poison)==0);
    assert(sum(migrated.lightningAuras)==0);
    std::cout<<"Source-authored 101-124: Earth/Wind/Lightning, sticky spreading, poison countdown and legacy saves passed\n";
    return 0;
}
