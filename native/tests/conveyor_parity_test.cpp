#include "conveyor_motion.hpp"
#include "game_conveyor_bridge.hpp"
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>
using rupee::conveyor::Tile;
static Tile readTile(std::istream& in){
    Tile t;
    if(!(in>>t.type>>t.ice>>t.lock>>t.chest>>t.rock>>t.frozen>>t.vines
         >>t.jam>>t.poison>>t.special>>t.elemental>>t.hold))
        throw std::runtime_error("incomplete conveyor tile fixture");
    return t;
}
static bool equal(const Tile& a,const Tile& b){
    return a.type==b.type&&a.ice==b.ice&&a.lock==b.lock&&a.chest==b.chest&&
           a.rock==b.rock&&a.frozen==b.frozen&&a.vines==b.vines&&a.jam==b.jam&&
           a.poison==b.poison&&a.special==b.special&&a.elemental==b.elemental&&a.hold==b.hold;
}
int main(int argc,char** argv){
    if(argc!=2)return 2;
    std::ifstream in(argv[1]);
    std::string magic;int cases=0;
    if(!(in>>magic>>cases)||magic!="RRCONVEYOR1"||cases<10)return 3;
    int integrated=0,pinnedLayerIntegrated=0;
    for(int test=0;test<cases;++test){
        std::string marker,name;int level,w,h,turn,n,belts;
        if(!(in>>marker>>name>>level>>w>>h>>turn>>n)||marker!="CASE"||n!=w*h)return 4;
        if(!(in>>marker>>belts)||marker!="BELTS"||belts<0||belts>1)return 5;
        std::vector<rupee::conveyor::Belt> expected;
        for(int k=0;k<belts;++k){
            int count,right,every;
            if(!(in>>count>>right>>every)||count<3||count>n||(right!=0&&right!=1))return 6;
            rupee::conveyor::Belt b;b.right=right!=0;b.every=every;
            for(int j=0;j<count;++j){int at;if(!(in>>at))return 7;b.indices.push_back(at);}
            expected.push_back(b);
        }
        if(!(in>>marker)||marker!="BEFORE")return 8;
        std::vector<Tile> actual,after;
        for(int j=0;j<n;++j)actual.push_back(readTile(in));
        if(!(in>>marker)||marker!="AFTER")return 9;
        for(int j=0;j<n;++j)after.push_back(readTile(in));
        auto computed=rupee::conveyor::make(level,w,h,actual);
        if(computed.size()!=expected.size()){
            std::cerr<<name<<": belt count differs from Android\n";return 10;
        }
        for(size_t j=0;j<computed.size();++j)
            if(computed[j].indices!=expected[j].indices||computed[j].right!=expected[j].right||computed[j].every!=expected[j].every){
                std::cerr<<name<<": authored conveyor geometry differs\n";return 11;
            }
        const auto before=actual;
        rupee::conveyor::advance(actual,computed,turn);
        for(int j=0;j<n;++j)if(!equal(actual[j],after[j])){
            std::cerr<<name<<": tile "<<j<<" differs after Android turn "<<turn<<"\n";return 12;
        }

        // Exercise the production Game adapter against the same Android
        // fixtures, not just the standalone conveyor implementation.
        // Rock and nature-vine cells are now integrated into production Game.
        bool unsupportedPinnedLayer=false;
        for(const auto& belt:computed)
            for(int at:belt.indices)
                if(before[at].rock>0||before[at].vines>0)
                    unsupportedPinnedLayer=true;
        if(unsupportedPinnedLayer)++pinnedLayerIntegrated;
        rupee::Game game(7919);
        game.startLevel(level);
        if(game.width!=w||game.height!=h)return 13;
        for(int j=0;j<n;++j){
            game.cells[j]=before[j].type;
            game.ice[j]=before[j].ice;
            game.locks[j]=before[j].lock;
            game.chests[j]=before[j].chest;
            game.frozen[j]=before[j].frozen;
            game.rockLayers[j]=before[j].rock;
            game.vineAuras[j]=before[j].vines ? 2 : 0;
            game.jam[j]=before[j].jam;
            game.poison[j]=before[j].poison;
            game.specials[j]=before[j].special;
            game.elementals[j]=before[j].elemental;
            game.holds[j]=before[j].hold;
        }
        bool expectedMoved=false;
        for(int j=0;j<n;++j)
            if(before[j].type!=after[j].type||
               before[j].special!=after[j].special||
               before[j].elemental!=after[j].elemental||
               before[j].hold!=after[j].hold)expectedMoved=true;
        if(rupee::advanceConveyor(game,turn)!=expectedMoved){
            std::cerr<<name<<": production conveyor change receipt differs\n";return 14;
        }
        for(int j=0;j<n;++j)
            if(game.cells[j]!=after[j].type||
               game.specials[j]!=after[j].special||
               game.elementals[j]!=after[j].elemental||
               game.holds[j]!=after[j].hold||
               game.ice[j]!=after[j].ice||
               game.locks[j]!=after[j].lock||
               game.chests[j]!=after[j].chest||
               game.rockLayers[j]!=after[j].rock||
               (game.vineAuras[j]>0)!=(after[j].vines>0)||
               game.frozen[j]!=after[j].frozen||
               game.jam[j]!=after[j].jam||
               game.poison[j]!=after[j].poison){
                std::cerr<<name<<": production Game payload/anchored state differs at "<<j<<"\n";
                return 15;
            }
        ++integrated;
    }
    if(integrated!=cases||pinnedLayerIntegrated<2){
        std::cerr<<"Insufficient integrated rock/vine conveyor cases\n";return 16;
    }
    std::cout<<"Source-equivalent stage-125 conveyor: "<<cases<<" Android/C++ cases, "<<integrated<<" Game bridge cases, "<<pinnedLayerIntegrated<<" anchored rock/vine cases verified\n";
    return 0;
}
