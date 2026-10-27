#include "game_logic.h"
#include "mine_economy.h"
#include "equipment_paths.h"
#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <algorithm>
#include <array>
#include <ctime>
#include <filesystem>
#include <fstream>
#include <string>
#include <vector>

namespace fs=std::filesystem;
using rupee::Game;
using rupee::MineEconomy;
using rupee::MineUpgrade;
namespace {
enum class Screen { Home, Board, Mine };
struct Rect {float x,y,w,h; bool contains(float px,float py)const{
    return px>=x&&py>=y&&px<x+w&&py<y+h;
}};
void fill(SDL_Renderer* r,Rect v,SDL_Color c){
    SDL_SetRenderDrawColor(r,c.r,c.g,c.b,c.a);
    SDL_FRect area{v.x,v.y,v.w,v.h};SDL_RenderFillRect(r,&area);
}
void label(SDL_Renderer* r,float x,float y,const std::string& s,int size=2){
    SDL_SetRenderDrawColor(r,226,248,235,255);
    SDL_SetRenderScale(r,static_cast<float>(size),static_cast<float>(size));
    SDL_RenderDebugText(r,x/size,y/size,s.c_str());
    SDL_SetRenderScale(r,1,1);
}
Rect button(SDL_Renderer* r,Rect box,const char* text){
    fill(r,box,{28,68,57,255});
    SDL_SetRenderDrawColor(r,88,207,142,255);
    SDL_FRect outline{box.x,box.y,box.w,box.h};
    SDL_RenderRect(r,&outline);
    float length=static_cast<float>(std::char_traits<char>::length(text)*16);
    label(r,box.x+std::max(6.0f,(box.w-length)*0.5f),box.y+(box.h-16)*0.5f,text);
    return box;
}
SDL_Texture* png(SDL_Renderer* r,const fs::path& path){
    SDL_Surface* s=SDL_LoadPNG(path.string().c_str());
    if(!s){SDL_Log("Missing required approved artwork: %s (%s)",path.string().c_str(),SDL_GetError());return nullptr;}
    SDL_Texture* t=SDL_CreateTextureFromSurface(r,s);
    SDL_DestroySurface(s);
    return t;
}
Rect gameBoard(int ww,int hh,const Game& g){
    float cell=std::min({110.0f,(ww-120.0f)/g.width,(hh-178.0f)/g.height});
    cell=std::max(10.0f,cell);
    return {(ww-g.width*cell)*.5f,96.0f,g.width*cell,g.height*cell};
}
Rect mineBoard(int ww,int hh,int size){
    // Leave a genuine native actions/economy panel to the right, not a page scroller.
    float cell=std::min({110.0f,(ww-380.0f)/size,(hh-195.0f)/size});
    cell=std::max(15.0f,cell);
    return {22.0f,105.0f,cell*size,cell*size};
}
std::array<Rect,10> mineActions(int ww,int hh,const MineEconomy& mine){
    Rect board=mineBoard(ww,hh,mine.size());
    const float px=board.x+board.w+24.0f;
    const float panel=std::max(120.0f,ww-px-18.0f);
    const float half=(panel-10.0f)/2.0f;
    std::array<Rect,10> result{};
    for(int i=0;i<10;++i){
        result[i]={px+(i%2)*(half+10),195.0f+(i/2)*53.0f,half,44.0f};
    }
    return result;
}
int hit(Rect b,int cols,int rows,float x,float y){
    if(!b.contains(x,y))return -1;
    int col=std::clamp(static_cast<int>((x-b.x)/(b.w/cols)),0,cols-1);
    int row=std::clamp(static_cast<int>((y-b.y)/(b.h/rows)),0,rows-1);
    return row*cols+col;
}
fs::path dataRoot(){
    return fs::path(SDL_GetBasePath())/"data";
}
fs::path savePath(){
    char* pref=SDL_GetPrefPath("RupeeRush","RupeeRushDesktop");
    if(!pref)return {};
    fs::path result=fs::path(pref)/"native-state-v1.txt";
    SDL_free(pref);
    return result;
}
template<class State>bool writeSave(const State& g,const fs::path& path){
    if(path.empty())return false;
    const auto tmp=fs::path(path.string()+".tmp");
    const auto backup=fs::path(path.string()+".bak");
    {
        std::ofstream f(tmp,std::ios::trunc);
        if(!f||!g.save(f))return false;
        f.flush();if(!f.good())return false;
    }
    std::error_code ec;
    fs::remove(backup,ec);ec.clear();
    if(fs::exists(path)){
        fs::rename(path,backup,ec);
        if(ec)return false;
    }
    fs::rename(tmp,path,ec);
    if(ec){
        std::error_code rollback;
        if(fs::exists(backup))fs::rename(backup,path,rollback);
        return false;
    }
    return true;
}
Game restore(const fs::path& path){
    Game g(7919);
    std::ifstream f(path);
    if(f && g.load(f))return g;
    // Recover from an interrupted replacement without wiping local progress.
    std::ifstream backup(path.string()+".bak");
    if(backup)g.load(backup);
    return g;
}
MineEconomy restoreMine(const fs::path& path,const Game& oldGame,bool hasPreviousNativeSave){
    MineEconomy n;
    std::ifstream main(path);
    if(main && n.load(main))return n;
    std::ifstream backup(path.string()+".bak");
    if(backup && n.load(backup))return n;
    // Upgrade from the previously published native desktop preview without
    // deleting its earned ore or strikes. No compatibility changes to Android.
    if(hasPreviousNativeSave && !fs::exists(path) && !fs::exists(path.string()+".bak")){
        std::vector<rupee::MineCell> old;
        for(const auto& r:oldGame.rocks){
            rupee::MineCell cell;
            cell.kind=r.kind;cell.hardness=r.hardness;cell.hits=r.hits;
            old.push_back(cell);
        }
        n.importLegacy(old,oldGame.ore,oldGame.strikes);
    }
    return n;
}
struct Art {
    std::array<SDL_Texture*,5> gem{};
    std::array<SDL_Texture*,40> pick{};
    std::array<SDL_Texture*,40> glove{};
    SDL_Texture* ore=nullptr;
    SDL_Texture* ice1=nullptr;
    SDL_Texture* ice2=nullptr;
    SDL_Texture* hammer=nullptr;
    SDL_Texture* extra=nullptr;
    SDL_Texture* rowRocket=nullptr;
    bool load(SDL_Renderer* r,const fs::path& root){
        static constexpr std::array<const char*,5> names={"ruby","sapphire","emerald","topaz","amethyst"};
        for(int i=0;i<5;++i)gem[i]=png(r,root/"art/embryon/generated/gems"/(std::string(names[i])+".png"));
        ore=png(r,root/"art/nutvale/mines/nutvale-mines-ore-atlas-approved.png");
        ice1=png(r,root/"art/primary/blockers/ice-1.png");
        ice2=png(r,root/"art/primary/blockers/ice-2.png");
        // Only original approved PNGs (source: web/progression.js BOOSTER_ART).
        hammer=png(r,root/"art/primary/powerups/hammer.png");
        extra=png(r,root/"art/additions/economy/hourglass.png");
        rowRocket=png(r,root/"art/embryon/runtime/boosters/row.png");
        for(int i=0;i<40;++i) {
            pick[i]=png(r,root/rupee::PickaxeArt[i]);
            glove[i]=png(r,root/rupee::GloveArt[i]);
        }
        const auto ready=[](const auto& list){
            return std::all_of(list.begin(),list.end(),[](SDL_Texture* t){return t!=nullptr;});
        };
        return ready(gem)&&ready(pick)&&ready(glove)&&ore&&ice1&&ice2&&hammer&&extra&&rowRocket;
    }
    void release(){
        for(auto* t:gem)if(t)SDL_DestroyTexture(t);
        for(auto* t:pick)if(t)SDL_DestroyTexture(t);
        for(auto* t:glove)if(t)SDL_DestroyTexture(t);
        if(ore)SDL_DestroyTexture(ore);
        if(ice1)SDL_DestroyTexture(ice1);
        if(ice2)SDL_DestroyTexture(ice2);
        if(hammer)SDL_DestroyTexture(hammer);
        if(extra)SDL_DestroyTexture(extra);
        if(rowRocket)SDL_DestroyTexture(rowRocket);
    }
};
std::array<Rect,3> boosterIcons(int ww,int hh){
    return {Rect{ww*.5f-128.0f,static_cast<float>(hh-74),60,60},
            Rect{ww*.5f-30.0f,static_cast<float>(hh-74),60,60},
            Rect{ww*.5f+68.0f,static_cast<float>(hh-74),60,60}};
}
void drawBoard(SDL_Renderer* r,Art& art,Game& game,int ww,int hh,bool hammerArmed,bool rowArmed){
    label(r,28,26,"RUPEE RUSH - NATIVE MATCH 3",2);
    label(r,28,59,"STAGE "+std::to_string(game.level)+"   MOVES "+std::to_string(game.moves)+
          (game.objectiveKind==1?
             "   BREAK ICE "+std::to_string(game.iceCleared)+" / "+std::to_string(game.objectiveTarget):
             "   SCORE "+std::to_string(game.score)+" / "+std::to_string(game.objectiveTarget)),2);
    const auto b=gameBoard(ww,hh,game);
    SDL_SetRenderDrawColor(r,67,191,128,255);
    SDL_FRect boardOutline{b.x-3,b.y-3,b.w+6,b.h+6};
    SDL_RenderRect(r,&boardOutline);
    float tile=b.w/game.width;
    for(int y=0;y<game.height;++y)for(int x=0;x<game.width;++x){
        int i=y*game.width+x;
        if(game.cells[i]==-2)continue; // Respect authored empty board-space silhouettes
        SDL_FRect dest{b.x+x*tile+2,b.y+y*tile+2,tile-4,tile-4};
        fill(r,{dest.x,dest.y,dest.w,dest.h},{30,50,55,255});
        // Source identity is the same approved gemstone file already in web/.
        SDL_RenderTexture(r,art.gem[game.cells[i]],nullptr,&dest);
        if(game.ice.size()==game.cells.size()&&game.ice[i]>0){
            SDL_RenderTexture(r,game.ice[i]>=2?art.ice2:art.ice1,nullptr,&dest);
        }
    }
    button(r,{20.0f,static_cast<float>(hh-64),154,44},"MAIN MENU");
    // Icons ARE the buttons: no surrounding shells or text-only substitutes.
    if(!game.won){
        const auto icons=boosterIcons(ww,hh);
        SDL_FRect hammerRect{icons[0].x,icons[0].y,icons[0].w,icons[0].h};
        SDL_RenderTexture(r,art.hammer,nullptr,&hammerRect);
        label(r,icons[0].x+43,icons[0].y+44,std::to_string(game.hammerCount),2);
        if(game.claimedExtra){
            SDL_FRect extraRect{icons[1].x,icons[1].y,icons[1].w,icons[1].h};
            SDL_RenderTexture(r,art.extra,nullptr,&extraRect);
            label(r,icons[1].x+43,icons[1].y+44,std::to_string(game.extraCount),2);
        }
        if(game.claimedRow){
            SDL_FRect rowRect{icons[2].x,icons[2].y,icons[2].w,icons[2].h};
            SDL_RenderTexture(r,art.rowRocket,nullptr,&rowRect);
            label(r,icons[2].x+43,icons[2].y+44,std::to_string(game.rowCount),2);
        }
    }
    if(game.won){
        label(r,ww*.5f-90,hh-72,"STAGE CLEARED!",2);
        if(game.level<14)
            button(r,{static_cast<float>(ww-200),static_cast<float>(hh-64),176,44},"NEXT STAGE");
        else label(r,ww*.5f-195,hh-32,"MORE STAGES IN DEVELOPMENT",1);
    }else if(game.lost){
        label(r,ww*.5f-90,hh-72,"OUT OF MOVES",2);
        button(r,{static_cast<float>(ww-200),static_cast<float>(hh-64),176,44},"RETRY");
    }else if(hammerArmed) label(r,ww*.5f-200,hh-106,"HAMMER: CLICK ONE TILE",2);
    else if(rowArmed) label(r,ww*.5f-200,hh-106,"ROW ROCKET: PICK ONE ROW",2);
    else label(r,ww*.5f-200,hh-106,"DRAG TO SWAP OR PICK A BOOSTER",2);
}
void drawMine(SDL_Renderer* r,Art& art,const MineEconomy& n,int ww,int hh,bool surveyMode){
    label(r,24,20,"RUPEE RUSH - NATIVE MINING",2);
    label(r,24,55,"STRIKES "+std::to_string(n.strikes)+"/"+std::to_string(MineEconomy::strikeLimit(n.pickTier))+
          "   SCANS "+std::to_string(n.scans)+"   MINE "+std::to_string(n.mineTier+1),2);
    const int count=n.size();
    Rect b=mineBoard(ww,hh,count);
    SDL_SetRenderDrawColor(r,67,191,128,255);
    SDL_FRect mineOutline{b.x-3,b.y-3,b.w+6,b.h+6};
    SDL_RenderRect(r,&mineOutline);
    float tile=b.w/count;
    static constexpr int xs[]={37,270,504,736,968,1200};
    static constexpr int ys[]={55,295,536,777};
    for(int i=0;i<static_cast<int>(n.cells.size());++i){
        const auto& rock=n.cells[i];
        int row=0,col=0;
        if(rock.hits<rock.hardness){col=rock.hits>=2?4:rock.hits>=1?3:0;}
        else if(rock.kind==0){row=3;col=0;}
        else if(rock.kind==2){row=1;col=2;}
        else if(rock.kind==3){row=1;col=5;}
        else {row=1;col=0;}
        SDL_FRect src{static_cast<float>(xs[col]),static_cast<float>(ys[row]),212,215};
        SDL_FRect dest{b.x+(i%count)*tile+2,b.y+(i/count)*tile+2,tile-4,tile-4};
        // The exact rectangles in web/mine-ore-atlas.js.
        SDL_RenderTexture(r,art.ore,&src,&dest);
        if(rock.exposed>0){
            fill(r,{dest.x+4,dest.y+4,std::min(15.0f,tile/4),std::min(15.0f,tile/4)},{255,200,72,255});
        }else if(rock.scanned && rock.hits<rock.hardness){
            SDL_SetRenderDrawColor(r,rock.kind?95:160,rock.kind?231:120,180,255);
            SDL_FRect mark{dest.x+dest.w-11,dest.y+2,8,8};
            SDL_RenderFillRect(r,&mark);
        }
    }
    const auto act=mineActions(ww,hh,n);
    const float panel=act[0].x;
    label(r,panel,78,"CART "+std::to_string(n.cartOre)+"/"+std::to_string(MineEconomy::cartLimit(n.cartTier))+
          "   ORE "+std::to_string(n.ore)+"   METAL "+std::to_string(n.metal),1);
    label(r,panel,90,"GOODS "+std::to_string(n.goods)+"   COINS "+std::to_string(n.dollars)+
          "   WRITS "+std::to_string(n.writs),1);
    if(art.pick[n.pickTier]){
        SDL_FRect image{panel,103,54,54};SDL_RenderTexture(r,art.pick[n.pickTier],nullptr,&image);
    }
    if(art.glove[n.gloveTier]){
        SDL_FRect image{panel+74,103,54,54};SDL_RenderTexture(r,art.glove[n.gloveTier],nullptr,&image);
    }
    label(r,panel,164,"PICK "+std::to_string(n.pickTier)+"   GLOVE "+std::to_string(n.gloveTier),1);
    static const char* names[]={
        "UNLOAD","REFINE","CRAFT","SELL","PICK +","GLOVE +","MINE +","CART +","REFINE +","SURVEY"
    };
    for(int i=0;i<10;++i)
        button(r,act[i],i==9?(surveyMode?"DIG MODE":names[i]):names[i]);
    label(r,24,hh-87,surveyMode?"SURVEY MODE: CLICK UNEXCAVATED ROCKS":"CLICK TO DIG / COLLECT EXPOSED ORE",1);
    button(r,{20.0f,static_cast<float>(hh-58),155,42},"MAIN MENU");
}
std::array<Rect,3> homeActions(int ww,int hh){
    const float middle=ww*.5f, top=hh*.43f;
    return {Rect{middle-170,top,340,62},
            Rect{middle-170,top+82,340,62},
            Rect{middle-170,top+164,340,62}};
}
void drawHome(SDL_Renderer* r,const Art& art,const Game& g,const MineEconomy& mine,int ww,int hh){
    // The official, approved emerald tile doubles as the native game's crest.
    // No new currency art, no placeholders, no arbitrary replacements.
    const float iconSize=std::min(132.0f,hh*.19f);
    const float iconY=hh*.08f;
    SDL_FRect crest{ww*.5f-iconSize*.5f,iconY,iconSize,iconSize};
    SDL_RenderTexture(r,art.gem[2],nullptr,&crest);
    const float headingY=iconY+iconSize+12;
    label(r,ww*.5f-125,headingY,"RUPEE RUSH",3);
    label(r,ww*.5f-141,headingY+40,"NATIVE DESKTOP",2);
    fill(r,{ww*.5f-170,headingY+67,340,2},{78,193,127,255});
    const auto actions=homeActions(ww,hh);
    button(r,actions[0],"PLAY MATCH 3");
    button(r,actions[1],"GO MINING");
    button(r,actions[2],"QUIT GAME");
    label(r,ww*.5f-175,hh-34,"STAGE "+std::to_string(g.level)+
          "   STORED ORE "+std::to_string(mine.ore),2);
}
}
int main(int argc,char** argv){
    const bool smoke=argc>1 && std::string(argv[1])=="--smoke";
    SDL_SetAppMetadata("Rupee Rush","0.1","io.github.mrcalzon02.rupeerush");
    if(!SDL_Init(SDL_INIT_VIDEO|SDL_INIT_EVENTS)){SDL_Log("SDL init failed: %s",SDL_GetError());return 1;}
    SDL_Window* window=nullptr;SDL_Renderer* render=nullptr;
    if(!SDL_CreateWindowAndRenderer("Rupee Rush",1080,740,SDL_WINDOW_RESIZABLE,&window,&render)){
        SDL_Log("Failed to create desktop window: %s",SDL_GetError());SDL_Quit();return 1;
    }
    SDL_SetWindowMinimumSize(window,640,520);
    // SDL native window icon: use exactly the approved emerald artwork.
    const auto iconFile=dataRoot()/"art/embryon/generated/gems/emerald.png";
    if(SDL_Surface* iconSurface=SDL_LoadPNG(iconFile.string().c_str())){
        SDL_SetWindowIcon(window,iconSurface);
        SDL_DestroySurface(iconSurface);
    } else SDL_Log("Could not load approved desktop window icon: %s",SDL_GetError());
    Art art;
    if(!art.load(render,dataRoot())){
        SDL_Log("Native release is missing required approved sprites; refusing placeholder rendering.");
        art.release();SDL_DestroyRenderer(render);SDL_DestroyWindow(window);SDL_Quit();return 2;
    }
    const fs::path storage=savePath();
    Game game=restore(storage);
    auto loadAuthoredIntro=[&](int stage){
        std::ifstream campaign(dataRoot()/"campaign-14.txt");
        if(!campaign)return false;
        return game.startIntro(stage,campaign);
    };
    if(!fs::exists(storage) && !loadAuthoredIntro(1)){
        SDL_Log("Missing authored intro campaign data: refusing to invent level profiles");
        art.release();SDL_DestroyRenderer(render);SDL_DestroyWindow(window);SDL_Quit();return 3;
    }
    const fs::path mineStorage=storage.parent_path()/"mine-state-v1.txt";
    MineEconomy mine=restoreMine(mineStorage,game,fs::exists(storage));
    Screen screen=Screen::Home;
    bool running=true;bool surveyMode=false;bool hammerArmed=false;bool rowArmed=false;int pressed=-1;int renderedFrames=0;
    auto persist=[&](){if(!writeSave(game,storage))SDL_Log("Native board save write failed.");};
    auto persistMine=[&](){if(!writeSave(mine,mineStorage))SDL_Log("Native mining save write failed.");};
    if(mine.resetForDay([](){
        std::time_t now=std::time(nullptr);std::tm time{};
#ifdef _WIN32
        localtime_s(&time,&now);
#else
        localtime_r(&now,&time);
#endif
        char day[11]={};std::strftime(day,sizeof(day),"%Y-%m-%d",&time);return std::string(day);
    }()))persistMine();
    while(running){
        int ww=0,hh=0;SDL_GetWindowSize(window,&ww,&hh);
        SDL_Event e;
        while(SDL_PollEvent(&e)){
            if(e.type==SDL_EVENT_QUIT){running=false;break;}
            if(e.type==SDL_EVENT_KEY_DOWN){
                if(e.key.key==SDLK_ESCAPE){if(hammerArmed||rowArmed){hammerArmed=false;rowArmed=false;}else screen=Screen::Home;pressed=-1;}
                else if(e.key.key==SDLK_Q&&screen==Screen::Home){running=false;}
            }
            if(e.type==SDL_EVENT_MOUSE_BUTTON_DOWN&&e.button.button==SDL_BUTTON_LEFT){
                pressed=screen==Screen::Board?hit(gameBoard(ww,hh,game),game.width,game.height,e.button.x,e.button.y):-1;
            }
            if(e.type==SDL_EVENT_MOUSE_BUTTON_UP&&e.button.button==SDL_BUTTON_LEFT){
                const float x=e.button.x,y=e.button.y;
                if(screen==Screen::Home){
                    const auto actions=homeActions(ww,hh);
                    if(actions[0].contains(x,y))screen=Screen::Board;
                    else if(actions[1].contains(x,y))screen=Screen::Mine;
                    else if(actions[2].contains(x,y))running=false;
                }else if(screen==Screen::Board){
                    if(Rect{20.0f,static_cast<float>(hh-64),154,44}.contains(x,y)) {
                        screen=Screen::Home;hammerArmed=false;rowArmed=false;
                    }else if((game.won||game.lost)&&
                            Rect{static_cast<float>(ww-200),static_cast<float>(hh-64),176,44}.contains(x,y)){
                        const int next=game.level+(game.won?1:0);
                        if(next<=14 && loadAuthoredIntro(next)){
                            hammerArmed=false;rowArmed=false;persist();
                        }
                    }else{
                        const auto icons=boosterIcons(ww,hh);
                        if(!game.won && icons[0].contains(x,y)) {
                            if(game.hammerCount>0){hammerArmed=!hammerArmed;rowArmed=false;}
                        } else if(!game.won && game.claimedExtra && icons[1].contains(x,y)){
                            if(game.useExtraMoves())persist();
                        } else if(!game.won && game.claimedRow && icons[2].contains(x,y)){
                            if(game.rowCount>0){rowArmed=!rowArmed;hammerArmed=false;}
                        } else{
                            const int target=hit(gameBoard(ww,hh,game),game.width,game.height,x,y);
                            if(target>=0&&hammerArmed) {
                                if(game.useHammer(target)){persist();hammerArmed=false;}
                            }else if(target>=0&&rowArmed) {
                                if(game.useRowRocket(target)){persist();rowArmed=false;}
                            }else if(pressed>=0&&target>=0 && game.swap(pressed,target))persist();
                        }
                    }
                }else{
                    if(Rect{20.0f,static_cast<float>(hh-58),155,42}.contains(x,y))
                        screen=Screen::Home;
                    else {
                        int target=hit(mineBoard(ww,hh,mine.size()),mine.size(),mine.size(),x,y);
                        bool changed=false;
                        if(target>=0){
                            if(surveyMode)changed=mine.survey(target);
                            else if(mine.cells[target].exposed>0)changed=mine.collect(target);
                            else changed=mine.mine(target);
                        }else{
                            auto actions=mineActions(ww,hh,mine);
                            for(int i=0;i<10;++i)if(actions[i].contains(x,y)){
                                switch(i){
                                    case 0:changed=mine.unload();break;
                                    case 1:changed=mine.refine();break;
                                    case 2:changed=mine.manufacture();break;
                                    case 3:changed=mine.sell();break;
                                    case 4:changed=mine.upgrade(MineUpgrade::Pickaxe);break;
                                    case 5:changed=mine.upgrade(MineUpgrade::Gloves);break;
                                    case 6:changed=mine.upgrade(MineUpgrade::Mine);break;
                                    case 7:changed=mine.upgrade(MineUpgrade::Cart);break;
                                    case 8:changed=mine.upgrade(MineUpgrade::Refinery);break;
                                    case 9:surveyMode=!surveyMode;break;
                                }
                                break;
                            }
                        }
                        if(changed)persistMine();
                    }
                }
                pressed=-1;
            }
        }
        SDL_SetRenderDrawColor(render,14,22,30,255);SDL_RenderClear(render);
        if(screen==Screen::Home)drawHome(render,art,game,mine,ww,hh);
        else if(screen==Screen::Board)drawBoard(render,art,game,ww,hh,hammerArmed,rowArmed);
        else drawMine(render,art,mine,ww,hh,surveyMode);
        SDL_RenderPresent(render);
        if(smoke && ++renderedFrames>=3)running=false;
        SDL_Delay(16);
    }
    persist();persistMine();art.release();
    SDL_DestroyRenderer(render);SDL_DestroyWindow(window);SDL_Quit();
    return 0;
}
