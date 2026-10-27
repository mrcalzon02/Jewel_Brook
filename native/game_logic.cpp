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
int Game::rosterSize() const { return std::min(5,3+(level-1)/30); }
void Game::populateBoard() {
    // No starting cascades, like the established deterministic Android generator.
    cells.assign(width*height,0);
    ice.assign(width*height,0);
    for(int y=0;y<height;++y) for(int x=0;x<width;++x) {
        std::vector<int> options;
        for(int t=0;t<rosterSize();++t) {
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
    objectiveKind=0;objectiveTarget=goal;iceCleared=0;
    won=false;lost=false;
    for(int attempts=0;attempts<100;++attempts) {
        populateBoard();
        if(hasMove())break;
    }
}
bool Game::adjacent(int a,int b) const {
    if(a<0||b<0||a>=static_cast<int>(cells.size())||b>=static_cast<int>(cells.size()))return false;
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
            while(y>=0&&ice[y*width+x]>0)--y;
            if(y<0)break;
            const int bottom=y;
            while(y>=0&&ice[y*width+x]==0)--y;
            const int top=y+1;
            int write=bottom;
            for(int from=bottom;from>=top;--from)
                if(cells[from*width+x]>=0)
                    cells[write--*width+x]=cells[from*width+x];
            for(;write>=top;--write)
                cells[write*width+x]=range(rosterSize());
        }
    }
}
void Game::grantMilestoneIfWon(){
    if(!won)return;
    // Only award starter bundles once after completing the unlock stage.
    if(level==5 && !claimedExtra){extraCount+=3;claimedExtra=true;}
    if(level==10 && !claimedRow){rowCount+=3;claimedRow=true;}
}
void Game::updateOutcome(){
    won=objectiveKind==1?iceCleared>=objectiveTarget:score>=objectiveTarget;
    lost=moves<=0&&!won;
    grantMilestoneIfWon();
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
            if(ice[i]>0){--ice[i];++iceCleared;}
            else cells[i]=-1;
        }
        score+=static_cast<int>(affected.size())*60*std::min(cascade,6);
        refill();
    }
    return changed;
}

bool Game::swap(int a,int b) {
    if(won||lost||!adjacent(a,b))return false;
    std::swap(cells[a],cells[b]);
    --moves;
    clearAndFill(); // non-match swaps stay swapped and consume the move
    updateOutcome();
    if(!won&&!lost&&!hasMove()) {
        // Repair a trapped board while preserving current progression.
        // Preserve authored blocker positions and layers during deadlock repair.
        std::vector<int> free;
        for(int i=0;i<static_cast<int>(cells.size());++i)
            if(ice.empty()||ice[i]==0)free.push_back(i);
        for(int tries=0;tries<120;++tries) {
            for(int i=static_cast<int>(free.size())-1;i>0;--i)
                std::swap(cells[free[i]],cells[free[range(i+1)]]);
            if(matchedCells()==0&&hasMove())break;
        }
        if(matchedCells()!=0||!hasMove()){
            // Deterministic repair without deleting any authored ice tiles.
            for(int a:free) {
                if(hasMove()&&matchedCells()==0)break;
                for(int b:free) {
                    if(a>=b||cells[a]==cells[b])continue;
                    std::swap(cells[a],cells[b]);
                    if(matchedCells()==0&&hasMove())break;
                    std::swap(cells[a],cells[b]);
                }
            }
        }

    }
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
    if(won||hammerCount<=0||cell<0||cell>=static_cast<int>(cells.size()))return false;
    --hammerCount;
    // web/engine.js hammer: twenty successive blows; the final blow can
    // remove the gem beneath the last ice layer. Do not invent extra strikes.
    for(int hit=0;hit<20;++hit){
        if(ice[cell]>0){--ice[cell];++iceCleared;}
        else if(cells[cell]>=0){cells[cell]=-1;break;}
        else break;
    }
    score+=35;
    refill();clearAndFill();
    updateOutcome();
    return true;
}
bool Game::useRowRocket(int cell){
    if(won||rowCount<=0||cell<0||cell>=static_cast<int>(cells.size()))return false;
    --rowCount;
    const int y=cell/width;
    for(int x=0;x<width;++x){
        const int i=y*width+x;
        if(ice[i]>0){--ice[i];++iceCleared;}
        else cells[i]=-1;
    }
    score+=width*35;
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
    if(stage<1||stage>10)return false;
    std::string magic;int count=0;
    if(!(authoredCatalog>>magic>>count)||magic!="RRINTRO1"||count!=10)return false;
    for(int k=1;k<=count;++k){
        int number=0,w=0,h=0,budget=0,stageGoal=0,kind=0,target=0;
        uint32_t rng=0;size_t n=0;
        if(!(authoredCatalog>>number>>w>>h>>budget>>stageGoal>>kind>>target>>rng>>n)
           ||number!=k||w!=4||h!=5||budget<12||budget>36||stageGoal<1||
           (kind!=0&&kind!=1)||target<1||target>2000000||!rng||n!=20)return false;
        std::vector<int> types(n),frost(n);
        for(auto& x:types)if(!(authoredCatalog>>x)||x<0||x>=5)return false;
        for(auto& x:frost)if(!(authoredCatalog>>x)||x<0||x>3)return false;
        if(k!=stage)continue;
        Game candidate=*this;
        candidate.level=number;candidate.width=w;candidate.height=h;
        candidate.moves=budget;candidate.goal=stageGoal;
        candidate.objectiveKind=kind;candidate.objectiveTarget=target;
        candidate.iceCleared=0;candidate.score=0;candidate.won=false;candidate.lost=false;
        candidate.cells=std::move(types);candidate.ice=std::move(frost);
        candidate.randomState=rng;
        if(candidate.matchedCells()!=0||!candidate.hasMove())return false;
        *this=std::move(candidate);
        return true;
    }
    return false;
}
bool Game::save(std::ostream& out) const {
    out<<"RRNATIVE3 "<<level<<' '<<width<<' '<<height<<' '<<moves<<' '
       <<score<<' '<<goal<<' '<<ore<<' '<<strikes<<' '<<won<<' '<<lost<<' '
       <<randomState<<' '<<objectiveKind<<' '<<objectiveTarget<<' '
       <<iceCleared<<' '<<hammerCount<<' '<<extraCount<<' '<<rowCount<<' '
       <<claimedExtra<<' '<<claimedRow<<' '<<cells.size()<<'\n';
    for(int v:cells)out<<v<<' ';out<<'\n';
    for(int v:ice)out<<v<<' ';out<<'\n';
    for(auto r:rocks)out<<r.kind<<' '<<r.hardness<<' '<<r.hits<<' '<<r.done<<' ';
    out<<'\n';
    return out.good();
}
bool Game::load(std::istream& in) {
    Game tmp(7919);
    std::string magic;size_t n=0;
    if(!(in>>magic) || (magic!="RRNATIVE1"&&magic!="RRNATIVE2"&&magic!="RRNATIVE3"))return false;
    if(!(in>>tmp.level>>tmp.width>>tmp.height>>tmp.moves>>
       tmp.score>>tmp.goal>>tmp.ore>>tmp.strikes>>tmp.won>>tmp.lost>>
       tmp.randomState))return false;
    if(magic!="RRNATIVE1") {
        if(!(in>>tmp.objectiveKind>>tmp.objectiveTarget>>tmp.iceCleared))return false;
    } else {
        tmp.objectiveKind=0;tmp.objectiveTarget=tmp.goal;tmp.iceCleared=0;
    }
    if(magic=="RRNATIVE3"){
        if(!(in>>tmp.hammerCount>>tmp.extraCount>>tmp.rowCount>>
             tmp.claimedExtra>>tmp.claimedRow))return false;
    } else {
        // Preserve old native saves and make earned early unlocks available.
        tmp.hammerCount=3;tmp.extraCount=tmp.level>=6?3:0;
        tmp.rowCount=tmp.level>=10&&tmp.won?3:0;
        tmp.claimedExtra=tmp.level>=6;
        tmp.claimedRow=tmp.level>=10&&tmp.won;
    }
    if(!(in>>n))return false;
    if(tmp.level<1||tmp.level>1000 ||tmp.width<4||tmp.width>8||
       tmp.height!=tmp.width+1||n!=static_cast<size_t>(tmp.width*tmp.height)||
       tmp.moves<0||tmp.moves>1000||tmp.score<0||tmp.goal<1||tmp.ore<0||
       tmp.strikes<0||tmp.strikes>12||!tmp.randomState||
       tmp.objectiveKind<0||tmp.objectiveKind>1||tmp.objectiveTarget<1||
       tmp.iceCleared<0||tmp.iceCleared>1000||(tmp.won&&tmp.lost)||
       tmp.hammerCount<0||tmp.hammerCount>999999||
       tmp.extraCount<0||tmp.extraCount>999999||
       tmp.rowCount<0||tmp.rowCount>999999||
       (tmp.claimedExtra&&tmp.level<5)||(tmp.claimedRow&&tmp.level<10))return false;
    tmp.cells.resize(n);
    for(auto& t:tmp.cells)if(!(in>>t)||t<0||t>=5)return false;
    tmp.ice.assign(n,0);
    if(magic!="RRNATIVE1")
        for(auto& layer:tmp.ice)if(!(in>>layer)||layer<0||layer>3)return false;
    for(auto& r:tmp.rocks){
       if(!(in>>r.kind>>r.hardness>>r.hits>>r.done)
          ||r.kind<0||r.kind>3||r.hardness<1||r.hardness>3
          ||r.hits<0||r.hits>r.hardness||r.done!=(r.hits==r.hardness))return false;
    }
    *this=std::move(tmp);
    return true;
}
} // namespace rupee
