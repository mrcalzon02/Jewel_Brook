#!/usr/bin/env python3
"""Crimson Beet PROVISIONAL palette-adaptation draft; not a hand-painted beet master.

Needs Pillow==12.3.0 and NumPy==2.3.5. Does not touch live game assets,
manifest or resolver; writes five sprites to a separate candidate directory.
"""
from PIL import Image,ImageDraw,ImageFont
import numpy as np, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
from importlib.machinery import SourceFileLoader
slicer=SourceFileLoader('slicer',str(ROOT/'scripts/slice-painted-crops.py')).load_module()
source=Image.open(ROOT/'web/art/embryon/town/gardening/growth/painted/source_sheets/radish-growth-source.webp').convert('RGBA')
sprites=slicer.slice_crop(source)
out=ROOT/'web/art/embryon/town/gardening/growth/candidates/crimson-beet-v1';out.mkdir(parents=True,exist_ok=True)
swatches=[]
for stage, img in sprites.items():
    ar=np.array(img)
    rgb=ar[:,:,:3].astype(np.float32)/255
    mx=rgb.max(axis=2);mn=rgb.min(axis=2);d=mx-mn
    # Make deep ruby/mulberry beet roots and dark green beet leaves while preserving painted shadows.
    h=np.zeros(mx.shape,dtype=np.float32)
    v=mx.copy();sat=np.divide(d,mx,out=np.zeros_like(d),where=mx>0)
    rs=(mx==rgb[:,:,0])&(d>1e-6); gs=(mx==rgb[:,:,1])&(d>1e-6)&(~rs); bs=(mx==rgb[:,:,2])&(d>1e-6)&(~rs)&(~gs)
    h[rs]=((rgb[:,:,1][rs]-rgb[:,:,2][rs])/d[rs])%6
    h[gs]=((rgb[:,:,2][gs]-rgb[:,:,0][gs])/d[gs])+2
    h[bs]=((rgb[:,:,0][bs]-rgb[:,:,1][bs])/d[bs])+4
    h=h/6
    yy,xx=np.indices(mx.shape)
    # Crop bulb tint, not the red/brown soil or seed. Small purposeful mask avoids the earlier soil recoloring artifact.
    bulb=(stage=='maturing')&(xx>203)&(xx<314)&(yy>=346)&(yy<444)
    bulb |= (stage=='ready')&(xx>175)&(xx<337)&(yy>=245)&(yy<438)
    red=((h<.065)|(h>.97))&(sat>.30)&(v>.20)&(ar[:,:,3]>3)&bulb&(rgb[:,:,2]>=rgb[:,:,1]*.90)&(rgb[:,:,0]>=rgb[:,:,1]*1.1)
    green=(h>.15)&(h<.52)&(sat>.16)&(ar[:,:,3]>3)
    hue=h.copy();ss=sat.copy();vv=v.copy()
    # Beetroot pigment is a deeper blue-red, keeping the glossy highlights from the original painted source.
    hue[red]=.935+np.clip((h[red]-.96)*.16,-.013,.012)
    ss[red]=np.clip(sat[red]*1.07+.04,0,.97)
    vv[red]=np.clip(v[red]*.72+.015,0,1)
    # Spinach-like dark beet leaf, retaining local highlight patterns and depth.
    hue[green]=np.clip(.325+(h[green]-.28)*.38,.23,.42)
    ss[green]=np.clip(sat[green]*1.08,0,1)
    vv[green]=np.clip(v[green]*.82+.01,0,1)
    # HSV back to RGB using numpy: all other pixels exactly unchanged.
    ih=np.floor(hue*6).astype(np.int16)%6;f=hue*6-np.floor(hue*6)
    p=vv*(1-ss);q=vv*(1-f*ss);t=vv*(1-(1-f)*ss)
    channels=[(vv,t,p),(q,vv,p),(p,vv,t),(p,q,vv),(t,p,vv),(vv,p,q)]
    nr=np.zeros_like(vv);ng=nr.copy();nb=nr.copy()
    for i,(cr,cg,cb) in enumerate(channels):
        sel=(ih==i)&(red|green)
        nr[sel]=cr[sel];ng[sel]=cg[sel];nb[sel]=cb[sel]
    for i, c in enumerate((nr,ng,nb)):
        ar[:,:,i][red|green]=np.uint8(np.clip(c[red|green]*255,0,255))
    converted=Image.fromarray(ar,'RGBA')
    converted.save(out/f'beet-{stage}.webp','WEBP',quality=91,method=5)
    swatches.append((stage,converted))
# Review on a nontransparent checker but keep the raw sprites RGBA
W=1550;H=500
bg=Image.new('RGB',(W,H),(35,46,53))
d=ImageDraw.Draw(bg)
for i,(stage,im) in enumerate(swatches):
    # transparent PNG compositing directly on solid board
    sized=im.resize((305,305),Image.Resampling.LANCZOS)
    bg.paste(sized,(i*310+2,86),sized)
    d.rectangle((i*310,82,i*310+309,387),outline=(95,112,110),width=1)
    d.text((i*310+88,410),stage.upper(),fill=(234,225,198),font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',18))
# pale label block in header
name='CRIMSON BEET — STAGED ART DRAFT (RADISH-DERIVED, NOT APPROVED MASTER)'
d.text((40,25),name,fill=(243,213,191),font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19))
bg.save(out/'review.png')
print('Created',len(swatches),'painted variations; output',out)
