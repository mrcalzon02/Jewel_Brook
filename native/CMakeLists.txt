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

# Native executable consumes authored data only. JavaScript is used once, at
# build time, to export initial stages from the authoritative Android engine.
find_program(RUPEE_NODE node REQUIRED)
set(INTRO_CATALOG "${CMAKE_BINARY_DIR}/campaign-17.txt")
execute_process(
  COMMAND "${RUPEE_NODE}" "${CMAKE_CURRENT_SOURCE_DIR}/tests/export_intro_campaign.js" "${INTRO_CATALOG}"
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/.."
  RESULT_VARIABLE INTRO_EXPORT_STATUS
)
if(NOT INTRO_EXPORT_STATUS EQUAL 0)
  message(FATAL_ERROR "Could not export authoritative Android intro campaign")
endif()
# Convert an already approved runtime Row Rocket asset to a format understood
# by SDL3's built-in PNG loader; Pillow runs only on the build machine.
find_package(Python3 COMPONENTS Interpreter REQUIRED)
set(ROW_BOOSTER_PNG "${CMAKE_BINARY_DIR}/row.png")
execute_process(
  COMMAND "${Python3_EXECUTABLE}" "${CMAKE_CURRENT_SOURCE_DIR}/tools/convert_row_booster.py"
    "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/embryon/runtime/boosters/row.webp"
    "${ROW_BOOSTER_PNG}"
  RESULT_VARIABLE ROW_EXPORT_STATUS
)
if(NOT ROW_EXPORT_STATUS EQUAL 0)
  message(FATAL_ERROR "Approved Row Rocket image could not be converted for SDL3")
endif()
# Exact pre-approved opal artwork; preserve gem identity and original pixels.
set(OPAL_GEM_PNG "${CMAKE_BINARY_DIR}/opal.png")
execute_process(
  COMMAND "${Python3_EXECUTABLE}" "${CMAKE_CURRENT_SOURCE_DIR}/tools/convert_row_booster.py"
    "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/embryon/runtime/gems/opal.webp"
    "${OPAL_GEM_PNG}"
  RESULT_VARIABLE OPAL_EXPORT_STATUS
)
if(NOT OPAL_EXPORT_STATUS EQUAL 0)
  message(FATAL_ERROR "Approved opal gem image could not be converted for SDL3")
endif()



add_library(rupee_native_logic STATIC game_logic.cpp)
add_library(rupee_mine_logic STATIC mine_economy.cpp)
target_include_directories(rupee_mine_logic PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")
target_include_directories(rupee_native_logic PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")
add_executable(RupeeRushNative main.cpp)
target_link_libraries(RupeeRushNative PRIVATE rupee_native_logic rupee_mine_logic SDL3::SDL3)
if(WIN32)
  enable_language(RC)
  set_target_properties(RupeeRushNative PROPERTIES WIN32_EXECUTABLE TRUE)
  # ICO file packages the exact approved emerald render; Windows resource
  # compiler embeds the icon directly into the genuine native executable.
  set(RUPEE_WIN_ICON "${CMAKE_CURRENT_SOURCE_DIR}/icons/rupee-rush.ico")
  configure_file(
    "${CMAKE_CURRENT_SOURCE_DIR}/icons/rupee-rush.rc.in"
    "${CMAKE_CURRENT_BINARY_DIR}/rupee-rush.rc" @ONLY)
  target_sources(RupeeRushNative PRIVATE "${CMAKE_CURRENT_BINARY_DIR}/rupee-rush.rc")
endif()
if(UNIX AND NOT APPLE)
  set_target_properties(RupeeRushNative PROPERTIES INSTALL_RPATH "$ORIGIN")
endif()

enable_testing()
add_executable(rupee_native_tests tests/game_logic_test.cpp)
target_link_libraries(rupee_native_tests PRIVATE rupee_native_logic)
add_test(NAME native_gameplay_functions COMMAND rupee_native_tests)
add_executable(rupee_intro_tests tests/intro_campaign_test.cpp)
target_link_libraries(rupee_intro_tests PRIVATE rupee_native_logic)
add_test(NAME native_authoritative_intro_levels
    COMMAND rupee_intro_tests "${INTRO_CATALOG}")
add_executable(rupee_early_booster_tests tests/early_boosters_test.cpp)
target_link_libraries(rupee_early_booster_tests PRIVATE rupee_native_logic)
add_test(NAME native_early_boosters_inventory_and_actions
    COMMAND rupee_early_booster_tests "${INTRO_CATALOG}")

add_executable(rupee_mine_tests tests/mine_economy_test.cpp)
target_link_libraries(rupee_mine_tests PRIVATE rupee_mine_logic)
add_test(NAME native_mining_source_parity_and_economy
    COMMAND rupee_mine_tests "${CMAKE_BINARY_DIR}/mine-fixture.txt")

install(TARGETS RupeeRushNative RUNTIME DESTINATION ".")
if(UNIX AND NOT APPLE)
  # Native desktop integration; original emerald art, not generated art.
  install(FILES
    "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/embryon/generated/gems/emerald.png"
    DESTINATION "share/icons/hicolor/192x192/apps"
    RENAME "rupee-rush.png")
  install(FILES "${CMAKE_CURRENT_SOURCE_DIR}/icons/rupee-rush.desktop"
    DESTINATION "share/applications")
  install(PROGRAMS "${CMAKE_CURRENT_SOURCE_DIR}/icons/rupee-rush-launch.sh"
    DESTINATION ".")
endif()

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
install(FILES "${OPAL_GEM_PNG}"
  DESTINATION data/art/embryon/runtime/gems)

install(FILES
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/nutvale/mines/nutvale-mines-ore-atlas-approved.png"
  DESTINATION data/art/nutvale/mines
)

install(FILES "${INTRO_CATALOG}" DESTINATION data)
install(FILES
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/primary/blockers/ice-1.png"
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/primary/blockers/ice-2.png"
  DESTINATION data/art/primary/blockers
)
# Approved gameplay booster icons from web/progression.js; NO substitutions.
install(FILES
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/primary/powerups/hammer.png"
  DESTINATION data/art/primary/powerups)
install(FILES
  "${CMAKE_CURRENT_SOURCE_DIR}/../web/art/additions/economy/hourglass.png"
  DESTINATION data/art/additions/economy)
install(FILES "${ROW_BOOSTER_PNG}"
  DESTINATION data/art/embryon/runtime/boosters)


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
