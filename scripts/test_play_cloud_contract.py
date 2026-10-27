#!/usr/bin/env python3
"""Check that Rupee Rush Play cloud saves connect real SDK IO to game-owned state."""
from pathlib import Path
import re
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
errors = []

def check(ok, name, fix):
    print(("PASS: " if ok else "FAIL: ") + name)
    if not ok:
        errors.append((name, fix))
        print("SOLUTION: " + fix)

manifest = (ROOT/"android/app/src/play/AndroidManifest.xml").read_text()
bridge = (ROOT/"android/app/src/play/java/io/github/mrcalzon02/rupeerush/PlayCloudBridge.java").read_text()
launcher = (ROOT/"android/app/src/play/java/io/github/mrcalzon02/rupeerush/PlayMainActivity.java").read_text()
js = (ROOT/"web/game.js").read_text()
check('android:name=".PlayMainActivity"' in manifest and 'tools:node="remove"' in manifest,
      "Play launcher is separate from sideload",
      "Declare PlayMainActivity with LAUNCHER intent; remove the base MainActivity only in the Play variant.")
check("addJavascriptInterface" in launcher and "new PlayCloudBridge" in launcher,
      "Packaged game controls are bound to native Cloud API",
      "Attach the PlayCloudBridge to the packaged WebView in PlayMainActivity.")
check(all(s in bridge for s in ("isAuthenticated()", "SnapshotsClient", "client.open(", 
 "writeBytes(", "commitAndClose(", "readFully(", "discardAndClose(")),
      "Platform-authenticated genuine Snapshots read/write operations",
      "Use PlayGames.getSnapshotsClient and SnapshotsClient Tasks; do not fake success from local preferences.")
check("MAX_BYTES" in bridge and "JSONObject candidate" in bridge,
      "Bounded and validated cloud saves",
      "Reject oversized snapshots and malformed progression data before writes.")
check(all(s in js for s in ("cloud-backup", "cloud-restore", "cloud-apply", "cloud-cancel",
 "pendingCloudRestore", ".before-cloud-restore")),
      "Explicit remote restore consent and local rollback copy",
      "Do not overwrite local progress until the player confirms, and preserve the previous save.")
check("window.RupeePlayCloudMessage" in js and "window.RupeePlayCloud.backup" in js,
      "Cloud responses and game-owned state are wired end-to-end",
      "Expose the Play-only JavaScript bridge and handle its results inside the game.")
result = subprocess.run(["node", "--check", str(ROOT/"web/game.js")], capture_output=True, text=True)
check(result.returncode == 0, "Game JavaScript parses", 
      "Fix web/game.js syntax: " + result.stderr[-400:])
main_activity = (ROOT/"android/app/src/main/java/io/github/mrcalzon02/rupeerush/MainActivity.java").read_text()
check('prepareGameWebView(game);' in main_activity and
        main_activity.index('prepareGameWebView(game);') < main_activity.index('game.loadUrl('),
        "Cloud bridge hooks before the first game page navigation",
        "Call prepareGameWebView(game) before game.loadUrl() in MainActivity.")
check('prepareGameWebView(WebView game)' in launcher and
        '"RupeePlayCloud"' in launcher,
        "Play subclass registers the cloud JavaScript API at pre-navigation hook",
        "Override prepareGameWebView(WebView game) and attach the bridge there.")
check('SnapshotsClient.RESOLUTION_POLICY_MANUAL' in java and
        'RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED' not in java,
        "Cloud snapshot conflicts are never auto-resolved by last-modified timestamp",
        "Use RESOLUTION_POLICY_MANUAL and reject or explicitly reconcile divergent remote snapshots.")

check(all(x in bridge for x in ('void replace(String json, String inspectedVersion)',
      'fingerprint(current).equals(inspectedVersion)', 'Arrays.equals(current, data)',
      'different progress', 'RESOLUTION_POLICY_MANUAL')),
      "Cloud writes require previewed version and explicit conflict choice",
      "Reject diverged snapshots unless the user explicitly chooses to replace the inspected remote revision.")
check(all(x in js for x in ('pendingCloudVersion', 'cloud-replace',
      'RupeePlayCloud.replace(JSON.stringify(saved),pendingCloudVersion)')),
      "Player chooses cloud replacement only after inspecting remote version",
      "Wire explicit replacement to the expected SHA-256 cloud fingerprint.")

for reason,fix in errors: print("::error title=Play cloud contract::" + reason + " | FIX: " + fix)
print("RUPEE PLAY CLOUD CONTRACT: " + ("FAIL" if errors else "PASS"))
sys.exit(1 if errors else 0)
