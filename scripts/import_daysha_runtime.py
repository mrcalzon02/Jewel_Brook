#!/usr/bin/env python3
"""Import only the hash-verified Daysha artwork package into the game."""
import hashlib, json, re, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/"asset-inbox/Jewel_Brook_Daysha_Gilded_Spindle_Runtime_19.zip"
BUNDLE_SHA256="5328418eaf3ff6cab4bc2a6af7322ba9af4eaf6b526dbf26371483748e1a81fa"
QUEUE=ROOT/"data/daysha-generated-atelier-recovery.json"
CHRONICLE=ROOT/"web/royal-chronicle.js"
DEST="web/art/embryon/story/gilded-spindle/runtime/"

def digest(b): return hashlib.sha256(b).hexdigest()
def reject(message): raise SystemExit("Daysha import rejected: "+message)

def main():
    if not BUNDLE.is_file(): reject("approved ZIP missing from asset-inbox")
    if digest(BUNDLE.read_bytes())!=BUNDLE_SHA256: reject("ZIP differs from verified generated-art package")
    queue=json.loads(QUEUE.read_text(encoding="utf-8"))
    entries=queue.get("entries",[])
    if len(entries)!=19: reject("expected exactly 19 source-original records")
    byname={e["fileName"]:e for e in entries}
    if len(byname)!=19: reject("ambiguous source file identity")
    if any(e.get("publicationStatus")!="pending_game_binary_upload" for e in entries):
        reject("recovery queue changed; reconcile instead of overwriting")
    items=[]; staged=[]
    with zipfile.ZipFile(BUNDLE) as z:
        mpath=DEST+"manifest.json"
        if mpath not in z.namelist(): reject("runtime manifest missing")
        manifest=json.loads(z.read(mpath))
        rows=manifest.get("images",[])
        if len(rows)!=19: reject("wrong runtime image count")
        expected={mpath}
        for entry in rows:
            source=byname.get(entry.get("sourceFile"))
            if source is None or entry.get("sourceSHA256")!=source["sha256"]:
                reject("unapproved source artwork "+str(entry.get("sourceFile")))
            name=entry.get("runtimeFile","")
            if name!=source["fileName"][:-4]+".webp": reject("unapproved derivative name "+name)
            path=DEST+name
            expected.add(path)
            bytes_=z.read(path)
            if bytes_[:4]!=b"RIFF" or bytes_[8:12]!=b"WEBP":
                reject("invalid WebP image "+name)
            if digest(bytes_)!=entry.get("runtimeSHA256") or len(bytes_)!=entry.get("bytes") or len(bytes_)>2000000:
                reject("derivative checksum or size mismatch "+name)
            output=ROOT/path
            if output.exists() and digest(output.read_bytes())!=entry["runtimeSHA256"]:
                reject("different artwork already at destination "+path)
            staged.append((output,bytes_))
            items.append(dict(
                id=source["id"],title=source["description"],eventId=source["eventId"],
                src=path.removeprefix("web/"),sha=entry["runtimeSHA256"],
                portraitStudy=False,origin="verified-generated-original-derived-webp",
                sourceSHA256=source["sha256"]))
        if set(z.namelist())!=expected: reject("package contains unexpected or missing images")
    if len({e["id"] for e in items})!=19: reject("duplicate generated image IDs")
    old=CHRONICLE.read_text(encoding="utf-8")
    match=re.search(r"const ART=Object\.freeze\((\[[^\n]*\])\.map\(Object\.freeze\)\);",old)
    if not match: reject("royal image registry changed; manual reconciliation required")
    prior=json.loads(match.group(1))
    if len(prior)!=13: reject("expected 13 previously approved original royal scenes")
    if {r["id"] for r in prior}&{r["id"] for r in items}: reject("generated originals are already registered")
    revised=old[:match.start()]+"const ART=Object.freeze("+json.dumps(prior+items,ensure_ascii=False,separators=(",",":"))+".map(Object.freeze));"+old[match.end():]
    for path,data in staged:
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(data)
        if digest(path.read_bytes())!=digest(data): reject("write readback failed "+str(path))
    (ROOT/mpath).write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    CHRONICLE.write_text(revised,encoding="utf-8")
    print("19 verified Daysha images imported; 19 true atelier story associations registered.")

if __name__=="__main__": main()
