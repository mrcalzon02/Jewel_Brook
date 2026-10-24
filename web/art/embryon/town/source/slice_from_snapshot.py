from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import numpy as np, json,zipfile,hashlib,cv2

SOURCE=Path('/mnt/data/a_clean_high_resolution_well_aligned_sprite_shee.png')
OUT=Path('/mnt/data/daysha_levels_01-40')
(OUT/'avatars').mkdir(parents=True,exist_ok=True)
(OUT/'sheets').mkdir(parents=True,exist_ok=True)
img=Image.open(SOURCE).convert('RGBA')
assert img.size == (1536,1024), img.size
# Master is 10 columns by 4 rows, with small typography just outside
# these manually inspected individual-character y bands.
ybands=[(0,283),(279,550),(547,801),(809,1024)]
serif='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
font=ImageFont.truetype(serif,31)


def plaque(level):
    canvas=Image.new('RGBA',(226,58),(0,0,0,0))
    d=ImageDraw.Draw(canvas)
    d.polygon([(13,7),(213,7),(224,29),(213,51),(13,51),(2,29)],fill='#623915',outline='#ffdf81',width=3)
    d.polygon([(19,12),(207,12),(217,29),(207,46),(19,46),(9,29)],fill='#092448',outline='#aa702c',width=2)
    d.line([(26,15),(200,15)],fill='#65bfff',width=2)
    d.line([(26,43),(200,43)],fill='#705cb0',width=2)
    for cx in (15,211):
        d.polygon([(cx,15),(cx+10,28),(cx,42),(cx-10,28)],fill='#20b9fa',outline='#f0cf6b',width=3)
        d.polygon([(cx,17),(cx+7,28),(cx,27)],fill='#a8faff')
    title=f'Lv {level:02d}'
    bb=d.textbbox((0,0),title,font=font,stroke_width=1)
    left=(226-(bb[2]-bb[0]))/2
    top=7
    d.text((left,top),title,fill='#fff4c5',font=font,stroke_width=1,stroke_fill='#83541b')
    return canvas

records=[]
sheets=[]
for block in range(4):
    sheet=Image.new('RGBA',(1536,1024),(0,0,0,0))
    for j in range(10):
        level=block*10+j+1
        sourcecol=j
        # Level 1-10 span first image row; 11-20 second, etc.
        sx1=round(sourcecol*153.6)
        sx2=round((sourcecol+1)*153.6)
        y1,y2=ybands[block]
        tile=img.crop((sx1,y1,sx2,y2))
        a=np.array(tile.getchannel('A'),dtype=np.uint8)
        # Source art contains small printed numbers below the boots.
        # Erase only that central number region before adding the official plaque.
        old_number_y=[(259,283),(531,550),(787,801),(999,1024)][block]
        ly1=max(0,old_number_y[0]-y1); ly2=min(y2-y1,old_number_y[1]-y1)
        if ly2>ly1 and block in ():  # reserved for future non-destructive label isolation
            a[ly1:ly2,45:110]=0
        # Remove residual near-transparent gradient and vague background.
        cleaned=np.uint8(np.clip((a.astype('float32')-13.)*255./242.,0,255))
        cleaned[cleaned<17]=0
        # Keep the actual character's largest coherent painted region.
        # Generated 40-up sheet bleeds isolated strands from the next column
        # into some cells; smaller components at the cell edge are not Daysha.
        count,labels,stats,_=cv2.connectedComponentsWithStats((cleaned>85).astype('uint8'),8)
        if count>1:
            main=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
            region=cv2.dilate((labels==main).astype('uint8'),np.ones((5,5),np.uint8),iterations=1)
            cleaned=np.where(region>0,cleaned,0).astype('uint8')
        tile.putalpha(Image.fromarray(cleaned,'L'))
        bounds=tile.getchannel('A').getbbox()
        assert bounds is not None,(block,j)
        tile=tile.crop(bounds)
        scale=min(234/tile.width,359/tile.height)
        nw,nh=round(tile.width*scale),round(tile.height*scale)
        tile=tile.resize((nw,nh),Image.Resampling.LANCZOS)
        # Use fixed exact per-avatar slot; 2x5. All four bands identical.
        avatar=Image.new('RGBA',(288,480),(0,0,0,0))
        avatar.alpha_composite(tile,((288-nw)//2, 375-nh + (34 if (block>=2 or (block==1 and j>=5)) else 0)))
        item_plaque=plaque(level)
        avatar.alpha_composite(item_plaque,((288-226)//2, (371 if (block>=2 or (block==1 and j>=5)) else 390)))
        avatar_path=OUT/'avatars'/f'daysha_lv_{level:02}.png'
        avatar.save(avatar_path,optimize=True)
        x=(j%5)*307+9
        y=(j//5)*512+16
        sheet.alpha_composite(avatar,(x,y))
        record={'level':level,'file':str(avatar_path.relative_to(OUT)),'dimensions':[288,480],'source_row':block+1,'source_column':j+1,'sha256':hashlib.sha256(avatar_path.read_bytes()).hexdigest()}
        records.append(record)
    fp=OUT/'sheets'/f'daysha_levels_{block*10+1:02d}-{(block+1)*10:02d}.png'
    sheet.save(fp,optimize=True)
    sheets.append(fp)

manifest={
'project':'Rupee Rush — Heroes of Embryon',
'character':'Daysha',
'source':'a_clean_high_resolution_well_aligned_sprite_shee.png',
'concept':'10-by-4 generated 1–40 snapshot, cropped into individual game-avatar candidates with precise ornamental level plaques',
'avatar_count':40,
'alpha':'PNG RGBA; sheet backgrounds are transparent',
'sprite_note':'Art candidates, not approved in-game assets. Source generation may retain minor compositional edge artifacts; inspect in engine before integrating.',
'sheets':[str(f.relative_to(OUT)) for f in sheets],
'avatars':records}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
zip_path=Path('/mnt/data/Daysha_Levels_01-40_Transparent_Archive.zip')
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(OUT.rglob('*')):
        if p.is_file():z.write(p,str(p.relative_to(OUT)))

for f in sheets:
    r=Image.open(f).convert('RGBA')
    arr=np.asarray(r)
    print(f.name, r.size, 'alpha_corner', int(arr[0,0,3]),'nonzero_alpha_fraction',round(float((arr[:,:,3]>0).mean()),3))
print('zip',zip_path,zip_path.stat().st_size, 'avatar_count',len(records))
