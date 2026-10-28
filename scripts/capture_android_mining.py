#!/usr/bin/env python3
"""Capture actual Android WebView gameplay from the signed, installed Jewelbrook APK.
No image generation, mock screenshots, test-mode user saves, or replacement assets.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
import zipfile

if len(sys.argv) != 3:
    raise SystemExit("usage: capture_android_mining.py SIGNED_APK OUTPUT_DIRECTORY")
apk = Path(sys.argv[1]).resolve()
out = Path(sys.argv[2]).resolve()
out.mkdir(parents=True, exist_ok=True)
repo = Path(__file__).resolve().parent.parent
pkg = "io.github.mrcalzon02.rupeerush"

def run(*args, timeout=90, check=True):
    p = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if check and p.returncode:
        raise RuntimeError("Command failed: " + " ".join(map(str, args)) +
                           "\n" + p.stdout.decode("utf8", "replace")[-1500:] +
                           "\n" + p.stderr.decode("utf8", "replace")[-1500:])
    return p.stdout

def adb(*args, timeout=90):
    return run("adb", *args, timeout=timeout)

def audit_apk():
    required = [
        "art/primary/blockers/rock.png",
        "art/nutvale/mining-tools/pickaxes/iron-prospector.png",
        "art/nutvale/mining-tools/gloves/apprentice-leather.png",
        "art/nutvale/mining-economy/goods/crate-mining-supplies.png",
        "art/embryon/runtime/gems/onyx.webp",
        "art/embryon/runtime/gems/garnet.webp",
        "art/embryon/runtime/gems/diamond.webp",
        "game.js", "mining.js", "style.css", "index.html"
    ]
    with zipfile.ZipFile(apk) as z:
        for p in required:
            bundled = z.read("assets/" + p)
            original = (repo / "web" / p).read_bytes()
            if bundled != original:
                raise AssertionError("APK contains a different source asset: " + p)
            print("APK asset matches repository:", p, hashlib.sha256(bundled).hexdigest()[:16])
    return hashlib.sha256(apk.read_bytes()).hexdigest()

def ui_xml():
    for _ in range(3):
        try:
            adb("shell", "uiautomator", "dump", "/sdcard/rupee-ui.xml", timeout=45)
            raw = adb("exec-out", "cat", "/sdcard/rupee-ui.xml", timeout=20).decode("utf8", "replace")
            return ET.fromstring(raw[raw.index("<?xml"):])
        except (ValueError, ET.ParseError, RuntimeError, subprocess.TimeoutExpired):
            time.sleep(1)
    raise RuntimeError("Android accessibility hierarchy not available; cannot verify real UI")

def nodes_containing(needle, *, exact=False):
    root = ui_xml()
    matches = []
    for el in root.iter("node"):
        name = (el.attrib.get("text", "") + " " + el.attrib.get("content-desc", "")).strip()
        if (name.casefold() == needle.casefold() if exact else needle.casefold() in name.casefold()):
            bounds = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", el.attrib.get("bounds", ""))
            if bounds:
                x1, y1, x2, y2 = map(int, bounds.groups())
                if x2 > x1 and y2 > y1:
                    matches.append(((x1 + x2) // 2, (y1 + y2) // 2, name))
    return matches

def wait_for(term, attempts=8):
    for i in range(attempts):
        found = nodes_containing(term)
        if found:
            print("UI verified:", term, found[0])
            return found
        time.sleep(2)
    raise AssertionError("Cannot find live Android UI element/text: " + term)

def tap(x, y):
    adb("shell", "input", "tap", str(x), str(y))
    time.sleep(1.5)

def tap_text(term, *, exact=False):
    matches = nodes_containing(term, exact=exact)
    if not matches:
        raise AssertionError("Cannot tap missing live Android UI control: " + term)
    x, y, name = matches[0]
    print("Tapping", repr(name), "at", x, y)
    tap(x, y)

evidence = {"apk_sha256": audit_apk(), "screenshots": {}, "source": "Android emulator adb screencap of installed signed APK"}
def screenshot(filename):
    data = adb("exec-out", "screencap", "-p", timeout=30)
    if not data.startswith(b"\x89PNG\r\n\x1a\n") or len(data) < 15000:
        raise AssertionError("Missing/invalid Android screenshot: " + filename)
    width, height = struct.unpack(">II", data[16:24])
    if width < 320 or height < 600:
        raise AssertionError("Unexpected Android screenshot dimensions")
    (out / filename).write_bytes(data)
    evidence["screenshots"][filename] = {"width": width, "height": height,
        "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
    print("SCREENSHOT", filename, width, height, len(data))

adb("wait-for-device", timeout=180)
adb("shell", "wm", "size", "480x960")
adb("shell", "wm", "density", "220")
for scale in ["window_animation_scale", "transition_animation_scale", "animator_duration_scale"]:
    adb("shell", "settings", "put", "global", scale, "0")
adb("install", "-r", str(apk), timeout=180)
adb("shell", "am", "start", "-W", "-n", pkg + "/.MainActivity", timeout=90)
time.sleep(3)  # Allow WebView title, assets and the short launch splash to settle.
try:
    wait_for("Adventure Menu", attempts=12)
except AssertionError:
    # The actual installed APK, not a mock: persist the failed launch evidence.
    try:
        screenshot("00-JewelBrook-Launch-Diagnostic.png")
    except Exception as exc:
        print("Unable to capture launch diagnostic screenshot:", repr(exc))
    for name, args in [
        ("ACTIVITY-DIAGNOSTICS.txt", ("shell", "dumpsys", "activity", "activities")),
        ("WINDOW-DIAGNOSTICS.txt", ("shell", "dumpsys", "window")),
        ("LOGCAT-DIAGNOSTICS.txt", ("logcat", "-d", "-t", "400")),
    ]:
        try:
            (out / name).write_bytes(adb(*args, timeout=35))
        except Exception as exc:
            print("Unable to capture", name, repr(exc))
    try:
        (out / "UI-DIAGNOSTICS.xml").write_bytes(ET.tostring(ui_xml(), encoding="utf-8"))
    except Exception as exc:
        print("Unable to capture accessibility tree:", repr(exc))
    raise
screenshot("01-JewelBrook-Home.png")

# Tap the real application's Mine navigation control.
try:
    # Prefer the large accessible in-page button over hard-coded screen pixels.
    tap_text("ENTER THE MINES")
except AssertionError:
    try:
        tap_text("Mine", exact=True)
    except AssertionError:
        # Last-resort coordinate fallback for 480x960 emulator.
        tap(171, 880)
try:
    wait_for("Prism Vale Mines", attempts=10)
except AssertionError:
    screenshot("02-JewelBrook-Mine-Navigation-Diagnostic.png")
    raise
screenshot("02-JewelBrook-Mine-Tools.png")

# Capture the actual equipment screen, including imported pickaxe and glove art.
tap_text("EQUIPMENT")
wait_for("Pickaxe", attempts=7)
screenshot("03-JewelBrook-Mine-Equipment.png")

# Return to live excavation and capture the actual rock tiles.
tap_text("DIG", exact=True)
wait_for("Prism Vale Mines", attempts=5)
adb("shell", "input", "swipe", "230", "760", "230", "300", "540")
time.sleep(2)
screenshot("04-JewelBrook-Mine-Board.png")

# A clean deterministic initial site has a three-hit rock at column 4, row 1.
# This is a real touch input, not an HTML screenshot or a painted concept.
target = None
for _ in range(4):
    found = nodes_containing("Mine tile 4,1")
    if found:
        target = found[0]
        break
    adb("shell", "input", "swipe", "230", "770", "230", "380", "420")
    time.sleep(1)
if target is None:
    raise AssertionError("Three-hit mining tile was not exposed in Android UI")
tap(target[0], target[1])
screenshot("05-JewelBrook-Mine-After-Strike.png")

# Preserve UI evidence for audit in addition to PNGs.
evidence["android_sdk"] = adb("shell", "getprop", "ro.build.version.sdk").decode().strip()
evidence["package"] = pkg
evidence["target_cell"] = "4,1 (first strike, original three-hit rock)"
(out / "CAPTURE-EVIDENCE.json").write_text(json.dumps(evidence, indent=2) + "\n")
print("PASS: signed Android APK opened, Mine and Equipment navigated, original assets checked, real screenshots captured")
