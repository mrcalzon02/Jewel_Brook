#pragma once
#include <array>
#include <cstdint>
#include <iosfwd>
#include <vector>

namespace rupee {
struct MineTile {
    int kind = 0;       // 0 barren, 1 ordinary, 2 rich, 3 crystal
    int hardness = 1;
    int hits = 0;
    bool done = false;
};
class Game {
public:
    int level = 1;
    int width = 4;
    int height = 5;
    int moves = 24;
    int score = 0;
    int goal = 850;
    int ore = 0;
    int strikes = 12;
    bool won = false;
    bool lost = false;
    uint32_t randomState = 1;
    std::vector<int> cells;
    // Android-authored introductory campaign objectives and blocker state.
    // objectiveKind: 0=score, 1=ice, 2=collect a specific authored gem, 3=locks, 4=chests, 5=collect and blocker dual goal.
    int objectiveKind = 0, objectiveTarget = 850, iceCleared = 0;
    int collectColor = -1, collected = 0;
    int secondaryKind = -1, secondaryTarget = 0;
    std::vector<int> ice;
    // Independently damageable anchored blockers and temporary frozen gems.
    std::vector<int> locks, frozen, chests, jam, poison, lightningAuras;
    // Board-anchored: rock layers take one hit per strike; nature-vine timers
    // pin their gem until the source-defined two-turn aura expires.
    std::vector<int> rockLayers, vineAuras;
    int locksCleared=0, chestsCleared=0, jamCleared=0, iceActivations=0, turns=0;
    int earthActivations=0, windActivations=0, lightningActivations=0, lightningDetonations=0;
    std::vector<int> pendingIce;
    // Exact authored gem IDs: 0 ruby, 1 sapphire, 2 emerald, 11 opal.
    std::vector<int> activeRoster{0,1,2};
    // Gem-carried elemental flags: 1 Water, 2 Fire, 3 Ice, 4 Earth, 5 Wind, 6 Lightning.
    std::vector<int> elementals;
    // Gem-carried Android payloads: 0 none, 1 row, 2 column; hold is a countdown.
    // These move with type and elemental, never with anchored blocker layers.
    std::vector<int> specials, holds;
    int waterActivations=0, fireActivations=0, fireDetonations=0;
    // Square-anchored fire auras (0 off, 1 next tick, 2 newly ignited).
    std::vector<int> fireAuras;
    // Starter supply and milestone unlocks from web/progression.js LADDER.
    int hammerCount = 3, extraCount = 0, rowCount = 0, shuffleCount = 0, columnCount = 0, blastCount = 0;
    int crossCount = 0, colorCount = 0, drillCount = 0, unlockCount = 0;
    bool claimedExtra = false, claimedRow = false, claimedShuffle = false, claimedColumn = false, claimedBlast = false;
    bool claimedCross = false, claimedColor = false, claimedDrill = false, claimedUnlock = false;
    std::array<MineTile, 16> rocks{};

    explicit Game(uint32_t seed = 7919);
    void startLevel(int stage);
    bool startIntro(int stage, std::istream& authoredCatalog);
    bool adjacent(int first, int second) const;
    // A valid adjacent non-matching swap is an intentional, move-consuming action.
    bool swap(int first, int second);
    bool useHammer(int cell);
    bool useExtraMoves();
    bool useRowRocket(int cell);
    bool useColumnRocket(int cell);
    bool useBlast(int cell);
    bool useCross(int cell);
    bool useColor(int cell);
    bool useDrill(int cell);
    bool useUnlock();
    bool useShuffle();
    bool hasMove();
    bool mine(int index);
    void replenishStrikes(); // diagnostic only: not exposed in gameplay
    bool save(std::ostream& out) const;
    bool load(std::istream& in);
    int rosterSize() const;
    int matchedCells() const;
private:
    uint32_t next();
    int range(int limit);
    bool clearAndFill();
    bool shuffleBoard();
    void refill();
    struct ElementalTrigger {int at, kind, color;};
    std::vector<ElementalTrigger> pendingNewElementals;
    std::vector<int> pendingFire;
    void resolveFire();
    void resolveIce();
    void advanceFireTurn();
    void clearGem(int cell); // preserves independent blocker and elemental state
    void updateOutcome();
    void grantMilestoneIfWon();
    void populateBoard();
    void initMine(uint32_t seed);
};
} // namespace rupee
