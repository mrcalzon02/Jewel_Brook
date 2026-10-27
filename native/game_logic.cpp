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
std::vector<int> matches(const std::vector<int>& board, int w, int h, const std::vector<int>& ice) {
    std::set<int> result;
    auto type=[&](int i){return board[i]>=0 && (ice.empty()||ice[i]==0)?board[i]:-1;};
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
    elementals.assign(width*height,0);
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
    objectiveKind=0;objectiveTarget=goal;iceCleared=0;collectColor=-1;collected=0;
    won=false;lost=false;
    for(int attempts=0;attempts<100;++attempts) {
        populateBoard();
        if(hasMove())break;
    }
}
bool Game::adjacent(int a,int b) const {
    if(a<0||b<0||a>=static_cast<int>(cells.size())||b>=static_cast<int>(cells.size()))return false;
    if(cells[a]<0||cells[b]<0)return false; // -2 is an authored board void
    if(ice.size()==cells.size() && (ice[a]>0||ice[b]>0))return false;
    return std::abs(a-b)==width || (a/width==b/width && std::abs(a-b)==1);
}
int Game::matchedCells() const {
    return static_cast<int>(matches(cells,width,height,ice).size());
}
bool Game::hasMove() {
    for(int a=0;a<static_cast<int>(cells.size());++a) {
        for(int b:{a+1,a+width}) {
            if(!adjacent(a,b))continue;
            std::swap(cells[a],cells[b]);
            const bool good=!matches(cells,width,height,ice).empty();
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
            while(y>=0&&(ice[y*width+x]>0||cells[y*width+x]==-2))--y;
            if(y<0)break;
            const int bottom=y;
            while(y>=0&&ice[y*width+x]==0&&cells[y*width+x]!=-2)--y;
            const int top=y+1;
            int write=bottom;
            for(int from=bottom;from>=top;--from)
                if(cells[from*width+x]>=0)
                    cells[write*width+x]=cells[from*width+x],
                    elementals[write--*width+x]=elementals[from*width+x];
            for(;write>=top;--write)
                cells[write*width+x]=activeRoster[range(rosterSize())],
                elementals[write*width+x]=0;
        }
    }
}
void Game::grantMilestoneIfWon(){
    if(!won)return;
    // Only award starter bundles once after completing the unlock stage.
    if(level==5 && !claimedExtra){extraCount+=3;claimedExtra=true;}
    if(level==10 && !claimedRow){rowCount+=3;claimedRow=true;}
    if(level==18 && !claimedShuffle){shuffleCount+=3;claimedShuffle=true;}
}
void Game::updateOutcome(){
    won=objectiveKind==1?iceCleared>=objectiveTarget:objectiveKind==2?collected>=objectiveTarget:score>=objectiveTarget;
    lost=moves<=0&&!won;
    grantMilestoneIfWon();
}

void Game::clearGem(int index){
    if(index<0||index>=static_cast<int>(cells.size())||cells[index]<0)return;
    if(ice[index]>0){--ice[index];++iceCleared;return;}
    if(elementals[index]==1){
        ++waterActivations;  // Water cleans row hazards in the authored game.
    }else if(elementals[index]==2){
        pendingFire.push_back(index); // Fire resolves after current strike set.
    }
    if(objectiveKind==2&&cells[index]==collectColor)++collected;
    cells[index]=-1;
    elementals[index]=0;
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
            if(i==origin||cells[i]<0||ice[i]>0)continue;
            const int distance=std::abs(i/width-row)+std::abs(i%width-col);
            if(distance<best){nearest=i;best=distance;}
        }
        if(nearest>=0 && fireAuras[nearest]==0)fireAuras[nearest]=2;
    }
    // An authored early stage seeds at most one Fire gem; still bound chains.
    pendingFire.clear();
}
void Game::advanceFireTurn(){
    if(won||lost||fireAuras.empty())return;
    std::vector<int> expired;
    for(int i=0;i<static_cast<int>(fireAuras.size());++i)
        if(fireAuras[i]>0 && --fireAuras[i]==0)expired.push_back(i);
    if(expired.empty())return;
    for(int origin:expired){
        ++fireDetonations;
        const int row=origin/width,col=origin%width;
        for(int neighbor:{origin,origin-width,origin-1,origin+1,origin+width}){
            if(neighbor<0||neighbor>=static_cast<int>(cells.size()))continue;
            if(std::abs(neighbor/width-row)+std::abs(neighbor%width-col)>1)continue;
            if(cells[neighbor]>=0)clearGem(neighbor);
        }
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
        auto hit=matches(cells,width,height,ice);
        if(hit.empty())break;
        changed=true;
        std::set<int> affected(hit.begin(),hit.end());
        for(int i:hit){
            const int y=i/width;
            for(int j:{i-width,i+width,i-1,i+1}){
                if(j<0||j>=static_cast<int>(cells.size()))continue;
                if(std::abs(j-i)==1&&j/width!=y)continue;
                if(ice[j]>0)affected.insert(j);
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
    --moves;
    clearAndFill(); // non-match swaps stay swapped and consume the move
    updateOutcome();
    advanceFireTurn();
    if(!won&&!lost&&!hasMove()) {
        // Repair a trapped board while preserving current progression.
        // Preserve authored blocker positions and layers during deadlock repair.
        std::vector<int> free;
        for(int i=0;i<static_cast<int>(cells.size());++i)
            if(cells[i]>=0&&(ice.empty()||ice[i]==0))free.push_back(i);
        for(int tries=0;tries<120;++tries) {
            for(int i=static_cast<int>(free.size())-1;i>0;--i)
                {const int other=free[range(i+1)];
                 std::swap(cells[free[i]],cells[other]);
                 std::swap(elementals[free[i]],elementals[other]);}
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
                    if(matchedCells()==0&&hasMove())break;
                    std::swap(cells[a],cells[b]);
                    std::swap(elementals[a],elementals[b]);
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
        if(cells[i]>=0 && ice[i]==0)free.push_back(i);
    if(free.size()<2)return false;
    const auto originalCells=cells,originalElements=elementals;
    const auto originalRng=randomState;
    for(int tries=0;tries<100;++tries){
        for(int j=static_cast<int>(free.size())-1;j>0;--j){
            const int other=free[range(j+1)];
            std::swap(cells[free[j]],cells[other]);
            std::swap(elementals[free[j]],elementals[other]);
        }
        if(matchedCells()==0&&hasMove())return true;
    }
    // Fallback from Android's gameplay logic: refill movable gem identities
    // from the authored roster, without moving carried elemental powers.
    for(int tries=0;tries<50;++tries){
        for(int i:free)cells[i]=activeRoster[range(rosterSize())];
        if(matchedCells()==0&&hasMove())return true;
    }
    cells=originalCells;elementals=originalElements;randomState=originalRng;
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
        if(ice[cell]>0){clearGem(cell);}
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
    if(stage<1||stage>25)return false;
    std::string magic;int count=0;
    if(!(authoredCatalog>>magic>>count)||magic!="RRCAMPAIGN5"||count!=25)return false;
    for(int k=1;k<=count;++k){
        int number=0,w=0,h=0,budget=0,stageGoal=0,kind=0,target=0;
        uint32_t rng=0;size_t n=0;int selectedColor=-1;
        if(!(authoredCatalog>>number>>w>>h>>budget>>stageGoal>>kind>>target>>rng>>n>>selectedColor)
           ||number!=k||w!=(k<=10?4:5)||h!=w+1||budget<12||budget>36||stageGoal<1||
           (kind!=0&&kind!=1&&kind!=2)||target<1||target>2000000||!rng||
           n!=static_cast<size_t>(w*h))return false;
        std::vector<int> types(n),frost(n);
        for(auto& x:types)if(!(authoredCatalog>>x)||x < -2||x>=19||x==-1)return false;
        for(auto& x:frost)if(!(authoredCatalog>>x)||x<0||x>3)return false;
        size_t rosterCount=0;
        if(!(authoredCatalog>>rosterCount)||rosterCount!=(k<15?3u:4u))return false;
        std::vector<int> roster(rosterCount);
        for(auto& x:roster)if(!(authoredCatalog>>x)||x<0||x>=19)return false;
        if(roster!=(k<15?std::vector<int>{0,1,2}:std::vector<int>{0,1,2,11}))return false;
        if((kind==2&&std::find(roster.begin(),roster.end(),selectedColor)==roster.end())
          ||(kind!=2&&selectedColor!=-1))return false;
        std::vector<int> effects(n,0);
        int powered=0;
        for(auto& x:effects){if(!(authoredCatalog>>x)||x<0||x>2)return false;powered+=x;}
        if(powered!=(k==15||k==21?1:0))return false;
        for(int effect:effects)if((k!=15&&effect==1)||(k!=21&&effect==2))return false;
        for(size_t i=0;i<n;++i)
            if((types[i]==-2&&(frost[i]!=0||effects[i]!=0))||
                (types[i]!=-2&&std::find(roster.begin(),roster.end(),types[i])==roster.end()))
                return false;
        if(k!=stage)continue;
        Game candidate=*this;
        candidate.level=number;candidate.width=w;candidate.height=h;
        candidate.moves=budget;candidate.goal=stageGoal;
        candidate.objectiveKind=kind;candidate.objectiveTarget=target;
        candidate.iceCleared=0;candidate.score=0;candidate.won=false;candidate.lost=false;
        candidate.collectColor=selectedColor;candidate.collected=0;
        candidate.cells=std::move(types);candidate.ice=std::move(frost);
        candidate.activeRoster=std::move(roster);
        candidate.elementals=std::move(effects);
        candidate.fireAuras.assign(n,0);
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
    out<<"RRNATIVE6 "<<level<<' '<<width<<' '<<height<<' '<<moves<<' '
       <<score<<' '<<goal<<' '<<ore<<' '<<strikes<<' '<<won<<' '<<lost<<' '
       <<randomState<<' '<<objectiveKind<<' '<<objectiveTarget<<' '
       <<iceCleared<<' '<<hammerCount<<' '<<extraCount<<' '<<rowCount<<' '
       <<claimedExtra<<' '<<claimedRow<<' '<<waterActivations<<' '
       <<shuffleCount<<' '<<claimedShuffle<<' '<<collectColor<<' '
       <<collected<<' '<<fireActivations<<' '<<fireDetonations<<' '<<cells.size()<<'\n';
    for(int v:cells)out<<v<<' ';out<<'\n';
    for(int v:ice)out<<v<<' ';out<<'\n';
    out<<activeRoster.size()<<' ';
    for(int id:activeRoster)out<<id<<' ';out<<'\n';
    for(int v:elementals)out<<v<<' ';out<<'\n';
    for(int v:fireAuras)out<<v<<' ';out<<'\n';
    for(auto r:rocks)out<<r.kind<<' '<<r.hardness<<' '<<r.hits<<' '<<r.done<<' ';
    out<<'\n';
    return out.good();
}
bool Game::load(std::istream& in) {
    Game tmp(7919);
    std::string magic;size_t n=0;
    if(!(in>>magic) || (magic!="RRNATIVE1"&&magic!="RRNATIVE2"&&magic!="RRNATIVE3"&&magic!="RRNATIVE4"&&magic!="RRNATIVE5"&&magic!="RRNATIVE6"))return false;
    if(!(in>>tmp.level>>tmp.width>>tmp.height>>tmp.moves>>
       tmp.score>>tmp.goal>>tmp.ore>>tmp.strikes>>tmp.won>>tmp.lost>>
       tmp.randomState))return false;
    if(magic!="RRNATIVE1") {
        if(!(in>>tmp.objectiveKind>>tmp.objectiveTarget>>tmp.iceCleared))return false;
    } else {
        tmp.objectiveKind=0;tmp.objectiveTarget=tmp.goal;tmp.iceCleared=0;
    }
    if(magic=="RRNATIVE3"||magic=="RRNATIVE4"||magic=="RRNATIVE5"||magic=="RRNATIVE6"){
        if(!(in>>tmp.hammerCount>>tmp.extraCount>>tmp.rowCount>>
             tmp.claimedExtra>>tmp.claimedRow))return false;
    } else {
        tmp.hammerCount=3;tmp.extraCount=tmp.level>=6?3:0;
        tmp.rowCount=tmp.level>=10&&tmp.won?3:0;
        tmp.claimedExtra=tmp.level>=6;
        tmp.claimedRow=tmp.level>=10&&tmp.won;
    }
    if((magic=="RRNATIVE4"||magic=="RRNATIVE5"||magic=="RRNATIVE6") && !(in>>tmp.waterActivations))return false;
    if(magic=="RRNATIVE5"||magic=="RRNATIVE6"){
        if(!(in>>tmp.shuffleCount>>tmp.claimedShuffle>>tmp.collectColor>>tmp.collected))return false;
    }else{
        tmp.shuffleCount=0;tmp.claimedShuffle=false;
        tmp.collectColor=-1;tmp.collected=0;
    }
    if(magic=="RRNATIVE6" &&
        !(in>>tmp.fireActivations>>tmp.fireDetonations))return false;
    if(!(in>>n))return false;
    if(tmp.level<1||tmp.level>1000 ||tmp.width<4||tmp.width>8||
       tmp.height!=tmp.width+1||n!=static_cast<size_t>(tmp.width*tmp.height)||
       tmp.moves<0||tmp.moves>1000||tmp.score<0||tmp.goal<1||tmp.ore<0||
       tmp.strikes<0||tmp.strikes>12||!tmp.randomState||
       tmp.objectiveKind<0||tmp.objectiveKind>2||tmp.objectiveTarget<1||
       tmp.iceCleared<0||tmp.iceCleared>1000||(tmp.won&&tmp.lost)||
       tmp.hammerCount<0||tmp.hammerCount>999999||
       tmp.extraCount<0||tmp.extraCount>999999||
       tmp.rowCount<0||tmp.rowCount>999999||
       tmp.waterActivations<0||tmp.waterActivations>1000||
       tmp.shuffleCount<0||tmp.shuffleCount>999999||
       tmp.collected<0||tmp.collected>1000000||
       tmp.fireActivations<0||tmp.fireActivations>1000000||
       tmp.fireDetonations<0||tmp.fireDetonations>1000000||
       (tmp.objectiveKind==2 && (tmp.collectColor<0||tmp.collectColor>=19))||
       (tmp.objectiveKind!=2&&tmp.collectColor!=-1)||
       (tmp.claimedExtra&&tmp.level<5)||(tmp.claimedRow&&tmp.level<10)||
       (tmp.claimedShuffle&&tmp.level<18))return false;
    tmp.cells.resize(n);
    for(auto& t:tmp.cells)if(!(in>>t)||t < -2||t>=19||t==-1)return false;
    tmp.ice.assign(n,0);
    if(magic!="RRNATIVE1")
        for(auto& layer:tmp.ice)if(!(in>>layer)||layer<0||layer>3)return false;
    if(magic=="RRNATIVE4"||magic=="RRNATIVE5"||magic=="RRNATIVE6"){
        size_t rosterCount=0;
        if(!(in>>rosterCount)||rosterCount<3||rosterCount>7)return false;
        tmp.activeRoster.resize(rosterCount);
        for(auto& id:tmp.activeRoster)if(!(in>>id)||id<0||id>=19)return false;
        tmp.elementals.assign(n,0);
        for(auto& status:tmp.elementals)if(!(in>>status)||status<0||status>2)return false;
    } else {
        tmp.activeRoster={0,1,2,3,4};
        tmp.elementals.assign(n,0);
    }
    tmp.fireAuras.assign(n,0);
    if(magic=="RRNATIVE6")
        for(auto& duration:tmp.fireAuras)if(!(in>>duration)||duration<0||duration>2)return false;
    for(size_t i=0;i<n;++i){
        if(tmp.cells[i]==-2&&(tmp.ice[i]!=0||tmp.elementals[i]!=0||tmp.fireAuras[i]!=0))return false;
        if(tmp.cells[i]>=0&&std::find(tmp.activeRoster.begin(),tmp.activeRoster.end(),tmp.cells[i])==tmp.activeRoster.end())return false;
    }
    for(auto& r:tmp.rocks){
       if(!(in>>r.kind>>r.hardness>>r.hits>>r.done)
          ||r.kind<0||r.kind>3||r.hardness<1||r.hardness>3
          ||r.hits<0||r.hits>r.hardness||r.done!=(r.hits==r.hardness))return false;
    }
    *this=std::move(tmp);
    return true;
}
} // namespace rupee
