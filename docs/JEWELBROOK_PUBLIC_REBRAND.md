# Jewelbrook — Public Display Rebrand

**Selected public title:** Jewel Brook: Heroes of Embryon (short title: Jewel Brook). **Previous display title:** Rupee Rush.

The public title and GitHub repository were renamed. Keep the existing Android package identity, signing certificate, persistent save namespaces and release asset/tag conventions so APK upgrades remain possible.

## Public-facing surfaces

- Android and Amazon Fire OS launcher labels use **Jewelbrook**. Both platforms share the Android app manifest and the existing application ID.
- The game browser/WebView document title, header navigation, home title, and in-game account reset language use **Jewelbrook**.
- The original home-screen title raster embeds the retired name and must not be displayed. Its original file and hash remain intact as archived approved artwork. The runtime now uses a jewel-toned text wordmark over the existing approved Embryon landscape; later approved Jewelbrook art may replace the text without changing gameplay.
- Native Windows and Linux SDL3 window titles, application metadata, match/mining headings, and main menu use **Jewelbrook**. The existing emerald application icon is unchanged.
- The Linux Freedesktop launcher displays **Jewelbrook**, keeping its existing Exec and Icon identifiers.
- User-facing GitHub Actions display names, release titles, updater prompts, primary README and active art/deployment documentation use **Jewelbrook**.

**Active GitHub repository and updater:** `mrcalzon02/Jewel_Brook`; release API, APK download URL checks, release-page controls and GitHub signing provisioners all use the renamed repository.

## Intentionally preserved internal identities

- Android application ID: `io.github.mrcalzon02.rupeerush`; Java package paths and signed publisher certificates.
- Existing release tags and APK/desktop archive filenames, required by updater and screenshot-release automation.
- WebView persistence: `rupeerush.save.v1`; native SDL3 save path `SDL_GetPrefPath("RupeeRush","RupeeRushDesktop")`.
- JavaScript APIs and native executable/build target names, existing assets and file paths.
- Source credit, asset SHA-256 records, archived visual references and technical historical signing records.

## Release correctness

Only existing functional diagnostics should gate releases. Do not add cosmetic tests or gate releases on art, colors, screenshot visual appearance or logo pixel matching.

Verify the Android launcher and app menus, Fire OS APK compatibility, SDL3 Windows/Linux visible title and launcher, signed/prerelease updater lookup and in-place save continuity. Preserve the separate `google-play` branch's Play Games integration and publication-specific signing requirements.
