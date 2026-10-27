# Rupee Rush native desktop icon and visual identity

Use the approved **emerald gemstone** from
`web/art/embryon/generated/gems/emerald.png` (192×192 transparent PNG),
without redrawing or reinterpreting it.

Windows: `native/icons/rupee-rush.ico` stores the **same PNG bytes** inside
an ICO wrapper, embedded in the native EXE at build time. Linux: install the
original file as `share/icons/hicolor/192x192/apps/rupee-rush.png`, alongside
a Freedesktop application entry. SDL3 sets the live window icon from the
original approved PNG and uses that gem as the native main-menu crest.

Style: near-black jewel/ink background, emerald-green highlights and thin
outlines, softly pale legible text, original game art unchanged.

This desktop brand selection does **not** alter currency icon assignments,
gameplay currencies, mining artwork, or booster visual identities. Do not
introduce appearance-based tests that block releases. Functional diagnostics,
startup, native dependencies and actual packaging can block releases.

Portable Linux tarball: run `rupee-rush-launch.sh` from the extracted directory.
The `.desktop` entry is intended for an installed program available on PATH;
copying it alone without adjusting Exec is not sufficient to install a
portable application.
