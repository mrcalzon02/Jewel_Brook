#ifdef NDEBUG
#undef NDEBUG
#endif
#include "../game_logic.h"
#include <algorithm>
#include <cassert>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using rupee::Game;
int main(int argc,char** argv){
    if(argc!=2){std::cerr<<"Missing source-authored campaign data\n";return 2;}
    auto loadStage=[&](Game& g,int stage){
        std::ifstream authored(argv[1]);
        assert(authored.good()&&g.startIntro(stage,authored));
    };
    Game g(7919);
    loadStage(g,26);
    assert(g.level==26&&g.width==5&&g.height==6);
    assert(g.columnCount==0&&!g.claimedColumn);
    assert(!g.useColumnRocket(0)); // cannot spend before earning
    assert(g.columnCount==0);
    int hammerTarget=-1;
    for(int i=0;i<static_cast<int>(g.cells.size());++i)
        if(g.cells[i]>=0&&g.ice[i]==0){hammerTarget=i;break;}
    assert(hammerTarget>=0);
    // Exercise first-clear unlock without changing the source-authored target
    // outside this functional diagnostic.
    g.objectiveKind=0;g.collectColor=-1;g.objectiveTarget=1;
    assert(g.useHammer(hammerTarget));
    assert(g.won&&g.claimedColumn&&g.columnCount==3);
    assert(!g.useColumnRocket(hammerTarget)); // no double-spend after win
    std::stringstream milestone;
    assert(g.save(milestone));
    Game restored(7919);
    assert(restored.load(milestone));
    assert(restored.columnCount==3&&restored.claimedColumn);
    loadStage(restored,27);
    assert(restored.level==27&&!restored.won);
    assert(restored.columnCount==3&&restored.claimedColumn);
    assert(!restored.useColumnRocket(-1));
    assert(!restored.useColumnRocket(static_cast<int>(restored.cells.size())));
    assert(restored.columnCount==3);
    int voidAt=-1,chosen=-1;
    for(int i=0;i<static_cast<int>(restored.cells.size());++i){
        if(restored.cells[i]==-2)voidAt=i;
        if(restored.cells[i]>=0&&chosen<0)chosen=i;
    }
    assert(chosen>=0);
    if(voidAt>=0){
        assert(!restored.useColumnRocket(voidAt));
        assert(restored.columnCount==3);
    }
    const int targetColumn=chosen%restored.width;
    const int movesBefore=restored.moves;
    const auto beforeCells=restored.cells;
    const auto beforeIce=restored.ice;
    const auto beforeElementals=restored.elementals;
    int cracked=0, collected=0, affected=0;
    for(int y=0;y<restored.height;++y){
        const int i=y*restored.width+targetColumn;
        if(beforeCells[i]<0)continue;
        ++affected;
        if(beforeIce[i]>0)++cracked;
        else if(restored.objectiveKind==2&&beforeCells[i]==restored.collectColor)++collected;
    }
    assert(affected>0);
    assert(restored.useColumnRocket(chosen));
    assert(restored.columnCount==2);
    assert(restored.moves==movesBefore); // booster is not a paid swap
    assert(restored.iceCleared>=cracked);
    assert(restored.collected>=collected);
    for(int i=0;i<static_cast<int>(beforeCells.size());++i)
        if(beforeCells[i]==-2)assert(restored.cells[i]==-2);
    assert(restored.matchedCells()==0);
    std::stringstream used;
    assert(restored.save(used));
    Game resumed;
    assert(resumed.load(used));
    assert(resumed.columnCount==2&&resumed.claimedColumn);
    assert(resumed.cells==restored.cells);
    assert(resumed.ice==restored.ice);
    assert(resumed.elementals==restored.elementals);
    assert(resumed.randomState==restored.randomState);
    // A historical RRNATIVE6 save has no Column inventory; it must continue
    // to load as zero instead of being discarded or granting free charges.
    Game preview;
    std::stringstream v7;
    assert(preview.save(v7));
    std::string first;
    assert(static_cast<bool>(std::getline(v7,first)));
    std::istringstream header(first);
    std::vector<std::string> fields;
    for(std::string word;header>>word;)fields.push_back(word);
    assert(fields.size()>8);
    fields[0]="RRNATIVE6";
    // RRNative9 adds six header fields beyond v6: Column Rocket stock,
    // its claimed flag, cleared locks, Ice activations, Blast stock and claim. Remove all four.
    fields.erase(fields.end()-16,fields.end()-1);
    std::string board, ice, locks, chests, frozen;
    assert(static_cast<bool>(std::getline(v7,board)));
    assert(static_cast<bool>(std::getline(v7,ice)));
    assert(static_cast<bool>(std::getline(v7,locks)));
    assert(static_cast<bool>(std::getline(v7,chests)));
    assert(static_cast<bool>(std::getline(v7,frozen)));
    std::ostringstream converted;
    for(const auto& item:fields)converted<<item<<" ";
    converted<<"\n"<<board<<"\n"<<ice<<"\n"<<v7.rdbuf();
    std::stringstream legacy(converted.str());
    Game migrated;
    assert(migrated.load(legacy));
    assert(migrated.columnCount==0&&!migrated.claimedColumn);
    assert(migrated.cells==preview.cells);
    std::cout<<"Native Column Rocket: stage 26 unlock, stage 27 use, ice/void/goal integrity and old saves passed\n";
    return 0;
}
