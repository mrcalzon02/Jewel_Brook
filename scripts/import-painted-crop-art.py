#!/usr/bin/env python3
"""Expand and integrity-check painted Rupee Rush crop assets from a Git-tracked ZIP.

This is a transfer step, not a generator; identical SHA256 images survive intact.
"""
import hashlib
import json
import pathlib
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "asset-imports" / "rupee-growth-painted-v1-runtime.zip"
BASE = "web/art/embryon/town/gardening/growth/painted/"
CROPS = ("carrot", "radish", "lettuce", "pea", "mint", "potato", "onion", "strawberry")
STAGES = ("seed", "sprout", "growing", "maturing", "ready")
EXPECTED = {BASE + c + "-" + s + ".webp" for c in CROPS for s in STAGES}
MANIFEST = BASE + "manifest.json"

def extract() -> None:
    if not ARCHIVE.is_file():
        raise FileNotFoundError(str(ARCHIVE))
    with zipfile.ZipFile(ARCHIVE) as archive:
        entries = set(archive.namelist())
        assert entries == EXPECTED | {MANIFEST}, "unexpected/missing archive files"
        manifest = json.loads(archive.read(MANIFEST))
        assert manifest["sprite_count"] == 40
        assert set(manifest["crops"]) == set(CROPS)
        assert manifest["stages"] == list(STAGES)
        checks = manifest["sprites"]
        assert len(checks) == 40 and set(e["asset"] for e in checks) == EXPECTED
        for entry in checks:
            name = entry["asset"]
            b = archive.read(name)
            assert len(b) == entry["bytes"], "asset size mismatch: " + name
            assert hashlib.sha256(b).hexdigest() == entry["sha256"], "digest mismatch: " + name
            assert b[:4] == b"RIFF" and b[8:12] == b"WEBP", "not WebP: " + name
            assert entry["dimensions"] == [512, 512], "unexpected canvas"
        for name in sorted(entries):
            target = ROOT / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(name))
    print("PASS: installed 40 SHA-verified painted crop stage sprites and manifest")

if __name__ == "__main__":
    extract()
