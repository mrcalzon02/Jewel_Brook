#pragma once
#include <cstdint>
#include <iosfwd>
#include <string>
#include <vector>

namespace rupee {
struct MineCell {
    int kind = 0;       // barren=0, ordinary=1, rich=2, crystal=3
    int hardness = 1;
    int hits = 0;
    int exposed = 0;    // collected only when cart has capacity
    bool scanned = false;
};
enum class MineUpgrade { Pickaxe, Gloves, Mine, Cart, Refinery };
class MineEconomy {
public:
    static constexpr int MaxWallet = 999999999;
    uint32_t seed = 4099;
    int sites = 0;
    int mineTier = 0, cartTier = 0, refineryTier = 0;
    int pickTier = 0, gloveTier = 0;
    int strikes = 12, scans = 0;
    int cartOre = 0, ore = 0, metal = 0, goods = 0, dollars = 0, writs = 0;
    std::string day;
    std::vector<MineCell> cells;
    MineEconomy();
    static MineCell tile(uint32_t seed, int x, int y, int tier);
    static int price(MineUpgrade track, int targetTier);
    static int cartLimit(int tier);
    static int mineSize(int tier);
    static int strikeLimit(int tier);
    static int scanLimit(int tier);
    int size() const { return mineSize(mineTier); }
    int index(int x, int y) const;
    bool resetForDay(const std::string& localYYYYMMDD);
    bool mine(int index);
    bool survey(int index);
    bool collect(int index);
    bool unload();
    bool refine(int qty=1);
    bool manufacture(int qty=1);
    bool sell(int qty=1);
    bool buyWrits(int qty=1);
    bool upgrade(MineUpgrade track);
    bool save(std::ostream& out) const;
    bool load(std::istream& in);
    bool anyExposed() const;
    void importLegacy(const std::vector<MineCell>& legacy,int legacyOre,int legacyStrikes);
private:
    void resetSite();
    void expandForMineTier(int previousSize);
    void advanceSiteIfFinished();
};
}
