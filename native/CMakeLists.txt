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
target_include_directories(rupee_native_logic PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")
add_executable(RupeeRushNative main.cpp)
target_link_libraries(RupeeRushNative PRIVATE rupee_native_logic SDL3::SDL3)
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

install(TARGETS RupeeRushNative RUNTIME DESTINATION ".")
install(FILES "$<TARGET_FILE:SDL3-shared>" DESTINATION ".")
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
