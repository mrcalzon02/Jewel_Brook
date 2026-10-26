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
    // objectiveKind: 0=score, 1=ice; later kinds are not exposed until ported.
    int objectiveKind = 0, objectiveTarget = 850, iceCleared = 0;
    std::vector<int> ice;
    std::array<MineTile, 16> rocks{};

    explicit Game(uint32_t seed = 7919);
    void startLevel(int stage);
    bool startIntro(int stage, std::istream& authoredCatalog);
    bool adjacent(int first, int second) const;
    // A valid adjacent non-matching swap is an intentional, move-consuming action.
    bool swap(int first, int second);
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
    void populateBoard();
    void initMine(uint32_t seed);
};
} // namespace rupee
