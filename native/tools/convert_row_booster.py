#!/usr/bin/env python3
"""Format conversion of explicitly approved existing WebP sprites for native SDL3.
No generative content, new icon selection, or renderer substitutions.
The converter is used at build time and never packaged in the application.
"""
import pathlib
import sys
from PIL import Image

if len(sys.argv) != 3:
    raise SystemExit("usage: convert_row_booster.py APPROVED.webp OUTPUT.png")
original = pathlib.Path(sys.argv[1])
output = pathlib.Path(sys.argv[2])
allowed = {
    "web/art/embryon/runtime/boosters/row.webp": "row.png",
    "web/art/embryon/runtime/gems/opal.webp": "opal.png",
}
normalized = original.as_posix()
kind = next((dest for path, dest in allowed.items() if normalized.endswith("/"+path)), None)
if kind is None or output.name != kind:
    raise SystemExit("Refusing unapproved WebP source or destination")
with Image.open(original) as source:
    if source.format != "WEBP":
        raise SystemExit("Approved asset is not in expected WebP format")
    converted = source.convert("RGBA")
output.parent.mkdir(parents=True, exist_ok=True)
converted.save(output, format="PNG")
print(f"Converted approved original {original} -> {output} ({converted.width}x{converted.height})")
