#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../mine_economy.h"
#include <cassert>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
using namespace rupee;
int main(int argc,char** argv){
    if(argc!=2){std::cerr<<"Need authoritative fixture path\n";return 2;}
    std::ifstream fixtures(argv[1]);if(!fixtures){std::cerr<<"Missing source parity vectors\n";return 2;}
    unsigned int seed;int tier,x,y,kind,hardness,ore,compared=0;
    while(fixtures>>seed>>tier>>x>>y>>kind>>hardness>>ore){
        const MineCell c=MineEconomy::tile(seed,x,y,tier);
        assert(c.kind==kind && c.hardness==hardness);
        assert((c.kind==0?0:c.kind==1?1:c.kind==2?2:4)==ore);
        ++compared;
    }
    assert(compared>=400);
    MineEconomy a;
    assert(a.seed==4099&&a.size()==4&&a.strikes==12&&a.scans==0);
    assert(a.cartOre==0&&a.ore==0&&a.goods==0&&a.dollars==0);
    assert(!a.survey(0)); // starter gloves do not grant a free scan
    assert(!a.mine(-1) && !a.mine(999));
    assert(MineEconomy::price(MineUpgrade::Pickaxe,1)==160);
    assert(MineEconomy::price(MineUpgrade::Gloves,1)==140);
    assert(MineEconomy::price(MineUpgrade::Mine,1)==250);
    assert(MineEconomy::price(MineUpgrade::Cart,1)==120);
    assert(!a.upgrade(MineUpgrade::Pickaxe)); // cannot buy with phantom dollars
    assert(a.mine(0));assert(a.strikes==11);
    a.cartOre=10; // simulated full cart
    int target=-1;
    for(int i=0;i<16;++i)if(a.cells[i].kind!=0 && !a.cells[i].hits){target=i;break;}
    assert(target>=0);
    while(a.cells[target].hits<a.cells[target].hardness){
        assert(a.mine(target));
    }
    assert(a.cartOre==10 && a.cells[target].exposed>0);
    assert(!a.collect(target));  // full cart must not discard or mint ore
    assert(a.unload());assert(a.ore==10 && a.cartOre==0);
    const int exposed=a.cells[target].exposed;
    assert(a.collect(target));assert(a.cartOre==exposed && a.cells[target].exposed==0);
    assert(!a.collect(target));
    assert(a.unload());assert(a.ore==10+exposed);
    a.ore=8;
    assert(a.refine(2));assert(a.ore==0&&a.metal==2);
    assert(!a.refine(1));
    assert(a.manufacture());assert(a.metal==0&&a.goods==1);
    assert(!a.manufacture());
    assert(a.sell());assert(a.goods==0&&a.dollars==300);
    assert(!a.sell());
    const int strikesBefore=a.strikes;
    assert(a.upgrade(MineUpgrade::Pickaxe));
    assert(a.pickTier==1&&a.strikes==strikesBefore+5&&a.dollars==140);
    assert(a.upgrade(MineUpgrade::Gloves));
    assert(a.gloveTier==1&&a.scans==1&&a.dollars==0);
    assert(!a.survey(target)); // already cleared
    int surveyTarget=-1;
    for(int i=0;i<16;++i)if(a.cells[i].hits<a.cells[i].hardness && !a.cells[i].scanned){surveyTarget=i;break;}
    assert(surveyTarget>=0&&a.survey(surveyTarget)&&a.scans==0);
    assert(!a.survey(surveyTarget));
    a.dollars=1000;
    const int targetHits=a.cells[target].hits;
    assert(a.upgrade(MineUpgrade::Mine)); // 4x4 -> 5x5 retains previous contents
    assert(a.size()==5&&a.cells.size()==25);
    const int nx=target%4,ny=target/4;
    assert(a.cells[a.index(nx,ny)].hits==targetHits);
    assert(a.upgrade(MineUpgrade::Cart));assert(a.cartTier==1&&MineEconomy::cartLimit(a.cartTier)==20);
    assert(a.upgrade(MineUpgrade::Refinery));assert(a.refineryTier==1);
    assert(a.day.size()==10);
    assert(a.resetForDay("2999-01-01"));
    assert(a.strikes==MineEconomy::strikeLimit(a.pickTier));
    assert(a.scans==MineEconomy::scanLimit(a.gloveTier));
    assert(!a.resetForDay("2999-01-01"));
    std::stringstream saved;
    assert(a.save(saved));
    MineEconomy restored;
    assert(restored.load(saved));
    assert(restored.pickTier==1&&restored.gloveTier==1);
    assert(restored.size()==5&&restored.cells.size()==25);
    assert(restored.cells[restored.index(nx,ny)].hits==a.cells[a.index(nx,ny)].hits);
    std::stringstream malformed("RRMINING1 4099 0 5 0 0 0 0 12 0 0 0 0 0 0 0 2026-10-26 100000000");
    assert(!restored.load(malformed));
    MineEconomy site;
    const int previousSite=site.sites;
    const uint32_t previousSeed=site.seed;
    for(auto& c:site.cells){c.hits=c.hardness;c.exposed=0;}
    site.cells[0].hits=site.cells[0].hardness-1;
    site.strikes=12;
    assert(site.mine(0));
    assert(site.sites==previousSite+1&&site.seed!=previousSeed);
    assert(site.cells.size()==16 && site.cells[0].hits==0);
    std::cout<<"Native mining parity: "<<compared<<" source vectors plus mining/economy/save functional diagnostics passed\n";
}
