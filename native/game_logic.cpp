#include "game_logic.h"
#include <algorithm>
#include <cmath>
#include <istream>
#include <ostream>
#include <random>
#include <set>
#include <string>

namespace rupee {
namespace {
uint32_t mix(uint32_t x) {
    x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu;
    return x ^ (x >> 16);
}
std::vector<int> matches(const std::vector<int>& board, int w, int h) {
    std::set<int> result;
    for (int y=0;y<h;++y) for (int x=0;x<w;) {
        int end=x+1; while(end<w && board[y*w+end]==board[y*w+x]) ++end;
        if(board[y*w+x]>=0 && end-x>=3) for(int i=x;i<end;++i) result.insert(y*w+i);
        x=end;
    }
    for (int x=0;x<w;++x) for (int y=0;y<h;) {
        int end=y+1; while(end<h && board[end*w+x]==board[y*w+x]) ++end;
        if(board[y*w+x]>=0 && end-y>=3) for(int i=y;i<end;++i) result.insert(i*w+x);
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
int Game::range(int limit) { return static_cast<int>(next()%static_cast<uint32_t>(limit)); }
int Game::rosterSize() const { return std::min(5,3+(level-1)/30); }
void Game::populateBoard() {
    // No starting cascades, like the established deterministic Android generator.
    cells.assign(width*height,0);
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
    won=false;lost=false;
    for(int attempts=0;attempts<100;++attempts) {
        populateBoard();
        if(hasMove())break;
    }
}
bool Game::adjacent(int a,int b) const {
    if(a<0||b<0||a>=static_cast<int>(cells.size())||b>=static_cast<int>(cells.size()))return false;
    return std::abs(a-b)==width || (a/width==b/width && std::abs(a-b)==1);
}
int Game::matchedCells() const {
    return static_cast<int>(matches(cells,width,height).size());
}
bool Game::hasMove() {
    for(int a=0;a<static_cast<int>(cells.size());++a) {
        for(int b:{a+1,a+width}) {
            if(!adjacent(a,b))continue;
            std::swap(cells[a],cells[b]);
            const bool good=!matches(cells,width,height).empty();
            std::swap(cells[a],cells[b]);
            if(good)return true;
        }
    }
    return false;
}
bool Game::clearAndFill() {
    bool changed=false;
    for(int cascade=0;cascade<50;++cascade) {
        const auto hit=matches(cells,width,height);
        if(hit.empty())break;
        changed=true;
        score+=static_cast<int>(hit.size())*100;
        for(int i:hit)cells[i]=-1;
        for(int x=0;x<width;++x) {
            int write=height-1;
            for(int y=height-1;y>=0;--y)if(cells[y*width+x]>=0) {
                cells[write*width+x]=cells[y*width+x];
                --write;
            }
            for(;write>=0;--write)cells[write*width+x]=range(rosterSize());
        }
    }
    return changed;
}
bool Game::swap(int a,int b) {
    if(won||lost||!adjacent(a,b))return false;
    std::swap(cells[a],cells[b]);
    --moves;
    clearAndFill(); // non-match swaps stay swapped and consume the move
    won=score>=goal;
    lost=moves<=0&&!won;
    if(!won&&!lost&&!hasMove()) {
        // Repair a trapped board while preserving current progression.
        auto old=cells;
        for(int tries=0;tries<120;++tries) {
            std::shuffle(cells.begin(),cells.end(),std::mt19937{next()});
            if(matchedCells()==0 && hasMove())break;
        }
        if(matchedCells()!=0||!hasMove()){
            populateBoard();
        }
    }
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
bool Game::save(std::ostream& out) const {
    out<<"RRNATIVE1 "<<level<<' '<<width<<' '<<height<<' '<<moves<<' '
       <<score<<' '<<goal<<' '<<ore<<' '<<strikes<<' '<<won<<' '<<lost<<' '
       <<randomState<<' '<<cells.size()<<'\n';
    for(int v:cells)out<<v<<' ';out<<'\n';
    for(auto r:rocks)out<<r.kind<<' '<<r.hardness<<' '<<r.hits<<' '<<r.done<<' ';
    out<<'\n';
    return out.good();
}
bool Game::load(std::istream& in) {
    Game tmp(7919);
    std::string magic;size_t n=0;
    if(!(in>>magic>>tmp.level>>tmp.width>>tmp.height>>tmp.moves>>
       tmp.score>>tmp.goal>>tmp.ore>>tmp.strikes>>tmp.won>>tmp.lost>>
       tmp.randomState>>n))return false;
    if(magic!="RRNATIVE1"||tmp.level<1||tmp.level>1000
       ||tmp.width<4||tmp.width>8||tmp.height!=tmp.width+1
       ||n!=static_cast<size_t>(tmp.width*tmp.height)||tmp.moves<0||tmp.moves>1000
       ||tmp.score<0||tmp.goal<1||tmp.ore<0||tmp.strikes<0||tmp.strikes>12
       ||!tmp.randomState|| (tmp.won&&tmp.lost))return false;
    tmp.cells.resize(n);
    for(auto& t:tmp.cells)if(!(in>>t)||t<0||t>=5)return false;
    for(auto& r:tmp.rocks){
       if(!(in>>r.kind>>r.hardness>>r.hits>>r.done)
          ||r.kind<0||r.kind>3||r.hardness<1||r.hardness>3
          ||r.hits<0||r.hits>r.hardness||r.done!=(r.hits==r.hardness))return false;
    }
    *this=tmp;
    return true;
}
} // namespace rupee
