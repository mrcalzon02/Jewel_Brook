#include "conveyor_motion.hpp"
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
        rupee::conveyor::advance(actual,computed,turn);
        for(int j=0;j<n;++j)if(!equal(actual[j],after[j])){
            std::cerr<<name<<": tile "<<j<<" differs after Android turn "<<turn<<"\n";return 12;
        }
    }
    std::cout<<"Source-equivalent stage-125 conveyor: "<<cases<<" Android/C++ cases passed\n";
    return 0;
}
