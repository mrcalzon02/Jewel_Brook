#!/usr/bin/env python3
"""Rupee Rush dynamic atlas slicing: traceable source crops, alpha cleanup, padded runtime previews.
Original generated art is never changed, never misidentified as production-approved animation.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np, cv2, hashlib, json, shutil, zipfile, math
ROOT=Path('/mnt/data/rupee_farming_assets_v1')
SRC=ROOT/'source'; OUT=ROOT/'runtime'; MASTERS=ROOT/'masters'; QA=ROOT/'qa'
for d in [SRC,OUT,MASTERS,QA]: d.mkdir(parents=True,exist_ok=True)
SHEETS=[
 ('farming-overview','a_clean_colorful_game_asset_style_illustration_sh.png',[
  (10,44,188,['shovel','pickaxe','hoe','rake','watering-can','pruners','sickle','axe','harvest-basket','wheelbarrow'],'equipment'),
  (10,240,384,['sprayer','seed-bag','fertilizer-sack','soil-treatment','plant-food-jar','compost-bin','fence','trellis','scarecrow','greenhouse'],'equipment'),
  (10,437,585,['garden-plot','planter-box','sprinkler','irrigation-pipe','soil-sensor','windmill','rain-barrel','storage-box','produce-crate','tractor'],'equipment'),
  (16,691,776,['wheat','corn','tomato','carrot','potato','lettuce','cabbage','onion','garlic','pepper','eggplant','strawberry','blueberry','raspberry','pumpkin','sunflower'],'goods'),
  (17,806,887,['cotton','sugarcane','cauliflower','broccoli','lavender','rose','tulip','daisy','orchid','herb-bundle','tea-leaves','coffee-beans','honey','milk','eggs','wool','wool-ball'],'goods'),
  (16,920,983,['flour','sugar','jam','pickles','juice','cheese','bread','butter','seed-pack','sapling','fertilizer','compost','plant-pot','beehive','animal-feed','mulch'],'goods'),
 ]),
 ('farming-tools','a_bright_highly_polished_game_asset_style_illustr.png',[
  (8,6,177,['shovel','pickaxe','hoe','watering-can','pruners','sickle','rake','broom'],'equipment'),
  (8,222,376,['bucket','harvest-basket','wheelbarrow','wooden-crate','storage-barrel','fertilizer-bag','seed-bag','compost-bin'],'equipment'),
  (8,420,585,['sprinkler','deluxe-sprinkler','irrigation-pipe','water-pump','water-tank','windmill','scarecrow','beehive'],'equipment'),
  (8,625,784,['garden-plot','raised-bed','greenhouse','trellis','fence','gate','tool-shed','well'],'equipment'),
  (9,833,977,['growth-elixir','soil-enhancer','plant-food','pest-repellent','speed-grow','plant-protect','crop-booster','magic-seeds','harvest-boost'],'equipment'),
 ])
]
def digest(f):return hashlib.sha256(Path(f).read_bytes()).hexdigest()
manifest={'schema':'rupee-rush/farming-asset-library/v1','sourceCount':2,'sources':[],'sprites':[],'policy':{'status':'sliced and QA flagged; player-facing activation requires separate mapping','baseArt':'generated image RGBA preserved','opacity':'isolated RGBA','runtimeSize':[192,192],'masterSize':[384,384],'cellIsolation':'per-row adaptive alpha-occupancy column boundaries; labels excluded by per-row crop; connected alpha cleanup','noGameplayChanges':True}}
for sheet,filename,rows in SHEETS:
 orig=Path('/mnt/data')/filename; shutil.copyfile(orig,SRC/filename)
 image=Image.open(orig).convert('RGBA'); data=np.array(image); H,W=data.shape[:2]
 manifest['sources'].append({'id':sheet,'file':'source/'+filename,'sha256':digest(orig),'dimensions':[W,H], 'rows':len(rows)})
 rendered=[]
 for row,(n,y0,y1,ids,category) in enumerate(rows):
  assert n==len(ids),(sheet,row,n,len(ids))
  al=data[y0:y1,:,3].astype(np.float32)
  # Per-row seam selection; sigma blur and distance penalty prevent a seam
  # from leaping into art simply to find a low-alpha unrelated gap.
  projection=cv2.GaussianBlur(np.mean((al/255.)**1.35,axis=0).reshape(1,-1),(1,1),0).ravel()
  bounds=[0]
  for c in range(1,n):
   nom=round(W*c/n); delta=max(5,round(W/n*.16)); xs=np.arange(max(bounds[-1]+16,nom-delta),min(W,nom+delta)+1)
   costs=projection[xs]+0.00024*((xs-nom)/max(1,delta))**2
   bounds.append(int(xs[np.argmin(costs)]))
  bounds.append(W)
  for c,id in enumerate(ids):
   left,right=bounds[c],bounds[c+1]
   a=data[y0:y1,left:right].copy()
   alpha=a[:,:,3].copy()
   alpha[alpha<17]=0
   # Remove isolated minor alpha fragments from gutter, preserve useful pieces
   # for dispersed silhouettes like sprinkler droplets and produce grains.
   core=(alpha>=54).astype('uint8')
   count,labels,stats,cent=cv2.connectedComponentsWithStats(core,8)
   if count<2:raise RuntimeError(f'empty {sheet} {row} {id}')
   areas=stats[1:,cv2.CC_STAT_AREA]; largest=int(areas.max()); cX=(right-left)/2;cY=(y1-y0)/2
   selected=[]
   for k in range(1,count):
    area=int(stats[k,cv2.CC_STAT_AREA]); distance=((cent[k,0]-cX)**2+(cent[k,1]-cY)**2)**.5
    if area>=max(8,largest*.002) and distance < max(right-left,y1-y0)*.9: selected.append(k)
   if not selected:selected=[int(np.argmax(areas))+1]
   keep=np.isin(labels,selected).astype('uint8'); dil=cv2.dilate(keep,np.ones((5,5),'uint8'),iterations=1)
   alpha=np.where(dil>0,alpha,0).astype('uint8')
   if np.sum(alpha>20)<100:raise RuntimeError('too little alpha '+id)
   a[:,:,3]=alpha
   bbox=Image.fromarray(alpha).getbbox(); assert bbox
   part=Image.fromarray(a,'RGBA').crop(bbox)
   px=384; inner=px-36*2;factor=min(inner/part.width,inner/part.height)
   new=(max(1,round(part.width*factor)),max(1,round(part.height*factor)))
   resized=part.resize(new,Image.Resampling.LANCZOS)
   master=Image.new('RGBA',(px,px),(0,0,0,0));master.alpha_composite(resized,((px-new[0])//2,(px-new[1])//2))
   runtime=master.resize((192,192),Image.Resampling.LANCZOS)
   folder=OUT/sheet/category; folder.mkdir(parents=True,exist_ok=True)
   mfolder=MASTERS/sheet/category;mfolder.mkdir(parents=True,exist_ok=True)
   rt=folder/(id+'.webp'); mt=mfolder/(id+'.png')
   runtime.save(rt,'WEBP',quality=86,method=5,exact=True)
   master.save(mt,optimize=True)
   # Diagnose opaque artwork that touches the dynamic left/right seam or clipped row.
   edge=np.count_nonzero(alpha[:,0:2]>170)+np.count_nonzero(alpha[:,-2:]>170)+np.count_nonzero(alpha[:2]>170)+np.count_nonzero(alpha[-2:]>170)
   high=max(25,int(np.sum(alpha>170)*.015))
   flags=[]
   if edge>high:flags.append('edge-contact-review')
   if (right-left)<70:flags.append('unusually-narrow-cell')
   if runtime.getpixel((0,0))[3]!=0 or runtime.getpixel((191,191))[3]!=0:flags.append('padding-failed')
   item={'id':id,'sourceId':sheet,'category':category,'row':row+1,'column':c+1,'sourceCrop':[left,y0,right,y1], 'contentBBox':list(bbox),'runtime':'runtime/'+sheet+'/'+category+'/'+id+'.webp','master':'masters/'+sheet+'/'+category+'/'+id+'.png','runtimeSha256':digest(rt),'masterSha256':digest(mt),'runtimeBytes':rt.stat().st_size,'masterBytes':mt.stat().st_size,'pixelDimensions':[192,192],'alphaNonzeroFraction':round(np.mean(np.asarray(runtime)[:,:,3]>10),3),'opaqueEdgeContacts':int(edge),'flags':flags}
   manifest['sprites'].append(item)
   rendered.append((id,runtime,item))
 preview=Image.new('RGB',(8*176,math.ceil(len(rendered)/8)*201),'#27203c');draw=ImageDraw.Draw(preview)
 for i,(id,im,item) in enumerate(rendered):
  x=(i%8)*176+16;y=(i//8)*201+3
  preview.paste(im.resize((148,148)),(x,y),im.resize((148,148)))
  draw.text((x,y+150),id[:21],fill='#fff0b8')
  if item['flags']: draw.text((x,y+166),'REVIEW',fill='#ff7777')
 preview.save(QA/(sheet+'-contact.png'))
manifest['totalSprites']=len(manifest['sprites'])
manifest['qaSummary']={'flagged':sum(bool(e['flags']) for e in manifest['sprites']),'byCollection':{k:sum(s['sourceId']==k for s in manifest['sprites']) for k,_,_ in SHEETS}}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
(ROOT/'README.md').write_text('''# Rupee Rush — Dynamic-sliced Farming Art Library v1\n\nTwo image-generated RGBA source sheets are preserved unchanged in `source/`. Every icon has an independently padded 384px transparent PNG master and a 192px WebP runtime sprite. The script `slice_farming.py` regenerates the full package from original sources. Manifest includes source coordinates, SHA-256 checksums, QA flags and explicit categories.\n\n`farming-tools` (41 assets): core tools, storage, equipment, irrigation, farm structures and growth upgrades.\n`farming-overview` (79 assets): extra tool/building designs and a broad farm goods, crops and processing inventory.\n\n**Not yet wired into game mechanics.** Intended as future farming UI/content library, preserving currently approved seed and fertilizer artwork.\n\nSource images include a title and name plates; cropping deliberately omits labels and backgrounds are cleaned using existing RGBA transparency plus connected-component thresholding. Semi-transparent glow outside the icon is preserved where it is isolated. Source overlaps, especially with narrow produce cells, are flagged for visual review instead of quietly declaring complete QA.\n''')
shutil.copyfile('/mnt/data/slice_farming.py',ROOT/'slice_farming.py')
with zipfile.ZipFile('/mnt/data/RupeeRush_Farming_Art_Dynamic_Slices_v1.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in ROOT.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(ROOT))
print(json.dumps({'total':manifest['totalSprites'],'qa':manifest['qaSummary'],'sourceSizes':[x['dimensions'] for x in manifest['sources']],'zipBytes':Path('/mnt/data/RupeeRush_Farming_Art_Dynamic_Slices_v1.zip').stat().st_size,'mostFlagged':[x['sourceId']+':'+x['id'] for x in manifest['sprites'] if x['flags']][:30]},indent=2))