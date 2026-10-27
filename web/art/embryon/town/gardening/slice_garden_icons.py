#!/usr/bin/env python3
"""Reproduce the ten seed/fertilizer/store sprites from the approved generated source sheet.
Never paint backgrounds; source already has RGBA transparency.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'source'/'fantasy_gardening_supplies_icon_sheet.png'
OUT=ROOT/'icons'
OUT.mkdir(parents=True,exist_ok=True)
# Pixel-accurate columns vary by row: the large seed-store crate is wider than its neighbors.
# The two rightmost objects slightly overlap bounding rectangles; connected-component masks isolate them without copying stray neighboring art.
SPEC=[
('seeds-carrot', 'seed', (0,110,280,532), 'Carrot seeds'),
('seeds-wheat', 'seed', (281,110,564,532), 'Wheat seeds'),
('seeds-bluebell-berry', 'seed', (565,110,847,532), 'Bluebell berry seeds'),
('seeds-onion', 'seed', (848,110,1121,532), 'Onion seeds'),
('seeds-cabbage', 'seed', (1122,110,1448,532), 'Cabbage seeds'),
('seeds-herbs', 'seed', (0,533,282,958), 'Herb seeds'),
('fertilizer-compost', 'fertilizer', (283,533,560,958), 'Compost'),
('fertilizer-enriched', 'fertilizer', (561,533,825,958), 'Enriched fertilizer'),
('fertilizer-crystal-tonic', 'fertilizer', (826,533,1079,958), 'Crystal growth tonic'),
('seed-store-bundle', 'store', (1036,533,1448,958), 'Seed store bundle')
]

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

im=Image.open(SOURCE).convert('RGBA')
assert im.size==(1448,1086),im.size
assert im.getpixel((0,0))[3]==0
MAPPING={
 'seeds-carrot':('seed','carrot'), 'seeds-wheat':('seed','wheat'),
 'seeds-bluebell-berry':('seed','berry'),
 'fertilizer-compost':('fertilizer','compost'),
 'fertilizer-enriched':('fertilizer','quality'),
 'fertilizer-crystal-tonic':('fertilizer','royal')
}
manifest={
 'schema':'rupee-rush/town-garden-icon-library/v1',
 'collection':'Town Gardening Seeds and Fertilizers',
 'project':'Rupee Rush — Heroes of Embryon',
 'stage':'art assets; not runtime-wired',
 'source':{'path':'source/fantasy_gardening_supplies_icon_sheet.png', 'size':list(im.size),'sha256':sha(SOURCE)},
 'iconSize':[512,512],
 'alpha':True,
 'icons':[]
}
for name,category,rect,label in SPEC:
    part=im.crop(rect)
    raw=np.array(part.getchannel('A'),dtype=np.uint8)
    # Reject adjacent packet fragments that bleed into nominal sheet slots.
    count,labels,stats,_=cv2.connectedComponentsWithStats((raw>=25).astype(np.uint8),8)
    assert count>1,name
    main=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
    allowed=cv2.dilate((labels==main).astype(np.uint8),np.ones((5,5),np.uint8),iterations=1)
    clean=np.where((allowed>0)&(raw>=10),raw,0).astype(np.uint8)
    part.putalpha(Image.fromarray(clean,'L'))
    bb=part.getchannel('A').getbbox()
    assert bb is not None,name
    part=part.crop(bb)
    scale=min(454/part.width,454/part.height)
    w,h=max(1,round(part.width*scale)),max(1,round(part.height*scale))
    part=part.resize((w,h),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(512,512),(0,0,0,0))
    canvas.alpha_composite(part,((512-w)//2,(512-h)//2))
    assert all(canvas.getpixel(pt)[3]==0 for pt in ((0,0),(511,0),(0,511),(511,511)))
    fp=OUT/(name+'.png')
    canvas.save(fp,optimize=True)
    manifest['icons'].append({'id':name,'label':label,'category':category,'path':'icons/'+fp.name,
        'sourceCrop':list(rect), 'contentBBox':list(bb), 'size':[512,512],
        'bytes':fp.stat().st_size,'sha256':sha(fp),
        'gameplayMapping':({'kind':MAPPING[name][0], 'id':MAPPING[name][1], 'availability':'existing Town economy'}
                           if name in MAPPING else {'kind':category,'id':None,'availability':'reserved future asset only'})})

manifest_path=ROOT/'manifest.json'
manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
# Visual verification contact: neutral background is PREVIEW ONLY, never included in sprite alpha.
preview=Image.new('RGB',(1280,610),'#242032')
from PIL import ImageDraw,ImageFont
d=ImageDraw.Draw(preview)
for i,a in enumerate(manifest['icons']):
 x=8+(i%5)*255;y=10+(i//5)*300
 tile=Image.open(ROOT/a['path']).convert('RGBA').resize((245,245))
 preview.paste(tile,(x,y),tile)
 d.text((x+9,y+250),a['label'],fill='#ffedb0')
preview.save(ROOT/'preview-contact.png',optimize=True)
print('10 sprites prepared; source SHA-256',manifest['source']['sha256'])
print('\n'.join(f"{x['path']} {x['bytes']}" for x in manifest['icons']))
