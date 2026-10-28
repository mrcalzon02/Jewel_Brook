#!/usr/bin/env python3
"""Install the owner-approved Jewel Brook crops from a ZIP, checking SHA-256 before writes.

Usage:
  python scripts/import-jewelbrook-splash-art.py /path/to/JewelBrook-Approved-Splash-Art-Pack.zip
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "web/art/embryon/branding/jewelbrook"
MANIFEST = TARGET / "manifest.json"


def sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    args = parser.parse_args()
    index = json.loads(MANIFEST.read_text(encoding="utf-8"))
    raw_archive = args.archive.read_bytes()
    if sha256(raw_archive) != index["sourceArchiveSha256"]:
        raise ValueError("Archive fingerprint mismatch; no files installed")
    verified = {}
    with zipfile.ZipFile(args.archive) as z:
        if sha256(z.read("source/approved-composite.png")) != index["sourceSHA256"]:
            raise ValueError("Original approved sheet SHA-256 mismatch")
        for spec in index["assets"]:
            name = spec["filename"]
            data = z.read("jewelbrook/" + name)
            if len(data) != spec["bytes"] or sha256(data) != spec["sha256"]:
                raise ValueError("Approved crop corrupted: " + name)
            if not (data.startswith(b"RIFF") and data[8:12] == b"WEBP"):
                raise ValueError("Invalid WebP file: " + name)
            verified[name] = data
    TARGET.mkdir(parents=True, exist_ok=True)
    for spec in index["assets"]:
        name = spec["filename"]
        path = TARGET / name
        path.write_bytes(verified[name])
        if sha256(path.read_bytes()) != spec["sha256"]:
            raise RuntimeError("Post-write readback mismatch: " + name)
        print("VERIFIED", path.relative_to(ROOT))
    print("Installed", len(verified), "owner-approved Jewel Brook art assets")


if __name__ == "__main__":
    main()
