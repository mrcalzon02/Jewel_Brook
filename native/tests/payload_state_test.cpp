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

static void stage(Game& g,const char* catalog,int n){
    std::ifstream in(catalog);
    assert(in.good()&&g.startIntro(n,in));
}
static std::string linesToText(const std::vector<std::string>& lines){
    std::ostringstream out;
    for(const auto& line:lines)out<<line<<'\n';
    return out.str();
}
static std::vector<std::string> linesOf(const std::string& text){
    std::istringstream in(text);
    std::vector<std::string> lines;
    for(std::string line;std::getline(in,line);)lines.push_back(line);
    return lines;
}
static int total(const std::vector<int>& v){
    int sum=0;for(int x:v)sum+=x;return sum;
}
int main(int argc,char** argv){
    if(argc!=2)return 2;
    Game g;stage(g,argv[1],18); // Actual Android-authored board and silhouette.
    assert(g.specials.size()==g.cells.size()&&g.holds.size()==g.cells.size());
    assert(total(g.specials)==0&&total(g.holds)==0);
    assert(!g.startIntro(125,*new std::istringstream(""))); // stage 125 remains locked

    // Find a real non-cascading adjacent move on the authored board, not a
    // synthetic belt-only fixture; both gem payloads must follow the swap.
    int from=-1,to=-1;
    for(int a=0;a<static_cast<int>(g.cells.size())&&from<0;++a)
      for(int b:{a+1,a+g.width}){
        if(!g.adjacent(a,b))continue;
        Game probe=g;
        const auto old=probe.cells;
        assert(probe.swap(a,b));
        auto expected=old;std::swap(expected[a],expected[b]);
        if(probe.cells==expected){from=a;to=b;break;}
      }
    assert(from>=0&&to>=0);
    const auto anchoredIce=g.ice,anchoredLocks=g.locks,anchoredChests=g.chests;
    g.specials[from]=1;g.holds[from]=2;
    g.specials[to]=2;g.holds[to]=3;
    assert(g.swap(from,to));
    assert(g.specials[from]==2&&g.holds[from]==3);
    assert(g.specials[to]==1&&g.holds[to]==2);
    assert(g.ice==anchoredIce&&g.locks==anchoredLocks&&g.chests==anchoredChests);

    // The new save format persists both gem-carried payloads.
    std::stringstream saved;assert(g.save(saved));
    const std::string current=saved.str();
    assert(current.rfind("RRNATIVE13 ",0)==0);
    Game loaded;std::istringstream modern(current);assert(loaded.load(modern));
    assert(loaded.cells==g.cells&&loaded.elementals==g.elementals);
    assert(loaded.specials==g.specials&&loaded.holds==g.holds);
    assert(loaded.ice==g.ice&&loaded.locks==g.locks);

    // RRNATIVE12 saves from levels 1-124 have no payload arrays.
    auto legacyLines=linesOf(current);
    assert(legacyLines.size()>4);
    legacyLines.pop_back();legacyLines.pop_back();
    legacyLines[0].replace(0,10,"RRNATIVE12");
    Game migrated;std::istringstream legacy(linesToText(legacyLines));
    assert(migrated.load(legacy));
    assert(migrated.cells==g.cells&&migrated.elementals==g.elementals);
    assert(total(migrated.specials)==0&&total(migrated.holds)==0);

    // Corrupt payloads cannot partially mutate an existing game.
    int voidAt=-1;
    for(int i=0;i<static_cast<int>(g.cells.size());++i)
        if(g.cells[i]==-2){voidAt=i;break;}
    assert(voidAt>=0);
    auto invalid=linesOf(current);
    std::istringstream payload(invalid[invalid.size()-2]);
    std::vector<int> specialValues;for(int v;payload>>v;)specialValues.push_back(v);
    assert(specialValues.size()==g.cells.size());
    specialValues[voidAt]=1;
    std::ostringstream corrupt;for(int v:specialValues)corrupt<<v<<' ';
    invalid[invalid.size()-2]=corrupt.str();
    const auto beforeCells=loaded.cells,beforeSpecials=loaded.specials;
    std::istringstream bad(linesToText(invalid));
    assert(!loaded.load(bad));
    assert(loaded.cells==beforeCells&&loaded.specials==beforeSpecials);

    // An actual booster destroys the gem's payload, rather than leaving a
    // special or hold on the freshly spawned replacement.
    Game hammer;stage(hammer,argv[1],18);
    int target=-1;
    for(int i=0;i<static_cast<int>(hammer.cells.size());++i)
        if(hammer.cells[i]>=0&&hammer.ice[i]==0&&hammer.locks[i]==0&&hammer.chests[i]==0)
            {target=i;break;}
    assert(target>=0);
    hammer.specials[target]=1;hammer.holds[target]=2;
    assert(hammer.useHammer(target));
    assert(total(hammer.specials)==0&&total(hammer.holds)==0);

    // Native shuffle must retain a special/hold as one indivisible gem payload.
    Game shuffle;stage(shuffle,argv[1],19);
    shuffle.shuffleCount=1;shuffle.claimedShuffle=true;
    int marked=-1;
    for(int i=0;i<static_cast<int>(shuffle.cells.size());++i)
        if(shuffle.cells[i]>=0&&shuffle.ice[i]==0&&shuffle.locks[i]==0&&shuffle.chests[i]==0)
            {marked=i;break;}
    assert(marked>=0);
    shuffle.specials[marked]=2;shuffle.holds[marked]=4;
    assert(shuffle.useShuffle());
    assert(total(shuffle.specials)==2&&total(shuffle.holds)==4);
    for(size_t i=0;i<shuffle.cells.size();++i)
        assert((shuffle.specials[i]==2)==(shuffle.holds[i]==4));

    // Second chapter's real authored blockers and voids remain square-bound.
    Game later;stage(later,argv[1],124);
    later.specials.assign(later.cells.size(),0);
    later.holds.assign(later.cells.size(),0);
    for(size_t i=0;i<later.cells.size();++i)if(later.cells[i]>=0){
        later.specials[i]=1;later.holds[i]=2;break;
    }
    std::stringstream laterSave;assert(later.save(laterSave));
    Game laterRead;assert(laterRead.load(laterSave));
    assert(laterRead.specials==later.specials&&laterRead.holds==later.holds);
    assert(laterRead.ice==later.ice&&laterRead.locks==later.locks);
    assert(laterRead.chests==later.chests&&laterRead.frozen==later.frozen);
    assert(laterRead.jam==later.jam&&laterRead.poison==later.poison);
    std::cout<<"Android-authored native special/hold: swap, booster, shuffle, save, legacy, void and anchored layers passed\n";
    return 0;
}
