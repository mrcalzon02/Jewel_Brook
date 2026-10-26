#!/usr/bin/env python3
"""Re-slice transparent five-stage crop paintings into uniform gameplay WebPs.

Usage: python scripts/slice-painted-crops.py [--crop radish] [--check]
Requires Pillow 12.x; keeps seeds naturally smaller than mature plants.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image

STAGES = ('seed', 'sprout', 'growing', 'maturing', 'ready')
ROOT = Path(__file__).resolve().parents[1]
PAINTED = ROOT / 'web/art/embryon/town/gardening/growth/painted'


def gap_runs(alpha):
    binary = alpha.point(lambda x: 255 if x > 18 else 0)
    occupied = binary.getprojection()[0]
    gaps = []
    start = None
    for x, val in enumerate(occupied):
        if val == 0 and start is None:
            start = x
        elif val and start is not None:
            if x - start >= 15:
                gaps.append((start, x - 1))
            start = None
    if start is not None and len(occupied) - start >= 15:
        gaps.append((start, len(occupied) - 1))
    return [g for g in gaps if g[0] > 200 and g[1] < len(occupied) - 100]


def slice_crop(img):
    img = img.convert('RGBA')
    if img.size != (2172, 724):
        raise ValueError(f'expected 2172x724 source sheet; received {img.size}')
    gaps = gap_runs(img.getchannel('A'))
    if len(gaps) != 4:
        raise ValueError(f'expected four transparent gaps between five stages: {gaps}')
    bounds = [0] + [round((a + b) / 2) for a, b in gaps] + [img.width]
    result = {}
    for i, stage in enumerate(STAGES):
        panel = img.crop((bounds[i], 0, bounds[i + 1], img.height))
        bbox = panel.getchannel('A').point(lambda a: 255 if a > 4 else 0).getbbox()
        if bbox is None:
            raise ValueError(f'empty stage {stage}')
        x0, y0, x1, y1 = bbox
        margin = (max(0, x0 - 3), max(0, y0 - 3), min(panel.width, x1 + 3), min(panel.height, y1 + 3))
        art = panel.crop(margin)
        w, h = (round(art.width * 0.66), round(art.height * 0.66))
        if w > 482 or h > 485:
            raise ValueError(f'frame {stage} would clip: {art.size}')
        frame = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
        frame.alpha_composite(art.resize((w, h), Image.Resampling.LANCZOS), ((512-w)//2, 487-h))
        result[stage] = frame
    return result


def slice_beet(img):
    """Precisely separate original Crimson Beet where mature foliage nearly touches.

    Alpha-gap splitting cannot find the fourth division, hence measured bounds.
    Stages share one 512px canvas and the y=487 soil baseline.
    """
    img = img.convert('RGBA')
    if img.size != (2172, 724):
        raise ValueError(f'original beet sheet must be 2172x724, received {img.size}')
    bounds = (0, 338, 700, 1129, 1634, 2172)
    result = {}
    for i, stage in enumerate(STAGES):
        panel = img.crop((bounds[i], 0, bounds[i + 1], img.height))
        bbox = panel.getchannel('A').point(lambda a: 255 if a > 3 else 0).getbbox()
        if bbox is None:
            raise ValueError('empty beet stage: '+stage)
        art = panel.crop(bbox)
        factor = min(430/art.width, 430/art.height, 1)
        size = (max(1, round(art.width*factor)), max(1, round(art.height*factor)))
        frame = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
        frame.alpha_composite(art.resize(size, Image.Resampling.LANCZOS),
                              ((512-size[0])//2, 487-size[1]))
        result[stage] = frame
    return result


def run(crop=None, check=False, directory=PAINTED):
    manifest = json.loads((directory/'manifest.json').read_text())
    crops = [crop] if crop else manifest['crops']
    for kind in crops:
        if kind not in manifest['crops']:
            raise ValueError('no painted master registered: '+kind)
        source = directory/'source_sheets'/f'{kind}-growth-source.webp'
        if not source.exists():
            raise FileNotFoundError(source)
        stages = slice_beet(Image.open(source)) if kind == 'beet' else slice_crop(Image.open(source))
        for phase, frame in stages.items():
            output = directory/f'{kind}-{phase}.webp'
            payload = io.BytesIO()
            frame.save(payload, 'WEBP', quality=92 if kind == 'beet' else 88,
                       method=5 if kind == 'beet' else 1)
            data = payload.getvalue()
            meta = next(x for x in manifest['sprites'] if x['crop']==kind and x['stage']==phase)
            if check:
                if hashlib.sha256(output.read_bytes()).hexdigest() != meta['sha256']:
                    raise ValueError('committed asset hash mismatch: '+output.name)
                if hashlib.sha256(data).hexdigest() != meta['sha256']:
                    raise ValueError('regenerated asset differs from the approved crop slice: '+output.name)
            else:
                output.write_bytes(data)
        print(f'{kind}: validated all five stages' if check else f'{kind}: wrote five staged images')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--crop', help='one crop ID; default all registered painted species')
    p.add_argument('--check', action='store_true', help='verify exact registered content hashes without writing')
    p.add_argument('--directory', type=Path, default=PAINTED, help=argparse.SUPPRESS)
    args = p.parse_args()
    run(args.crop, args.check, args.directory)
