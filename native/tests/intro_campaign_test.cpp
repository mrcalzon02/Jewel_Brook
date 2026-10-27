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
    for(int stage=1;stage<=48;++stage) {
        std::ifstream source(argv[1]);
        assert(source.good());
        Game g(7919);
        assert(g.startIntro(stage,source));
        assert(g.level==stage);
        assert(g.width==(stage<=10?4:stage<=30?5:6));
        assert(g.height==g.width+1);
        assert(g.cells.size()==static_cast<size_t>(g.width*g.height));
        assert(g.ice.size()==g.cells.size());
        assert(g.locks.size()==g.cells.size());
        assert(g.frozen.size()==g.cells.size());
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
        int seedFire=0;
        for(int timer:g.fireAuras){
            assert(timer>=0&&timer<=2);
            if(timer>0){assert(timer==2);++seedFire;}
        }
        assert(seedFire==(stage>=45?1:0));
        if(stage<=10)
            assert((stage==3||stage==6||stage==8||stage==9||stage==10)?
                g.objectiveKind==1 : g.objectiveKind==0);
        else if(stage==18||stage==19||stage==22||stage==23||stage==25){
            assert(g.objectiveKind==2);
            assert(g.collected==0);
            assert(std::find(g.activeRoster.begin(),g.activeRoster.end(),g.collectColor)!=g.activeRoster.end());
        }
        else if(stage>=26&&stage<=27){
            // Android determines the authored collection/score/ice profile.
            assert(g.objectiveKind>=0 && g.objectiveKind<=2);
            if(g.objectiveKind==2)
                assert(std::find(g.activeRoster.begin(),g.activeRoster.end(),g.collectColor)!=g.activeRoster.end());
        }
        else if(stage>=28&&stage<=48)
            assert(g.objectiveKind>=0&&g.objectiveKind<=3);
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
        assert(restored.locks==g.locks);
        assert(restored.frozen==g.frozen);
        assert(restored.locksCleared==g.locksCleared);
        assert(restored.iceActivations==g.iceActivations);
        assert(restored.moves==g.moves);
        assert(restored.objectiveTarget==g.objectiveTarget);
        assert(restored.objectiveKind==g.objectiveKind);
        assert(restored.randomState==g.randomState);
        assert(restored.collected==g.collected && restored.collectColor==g.collectColor);
        assert(restored.shuffleCount==g.shuffleCount && restored.claimedShuffle==g.claimedShuffle);
        assert(restored.columnCount==g.columnCount && restored.claimedColumn==g.claimedColumn);
        assert(restored.blastCount==g.blastCount && restored.claimedBlast==g.claimedBlast);
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
            if(stage<35)assert(g.activeRoster==std::vector<int>({0,1,2,11}));
            else assert(g.activeRoster==std::vector<int>({0,1,2,11,18}));
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
        if(stage==31){
            // Pin the actual Android-authored six-column first expansion,
            // not a native-invented 5x6 layout or a rectangular fill.
            const std::vector<int> voids{0,1,6,7,30,31,34,35,36,37,40,41};
            for(int i=0;i<42;++i)
                assert((g.cells[i]==-2)==(std::find(voids.begin(),voids.end(),i)!=voids.end()));
            assert(g.width==6 && g.height==7 && holes==12);
            assert(g.moves==31 && g.goal==6290 && g.randomState==2847946430u);
            assert(g.objectiveKind==2 && g.collectColor==11 && g.objectiveTarget==20);
            assert(g.activeRoster==std::vector<int>({0,1,2,11}));
            assert(std::count_if(g.ice.begin(),g.ice.end(),[](int n){return n>0;})==4);
            assert(std::count_if(g.locks.begin(),g.locks.end(),[](int n){return n>0;})==1);
            assert(g.locks[24]>0 && g.ice[3]>0 && g.ice[11]>0 &&
                   g.ice[21]>0 && g.ice[27]>0);
            assert(std::all_of(g.elementals.begin(),g.elementals.end(),[](int n){return n==0;}));
            // Stage 30 -> 31 is a real progression boundary. The new board
            // must not discard earned booster inventory or previous unlocks.
            Game crossing;
            std::ifstream stage30(argv[1]);
            assert(crossing.startIntro(30,stage30));
            crossing.hammerCount=2;
            crossing.columnCount=2;
            crossing.claimedColumn=true;
            std::ifstream stage31(argv[1]);
            assert(crossing.startIntro(31,stage31));
            assert(crossing.hammerCount==2 && crossing.columnCount==2 && crossing.claimedColumn);
            assert(crossing.cells==g.cells && crossing.ice==g.ice &&
                   crossing.locks==g.locks && crossing.elementals==g.elementals);
            std::stringstream saved;
            assert(crossing.save(saved));
            Game reopened;
            assert(reopened.load(saved));
            assert(reopened.level==31 && reopened.width==6 && reopened.height==7);
            assert(reopened.cells==g.cells && reopened.ice==g.ice &&
                   reopened.locks==g.locks && reopened.elementals==g.elementals);
            assert(reopened.hammerCount==2 && reopened.columnCount==2 &&
                   reopened.claimedColumn && reopened.randomState==g.randomState);
            assert(reopened.objectiveKind==2 && reopened.collectColor==11 &&
                   reopened.objectiveTarget==20 && reopened.collected==0);
        }
        if(stage==42){
            int fireGems=0,fireIndex=-1;
            for(size_t i=0;i<g.elementals.size();++i)
                if(g.elementals[i]==2){++fireGems;fireIndex=static_cast<int>(i);}
            assert(fireGems==1 && fireIndex>=0);
            assert(g.cells[fireIndex]==11 || g.cells[fireIndex]==18);
            assert(g.ice[fireIndex]==0 && g.locks[fireIndex]==0);
            std::stringstream seeded;assert(g.save(seeded));
            Game fireLoaded;assert(fireLoaded.load(seeded));
            assert(fireLoaded.elementals==g.elementals);
        }
        if(stage==35){
            assert(g.activeRoster==std::vector<int>({0,1,2,11,18}));
            bool originalAlexandrite=false;
            for(int type:g.cells)if(type==18)originalAlexandrite=true;
            assert(originalAlexandrite);
            int count=0;
            for(int power:g.elementals)if(power==1)++count;
            assert(count==1);
        }
        if(stage==28){
            int frozenSeed=-1;
            for(int i=0;i<static_cast<int>(g.elementals.size());++i)
                if(g.elementals[i]==3){assert(frozenSeed==-1);frozenSeed=i;}
            assert(frozenSeed>=0 && g.ice[frozenSeed]==0 && g.locks[frozenSeed]==0);
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
    assert(!previous.startIntro(49,source));
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
    std::cout<<"Native campaign: 48 source-derived stages, 6-column stage 31, void masks, objective parity, and old saves passed\n";
    return 0;
}
