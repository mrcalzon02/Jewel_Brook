#include "conveyor_motion.hpp"
#include "game_conveyor_bridge.hpp"
#include <algorithm>
#include <cstdint>
#include <fstream>
#include <sstream>
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

    // Import the *actual* stage-125 starting board/objective into a native
    // Game for parity checks. Do not enable Game::startIntro(125) or the UI:
    // full objective-turn and visual acceptance is still outstanding.
    std::string tag;int level,w,h,moves,goal,target,color,n,rosterCount;
    std::uint32_t rng;
    if(!(in>>tag>>level>>w>>h>>moves>>goal>>target>>color>>rng>>n)||
       tag!="AUTHORED125"||level!=125||w!=7||h!=8||n!=w*h||
       moves<12||moves>36||goal<1||target<1||rng==0)return 17;
    if(!(in>>tag>>rosterCount)||tag!="ROSTER"||rosterCount!=6)return 18;
    std::vector<int> roster;
    for(int j=0;j<rosterCount;++j){
        int gem=-1;
        if(!(in>>gem)||gem<0||gem>=19||
           std::find(roster.begin(),roster.end(),gem)!=roster.end())return 19;
        roster.push_back(gem);
    }
    if(std::find(roster.begin(),roster.end(),color)==roster.end())return 20;
    if(!(in>>tag)||tag!="TILES")return 21;
    rupee::Game authored(7919);
    authored.startLevel(125);
    authored.moves=moves;authored.goal=goal;
    authored.objectiveKind=2;authored.objectiveTarget=target;
    authored.collectColor=color;authored.activeRoster=roster;
    authored.randomState=rng;
    for(int j=0;j<n;++j){
        int type,ice,lock,chest,jam,poison,rock,frozen,vine,fire,special,elemental,hold;
        if(!(in>>type>>ice>>lock>>chest>>jam>>poison>>rock>>frozen>>
             vine>>fire>>special>>elemental>>hold))return 22;
        if(type < -2||type >= 19||type == -1||
           ice<0||ice>5||lock<0||lock>5||chest<0||chest>5||
           jam<0||jam>1||poison<0||poison>2||rock<0||rock>5||
           frozen<0||frozen>5||vine<0||vine>2||(fire!=0&&fire!=2)||
           special<0||special>2||elemental<0||elemental>6||hold<0||hold>4)return 23;
        if(type==-2){
            if(ice||lock||chest||jam||poison||rock||frozen||vine||fire||special||elemental||hold)return 24;
        }else if(std::find(roster.begin(),roster.end(),type)==roster.end())return 25;
        authored.cells[j]=type;authored.ice[j]=ice;authored.locks[j]=lock;
        authored.chests[j]=chest;authored.jam[j]=jam;authored.poison[j]=poison;
        authored.rockLayers[j]=rock;authored.frozen[j]=frozen;
        authored.vineAuras[j]=vine;authored.fireAuras[j]=fire;
        authored.specials[j]=special;authored.elementals[j]=elemental;
        authored.holds[j]=hold;
    }
    if(in>>tag)return 26; // reject trailing unreviewed source fields
    if(authored.matchedCells()!=0||!authored.hasMove())return 27;
    std::stringstream persisted;
    if(!authored.save(persisted))return 28;
    rupee::Game reloaded;
    if(!reloaded.load(persisted)||reloaded.level!=125||
       reloaded.cells!=authored.cells||reloaded.ice!=authored.ice||
       reloaded.locks!=authored.locks||reloaded.chests!=authored.chests||
       reloaded.jam!=authored.jam||reloaded.poison!=authored.poison||
       reloaded.rockLayers!=authored.rockLayers||
       reloaded.vineAuras!=authored.vineAuras||
       reloaded.fireAuras!=authored.fireAuras||
       reloaded.specials!=authored.specials||
       reloaded.elementals!=authored.elementals||
       reloaded.holds!=authored.holds||
       reloaded.activeRoster!=roster||reloaded.objectiveKind!=2||
       reloaded.objectiveTarget!=target||reloaded.collectColor!=color||
       reloaded.randomState!=rng)return 29;
    rupee::Game gated;
    std::istringstream noCatalog("");
    if(gated.startIntro(125,noCatalog))return 30;

    std::cout<<"Source-equivalent stage-125 conveyor: "<<cases<<" Android/C++ cases, "<<integrated<<" Game bridge cases, "<<pinnedLayerIntegrated<<" anchored rock/vine cases plus authored stage-125 objective/board/save verified (stage gated)\n";
    return 0;
}
