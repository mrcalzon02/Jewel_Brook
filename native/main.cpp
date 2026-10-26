#include "game_logic.h"
#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <algorithm>
#include <array>
#include <filesystem>
#include <fstream>
#include <string>
#include <vector>

namespace fs=std::filesystem;
using rupee::Game;
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
    SDL_SetRenderDrawColor(r,246,235,255,255);
    SDL_SetRenderScale(r,static_cast<float>(size),static_cast<float>(size));
    SDL_RenderDebugText(r,x/size,y/size,s.c_str());
    SDL_SetRenderScale(r,1,1);
}
Rect button(SDL_Renderer* r,Rect box,const char* text){
    fill(r,box,{72,49,112,255});
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
Rect mineBoard(int ww,int hh){
    float cell=std::min({128.0f,(ww-120.0f)/4.0f,(hh-200.0f)/4.0f});
    cell=std::max(10.0f,cell);
    return {(ww-cell*4)*.5f,104.0f,cell*4,cell*4};
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
bool writeSave(const Game& g,const fs::path& path){
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
struct Art {
    std::array<SDL_Texture*,5> gem{};
    SDL_Texture* ore=nullptr;
    bool load(SDL_Renderer* r,const fs::path& root){
        static constexpr std::array<const char*,5> names={"ruby","sapphire","emerald","topaz","amethyst"};
        for(int i=0;i<5;++i)gem[i]=png(r,root/"art/embryon/generated/gems"/(std::string(names[i])+".png"));
        ore=png(r,root/"art/nutvale/mines/nutvale-mines-ore-atlas-approved.png");
        return std::all_of(gem.begin(),gem.end(),[](auto* t){return t!=nullptr;})&&ore;
    }
    void release(){for(auto* t:gem)if(t)SDL_DestroyTexture(t);if(ore)SDL_DestroyTexture(ore);}
};
void drawBoard(SDL_Renderer* r,Art& art,Game& game,int ww,int hh){
    label(r,28,26,"RUPEE RUSH - NATIVE MATCH 3",2);
    label(r,28,59,"STAGE "+std::to_string(game.level)+"   MOVES "+std::to_string(game.moves)+
          "   SCORE "+std::to_string(game.score)+" / "+std::to_string(game.goal),2);
    const auto b=gameBoard(ww,hh,game);
    float tile=b.w/game.width;
    for(int y=0;y<game.height;++y)for(int x=0;x<game.width;++x){
        int i=y*game.width+x;
        SDL_FRect dest{b.x+x*tile+2,b.y+y*tile+2,tile-4,tile-4};
        fill(r,{dest.x,dest.y,dest.w,dest.h},{48,36,81,255});
        // Source identity is the same approved gemstone file already in web/.
        SDL_RenderTexture(r,art.gem[game.cells[i]],nullptr,&dest);
    }
    button(r,{20.0f,static_cast<float>(hh-64),154,44},"MAIN MENU");
    if(game.won){
        label(r,ww*.5f-90,hh-72,"STAGE CLEARED!",2);
        button(r,{static_cast<float>(ww-200),static_cast<float>(hh-64),176,44},"NEXT STAGE");
    }else if(game.lost){
        label(r,ww*.5f-90,hh-72,"OUT OF MOVES",2);
        button(r,{static_cast<float>(ww-200),static_cast<float>(hh-64),176,44},"RETRY");
    }else label(r,ww*.5f-120,hh-36,"DRAG A GEM TO SWAP",2);
}
void drawMine(SDL_Renderer* r,Art& art,Game& game,int ww,int hh){
    label(r,28,26,"RUPEE RUSH - NATIVE MINING",2);
    label(r,28,59,"STRIKES "+std::to_string(game.strikes)+"   ORE "+std::to_string(game.ore),2);
    Rect b=mineBoard(ww,hh);float tile=b.w/4;
    static constexpr int xs[]={37,270,504,736,968,1200};
    static constexpr int ys[]={55,295,536,777};
    for(int i=0;i<16;++i){
        const auto& rock=game.rocks[i];
        int row=0,col=0;
        if(!rock.done){col=rock.hits>=2?4:rock.hits>=1?3:0;}
        else if(rock.kind==0){row=3;col=0;}
        else if(rock.kind==2){row=1;col=2;}
        else if(rock.kind==3){row=1;col=5;}
        else {row=1;col=0;}
        SDL_FRect src{static_cast<float>(xs[col]),static_cast<float>(ys[row]),212,215};
        SDL_FRect dest{b.x+(i%4)*tile+2,b.y+(i/4)*tile+2,tile-4,tile-4};
        // Atlas slices are the approved exact positions from web/mine-ore-atlas.js.
        SDL_RenderTexture(r,art.ore,&src,&dest);
    }
    label(r,ww*.5f-180,hh-93,"EXCAVATE TO REVEAL ORE",2);
    button(r,{20.0f,static_cast<float>(hh-64),154,44},"MAIN MENU");
}
void drawHome(SDL_Renderer* r,Game& g,int ww,int hh){
    label(r,ww*.5f-125,hh*.19f,"RUPEE RUSH",3);
    label(r,ww*.5f-170,hh*.19f+48,"NATIVE DESKTOP FOUNDATION",2);
    button(r,{ww*.5f-170,hh*.37f,340,62},"PLAY MATCH 3");
    button(r,{ww*.5f-170,hh*.37f+82,340,62},"GO MINING");
    button(r,{ww*.5f-170,hh*.37f+164,340,62},"QUIT GAME");
    label(r,ww*.5f-175,hh-70,"STAGE "+std::to_string(g.level)+
          "   MINED ORE "+std::to_string(g.ore),2);
}
}
int main(int argc,char** argv){
    const bool smoke=argc>1 && std::string(argv[1])=="--smoke";
    if(!SDL_Init(SDL_INIT_VIDEO|SDL_INIT_EVENTS)){SDL_Log("SDL init failed: %s",SDL_GetError());return 1;}
    SDL_Window* window=nullptr;SDL_Renderer* render=nullptr;
    if(!SDL_CreateWindowAndRenderer("Rupee Rush - Native",1080,740,SDL_WINDOW_RESIZABLE,&window,&render)){
        SDL_Log("Failed to create desktop window: %s",SDL_GetError());SDL_Quit();return 1;
    }
    SDL_SetWindowMinimumSize(window,640,520);
    Art art;
    if(!art.load(render,dataRoot())){
        SDL_Log("Native release is missing required approved sprites; refusing placeholder rendering.");
        art.release();SDL_DestroyRenderer(render);SDL_DestroyWindow(window);SDL_Quit();return 2;
    }
    const fs::path storage=savePath();
    Game game=restore(storage);
    Screen screen=Screen::Home;
    bool running=true;int pressed=-1;int renderedFrames=0;
    auto persist=[&](){if(!writeSave(game,storage))SDL_Log("Native save write failed.");};
    while(running){
        int ww=0,hh=0;SDL_GetWindowSize(window,&ww,&hh);
        SDL_Event e;
        while(SDL_PollEvent(&e)){
            if(e.type==SDL_EVENT_QUIT){running=false;break;}
            if(e.type==SDL_EVENT_KEY_DOWN){
                if(e.key.key==SDLK_ESCAPE){screen=Screen::Home;pressed=-1;}
                else if(e.key.key==SDLK_Q&&screen==Screen::Home){running=false;}
            }
            if(e.type==SDL_EVENT_MOUSE_BUTTON_DOWN&&e.button.button==SDL_BUTTON_LEFT){
                pressed=screen==Screen::Board?hit(gameBoard(ww,hh,game),game.width,game.height,e.button.x,e.button.y):-1;
            }
            if(e.type==SDL_EVENT_MOUSE_BUTTON_UP&&e.button.button==SDL_BUTTON_LEFT){
                const float x=e.button.x,y=e.button.y;
                if(screen==Screen::Home){
                    Rect play{ww*.5f-170,hh*.37f,340,62};
                    Rect mine{ww*.5f-170,hh*.37f+82,340,62};
                    Rect quit{ww*.5f-170,hh*.37f+164,340,62};
                    if(play.contains(x,y))screen=Screen::Board;
                    else if(mine.contains(x,y))screen=Screen::Mine;
                    else if(quit.contains(x,y))running=false;
                }else if(screen==Screen::Board){
                    if(Rect{20.0f,static_cast<float>(hh-64),154,44}.contains(x,y))
                        screen=Screen::Home;
                    else if((game.won||game.lost)&&
                            Rect{static_cast<float>(ww-200),static_cast<float>(hh-64),176,44}.contains(x,y)){
                        game.startLevel(game.level+(game.won?1:0));persist();
                    }else {
                        int target=hit(gameBoard(ww,hh,game),game.width,game.height,x,y);
                        if(pressed>=0 && target>=0 && game.swap(pressed,target))persist();
                    }
                }else{
                    if(Rect{20.0f,static_cast<float>(hh-64),154,44}.contains(x,y))
                        screen=Screen::Home;
                    else {
                        int target=hit(mineBoard(ww,hh),4,4,x,y);
                        if(target>=0&&game.mine(target))persist();
                    }
                }
                pressed=-1;
            }
        }
        SDL_SetRenderDrawColor(render,23,17,40,255);SDL_RenderClear(render);
        if(screen==Screen::Home)drawHome(render,game,ww,hh);
        else if(screen==Screen::Board)drawBoard(render,art,game,ww,hh);
        else drawMine(render,art,game,ww,hh);
        SDL_RenderPresent(render);
        if(smoke && ++renderedFrames>=3)running=false;
        SDL_Delay(16);
    }
    persist();art.release();
    SDL_DestroyRenderer(render);SDL_DestroyWindow(window);SDL_Quit();
    return 0;
}
