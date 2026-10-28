#pragma once
// Source-equivalent conveyor geometry and gem-payload motion from
// web/board-features.js. A tested prerequisite: stage 125 is NOT enabled here.
#include <algorithm>
#include <cstdlib>
#include <stdexcept>
#include <vector>

namespace rupee::conveyor {
struct Tile {
    int type=-2, ice=0, lock=0, chest=0, rock=0, frozen=0, vines=0;
    int jam=0, poison=0, special=0, elemental=0, hold=0;
};
struct Belt {std::vector<int> indices; bool right=false; int every=2;};

inline std::vector<Belt> make(int level,int width,int height,const std::vector<Tile>& tiles) {
    if(width<=0||height<=0||static_cast<size_t>(width)*height!=tiles.size())
        throw std::invalid_argument("invalid authored conveyor board");
    if(level<125 || !(level>=201||level==125||level==126||level%3!=0))return {};
    struct Run {std::vector<int> ids; int priority;};
    std::vector<Run> runs;
    for(int y=0;y<height;++y){
        int start=-1;
        for(int x=0;x<=width;++x){
            const bool active=x<width&&tiles[y*width+x].type!=-2;
            if(active&&start<0)start=x;
            if(!active&&start>=0){
                if(x-start>=3){
                    Run r;
                    for(int j=start;j<x;++j)r.ids.push_back(y*width+j);
                    // Double the JS half-row priority to preserve exact ties.
                    r.priority=(x-start)*200-std::abs(2*y-(height-1))*4;
                    runs.push_back(std::move(r));
                }
                start=-1;
            }
        }
    }
    if(runs.empty())return {};
    std::sort(runs.begin(),runs.end(),[](const Run& a,const Run& b){
        return a.priority!=b.priority?a.priority>b.priority:a.ids.front()<b.ids.front();
    });
    return {{runs.front().ids,level%2==0,level>=301?1:2}};
}
inline bool blocked(const Tile& c) {
    return c.ice>0||c.lock>0||c.chest>0||c.rock>0||c.frozen>0||c.vines>0;
}
inline void advance(std::vector<Tile>& tiles,const std::vector<Belt>& belts,int turn) {
    if(turn<1)throw std::invalid_argument("turn must be one-based");
    for(const Belt& belt:belts){
        if(belt.every<1)throw std::invalid_argument("invalid conveyor period");
        if(turn%belt.every)continue;
        std::vector<int> segment;
        const auto rotate=[&](){
            if(segment.size()<2){segment.clear();return;}
            struct Payload {int type,special,elemental,hold;};
            std::vector<Payload> prior;
            for(int at:segment){
                if(at<0||static_cast<size_t>(at)>=tiles.size())throw std::out_of_range("conveyor index");
                const Tile& t=tiles[at];prior.push_back({t.type,t.special,t.elemental,t.hold});
            }
            for(size_t i=0;i<segment.size();++i){
                const size_t to=belt.right?(i+1)%segment.size():(i+segment.size()-1)%segment.size();
                Tile& dst=tiles[segment[to]];
                dst.type=prior[i].type;dst.special=prior[i].special;
                dst.elemental=prior[i].elemental;dst.hold=prior[i].hold;
            }
            segment.clear();
        };
        for(int at:belt.indices){
            if(at<0||static_cast<size_t>(at)>=tiles.size())throw std::out_of_range("conveyor index");
            if(tiles[at].type==-2||blocked(tiles[at]))rotate();
            else segment.push_back(at);
        }
        rotate();
    }
}
} // namespace rupee::conveyor
