#!/usr/bin/env python3
"""Build-time conversion of the EXISTING approved Row Rocket image.

This converts the exact pixels of web/art/embryon/runtime/boosters/row.webp
into a native SDL_LoadPNG-compatible asset. It never generates or selects art,
never edits the source image and is not packaged in the desktop application.
"""
import pathlib
import sys
from PIL import Image

if len(sys.argv) != 3:
    raise SystemExit("usage: convert_row_booster.py ORIGINAL.webp OUTPUT.png")
original = pathlib.Path(sys.argv[1])
output = pathlib.Path(sys.argv[2])
if original.name != "row.webp" or not original.as_posix().endswith("/web/art/embryon/runtime/boosters/row.webp"):
    raise SystemExit("Refusing unexpected booster source identity")
with Image.open(original) as source:
    if source.format != "WEBP":
        raise SystemExit("Approved Row Rocket source isn't a WebP image")
    converted = source.convert("RGBA")
output.parent.mkdir(parents=True, exist_ok=True)
converted.save(output, format="PNG")
print(f"Converted approved Row Rocket art {original} -> {output} ({converted.width}x{converted.height})")
