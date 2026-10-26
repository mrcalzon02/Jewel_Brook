#include "mine_economy.h"
#include <algorithm>
#include <array>
#include <cmath>
#include <ctime>
#include <iomanip>
#include <istream>
#include <limits>
#include <ostream>
#include <sstream>
#include <utility>

namespace rupee {
namespace {
constexpr std::array<int,6> SIZES={4,5,6,7,8,9};
constexpr std::array<std::array<int,4>,6> ODDS={{
    {{45,40,12,3}}, {{50,35,11,4}}, {{55,29,11,5}},
    {{60,25,9,6}}, {{65,20,9,6}}, {{70,16,8,6}}
}};
constexpr std::array<int,6> CARTS={10,20,30,45,60,80};
constexpr std::array<int,6> ORE_RATE={4,4,3,3,2,2};
constexpr std::array<int,6> SALE_PRICE={300,340,380,430,480,550};
constexpr std::array<int,6> MINE_PRICE={0,250,600,1150,1900,3000};
constexpr std::array<int,6> CART_PRICE={0,120,300,580,960,1540};
constexpr std::array<int,6> REFINERY_PRICE={0,300,700,1300,2200,3500};
constexpr std::array<int,4> YIELD={0,1,2,4};
uint32_t hash32(uint32_t x) {
    x ^= x>>16; x *= 0x7feb352du; x ^= x>>15; x *= 0x846ca68bu;
    return x^(x>>16);
}
int roll(uint32_t seed,int x,int y,uint32_t salt) {
    return static_cast<int>(hash32(seed ^
        (static_cast<uint32_t>(x+1)*15485863u) ^
        (static_cast<uint32_t>(y+1)*32452843u) ^ salt)%100u);
}
std::string today() {
    std::time_t now=std::time(nullptr);
    std::tm dt{};
#ifdef _WIN32
    localtime_s(&dt,&now);
#else
    localtime_r(&now,&dt);
#endif
    char buf[11]={};
    if(std::strftime(buf,sizeof(buf),"%Y-%m-%d",&dt)==0)return "1970-01-01";
    return buf;
}
bool validDay(const std::string& date){
    if(date.size()!=10||date[4]!='-'||date[7]!='-')return false;
    for(size_t i=0;i<10;++i)if(i!=4&&i!=7&&(date[i]<'0'||date[i]>'9'))return false;
    const int month=std::stoi(date.substr(5,2)),day=std::stoi(date.substr(8,2));
    return month>=1&&month<=12&&day>=1&&day<=31;
}
bool bounded(int value) {return value>=0&&value<=MineEconomy::MaxWallet;}
}
MineCell MineEconomy::tile(uint32_t seed,int x,int y,int tier){
    MineCell result;
    if(tier<0||tier>=6||x<0||y<0||x>=SIZES[tier]||y>=SIZES[tier])return result;
    int chance=roll(seed,x,y,0x248fd19du);
    for(int i=0;i<4;++i){chance-=ODDS[tier][i];if(chance<0){result.kind=i;break;}}
    int hardness=roll(seed,x,y,0x74220a3bu);
    result.hardness=hardness<55?1:hardness<90?2:3;
    return result;
}
int MineEconomy::mineSize(int tier){return tier>=0&&tier<6?SIZES[tier]:0;}
int MineEconomy::cartLimit(int tier){return tier>=0&&tier<6?CARTS[tier]:0;}
int MineEconomy::strikeLimit(int tier){return tier>=0&&tier<40?12+5*tier:0;}
int MineEconomy::scanLimit(int tier){return tier>=0&&tier<40?tier:0;}
int MineEconomy::price(MineUpgrade track,int targetTier){
    if(targetTier<1)return -1;
    if(track==MineUpgrade::Pickaxe||track==MineUpgrade::Gloves){
        if(targetTier>=40)return -1;
        const int t=targetTier-1;
        const double base=track==MineUpgrade::Pickaxe?160.0:140.0;
        const double linear=track==MineUpgrade::Pickaxe?52.0:48.0;
        const double quadratic=track==MineUpgrade::Pickaxe?3.5:3.0;
        // Source: web/mining-gear.js price(kind,to)
        return static_cast<int>(std::floor((base+linear*t+quadratic*t*t)/10.0+0.5))*10;
    }
    if(targetTier>=6)return -1;
    if(track==MineUpgrade::Mine)return MINE_PRICE[targetTier];
    if(track==MineUpgrade::Cart)return CART_PRICE[targetTier];
    if(track==MineUpgrade::Refinery)return REFINERY_PRICE[targetTier];
    return -1;
}
MineEconomy::MineEconomy(){
    resetSite();
    day=today();
}
int MineEconomy::index(int x,int y) const{
    const int s=size();
    return x>=0&&y>=0&&x<s&&y<s?y*s+x:-1;
}
bool MineEconomy::resetForDay(const std::string& localYYYYMMDD){
    if(!validDay(localYYYYMMDD)||localYYYYMMDD<=day)return false;
    day=localYYYYMMDD;
    strikes=strikeLimit(pickTier);
    scans=scanLimit(gloveTier);
    return true;
}
void MineEconomy::resetSite(){
    cells.clear();
    const int s=size();
    for(int y=0;y<s;++y)for(int x=0;x<s;++x)cells.push_back(tile(seed,x,y,mineTier));
}
void MineEconomy::expandForMineTier(int prevSize) {
    const auto old=cells;
    resetSite();
    for(int y=0;y<prevSize;++y)for(int x=0;x<prevSize;++x)
        cells[y*size()+x]=old[y*prevSize+x];
}
void MineEconomy::advanceSiteIfFinished(){
    if(cells.empty())return;
    for(const auto& c:cells)if(c.hits<c.hardness||c.exposed>0)return;
    if(sites>=MaxWallet)return;
    ++sites;
    seed=hash32(seed+static_cast<uint32_t>(sites)*15485863u+0x2f9187u);
    if(seed==0)seed=113;
    resetSite();
}
bool MineEconomy::mine(int index){
    if(index<0||index>=static_cast<int>(cells.size())||strikes<=0)return false;
    auto& c=cells[index];
    if(c.hits>=c.hardness)return false;
    --strikes; ++c.hits;
    if(c.hits==c.hardness) {
        const int gathered=YIELD[c.kind];
        if(gathered>0) {
            if(cartOre+gathered<=cartLimit(cartTier))cartOre+=gathered;
            else c.exposed=gathered;
        }
        advanceSiteIfFinished();
    }
    return true;
}
bool MineEconomy::survey(int index){
    if(index<0||index>=static_cast<int>(cells.size())||scans<=0)return false;
    auto& c=cells[index];
    if(c.hits>=c.hardness||c.scanned)return false;
    --scans;c.scanned=true;
    return true;
}
bool MineEconomy::collect(int index){
    if(index<0||index>=static_cast<int>(cells.size()))return false;
    auto& c=cells[index];
    if(c.exposed<=0||cartOre+c.exposed>cartLimit(cartTier))return false;
    cartOre+=c.exposed;c.exposed=0;
    advanceSiteIfFinished();
    return true;
}
bool MineEconomy::unload(){
    if(cartOre<=0||ore>MaxWallet-cartOre)return false;
    ore+=cartOre;cartOre=0;return true;
}
bool MineEconomy::refine(int qty){
    const int cost=ORE_RATE[refineryTier];
    if(qty<1||qty>ore/cost||qty>MaxWallet-metal)return false;
    ore-=cost*qty;metal+=qty;return true;
}
bool MineEconomy::manufacture(int qty){
    if(qty<1||qty>metal/2||qty>MaxWallet-goods)return false;
    metal-=qty*2;goods+=qty;return true;
}
bool MineEconomy::sell(int qty){
    const int unit=SALE_PRICE[refineryTier];
    if(qty<1||qty>goods||qty>(MaxWallet-dollars)/unit)return false;
    goods-=qty;dollars+=qty*unit;return true;
}
bool MineEconomy::buyWrits(int qty){
    if(qty<1||qty>dollars/180||qty>MaxWallet-writs)return false;
    dollars-=qty*180;writs+=qty;return true;
}
bool MineEconomy::upgrade(MineUpgrade track){
    int* tier=nullptr;
    if(track==MineUpgrade::Pickaxe)tier=&pickTier;
    else if(track==MineUpgrade::Gloves)tier=&gloveTier;
    else if(track==MineUpgrade::Mine)tier=&mineTier;
    else if(track==MineUpgrade::Cart)tier=&cartTier;
    else if(track==MineUpgrade::Refinery)tier=&refineryTier;
    if(!tier)return false;
    const int cost=price(track,*tier+1);
    if(cost<0||dollars<cost)return false;
    dollars-=cost;
    const int prevSize=size();
    const int before=*tier;
    ++*tier;
    if(track==MineUpgrade::Pickaxe)strikes=std::min(strikeLimit(pickTier),strikes+strikeLimit(pickTier)-strikeLimit(before));
    if(track==MineUpgrade::Gloves)scans=std::min(scanLimit(gloveTier),scans+scanLimit(gloveTier)-scanLimit(before));
    if(track==MineUpgrade::Mine)expandForMineTier(prevSize);
    return true;
}
bool MineEconomy::anyExposed()const{
    for(const auto& c:cells)if(c.exposed>0)return true;
    return false;
}
void MineEconomy::importLegacy(const std::vector<MineCell>& legacy,int legacyOre,int legacyStrikes){
    if(legacy.size()!=16)return;
    MineEconomy copy;
    copy.cells=legacy;
    copy.ore=std::clamp(legacyOre,0,MaxWallet);
    copy.strikes=std::clamp(legacyStrikes,0,12);
    *this=copy;
}
bool MineEconomy::save(std::ostream& out) const{
    out<<"RRMINING1 "<<seed<<' '<<sites<<' '<<mineTier<<' '<<cartTier<<' '<<refineryTier
       <<' '<<pickTier<<' '<<gloveTier<<' '<<strikes<<' '<<scans
       <<' '<<cartOre<<' '<<ore<<' '<<metal<<' '<<goods<<' '<<dollars<<' '<<writs
       <<' '<<day<<' '<<cells.size()<<'\n';
    for(const auto& c:cells)out<<c.kind<<' '<<c.hardness<<' '<<c.hits<<' '<<c.exposed<<' '<<c.scanned<<' ';
    out<<'\n';
    return out.good();
}
bool MineEconomy::load(std::istream& in){
    MineEconomy parsed; std::string magic;size_t count=0;
    if(!(in>>magic>>parsed.seed>>parsed.sites>>parsed.mineTier>>parsed.cartTier>>parsed.refineryTier
        >>parsed.pickTier>>parsed.gloveTier>>parsed.strikes>>parsed.scans
        >>parsed.cartOre>>parsed.ore>>parsed.metal>>parsed.goods>>parsed.dollars>>parsed.writs
        >>parsed.day>>count))return false;
    if(magic!="RRMINING1"||!parsed.seed||!bounded(parsed.sites)
        ||parsed.mineTier<0||parsed.mineTier>5||parsed.cartTier<0||parsed.cartTier>5
        ||parsed.refineryTier<0||parsed.refineryTier>5||parsed.pickTier<0||parsed.pickTier>=40
        ||parsed.gloveTier<0||parsed.gloveTier>=40||parsed.strikes<0||parsed.strikes>strikeLimit(parsed.pickTier)
        ||parsed.scans<0||parsed.scans>scanLimit(parsed.gloveTier)
        ||parsed.cartOre<0||!bounded(parsed.cartOre)
        ||!bounded(parsed.ore)||!bounded(parsed.metal)||!bounded(parsed.goods)
        ||!bounded(parsed.dollars)||!bounded(parsed.writs)||!validDay(parsed.day)
        ||count!=static_cast<size_t>(parsed.size()*parsed.size()))return false;
    parsed.cells.resize(count);
    for(auto& c:parsed.cells){
        int scan=0;
        if(!(in>>c.kind>>c.hardness>>c.hits>>c.exposed>>scan))return false;
        if(c.kind<0||c.kind>3||c.hardness<1||c.hardness>3
            ||c.hits<0||c.hits>c.hardness||c.exposed<0||c.exposed>4||scan<0||scan>1
            ||(c.exposed!=0&&(c.hits!=c.hardness||c.exposed!=YIELD[c.kind])))return false;
        c.scanned=scan==1;
    }
    *this=std::move(parsed);
    return true;
}
} // namespace rupee
