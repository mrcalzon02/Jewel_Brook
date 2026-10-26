cmake_minimum_required(VERSION 3.24)
project(RupeeRushNative LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
include(FetchContent)

# Pin a real SDL3 source release and its SHA256. No embedded browser runtime.
set(SDL_SHARED ON CACHE BOOL "Build SDL shared runtime" FORCE)
set(SDL_STATIC OFF CACHE BOOL "Disable SDL static runtime" FORCE)
set(SDL_TEST_LIBRARY OFF CACHE BOOL "" FORCE)
set(SDL_TESTS OFF CACHE BOOL "" FORCE)
FetchContent_Declare(
  SDL3
  URL https://github.com/libsdl-org/SDL/releases/download/release-3.4.18/SDL3-3.4.18.tar.gz
  URL_HASH SHA256=9c75cf16330322c217dedd2e0609f1124f1b54b8633e763467b4684d0f4334a3
  DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)
FetchContent_MakeAvailable(SDL3)

add_library(rupee_native_logic STATIC game_logic.cpp)
add_library(rupee_mine_logic STATIC mine_economy.cpp)
target_include_directories(rupee_mine_logic PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")
target_include_directories(rupee_native_logic PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")
add_executable(RupeeRushNative main.cpp)
target_link_libraries(RupeeRushNative PRIVATE rupee_native_logic rupee_mine_logic SDL3::SDL3)
if(WIN32)
  set_target_properties(RupeeRushNative PROPERTIES WIN32_EXECUTABLE TRUE)
endif()
if(UNIX AND NOT APPLE)
  set_target_properties(RupeeRushNative PROPERTIES INSTALL_RPATH "$ORIGIN")
endif()

enable_testing()
add_executable(rupee_native_tests tests/game_logic_test.cpp)
target_link_libraries(rupee_native_tests PRIVATE rupee_native_logic)
add_test(NAME native_gameplay_functions COMMAND rupee_native_tests)
add_executable(rupee_mine_tests tests/mine_economy_test.cpp)
target_link_libraries(rupee_mine_tests PRIVATE rupee_mine_logic)
add_test(NAME native_mining_source_parity_and_economy
    COMMAND rupee_mine_tests "${CMAKE_BINARY_DIR}/mine-fixture.txt")

install(TARGETS RupeeRushNative RUNTIME DESTINATION ".")
if(WIN32)
  install(FILES "$<TARGET_FILE:SDL3-shared>" DESTINATION ".")
else()
  # Keep the ELF SONAME filename in the archive; the loader searches for libSDL3.so.0.
  install(FILES "$<TARGET_FILE:SDL3-shared>" DESTINATION "." RENAME "libSDL3.so.0")
endif()
set(SOURCE_GEMS "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/embryon/generated/gems")
install(FILES
  "${SOURCE_GEMS}/ruby.png"
  "${SOURCE_GEMS}/sapphire.png"
  "${SOURCE_GEMS}/emerald.png"
  "${SOURCE_GEMS}/topaz.png"
  "${SOURCE_GEMS}/amethyst.png"
  DESTINATION data/art/embryon/generated/gems
)
install(FILES
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mines/nutvale-mines-ore-atlas-approved.png"
  DESTINATION data/art/nutvale/mines
)


# Install original equipment art under its original relative path (not flattened).
install(FILES
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/iron-prospector.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/acorn-bronze.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/blossom-oak.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/pinecone-copper.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/ropebound-steel.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/daisy-wreathed.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/froststeel.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/gilded-crescent.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/flamecrest-gold.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/amethyst-sickle.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/azure-edge.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/riverstone-iron.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/sapphire-shard.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/ruby-blaze.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/glacier-shadow.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/honeygold.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/mossbound-amber.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/thorn-garnet.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/strawberry-frosting.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/caramel-drizzle.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/heart-cupcake.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/prism-star.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/violet-skull.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/astral-comet.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/opal-sunrise.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/amber-crown.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/arcane-wraith.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/bloodmoon-crystal.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/silver-sunstone.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/spring-blossom.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/lionheart-gold.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/sunburst-royal.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/golden-dawn.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/ocean-lantern.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/starfall-amethyst.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/tideglass-cyan.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/forest-prism.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/ruby-ice.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/molten-star.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/pickaxes/winter-berry.png"
  DESTINATION data/art/nutvale/mining-tools/pickaxes
)
install(FILES
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/russet-leather.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/apprentice-leather.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/autumn-leaves.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/verdant-wool.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/acorn-gardener.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/frostfur-forager.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/oak-traveler.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/winter-stone.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/copper-clockwork.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/brass-clockwork.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/sapphire-royal.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/solar-gilt.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/orchid-bloom.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/holly-blossom.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/pink-confection.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/rainbow-icing.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/confetti-star.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/candy-party.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/violet-nebula.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/spectral-skull.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/starlight-void.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/golden-cabochon.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/silver-sunburst.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/arcane-geode.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/industrial-gear.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/glacier-mechanist.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/sunstone-alchemist.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/sunflower-garden.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/lava-fissure.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/flameheart.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/riveted-steel.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/winter-rune.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/shadow-amethyst.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/aether-machinery.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/fresh-spring.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/woodland-hide.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/golden-gears.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/pumpkin-gold.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/holiday-holly.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mining-tools/gloves/fur-trapper.png"
  DESTINATION data/art/nutvale/mining-tools/gloves
)
