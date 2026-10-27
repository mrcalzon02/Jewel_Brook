#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <cassert>
#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>
using rupee::Game;
int main(int argc,char** argv) {
    if(argc!=2){std::cerr<<"Missing exported intro campaign fixture\n";return 2;}
    Game previous;
    for(int stage=1;stage<=25;++stage) {
        std::ifstream source(argv[1]);
        assert(source.good());
        Game g(7919);
        assert(g.startIntro(stage,source));
        assert(g.level==stage);
        assert(g.width==(stage<=10?4:5));
        assert(g.height==g.width+1);
        assert(g.cells.size()==static_cast<size_t>(g.width*g.height));
        assert(g.ice.size()==g.cells.size());
        int holes=0;
        for(size_t i=0;i<g.cells.size();++i){
            if(g.cells[i]==-2){
                ++holes;
                assert(g.ice[i]==0);
                assert(!g.adjacent(static_cast<int>(i),static_cast<int>(i)+1));
                assert(!g.adjacent(static_cast<int>(i),static_cast<int>(i)+g.width));
            }
        }
        if(stage==11||stage==12||stage==14)assert(holes>0);
        // Level 13's authored double-chamber mask is fully connected at width 5.
        if(stage==13)assert(holes==0);
        assert(g.moves>=12 && g.moves<=36);
        assert(g.matchedCells()==0&&g.hasMove());
        assert(g.objectiveTarget>0);
        if(stage<=10)
            assert((stage==3||stage==6||stage==8||stage==9||stage==10)?
                g.objectiveKind==1 : g.objectiveKind==0);
        else if(stage==18||stage==19||stage==22||stage==23||stage==25){
            assert(g.objectiveKind==2);
            assert(g.collected==0);
            assert(std::find(g.activeRoster.begin(),g.activeRoster.end(),g.collectColor)!=g.activeRoster.end());
        }
        else assert(g.objectiveKind==0||g.objectiveKind==1);
        if(g.objectiveKind==1) {
            int frozen=0, layers=0;
            for(size_t i=0;i<g.ice.size();++i)if(g.ice[i]>0){
                ++frozen;layers+=g.ice[i];
                assert(!g.adjacent(static_cast<int>(i),static_cast<int>(i)+1));
            }
            assert(frozen>0&&layers>=g.objectiveTarget);
        }
        assert(!g.won&&!g.lost);
        std::stringstream disk;
        assert(g.save(disk));
        Game restored;
        assert(restored.load(disk));
        assert(restored.cells==g.cells);
        assert(restored.ice==g.ice);
        assert(restored.moves==g.moves);
        assert(restored.objectiveTarget==g.objectiveTarget);
        assert(restored.objectiveKind==g.objectiveKind);
        assert(restored.randomState==g.randomState);
        assert(restored.collected==g.collected && restored.collectColor==g.collectColor);
        assert(restored.shuffleCount==g.shuffleCount && restored.claimedShuffle==g.claimedShuffle);
        assert(restored.activeRoster==g.activeRoster);
        assert(restored.elementals==g.elementals);
        assert(restored.waterActivations==g.waterActivations);
        assert(restored.fireActivations==g.fireActivations);
        assert(restored.fireDetonations==g.fireDetonations);
        assert(restored.fireAuras==g.fireAuras);
        if(stage==3){
            int original=g.moves;
            // Adjacent swaps consume a turn even without a match.
            bool accepted=false;
            for(int i=0;i<20 && !accepted;++i)
                for(int j:{i+1,i+4})if(g.adjacent(i,j)) {
                    accepted=g.swap(i,j);
                    if(accepted)break;
                }
            assert(accepted && g.moves==original-1);
            assert(g.ice.size()==20);
            assert(g.matchedCells()==0);
            std::stringstream resumed;assert(g.save(resumed));
            Game reloaded;assert(reloaded.load(resumed));
            assert(reloaded.ice==g.ice&&reloaded.iceCleared==g.iceCleared);
        }
        if(stage>=15){
            assert(g.activeRoster==std::vector<int>({0,1,2,11}));
            bool opal=false;
            for(int type:g.cells)if(type==11)opal=true;
            assert(opal); // gem comes from the Android-authored starting board
        }
        if(stage==15){
            int waterAt=-1;
            for(int i=0;i<static_cast<int>(g.elementals.size());++i)
                if(g.elementals[i]==1){assert(waterAt<0);waterAt=i;}
            assert(waterAt>=0&&g.ice[waterAt]==0);
            assert(g.waterActivations==0);
            assert(g.useHammer(waterAt));
            assert(g.waterActivations==1);
            assert(g.elementals[waterAt]==0);
            assert(g.matchedCells()==0);
            std::stringstream waterSave;
            assert(g.save(waterSave));
            Game waterRestored;
            assert(waterRestored.load(waterSave));
            assert(waterRestored.waterActivations==1);
            assert(waterRestored.elementals==g.elementals);
            assert(waterRestored.activeRoster==g.activeRoster);
        }
        if(stage==21){
            int fireAt=-1;
            for(int i=0;i<static_cast<int>(g.elementals.size());++i)
                if(g.elementals[i]==2){assert(fireAt<0);fireAt=i;}
            assert(fireAt>=0&&g.ice[fireAt]==0);
            assert(g.fireActivations==0&&g.fireDetonations==0);
        }
        if((stage>=16&&stage<=20)||(stage>=22&&stage<=25)){
            for(int e:g.elementals)assert(e==0);
        }
        if(stage==11){
            int voidAt=-1, active=-1;
            for(int i=0;i<static_cast<int>(g.cells.size());++i){
                if(g.cells[i]==-2)voidAt=i;
                else if(active<0)active=i;
            }
            assert(voidAt>=0 && active>=0);
            g.claimedRow=true;g.rowCount=3;
            const int oldScore=g.score;
            assert(!g.useRowRocket(voidAt));
            assert(g.rowCount==3);
            assert(g.useRowRocket(active));
            assert(g.rowCount==2&&g.score>oldScore);
            assert(g.cells[voidAt]==-2); // blasts cannot fill original voids
            assert(g.matchedCells()==0);
            std::stringstream archive;
            assert(g.save(archive));
            Game restored;
            assert(restored.load(archive));
            assert(restored.cells==g.cells&&restored.rowCount==2);
        }
        previous=g;
    }
    std::ifstream source(argv[1]);
    assert(!previous.startIntro(26,source));
    Game legacy;
    std::stringstream old;
    // Verify native preview v1 loads without deleting saves.
    old<<"RRNATIVE1 1 4 5 23 100 850 0 12 0 0 7919 20\n";
    for(int i=0;i<20;++i)old<<"0 ";old<<"\n";
    for(const auto& r:legacy.rocks)
        old<<r.kind<<" "<<r.hardness<<" "<<r.hits<<" "<<r.done<<" ";
    old<<"\n";
    assert(legacy.load(old));
    assert(legacy.ice.size()==20);
    assert(legacy.objectiveKind==0&&legacy.objectiveTarget==850);
    std::cout<<"Native campaign: 25 source-derived stages, opal and Water elemental, void masks, ice, Row Rocket, drag swaps, and old saves passed\n";
    return 0;
}
