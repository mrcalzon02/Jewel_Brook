#include "game_logic.h"
#include <algorithm>
#include <cmath>
#include <istream>
#include <ostream>
#include <random>
#include <set>
#include <string>
#include <utility>

namespace rupee {
namespace {
uint32_t mix(uint32_t x) {
    x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu;
    return x ^ (x >> 16);
}
std::vector<int> matches(const std::vector<int>& board, int w, int h, const std::vector<int>& ice, const std::vector<int>& locks, const std::vector<int>& frozen, const std::vector<int>& chests) {
    std::set<int> result;
    auto type=[&](int i){return board[i]>=0 && (ice.empty()||ice[i]==0) && (locks.empty()||locks[i]==0) && (frozen.empty()||frozen[i]==0) && (chests.empty()||chests[i]==0)?board[i]:-1;};
    for(int y=0;y<h;++y)for(int x=0;x<w;){
        const int t=type(y*w+x);int end=x+1;
        while(end<w&&t>=0&&type(y*w+end)==t)++end;
        if(t>=0&&end-x>=3)for(int k=x;k<end;++k)result.insert(y*w+k);
        x=end;
    }
    for(int x=0;x<w;++x)for(int y=0;y<h;){
        const int t=type(y*w+x);int end=y+1;
        while(end<h&&t>=0&&type(end*w+x)==t)++end;
        if(t>=0&&end-y>=3)for(int k=y;k<end;++k)result.insert(k*w+x);
        y=end;
    }
    return {result.begin(),result.end()};
}


}
Game::Game(uint32_t seed) {
    randomState=seed?seed:7919;
    initMine(seed);
    startLevel(1);
}
uint32_t Game::next() {
    // Compact serializable deterministic RNG; never changes source artwork.
    randomState ^= randomState << 13;
    randomState ^= randomState >> 17;
    randomState ^= randomState << 5;
    if(!randomState) randomState=7919;
    return randomState;
}
int Game::range(int limit) {
    return static_cast<int>((static_cast<uint64_t>(next())*static_cast<uint64_t>(limit))>>32);
}
int Game::rosterSize() const { return static_cast<int>(activeRoster.size()); }
void Game::populateBoard() {
    // No starting cascades, like the established deterministic Android generator.
    cells.assign(width*height,0);
    ice.assign(width*height,0);
    locks.assign(width*height,0);
    chests.assign(width*height,0);
    jam.assign(width*height,0);
    poison.assign(width*height,0);
    lightningAuras.assign(width*height,0);
    turns=jamCleared=earthActivations=windActivations=lightningActivations=lightningDetonations=0;
    pendingNewElementals.clear();
    frozen.assign(width*height,0);
    pendingIce.clear();
    elementals.assign(width*height,0);
    specials.assign(width*height,0);
    holds.assign(width*height,0);
    fireAuras.assign(width*height,0);
    pendingFire.clear();
    for(int y=0;y<height;++y) for(int x=0;x<width;++x) {
        std::vector<int> options;
        for(int t:activeRoster) {
            if(x>=2 && cells[y*width+x-1]==t && cells[y*width+x-2]==t)continue;
            if(y>=2 && cells[(y-1)*width+x]==t && cells[(y-2)*width+x]==t)continue;
            options.push_back(t);
        }
        cells[y*width+x]=options[range(static_cast<int>(options.size()))];
    }
}
void Game::startLevel(int stage) {
    level=std::clamp(stage,1,1000);
    width=level<=10?4:level<=30?5:level<=70?6:level<=140?7:8;
    height=width+1;
    moves=std::max(12,24-level/75);
    score=0;goal=700+level*18;
    activeRoster={0,1,2};waterActivations=0;fireActivations=0;fireDetonations=0;
    objectiveKind=0;objectiveTarget=goal;iceCleared=0;locksCleared=0;chestsCleared=0;iceActivations=0;collectColor=-1;collected=0;
    won=false;lost=false;
    for(int attempts=0;attempts<100;++attempts) {
        populateBoard();
        if(hasMove())break;
    }
}
bool Game::adjacent(int a,int b) const {
    if(a<0||b<0||a>=static_cast<int>(cells.size())||b>=static_cast<int>(cells.size()))return false;
    if(cells[a]<0||cells[b]<0)return false; // -2 is an authored board void
    if(ice.size()==cells.size() && (ice[a]>0||ice[b]>0||locks[a]>0||locks[b]>0||chests[a]>0||chests[b]>0||frozen[a]>0||frozen[b]>0))return false;
    return std::abs(a-b)==width || (a/width==b/width && std::abs(a-b)==1);
}
int Game::matchedCells() const {
    return static_cast<int>(matches(cells,width,height,ice,locks,frozen,chests).size());
}
bool Game::hasMove() {
    for(int a=0;a<static_cast<int>(cells.size());++a) {
        for(int b:{a+1,a+width}) {
            if(!adjacent(a,b))continue;
            std::swap(cells[a],cells[b]);
            const bool good=!matches(cells,width,height,ice,locks,frozen,chests).empty();
            std::swap(cells[a],cells[b]);
            if(good)return true;
        }
    }
    return false;
}
void Game::refill(){
    // Source gravity is segmented around each immovable ice blocker.
    for(int x=0;x<width;++x){
        for(int y=height-1;y>=0;){
            while(y>=0&&(ice[y*width+x]>0||locks[y*width+x]>0||chests[y*width+x]>0||frozen[y*width+x]>0||cells[y*width+x]==-2))--y;
            if(y<0)break;
            const int bottom=y;
            while(y>=0&&ice[y*width+x]==0&&locks[y*width+x]==0&&chests[y*width+x]==0&&frozen[y*width+x]==0&&cells[y*width+x]!=-2)--y;
            const int top=y+1;
            int write=bottom;
            for(int from=bottom;from>=top;--from){
                if(cells[from*width+x]<0)continue;
                const int src=from*width+x,to=write*width+x;
                cells[to]=cells[src];elementals[to]=elementals[src];
                specials[to]=specials[src];holds[to]=holds[src];
                --write;
            }
            for(;write>=top;--write){
                const int to=write*width+x;
                cells[to]=activeRoster[range(rosterSize())];
                elementals[to]=specials[to]=holds[to]=0;
            }
        }
    }
}
void Game::grantMilestoneIfWon(){
    if(!won)return;
    // Only award starter bundles once after completing the unlock stage.
    if(level==5 && !claimedExtra){extraCount+=3;claimedExtra=true;}
    if(level==10 && !claimedRow){rowCount+=3;claimedRow=true;}
    if(level==18 && !claimedShuffle){shuffleCount+=3;claimedShuffle=true;}
    if(level==26 && !claimedColumn){columnCount+=3;claimedColumn=true;}
    if(level==37 && !claimedBlast){blastCount+=3;claimedBlast=true;}
    if(level==49 && !claimedCross){crossCount+=3;claimedCross=true;}
    if(level==62 && !claimedColor){colorCount+=3;claimedColor=true;}
    if(level==77 && !claimedDrill){drillCount+=3;claimedDrill=true;}
    if(level==92 && !claimedUnlock){unlockCount+=3;claimedUnlock=true;}
}
void Game::updateOutcome(){
    won=objectiveKind==1?iceCleared>=objectiveTarget:objectiveKind==2?collected>=objectiveTarget:objectiveKind==3?locksCleared>=objectiveTarget:objectiveKind==4?chestsCleared>=objectiveTarget:objectiveKind==6?jamCleared>=objectiveTarget:objectiveKind==5?(collected>=objectiveTarget && (secondaryKind==1?iceCleared:secondaryKind==3?locksCleared:chestsCleared)>=secondaryTarget):score>=objectiveTarget;
    lost=moves<=0&&!won;
    grantMilestoneIfWon();
}

void Game::clearGem(int index){
    if(index<0||index>=static_cast<int>(cells.size())||cells[index]<0)return;
    if(jam[index]>0){--jam[index];++jamCleared;return;}
    if(ice[index]>0){--ice[index];++iceCleared;return;}
    if(locks[index]>0){--locks[index];++locksCleared;return;}
    if(chests[index]>0){--chests[index];++chestsCleared;return;}
    if(elementals[index]==1){
        ++waterActivations;
        // Source Water washes sticky resin, poison, and burning tiles in
        // the destroyed gem's row without disturbing the gemstone roster.
        const int row=index/width;
        for(int col=0;col<width;++col){
            const int at=row*width+col;
            jamCleared+=jam[at];jam[at]=0;
            poison[at]=0;fireAuras[at]=0;
        }
    }else if(elementals[index]==3){
        pendingIce.push_back(index);
    }else if(elementals[index]==2){
        pendingFire.push_back(index); // Fire resolves after current strike set.
    }else if(elementals[index]>=4&&elementals[index]<=6){
        pendingNewElementals.push_back({index,elementals[index],cells[index]});
    }
    if((objectiveKind==2||objectiveKind==5)&&cells[index]==collectColor)++collected;
    cells[index]=-1;
    elementals[index]=specials[index]=holds[index]=0;
}
void Game::resolveIce(){
    std::sort(pendingIce.begin(),pendingIce.end());
    while(!pendingIce.empty()){
        const int origin=pendingIce.front();pendingIce.erase(pendingIce.begin());
        ++iceActivations;
        const int row=origin/width,col=origin%width;
        int count=0;
        for(int at:{origin-width,origin-1,origin+1,origin+width}){
            if(at<0||at>=static_cast<int>(cells.size()))continue;
            if(std::abs(at/width-row)+std::abs(at%width-col)!=1)continue;
            if(cells[at]<0||ice[at]>0||locks[at]>0||frozen[at]>0)continue;
            frozen[at]=2;
            if(++count==2)break;
        }
    }
}
void Game::resolveFire(){
    // Android resolves elemental records after the current group of damage,
    // sorted by originating board cell, not recursively during each strike.
    std::vector<bool> seen(cells.size(),false);
    int limit=static_cast<int>(cells.size())*3;
    while(!pendingFire.empty() && limit-->0){
        std::sort(pendingFire.begin(),pendingFire.end());
        const int origin=pendingFire.front();
        pendingFire.erase(pendingFire.begin());
        if(origin<0||origin>=static_cast<int>(cells.size())||seen[origin])continue;
        seen[origin]=true;
        ++fireActivations;
        const int row=origin/width,col=origin%width;
        for(int neighbor:{origin-width,origin-1,origin+1,origin+width}){
            if(neighbor<0||neighbor>=static_cast<int>(cells.size()))continue;
            if(std::abs(neighbor/width-row)+std::abs(neighbor%width-col)!=1)continue;
            if(cells[neighbor]>=0)clearGem(neighbor);
        }
        // Nearest surviving movable square: Manhattan distance, then index.
        int nearest=-1,best=999999;
        for(int i=0;i<static_cast<int>(cells.size());++i){
            if(i==origin||cells[i]<0||ice[i]>0||locks[i]>0||chests[i]>0||frozen[i]>0||fireAuras[i]>0)continue;
            const int distance=std::abs(i/width-row)+std::abs(i%width-col);
            if(distance<best){nearest=i;best=distance;}
        }
        if(nearest>=0 && fireAuras[nearest]==0)fireAuras[nearest]=2;
    }
    // An authored early stage seeds at most one Fire gem; still bound chains.
    pendingFire.clear();
    resolveIce();
    // Shared trigger dispatcher for second-chapter elemental gems. Each
    // reaction uses the same source-defined damage and fixed overlay data.
    int budget=static_cast<int>(cells.size())*3;
    while(!pendingNewElementals.empty()&&budget-->0){
        std::sort(pendingNewElementals.begin(),pendingNewElementals.end(),
                  [](const auto& a,const auto& b){return a.at<b.at;});
        const auto trigger=pendingNewElementals.front();
        pendingNewElementals.erase(pendingNewElementals.begin());
        const int origin=trigger.at, row=origin/width,col=origin%width;
        std::vector<int> nearest;
        for(int i=0;i<static_cast<int>(cells.size());++i)
            if(i!=origin&&cells[i]>=0)nearest.push_back(i);
        std::sort(nearest.begin(),nearest.end(),[&](int a,int b){
            const int da=std::abs(a/width-row)+std::abs(a%width-col);
            const int db=std::abs(b/width-row)+std::abs(b%width-col);
            return da==db?a<b:da<db;
        });
        if(trigger.kind==4){
            ++earthActivations;int hits=0;
            for(int i:nearest)if(i%width==col){
                clearGem(i);if(++hits==3)break;
            }
        }else if(trigger.kind==5){
            ++windActivations;
            std::vector<int> movable;
            for(int i:nearest)if(i/width==row&&ice[i]==0&&locks[i]==0
                  &&chests[i]==0&&frozen[i]==0){
                movable.push_back(i);if(movable.size()==3)break;
            }
            if(movable.size()==3){
                const int lastType=cells[movable[2]],lastPower=elementals[movable[2]];
                const int lastSpecial=specials[movable[2]],lastHold=holds[movable[2]];
                for(int j=2;j>0;--j){
                    cells[movable[j]]=cells[movable[j-1]];
                    elementals[movable[j]]=elementals[movable[j-1]];
                    specials[movable[j]]=specials[movable[j-1]];
                    holds[movable[j]]=holds[movable[j-1]];
                }
                cells[movable[0]]=lastType;elementals[movable[0]]=lastPower;
                specials[movable[0]]=lastSpecial;holds[movable[0]]=lastHold;
            }
        }else if(trigger.kind==6){
            ++lightningActivations;int hits=0;
            for(int i:nearest)if(cells[i]==trigger.color){
                clearGem(i);if(++hits==3)break;
            }
            for(int i:nearest)if(cells[i]>=0&&ice[i]==0&&locks[i]==0
                  &&chests[i]==0&&frozen[i]==0&&fireAuras[i]==0
                  &&lightningAuras[i]==0){
                lightningAuras[i]=2;break;
            }
        }
    }
    // A triggered Earth/Lightning hit can release an existing Fire/Ice gem.
    if(!pendingFire.empty()||!pendingIce.empty())resolveFire();
}
void Game::advanceFireTurn(){
    if(won||lost||fireAuras.empty())return;
    ++turns;
    std::vector<int> expired, lightningExpired;
    for(int i=0;i<static_cast<int>(fireAuras.size());++i){
        if(frozen[i]>0)--frozen[i];
        if(fireAuras[i]>0 && --fireAuras[i]==0)expired.push_back(i);
        if(lightningAuras[i]>0&&--lightningAuras[i]==0)lightningExpired.push_back(i);
        if(poison[i]>0&&--poison[i]==0)jam[i]=std::max(jam[i],1);
    }
    // One source-defined resin spread every third swap, provided resin is
    // active. It may occupy a neighboring gem but never a board void.
    if(turns%3==0){
        for(int i=0;i<static_cast<int>(cells.size());++i)if(jam[i]>0){
            std::vector<int> choices;
            const int row=i/width;
            for(int n:{i-width,i+width,i-1,i+1}){
                if(n<0||n>=static_cast<int>(cells.size())||cells[n]<0||jam[n]>0)continue;
                if(std::abs(n-i)==1&&n/width!=row)continue;
                choices.push_back(n);
            }
            if(!choices.empty()){jam[choices[range(static_cast<int>(choices.size()))]]=1;break;}
        }
    }
    if(expired.empty()&&lightningExpired.empty())return;
    for(int origin:expired){
        ++fireDetonations;
        const int row=origin/width,col=origin%width;
        for(int neighbor:{origin,origin-width,origin-1,origin+1,origin+width}){
            if(neighbor<0||neighbor>=static_cast<int>(cells.size()))continue;
            if(std::abs(neighbor/width-row)+std::abs(neighbor%width-col)>1)continue;
            if(cells[neighbor]>=0)clearGem(neighbor);
        }
    }
    for(int origin:lightningExpired){
        ++lightningDetonations;
        if(cells[origin]<0)continue;
        const int row=origin/width,col=origin%width,type=cells[origin];
        std::vector<int> same;
        for(int i=0;i<static_cast<int>(cells.size());++i)if(i!=origin&&cells[i]==type)
            same.push_back(i);
        std::sort(same.begin(),same.end(),[&](int a,int b){
            const int da=std::abs(a/width-row)+std::abs(a%width-col);
            const int db=std::abs(b/width-row)+std::abs(b%width-col);
            return da==db?a<b:da<db;
        });
        for(int i=0;i<std::min(3,static_cast<int>(same.size()));++i)clearGem(same[i]);
    }
    resolveFire();
    bool empty=false;
    for(int value:cells)if(value==-1){empty=true;break;}
    if(empty)refill();
    clearAndFill();
    updateOutcome();
}
bool Game::clearAndFill() {
    bool changed=false;
    for(int cascade=1;cascade<=60;++cascade){
        auto hit=matches(cells,width,height,ice,locks,frozen,chests);
        if(hit.empty())break;
        changed=true;
        std::set<int> affected(hit.begin(),hit.end());
        for(int i:hit){
            const int y=i/width;
            for(int j:{i-width,i+width,i-1,i+1}){
                if(j<0||j>=static_cast<int>(cells.size()))continue;
                if(std::abs(j-i)==1&&j/width!=y)continue;
                if(ice[j]>0||locks[j]>0||chests[j]>0)affected.insert(j);
            }
        }
        for(int i:affected){
            if(cells[i]==-2)continue;
            clearGem(i);
        }
        resolveFire();
        score+=static_cast<int>(affected.size())*60*std::min(cascade,6);
        refill();
    }
    return changed;
}

bool Game::swap(int a,int b) {
    if(won||lost||!adjacent(a,b))return false;
    std::swap(cells[a],cells[b]);
    std::swap(elementals[a],elementals[b]);
    std::swap(specials[a],specials[b]);
    std::swap(holds[a],holds[b]);
    --moves;
    clearAndFill(); // non-match swaps stay swapped and consume the move
    updateOutcome();
    advanceFireTurn();
    if(!won&&!lost&&!hasMove()) {
        // Repair a trapped board while preserving current progression.
        // Preserve authored blocker positions and layers during deadlock repair.
        std::vector<int> free;
        for(int i=0;i<static_cast<int>(cells.size());++i)
            if(cells[i]>=0&&(ice.empty()||ice[i]==0)&&locks[i]==0&&chests[i]==0&&frozen[i]==0)free.push_back(i);
        for(int tries=0;tries<120;++tries) {
            for(int i=static_cast<int>(free.size())-1;i>0;--i)
                {const int other=free[range(i+1)];
                 std::swap(cells[free[i]],cells[other]);
                 std::swap(elementals[free[i]],elementals[other]);
                 std::swap(specials[free[i]],specials[other]);
                 std::swap(holds[free[i]],holds[other]);}
            if(matchedCells()==0&&hasMove())break;
        }
        if(matchedCells()!=0||!hasMove()){
            // Deterministic repair without deleting any authored ice tiles.
            for(int a:free) {
                if(hasMove()&&matchedCells()==0)break;
                for(int b:free) {
                    if(a>=b||cells[a]==cells[b])continue;
                    std::swap(cells[a],cells[b]);
                    std::swap(elementals[a],elementals[b]);
                    std::swap(specials[a],specials[b]);
                    std::swap(holds[a],holds[b]);
                    if(matchedCells()==0&&hasMove())break;
                    std::swap(cells[a],cells[b]);
                    std::swap(elementals[a],elementals[b]);
                    std::swap(specials[a],specials[b]);
                    std::swap(holds[a],holds[b]);
                }
            }
        }

    }
    return true;
}
bool Game::shuffleBoard(){
    // Mirror web/engine.js shuffle: movable gem payloads are exchanged;
    // authored ice, empty silhouette squares and goal state are untouched.
    std::vector<int> free;
    for(int i=0;i<static_cast<int>(cells.size());++i)
        if(cells[i]>=0 && ice[i]==0 && locks[i]==0 && chests[i]==0 && frozen[i]==0)free.push_back(i);
    if(free.size()<2)return false;
    const auto originalCells=cells,originalElements=elementals;
    const auto originalSpecials=specials,originalHolds=holds;
    const auto originalRng=randomState;
    for(int tries=0;tries<100;++tries){
        for(int j=static_cast<int>(free.size())-1;j>0;--j){
            const int other=free[range(j+1)];
            std::swap(cells[free[j]],cells[other]);
            std::swap(elementals[free[j]],elementals[other]);
            std::swap(specials[free[j]],specials[other]);
            std::swap(holds[free[j]],holds[other]);
        }
        if(matchedCells()==0&&hasMove())return true;
    }
    // Fallback from Android's gameplay logic: refill movable gem identities
    // from the authored roster, without moving carried elemental powers.
    for(int tries=0;tries<50;++tries){
        for(int i:free)cells[i]=activeRoster[range(rosterSize())];
        if(matchedCells()==0&&hasMove())return true;
    }
    cells=originalCells;elementals=originalElements;
    specials=originalSpecials;holds=originalHolds;randomState=originalRng;
    return false;
}
bool Game::useShuffle(){
    if(won||shuffleCount<=0)return false;
    if(!shuffleBoard())return false;
    --shuffleCount;
    return true;
}
bool Game::useExtraMoves(){
    if(won||extraCount<=0||moves>995)return false;
    --extraCount;
    moves+=5;
    lost=false;
    return true;
}
bool Game::useHammer(int cell){
    if(won||hammerCount<=0||cell<0||cell>=static_cast<int>(cells.size())||cells[cell]<0)return false;
    --hammerCount;
    // web/engine.js hammer: twenty successive blows; the final blow can
    // remove the gem beneath the last ice layer. Do not invent extra strikes.
    for(int hit=0;hit<20;++hit){
        if(ice[cell]>0||locks[cell]>0||chests[cell]>0){clearGem(cell);}
        else if(cells[cell]>=0){clearGem(cell);break;}
        else break;
    }
    resolveFire();
    score+=35;
    refill();clearAndFill();
    updateOutcome();
    return true;
}
bool Game::useRowRocket(int cell){
    if(won||rowCount<=0||cell<0||cell>=static_cast<int>(cells.size())||cells[cell]<0)return false;
    --rowCount;
    const int y=cell/width;
    int affected=0;
    for(int x=0;x<width;++x){
        const int i=y*width+x;
        if(cells[i]==-2)continue;
        ++affected;
        clearGem(i);
    }
    resolveFire();
    score+=affected*35;
    refill();clearAndFill();
    updateOutcome();
    return true;
}
bool Game::useColumnRocket(int cell){
    // Source Column Rocket: one hit per present tile in the selected column.
    if(won||columnCount<=0||cell<0||cell>=static_cast<int>(cells.size())||cells[cell]<0)return false;
    --columnCount;
    const int x=cell%width;
    int affected=0;
    for(int y=0;y<height;++y){
        const int at=y*width+x;
        if(cells[at]<0)continue; // preserve authored voids
        ++affected;
        clearGem(at);           // exactly one ice layer, or destroy gem
    }
    resolveFire();
    score+=affected*35;
    refill();clearAndFill();
    updateOutcome();
    return true;
}
bool Game::useBlast(int cell){
    // Exact Android booster('blast'): one damage hit in the 3x3 area,
    // skip authored voids; inventory is spent only on a valid target.
    if(won||blastCount<=0||cell<0||
       cell>=static_cast<int>(cells.size())||cells[cell]<0)return false;
    --blastCount;
    const int row=cell/width,col=cell%width;
    int affected=0;
    for(int y=std::max(0,row-1);y<=std::min(height-1,row+1);++y)
      for(int x=std::max(0,col-1);x<=std::min(width-1,col+1);++x){
        const int at=y*width+x;
        if(cells[at]<0)continue;
        ++affected;
        clearGem(at);
      }
    resolveFire();
    score+=affected*35;
    refill();clearAndFill();
    updateOutcome();
    return true;
}
bool Game::useCross(int cell){
    if(won||crossCount<=0||cell<0||cell>=static_cast<int>(cells.size())||cells[cell]<0)return false;
    --crossCount;int count=0;
    for(int i=0;i<static_cast<int>(cells.size());++i){
        if(cells[i]<0 || (i/width!=cell/width && i%width!=cell%width))continue;
        ++count;clearGem(i);
    }
    resolveFire();score+=count*35;refill();clearAndFill();updateOutcome();return true;
}
bool Game::useColor(int cell){
    if(won||colorCount<=0||cell<0||cell>=static_cast<int>(cells.size())||cells[cell]<0)return false;
    --colorCount;const int chosen=cells[cell];int count=0;
    for(int i=0;i<static_cast<int>(cells.size());++i){
        if(cells[i]!=chosen)continue;
        ++count;clearGem(i);
    }
    resolveFire();score+=count*35;refill();clearAndFill();updateOutcome();return true;
}
bool Game::useDrill(int cell){
    if(won||drillCount<=0||cell<0||cell>=static_cast<int>(cells.size())||cells[cell]<0)return false;
    --drillCount;int count=0;
    for(int i=cell%width;i<static_cast<int>(cells.size());i+=width){
        if(cells[i]<0)continue;
        ++count;
        for(int n=0;n<3 && cells[i]>=0;++n)clearGem(i);
    }
    resolveFire();score+=count*35;refill();clearAndFill();updateOutcome();return true;
}
bool Game::useUnlock(){
    if(won||unlockCount<=0)return false;
    int count=0;for(int layers:locks)count+=layers;
    if(!count)return false;
    --unlockCount;
    for(int& layers:locks)layers=0;
    locksCleared+=count;updateOutcome();return true;
}
void Game::initMine(uint32_t seed) {
    for(int i=0;i<16;++i){
        const int x=i%4,y=i/4;
        uint32_t odds=mix(seed ^ (static_cast<uint32_t>(x+1)*15485863u)
                         ^ (static_cast<uint32_t>(y+1)*32452843u) ^ 0x248fd19du)%100;
        rocks[i].kind=odds<45?0:odds<85?1:odds<97?2:3;
        auto hard=mix(seed ^ (static_cast<uint32_t>(x+1)*15485863u)
                     ^ (static_cast<uint32_t>(y+1)*32452843u) ^ 0x74220a3bu)%100;
        rocks[i].hardness=hard<55?1:hard<90?2:3;
        rocks[i].hits=0;rocks[i].done=false;
    }
}
bool Game::mine(int index) {
    if(index<0||index>=16||strikes<=0||rocks[index].done)return false;
    --strikes;auto& tile=rocks[index];++tile.hits;
    if(tile.hits>=tile.hardness) {
        tile.done=true;
        ore+=tile.kind==0?0:tile.kind==1?1:tile.kind==2?2:4;
    }
    return true;
}
void Game::replenishStrikes(){strikes=12;}
bool Game::startIntro(int stage,std::istream& authoredCatalog){
    if(stage<1||stage>124)return false;
    std::string magic;int count=0;
    if(!(authoredCatalog>>magic>>count)||magic!="RRCAMPAIGN14"||count!=124)return false;
    for(int k=1;k<=count;++k){
        int number=0,w=0,h=0,budget=0,stageGoal=0,kind=0,target=0;
        uint32_t rng=0;size_t n=0;int selectedColor=-1,secondaryKind=-1,secondaryTarget=0;
        if(!(authoredCatalog>>number>>w>>h>>budget>>stageGoal>>kind>>target >>rng>>n>>selectedColor>>secondaryKind>>secondaryTarget)
           ||number!=k||w!=(k<=10?4:k<=30?5:k<=70?6:7)||h!=w+1||budget<12||budget>36||stageGoal<1||
           (kind!=0&&kind!=1&&kind!=2&&kind!=3&&kind!=4&&kind!=5&&kind!=6)||target<1||target>2000000||!rng||
           n!=static_cast<size_t>(w*h))return false;
        std::vector<int> types(n),frost(n);
        for(auto& x:types)if(!(authoredCatalog>>x)||x < -2||x>=19||x==-1)return false;
        for(auto& x:frost)if(!(authoredCatalog>>x)||x<0||x>5)return false;
        std::vector<int> locked(n);
        for(auto& x:locked)if(!(authoredCatalog>>x)||x<0||x>5)return false;
        std::vector<int> chestLayers(n);
        for(auto& x:chestLayers)if(!(authoredCatalog>>x)||x<0||x>5)return false;
        std::vector<int> resin(n),seedPoison(n);
        for(auto& x:resin)if(!(authoredCatalog>>x)||x<0||x>1)return false;
        for(auto& x:seedPoison)if(!(authoredCatalog>>x)||x<0||x>2)return false;
        size_t rosterCount=0;
        if(!(authoredCatalog>>rosterCount)||rosterCount!=(k<15?3u:k<35?4u:k<=100?5u:6u))return false;
        std::vector<int> roster(rosterCount);
        for(auto& x:roster)if(!(authoredCatalog>>x)||x<0||x>=19)return false;
        if(roster!=(k<15?std::vector<int>{0,1,2}:k<35?std::vector<int>{0,1,2,11}:k<80?std::vector<int>{0,1,2,11,18}:k<=100?std::vector<int>{0,1,2,15,((k-1)/16)%2==0?11:18}:std::vector<int>{0,1,2,3,15,((k-1)/16)%2==0?11:18}))return false;
        if(((kind==2||kind==5)&&std::find(roster.begin(),roster.end(),selectedColor)==roster.end())
          ||(kind!=2&&kind!=5&&selectedColor!=-1)
          ||(kind==5 && (secondaryKind!=1&&secondaryKind!=3&&secondaryKind!=4))
          ||(kind==5 && (secondaryTarget<1||secondaryTarget>2000000))
          ||(kind!=5 && (secondaryKind!=-1||secondaryTarget!=0)))return false;
        std::vector<int> effects(n,0);
        int powered=0;
        for(auto& x:effects){if(!(authoredCatalog>>x)||x<0||x>6)return false;if(x>0)++powered;}
        // Fire tile auras are anchored to the original board square;
        // imported separately from any gem-carried elemental.
        std::vector<int> startingFire(n);
        int burning=0;
        for(auto& timer:startingFire){
            if(!(authoredCatalog>>timer)||timer<0||timer>2)return false;
            if(timer>0){++burning;if(timer!=2)return false;}
        }
        if(burning!=(k>=45&&(k<115||(k/7)%2==0)?1:0))return false;
        int seededPoison=0;for(int value:seedPoison)if(value>0){if(value!=2)return false;++seededPoison;}
        if(seededPoison!=(k>=115&&(k/7)%2!=0?1:0))return false;
        if(powered!=((k>=15&&(k==15||k==35||k%7==0))?1:0))return false;
        for(int effect:effects)if(effect){
          const int cycle=(k/7)%(k<=100?3:6);
          const int expected=(k==15||k==35||k%7==0)?
              (cycle==0?2:cycle==1?3:cycle==2?1:cycle==3?4:cycle==4?5:6):0;
          if(effect!=expected)return false;
        }
        for(size_t i=0;i<n;++i)
            if((types[i]==-2&&(frost[i]!=0||locked[i]!=0||chestLayers[i]!=0||resin[i]!=0||seedPoison[i]!=0||effects[i]!=0||startingFire[i]!=0))||
                (types[i]!=-2&&std::find(roster.begin(),roster.end(),types[i])==roster.end()))
                return false;
        if(k!=stage)continue;
        Game candidate=*this;
        candidate.level=number;candidate.width=w;candidate.height=h;
        candidate.moves=budget;candidate.goal=stageGoal;
        candidate.objectiveKind=kind;candidate.objectiveTarget=target;
        candidate.iceCleared=0;candidate.score=0;candidate.won=false;candidate.lost=false;
        candidate.collectColor=selectedColor;candidate.collected=0;
        candidate.secondaryKind=secondaryKind;candidate.secondaryTarget=secondaryTarget;
        candidate.cells=std::move(types);candidate.ice=std::move(frost);
        candidate.locks=std::move(locked);candidate.chests=std::move(chestLayers);
        candidate.jam=std::move(resin);candidate.poison=std::move(seedPoison);
        candidate.lightningAuras.assign(n,0);candidate.frozen.assign(n,0);
        candidate.locksCleared=0;candidate.chestsCleared=0;candidate.jamCleared=0;
        candidate.turns=candidate.earthActivations=candidate.windActivations=0;
        candidate.lightningActivations=candidate.lightningDetonations=0;
        candidate.pendingNewElementals.clear();candidate.iceActivations=0;candidate.pendingIce.clear();
        candidate.activeRoster=std::move(roster);
        candidate.elementals=std::move(effects);
        candidate.specials.assign(n,0);candidate.holds.assign(n,0);
        candidate.fireAuras=std::move(startingFire);
        candidate.pendingFire.clear();
        candidate.waterActivations=0;
        candidate.fireActivations=0;
        candidate.fireDetonations=0;
        candidate.randomState=rng;
        if(candidate.matchedCells()!=0||!candidate.hasMove())return false;
        *this=std::move(candidate);
        return true;
    }
    return false;
}
bool Game::save(std::ostream& out) const {
    out<<"RRNATIVE13 "<<level<<' '<<width<<' '<<height<<' '<<moves<<' '
       <<score<<' '<<goal<<' '<<ore<<' '<<strikes<<' '<<won<<' '<<lost<<' '
       <<randomState<<' '<<objectiveKind<<' '<<objectiveTarget<<' '
       <<iceCleared<<' '<<hammerCount<<' '<<extraCount<<' '<<rowCount<<' '
       <<claimedExtra<<' '<<claimedRow<<' '<<waterActivations<<' '
       <<shuffleCount<<' '<<claimedShuffle<<' '<<collectColor<<' '
       <<collected<<' '<<fireActivations<<' '<<fireDetonations<<' '
       <<columnCount<<' '<<claimedColumn<<' '<<locksCleared<<' '<<iceActivations<<' '
       <<blastCount<<' '<<claimedBlast<<' '<<crossCount<<' '<<claimedCross<<' '
       <<colorCount<<' '<<claimedColor<<' '<<drillCount<<' '<<claimedDrill<<' '
       <<unlockCount<<' '<<claimedUnlock<<' '<<chestsCleared<<' '
       <<secondaryKind<<' '<<secondaryTarget<<' '<<turns<<' '<<jamCleared<<' '
       <<earthActivations<<' '<<windActivations<<' '<<lightningActivations<<' '
       <<lightningDetonations<<' '<<cells.size()<<'\n';
    for(int v:cells)out<<v<<' ';out<<'\n';
    for(int v:ice)out<<v<<' ';out<<'\n';
    for(int v:locks)out<<v<<' ';out<<'\n';
    for(int v:chests)out<<v<<' ';out<<'\n';
    for(int v:frozen)out<<v<<' ';out<<'\n';
    out<<activeRoster.size()<<' ';
    for(int id:activeRoster)out<<id<<' ';out<<'\n';
    for(int v:elementals)out<<v<<' ';out<<'\n';
    for(int v:fireAuras)out<<v<<' ';out<<'\n';
    for(int v:jam)out<<v<<' ';out<<'\n';
    for(int v:poison)out<<v<<' ';out<<'\n';
    for(int v:lightningAuras)out<<v<<' ';out<<'\n';
    for(auto r:rocks)out<<r.kind<<' '<<r.hardness<<' '<<r.hits<<' '<<r.done<<' ';
    out<<'\n';
    // Append after the legacy RRNATIVE12 body; older versions load with zero payloads.
    for(int v:specials)out<<v<<' ';out<<'\n';
    for(int v:holds)out<<v<<' ';out<<'\n';
    return out.good();
}
bool Game::load(std::istream& in) {
    Game tmp(7919);
    std::string magic;size_t n=0;
    if(!(in>>magic) || (magic!="RRNATIVE1"&&magic!="RRNATIVE2"&&magic!="RRNATIVE3"&&magic!="RRNATIVE4"&&magic!="RRNATIVE5"&&magic!="RRNATIVE6"&&magic!="RRNATIVE7"&&magic!="RRNATIVE8"&&magic!="RRNATIVE9"&&magic!="RRNATIVE10"&&magic!="RRNATIVE11"&&magic!="RRNATIVE12"&&magic!="RRNATIVE13"))return false;
    if(!(in>>tmp.level>>tmp.width>>tmp.height>>tmp.moves>>
       tmp.score>>tmp.goal>>tmp.ore>>tmp.strikes>>tmp.won>>tmp.lost>>
       tmp.randomState))return false;
    if(magic!="RRNATIVE1") {
        if(!(in>>tmp.objectiveKind>>tmp.objectiveTarget>>tmp.iceCleared))return false;
    } else {
        tmp.objectiveKind=0;tmp.objectiveTarget=tmp.goal;tmp.iceCleared=0;
    }
    if(magic=="RRNATIVE3"||magic=="RRNATIVE4"||magic=="RRNATIVE5"||magic=="RRNATIVE6"||magic=="RRNATIVE7"||magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")){
        if(!(in>>tmp.hammerCount>>tmp.extraCount>>tmp.rowCount>>
             tmp.claimedExtra>>tmp.claimedRow))return false;
    } else {
        tmp.hammerCount=3;tmp.extraCount=tmp.level>=6?3:0;
        tmp.rowCount=tmp.level>=10&&tmp.won?3:0;
        tmp.claimedExtra=tmp.level>=6;
        tmp.claimedRow=tmp.level>=10&&tmp.won;
    }
    if((magic=="RRNATIVE4"||magic=="RRNATIVE5"||magic=="RRNATIVE6"||magic=="RRNATIVE7"||magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")) && !(in>>tmp.waterActivations))return false;
    if(magic=="RRNATIVE5"||magic=="RRNATIVE6"||magic=="RRNATIVE7"||magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")){
        if(!(in>>tmp.shuffleCount>>tmp.claimedShuffle>>tmp.collectColor>>tmp.collected))return false;
    }else{
        tmp.shuffleCount=0;tmp.claimedShuffle=false;
        tmp.collectColor=-1;tmp.collected=0;
    }
    if((magic=="RRNATIVE6"||magic=="RRNATIVE7"||magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")) &&
        !(in>>tmp.fireActivations>>tmp.fireDetonations))return false;
    if(magic=="RRNATIVE7"||magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")){
        if(!(in>>tmp.columnCount>>tmp.claimedColumn))return false;
    }else{
        tmp.columnCount=0;tmp.claimedColumn=false;
    }
    if((magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")) &&
        !(in>>tmp.locksCleared>>tmp.iceActivations))return false;
    if((magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13"))){
        if(!(in>>tmp.blastCount>>tmp.claimedBlast))return false;
    }else{
        tmp.blastCount=0;tmp.claimedBlast=false;
    }
    if((magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13"))){
        if(!(in>>tmp.crossCount>>tmp.claimedCross>>tmp.colorCount>>tmp.claimedColor>>
             tmp.drillCount>>tmp.claimedDrill>>tmp.unlockCount>>tmp.claimedUnlock>>
             tmp.chestsCleared))return false;
    }else{
        tmp.crossCount=tmp.colorCount=tmp.drillCount=tmp.unlockCount=0;
        tmp.claimedCross=tmp.claimedColor=tmp.claimedDrill=tmp.claimedUnlock=false;
        tmp.chestsCleared=0;
    }
    if((magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13"))){
        if(!(in>>tmp.secondaryKind>>tmp.secondaryTarget))return false;
    }else{
        tmp.secondaryKind=-1;tmp.secondaryTarget=0;
    }
    if((magic=="RRNATIVE12"||magic=="RRNATIVE13") &&
       !(in>>tmp.turns>>tmp.jamCleared>>tmp.earthActivations>>
          tmp.windActivations>>tmp.lightningActivations>>tmp.lightningDetonations))
        return false;
    if(!(in>>n))return false;
    if(tmp.level<1||tmp.level>1000 ||tmp.width<4||tmp.width>8||
       tmp.height!=tmp.width+1||n!=static_cast<size_t>(tmp.width*tmp.height)||
       tmp.moves<0||tmp.moves>1000||tmp.score<0||tmp.goal<1||tmp.ore<0||
       tmp.strikes<0||tmp.strikes>12||!tmp.randomState||
       tmp.objectiveKind<0||tmp.objectiveKind>6||tmp.objectiveTarget<1||
       tmp.iceCleared<0||tmp.iceCleared>1000||(tmp.won&&tmp.lost)||
       tmp.hammerCount<0||tmp.hammerCount>999999||
       tmp.extraCount<0||tmp.extraCount>999999||
       tmp.rowCount<0||tmp.rowCount>999999||
       tmp.columnCount<0||tmp.columnCount>999999||
       tmp.blastCount<0||tmp.blastCount>999999||
       tmp.crossCount<0||tmp.crossCount>999999||
       tmp.colorCount<0||tmp.colorCount>999999||
       tmp.drillCount<0||tmp.drillCount>999999||
       tmp.unlockCount<0||tmp.unlockCount>999999||
       tmp.chestsCleared<0||tmp.chestsCleared>100000||
       tmp.turns<0||tmp.turns>1000000||
       tmp.jamCleared<0||tmp.jamCleared>100000||
       tmp.earthActivations<0||tmp.earthActivations>100000||
       tmp.windActivations<0||tmp.windActivations>100000||
       tmp.lightningActivations<0||tmp.lightningActivations>100000||
       tmp.lightningDetonations<0||tmp.lightningDetonations>100000||
       tmp.locksCleared<0||tmp.locksCleared>100000||
       tmp.iceActivations<0||tmp.iceActivations>100000||
       tmp.waterActivations<0||tmp.waterActivations>1000||
       tmp.shuffleCount<0||tmp.shuffleCount>999999||
       tmp.collected<0||tmp.collected>1000000||
       tmp.fireActivations<0||tmp.fireActivations>1000000||
       tmp.fireDetonations<0||tmp.fireDetonations>1000000||
       ((tmp.objectiveKind==2||tmp.objectiveKind==5) && (tmp.collectColor<0||tmp.collectColor>=19))||
       (tmp.objectiveKind!=2&&tmp.objectiveKind!=5&&tmp.collectColor!=-1)||
       (tmp.objectiveKind==5&&(tmp.secondaryKind!=1&&tmp.secondaryKind!=3&&tmp.secondaryKind!=4))||
       (tmp.objectiveKind==5&&(tmp.secondaryTarget<1||tmp.secondaryTarget>2000000))||
       (tmp.objectiveKind!=5&&(tmp.secondaryKind!=-1||tmp.secondaryTarget!=0))||
       (tmp.claimedExtra&&tmp.level<5)||(tmp.claimedRow&&tmp.level<10)||
       (tmp.claimedShuffle&&tmp.level<18)||
       (tmp.claimedColumn&&tmp.level<26)||
       (tmp.claimedBlast&&tmp.level<37)||
       (tmp.claimedCross&&tmp.level<49)||
       (tmp.claimedColor&&tmp.level<62)||
       (tmp.claimedDrill&&tmp.level<77)||
       (tmp.claimedUnlock&&tmp.level<92))return false;
    tmp.cells.resize(n);
    for(auto& t:tmp.cells)if(!(in>>t)||t < -2||t>=19||t==-1)return false;
    tmp.ice.assign(n,0);
    if(magic!="RRNATIVE1")
        for(auto& layer:tmp.ice)if(!(in>>layer)||layer<0||layer>5)return false;
    tmp.locks.assign(n,0);tmp.frozen.assign(n,0);tmp.chests.assign(n,0);
    if(magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")){
        for(auto& x:tmp.locks)if(!(in>>x)||x<0||x>5)return false;
        if((magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")))
            for(auto& layer:tmp.chests)if(!(in>>layer)||layer<0||layer>5)return false;
        for(auto& x:tmp.frozen)if(!(in>>x)||x<0||x>2)return false;
    }
    if(magic=="RRNATIVE4"||magic=="RRNATIVE5"||magic=="RRNATIVE6"||magic=="RRNATIVE7"||magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13")){
        size_t rosterCount=0;
        if(!(in>>rosterCount)||rosterCount<3||rosterCount>7)return false;
        tmp.activeRoster.resize(rosterCount);
        for(auto& id:tmp.activeRoster)if(!(in>>id)||id<0||id>=19)return false;
        tmp.elementals.assign(n,0);
        for(auto& status:tmp.elementals)if(!(in>>status)||status<0||status>6)return false;
    } else {
        tmp.activeRoster={0,1,2,3,4};
        tmp.elementals.assign(n,0);
    }
    tmp.fireAuras.assign(n,0);
    if(magic=="RRNATIVE6"||magic=="RRNATIVE7"||magic=="RRNATIVE8"||magic=="RRNATIVE9"||magic=="RRNATIVE10"||magic=="RRNATIVE11"||(magic=="RRNATIVE12"||magic=="RRNATIVE13"))
        for(auto& duration:tmp.fireAuras)if(!(in>>duration)||duration<0||duration>2)return false;
    for(size_t i=0;i<n;++i){
        if(tmp.cells[i]==-2&&(tmp.ice[i]!=0||tmp.locks[i]!=0||tmp.chests[i]!=0||tmp.frozen[i]!=0||tmp.elementals[i]!=0||tmp.fireAuras[i]!=0))return false;
        if(tmp.cells[i]>=0&&std::find(tmp.activeRoster.begin(),tmp.activeRoster.end(),tmp.cells[i])==tmp.activeRoster.end())return false;
    }
    tmp.jam.assign(n,0);tmp.poison.assign(n,0);
    tmp.lightningAuras.assign(n,0);
    if((magic=="RRNATIVE12"||magic=="RRNATIVE13")){
        for(int& v:tmp.jam)if(!(in>>v)||v<0||v>1)return false;
        for(int& v:tmp.poison)if(!(in>>v)||v<0||v>2)return false;
        for(int& v:tmp.lightningAuras)if(!(in>>v)||v<0||v>2)return false;
    }
    for(size_t i=0;i<n;++i)if(tmp.cells[i]==-2 &&
        (tmp.jam[i]||tmp.poison[i]||tmp.lightningAuras[i]))return false;
    for(auto& r:tmp.rocks){
       if(!(in>>r.kind>>r.hardness>>r.hits>>r.done)
          ||r.kind<0||r.kind>3||r.hardness<1||r.hardness>3
          ||r.hits<0||r.hits>r.hardness||r.done!=(r.hits==r.hardness))return false;
    }
    tmp.specials.assign(n,0);tmp.holds.assign(n,0);
    if(magic=="RRNATIVE13"){
        for(int& v:tmp.specials)if(!(in>>v)||v<0||v>2)return false;
        for(int& v:tmp.holds)if(!(in>>v)||v<0||v>1000000)return false;
        for(size_t i=0;i<n;++i)if(tmp.cells[i]==-2&&(tmp.specials[i]||tmp.holds[i]))return false;
    }
    *this=std::move(tmp);
    return true;
}
} // namespace rupee
