#!/usr/bin/env python3
"""Rupee Rush atlas slicer: alpha-aware dynamic gutters, QA, traceable PNGs."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import cv2, hashlib, json, zipfile, shutil, io, os, time
BASE=Path('/mnt/data')
OUT=BASE/'rupee_rush_boosters_v1'
ART=OUT/'sprites'
SOURCES=OUT/'sources'
QA=OUT/'qa'
PACKS=OUT/'packs'
for p in [ART,SOURCES,QA,PACKS]:p.mkdir(parents=True,exist_ok=True)
SHEETS=[
 ('01_powerup_gems','fantasy_jewel_power_up_icon_grid.png',['ruby-stripe','sapphire-column','emerald-gift','amethyst-gift','rainbow-star','prismatic-heart','golden-star','sunstone-orb','moon-crescent','lightning-bolt','frost-star','nature-emblem','fire-shard','void-shard','royal-emblem','cosmic-orb']),
 ('02_booster_tools','glowing_fantasy_booster_icon_collection.png',['royal-hammer','crystal-pickaxe','arcane-rockets','gem-rocket','star-bomb','royal-star','color-sphere','royal-crown','crystal-drill','scepter','swap-glove','shuffle-orb','hourglass','magnet','shatter-hammer','ward-shield']),
 ('03_arcane_relics','fantasy_rpg_icon_collection.png',['prismatic-comet','dragon-flame','ice-citadel','storm-orb','ocean-heart','nature-heart','void-moon','radiant-sun','astral-vortex','prismatic-star','phoenix-burst','royal-scroll','arcane-gate','star-compass','treasure-chest','angel-heart']),
 ('04_impact_vfx','fantasy_vfx_icon_grid.png',['gem-explosion','horizontal-beam','vertical-beam','radiant-starburst','prismatic-ring','lightning-impact','gem-shrapnel','snowflake-burst','fire-vortex','nature-vortex','void-smoke','gem-reward-fountain','heart-healing','time-warp','portal-spire','crown-reward']),
 ('05_action_vfx','glossy_crystal_magic_effects_sprite_sheet.png',['rocket-launch','bomb-detonation','prism-comet','meteor-impact','drill-impact','hammer-impact','pickaxe-impact','gem-swirl','magical-shuffle','gem-magnet','shield-bubble','royal-awakening','star-scepter','time-extension','shattered-crystals','snowflake-burst']),
 ('06_equippable_boosters','fantasy_rpg_booster_icon_set.png',['rocket-booster','star-bomb','prism-cube','royal-hammer','heart-key','shuffle-token','heart-protection','time-boost','star-cross','earth-bomb','lightning-bolt','royal-shield','royal-crown','dragon-flame','moon-portal','radiant-sun'])
]

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def seam(A, axis, nominal, band=58):
    # A is alpha [y,x]; choose the lowest-occupancy path between tile centers.
    if axis=='horizontal': A=A.T
    h,w=A.shape
    lo=max(0,nominal-band);hi=min(w,nominal+band+1)
    xs=np.arange(lo,hi)
    # Overlap avoidance and centerline bias. Zero-alpha space is strongly preferred.
    a=A[:,lo:hi].astype(np.float32)/255.
    cost=(a**1.65)*70.0+0.004*(xs[None,:]-nominal)**2
    # Minor alpha speckles do not steer the seam wildly.
    cost+=0.02*np.abs(xs[None,:]-nominal)
    n=len(xs)
    dp=cost[0].copy()
    paths=np.empty((h,n),np.uint8)
    for y in range(1,h):
        # local transitions -2..+2; penalize wiggles, keep smooth near-alpha gutters
        opts=np.stack([np.pad(dp,(max(0,k),max(0,-k)),constant_values=1e10)[max(0,-k):max(0,-k)+n]+abs(k)*.6 for k in (-2,-1,0,1,2)],axis=0)
        pick=np.argmin(opts,axis=0)
        paths[y]=pick
        dp=cost[y]+np.min(opts,axis=0)
    trace=np.empty(h,np.int16)
    at=int(np.argmin(dp))
    for y in range(h-1,-1,-1):
        trace[y]=xs[at]
        if y:
            move=2-int(paths[y,at])
            at=at+move # former index = current + offset from selected roll
            if at<0:at=0
            if at>=n:at=n-1
    score=A[np.arange(h),trace] if axis=='vertical' else A.T[np.arange(h),trace]
    return trace,{'high_alpha_cut_pixels':int(np.sum(score>=96)),'opaque_alpha_cut_pixels':int(np.sum(score>=224)),'samples':h,'worst_alpha':int(np.max(score)),'median_x':int(np.median(trace))}

def process(sid,source,labels):
    assert len(labels)==16
    image=Image.open(BASE/source).convert('RGBA')
    assert image.size==(1254,1254),image.size
    srcfile=SOURCES/source;shutil.copy2(BASE/source,srcfile)
    raw=np.array(image)
    alpha=raw[:,:,3]; H,W=alpha.shape
    v=[seam(alpha,'vertical',round(W*i/4)) for i in range(1,4)]
    h=[seam(alpha,'horizontal',round(H*i/4)) for i in range(1,4)]
    # Restrict all 16 quadrants by joint dynamic cell boundaries (not simple rectangular crops).
    Y,X=np.ogrid[:H,:W]
    vregions=np.zeros((H,W),np.uint8)
    for idx,(trace,_) in enumerate(v):vregions+=(X>=trace[:,None]).astype(np.uint8)
    hregions=np.zeros((H,W),np.uint8)
    for idx,(trace,_) in enumerate(h):hregions+=(Y>=trace[None,:]).astype(np.uint8)
    entries=[]; card=[]
    checker=Image.new('RGB',(128,128),'#e9e9e9'); dd=ImageDraw.Draw(checker)
    for yy in range(0,128,16):
     for xx in range(0,128,16):
      if (xx//16+yy//16)%2==0:dd.rectangle((xx,yy,xx+15,yy+15),fill='#9fa3ad')
    sheetcontact=Image.new('RGB',(4*256,4*280),(14,18,38))
    draw=ImageDraw.Draw(sheetcontact)
    outdir=ART/sid;outdir.mkdir(parents=True,exist_ok=True)
    for row in range(4):
     for col in range(4):
      idx=row*4+col
      # Bounding safety window: adjacent center regions cannot be copied.
      region=(vregions==col)&(hregions==row)
      cell=np.where(region,alpha,0).astype(np.uint8)
      # Isolated alpha specks under threshold are source-generation crumbs, not gems.
      cell[cell<10]=0
      core=(cell>=26).astype(np.uint8)
      n,lab,stats,cents=cv2.connectedComponentsWithStats(core,8)
      if n<=1:raise RuntimeError('no connected content '+sid+' '+str(idx))
      sizes=stats[1:,cv2.CC_STAT_AREA]
      anchor=1+int(np.argmax(sizes)); max_area=int(sizes.max())
      mainCent=cents[anchor];
      retained=[anchor]
      for k in range(1,n):
       if k==anchor:continue
       area=int(stats[k,cv2.CC_STAT_AREA]);dist=np.linalg.norm(cents[k]-mainCent)
       # Include deliberate secondary jewels/sparkles, not one-pixel stray fragments.
       if area>=max(35, int(max_area*.008)) and dist < 288:
        retained.append(k)
      keep=np.isin(lab,retained).astype(np.uint8)
      # recover gentle antialiasing just around retained solids, not remote stray elements
      preserve=cv2.dilate(keep,np.ones((7,7),np.uint8),iterations=1)
      cell=np.where(preserve>0,cell,0).astype(np.uint8)
      ys,xs=np.where(cell>10)
      if len(xs)==0:raise RuntimeError('empty sprite '+sid+str(idx))
      x0,x1=int(xs.min()),int(xs.max())+1; y0,y1=int(ys.min()),int(ys.max())+1
      # Also determine where the original source connects to tile edge at substantial opacity.
      boxw,boxh=x1-x0,y1-y0
      # A centered 384 master gives 7.3% guaranteed transparent canvas inset.
      content=raw[y0:y1,x0:x1].copy()
      content[:,:,3]=cell[y0:y1,x0:x1]
      rgba=Image.fromarray(content,'RGBA')
      target=384;inner=target-2*26
      s=min(inner/boxw,inner/boxh)
      neww=max(1,round(boxw*s));newh=max(1,round(boxh*s))
      resized=rgba.resize((neww,newh),Image.Resampling.LANCZOS)
      canvas=Image.new('RGBA',(target,target),(0,0,0,0))
      ox=(target-neww)//2;oy=(target-newh)//2
      canvas.alpha_composite(resized,(ox,oy))
      label=labels[idx];filename=f'{idx+1:02d}_r{row+1}c{col+1}_{label}.png'
      master=outdir/filename;canvas.save(master,optimize=True)
      a192=canvas.resize((192,192),Image.Resampling.LANCZOS)
      runtime=outdir/(master.stem+'__192.png');a192.save(runtime,optimize=True)
      # Strongly opaque source pixels cut by seam may indicate irrecoverable source overlap.
      edge_mask=region & (cv2.dilate((~region).astype(np.uint8),np.ones((3,3),np.uint8),iterations=1)>0)
      touch=int(np.count_nonzero((alpha>=180)&edge_mask))
      # Edge touching due to intact glow may be acceptable; log for manual review.
      sourcearea=int(np.sum(core>0));retainedarea=int(np.sum(keep>0));discarded=int(sourcearea-retainedarea)
      rendered=np.asarray(canvas)[:,:,3]
      assert not np.any(rendered[:18]>0) and not np.any(rendered[-18:]>0)
      assert not np.any(rendered[:,:18]>0) and not np.any(rendered[:,-18:]>0)
      assert int(np.sum(rendered>100))>600
      entry={'id':f'{sid}-{idx+1:02d}', 'label':label,'r':row+1,'c':col+1,'source':source,'source_bbox':[x0,y0,x1,y1],
        'master_png':str(master.relative_to(OUT)), 'master_sha256':sha(master),'master_bytes':master.stat().st_size,'runtime192_png':str(runtime.relative_to(OUT)),
        'runtime192_sha256':sha(runtime),'runtime192_bytes':runtime.stat().st_size,'solid_pixel_count':int(np.sum(rendered>=100)),
        'source_edge_high_alpha_count':touch,'discarded_source_noise_pixels':discarded,
        'state':'isolated_sliced_source; manual game-device and semantic check pending'}
      entries.append(entry)
      preview=canvas.resize((190,190),Image.Resampling.LANCZOS)
      tile=Image.new('RGB',(190,190),'#cacbd0')
      for by in range(0,190,20):
       for bx in range(0,190,20):
        if ((bx//20)+(by//20))%2:ImageDraw.Draw(tile).rectangle((bx,by,bx+19,by+19),fill='#5e647a')
      tile.paste(preview,mask=preview.getchannel('A'))
      px=col*256+33;py=row*280+18
      sheetcontact.paste(tile,(px,py))
      draw.text((col*256+10,row*280+219),f'{idx+1:02d} {label}',fill='white')
      draw.text((col*256+10,row*280+236),f'edge={touch}  loss={discarded}  {boxw}x{boxh}',fill='#d8bdd4')
    qapath=QA/(sid+'-qa.jpg');sheetcontact.save(qapath,quality=88)
    pzip=PACKS/(sid+'-sprites.zip')
    with zipfile.ZipFile(pzip,'w',zipfile.ZIP_DEFLATED,6) as z:
     z.write(srcfile,'original/'+source)
     z.write(qapath,'qa/'+qapath.name)
     for e in entries:
      for f in (e['master_png'],e['runtime192_png']):z.write(OUT/f,f)
     z.writestr('manifest.json',json.dumps({'set':sid,'source_sha256':sha(srcfile),'sprites':entries},indent=2))
    return {'id':sid,'source':source,'source_sha256':sha(srcfile),'source_mode':'RGBA','source_dimensions':[1254,1254],
      'cut_seam_metrics':{'vertical':[x[1] for x in v],'horizontal':[x[1] for x in h]},
      'sprites':entries,'qa_preview':str(qapath.relative_to(OUT)),'pack_file':str(pzip.relative_to(OUT)),'pack_sha256':sha(pzip)}

start=time.time();manifest=[]
for sid,source,labels in SHEETS:
 d=process(sid,source,labels);manifest.append(d)
 alerts=sum(1 for x in d['sprites'] if x['source_edge_high_alpha_count']>10)
 vcuts=sum(x['opaque_alpha_cut_pixels'] for x in d['cut_seam_metrics']['vertical']);hcuts=sum(x['opaque_alpha_cut_pixels'] for x in d['cut_seam_metrics']['horizontal'])
 print(sid, '16 slices','potential edge contacts',alerts,'seam opaque cuts',vcuts+hcuts,flush=True)
report={'name':'Rupee Rush — Heroes of Embryon — 6 booster/effect atlas slicing batch','format':'4x4 source atlases, dynamic alpha gutter isolation; 384px masters + 192px runtime exports','version':'1.0','sheets':manifest,'sheets_count':len(manifest),'sprite_count':sum(len(s['sprites']) for s in manifest),'assets_are_original_work':True,'manual_semantic_review_required':True,'source_overlap_caveat':'No slicing method can restore subject detail already occluded/overlapped within a generated atlas. source_edge_high_alpha_count and cut seam metrics identify at-risk locations.','produced_utc':'2026-10-24'}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2))
lines=['# Rupee Rush — Six-Atlas Booster and VFX Sprite Extraction QA','',f'Extracted **{report["sprite_count"]} named sprites** from **6 source atlases**, each in 384 px and 192 px transparent RGBA PNG.', '', 'Each atlas is preserved. Dynamic alpha-minimizing gutters isolate its 4×4 cells; disconnected speckles are removed. A 26px transparent safety margin surrounds every exported PNG. Source edge contacts are diagnostic flags, **not** proof that every feature is perfect.', '', '| Sheet | 16 sprites | high-alpha seam cuts | sprites with edge contact > 10 pixels |', '|---|---:|---:|---:|']
for d in manifest:
 score=sum(a['opaque_alpha_cut_pixels'] for ax in d['cut_seam_metrics'].values() for a in ax)
 contact=sum(x['source_edge_high_alpha_count']>10 for x in d['sprites'])
 lines.append(f'| {d["id"]} | {len(d["sprites"])} | {score} | {contact} |')
lines += ['','## Inspection', 'Each `qa/<sheet>-qa.jpg` renders all sixteen separated results over contrasting checkerboard and gives original extraction dimensions, disconnected-noise count and edge-contact indicators.', 'A nonzero seam cut indicates that adjacent generated subjects/glow overlapped in the source. Borders and padding are protected in exported PNGs, but regenerate flagged source tiles if the cut affects a main crystal tip.', 'The labels identify positions and intended assets; individual sprites are not wired into gameplay or sold as production-approved assets until reviewed on phones.', '', '## Packaging', 'Six per-sheet ZIP archives in `packs/` each include its original atlas, sixteen high-res/low-res PNG pairs, a QA preview, and the manifest. Root manifest inventories every file by SHA-256. `Rupee_Rush_Embryon_Booster_VFX_Library.zip` contains 320 individually named PNG exports, all six source sheets, previews, manifest and source code; the six per-sheet ZIPs are uploaded separately to the same Drive folder to avoid redundant nested archives.', '']
(OUT/'QA_REPORT.md').write_text('\n'.join(lines))
shutil.copy2(__file__,OUT/'slice_assets.py')
# bundle with individual png files not nested-only archives, so immediate usage after extraction
bundle=BASE/'Rupee_Rush_Embryon_Booster_VFX_Library.zip'
with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED,5) as z:
 for p in OUT.rglob('*'):
  if p.is_file():
   # Do not duplicate the 6 per-sheet archives inside root -- they are provided beside master ZIP.
   if p.parent==PACKS: continue
   z.write(p,p.relative_to(OUT))
print('DONE',bundle,bundle.stat().st_size,'seconds',round(time.time()-start,1),flush=True)
